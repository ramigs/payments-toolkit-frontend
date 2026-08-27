<script setup lang="ts">
import { computed } from 'vue'
import ChatInput from './components/ChatInput.vue'
import MessageList from './components/MessageList.vue'
import { useAgentChat } from './composables/useAgentChat'

const { messages, error, isLoading, sendMessage, cancel } = useAgentChat()

function handleSend(message: string) {
  sendMessage(message)
}

// A cancel that reaches the client as an AG-UI event (rather than a local
// stop()) surfaces as an error with message "cancelled" — see
// payments-toolkit-agent's AgUiTranslator. That's a user action, not a
// failure, so show it as a muted notice instead of a red error.
const wasCancelled = computed(() => error.value?.message === 'cancelled')
</script>

<template>
  <main class="chat">
    <h1>payments-toolkit</h1>
    <MessageList :messages :loading="isLoading" />
    <p v-if="wasCancelled" class="notice">Turn stopped.</p>
    <p v-else-if="error" class="error">{{ error.message }}</p>
    <ChatInput :busy="isLoading" @send="handleSend" @stop="cancel" />
  </main>
</template>

<style scoped>
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
</style>
