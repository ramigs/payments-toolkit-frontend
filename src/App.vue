<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import AppIntro from './components/AppIntro.vue'
import ChatInput from './components/ChatInput.vue'
import MessageList from './components/MessageList.vue'
import SampleCards from './components/SampleCards.vue'
import SampleIbans from './components/SampleIbans.vue'
import SamplePrompts from './components/SamplePrompts.vue'
import { ScrollArea } from './components/ui/scroll-area'
import { Separator } from './components/ui/separator'
import { useAgentChat } from './composables/useAgentChat'
import { useAutoScroll } from './composables/useAutoScroll'

const { messages, error, isLoading, sendMessage, cancel } = useAgentChat()

const messagesArea = useTemplateRef<InstanceType<typeof ScrollArea>>('messagesArea')
const { isPinned, scrollToBottom } = useAutoScroll(messagesArea)

function handleSend(message: string) {
  sendMessage(message)
  // The user just spoke — always follow, even if they'd scrolled up.
  scrollToBottom()
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
      <ScrollArea class="rail-scroll">
        <div class="rail-content">
          <SampleCards @pick="appendToDraft" />
          <Separator />
          <SampleIbans @pick="appendToDraft" />
        </div>
      </ScrollArea>
    </aside>

    <main class="chat">
      <AppIntro />
      <div class="messages">
        <ScrollArea ref="messagesArea" class="messages-scroll">
          <MessageList :messages :loading="isLoading" />
        </ScrollArea>
        <button
          v-if="!isPinned"
          type="button"
          class="jump"
          aria-label="Scroll to latest"
          @click="scrollToBottom('smooth')"
        >
          ↓
        </button>
      </div>
      <div class="composer">
        <p v-if="wasCancelled" class="notice">Turn stopped.</p>
        <p v-else-if="error" class="error">{{ error.message }}</p>
        <ChatInput
          ref="chatInput"
          v-model="draft"
          :busy="isLoading"
          @send="handleSend"
          @stop="cancel"
        />
      </div>
    </main>

    <aside class="rail rail-right">
      <ScrollArea class="rail-scroll">
        <div class="rail-content">
          <SamplePrompts @ask="handleSend" />
        </div>
      </ScrollArea>
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
  background: #f8fafc;
}

.rail-left {
  left: 0;
  border-right: 1px solid #e2e8f0;
}

.rail-right {
  right: 0;
  border-left: 1px solid #e2e8f0;
}

.rail-scroll {
  height: 100%;
}

.rail-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem 1rem;
}

/* Full-height column: intro pinned at the top, composer at the bottom, and
   the message list scrolls in the space between. */
.chat {
  max-width: 640px;
  height: 100dvh;
  margin: 0 auto;
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.messages {
  position: relative;
  flex: 1;
  /* Let the flex item shrink below its content so the ScrollArea scrolls. */
  min-height: 0;
}

.messages-scroll {
  height: 100%;
}

.jump {
  position: absolute;
  right: 0.75rem;
  bottom: 0.75rem;
  width: 2rem;
  height: 2rem;
  display: grid;
  place-items: center;
  font-size: 1rem;
  line-height: 1;
  color: #0f172a;
  background: #fff;
  border: 1px solid #cbd5e1;
  border-radius: 9999px;
  box-shadow: 0 1px 3px rgb(15 23 42 / 0.12);
  cursor: pointer;
}

.jump:hover {
  background: #f8fafc;
}

.composer {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.error {
  color: #b91c1c;
}

.notice {
  color: #64748b;
  font-size: 0.875rem;
}

/* Not enough room for 640px of chat between two 280px rails — drop the rails
   back into flow and let the page scroll normally. */
@media (max-width: 1200px) {
  .layout {
    padding: 0;
  }

  .rail {
    position: static;
    height: auto;
    width: auto;
  }

  .chat {
    height: auto;
    min-height: 100dvh;
  }

  .messages {
    min-height: 0;
  }
}
</style>
