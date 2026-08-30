<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import AppIntro from './components/AppIntro.vue'
import ChatInput from './components/ChatInput.vue'
import MessageList from './components/MessageList.vue'
import SampleCards from './components/SampleCards.vue'
import SampleIbans from './components/SampleIbans.vue'
import SamplePrompts from './components/SamplePrompts.vue'
import { useAgentChat } from './composables/useAgentChat'

const { messages, error, isLoading, sendMessage, cancel } = useAgentChat()

function handleSend(message: string) {
  sendMessage(message)
}

// The chat draft lives here so the sample rails can feed it. Clicking a
// sample appends its value, space-separated, to whatever's already typed.
const draft = ref('')
const chatInput = useTemplateRef<InstanceType<typeof ChatInput>>('chatInput')

function appendToDraft(value: string) {
  const current = draft.value.trimEnd()
  draft.value = current ? `${current} ${value}` : value
  chatInput.value?.focus()
}

// A cancel that reaches the client as an AG-UI event (rather than a local
// stop()) surfaces as an error with message "cancelled" — see
// payments-toolkit-agent's AgUiTranslator. That's a user action, not a
// failure, so show it as a muted notice instead of a red error.
const wasCancelled = computed(() => error.value?.message === 'cancelled')
</script>

<template>
  <div class="layout">
    <!-- Fixed, full-height rails. The center column stays in normal flow so
         it keeps growing the page as the conversation gets longer. -->
    <aside class="rail rail-left">
      <SampleCards @pick="appendToDraft" />
      <SampleIbans @pick="appendToDraft" />
    </aside>

    <main class="chat">
      <AppIntro />
      <MessageList :messages :loading="isLoading" />
      <p v-if="wasCancelled" class="notice">Turn stopped.</p>
      <p v-else-if="error" class="error">{{ error.message }}</p>
      <ChatInput
        ref="chatInput"
        v-model="draft"
        :busy="isLoading"
        @send="handleSend"
        @stop="cancel"
      />
    </main>

    <aside class="rail rail-right">
      <SamplePrompts @ask="handleSend" />
    </aside>
  </div>
</template>

<style>
body {
  margin: 0;
}
</style>

<style scoped>
.layout {
  --rail-width: 280px;
  /* Reserve the gutters the fixed rails sit in. */
  padding: 0 var(--rail-width);
}

.rail {
  position: fixed;
  top: 0;
  height: 100vh;
  width: var(--rail-width);
  box-sizing: border-box;
  overflow-y: auto;
  padding: 1.5rem 1rem;
  background: #f8fafc;
}

.rail-left {
  left: 0;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.rail-right {
  right: 0;
  border-left: 1px solid #e2e8f0;
}

.chat {
  max-width: 640px;
  margin: 2rem auto;
  padding: 0 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.error {
  color: #b91c1c;
}

.notice {
  color: #64748b;
  font-size: 0.875rem;
}

/* Not enough room for 640px of chat between two 280px rails — drop the rails
   back into flow so nothing overlaps. */
@media (max-width: 1200px) {
  .layout {
    padding: 0;
  }

  .rail {
    position: static;
    height: auto;
    width: auto;
  }
}
</style>
