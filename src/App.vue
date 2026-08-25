<script setup lang="ts">
import ChatInput from './components/ChatInput.vue'
import MessageList from './components/MessageList.vue'
import { useAgentChat } from './composables/useAgentChat'

const { messages, error, isLoading, sendMessage } = useAgentChat()

function handleSend(message: string) {
  sendMessage(message)
}
</script>

<template>
  <main class="chat">
    <h1>payments-toolkit</h1>
    <MessageList :messages />
    <p v-if="error" class="error">{{ error.message }}</p>
    <ChatInput :disabled="isLoading" @send="handleSend" />
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
</style>
