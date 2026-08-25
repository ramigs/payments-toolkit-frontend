<script setup lang="ts">
import { computed } from 'vue'
import type { UIMessage } from '@tanstack/ai-vue'
import ToolCallTrace from './ToolCallTrace.vue'

const props = defineProps<{
  messages: ReadonlyArray<UIMessage>
}>()

function textOf(message: UIMessage): string {
  return message.parts
    .filter((part) => part.type === 'text')
    .map((part) => part.content)
    .join('')
}

const turns = computed(() =>
  props.messages
    .filter((message) => message.role === 'user' || message.role === 'assistant')
    .map((message) => ({ id: message.id, role: message.role, text: textOf(message), message })),
)
</script>

<template>
  <div class="message-list">
    <p v-if="turns.length === 0" class="empty">Ask about a card number or IBAN to get started.</p>
    <div v-for="turn in turns" :key="turn.id" class="turn" :class="turn.role">
      <span class="role">{{ turn.role === 'user' ? 'You' : 'Agent' }}</span>
      <ToolCallTrace v-if="turn.role === 'assistant'" :message="turn.message" />
      <p v-if="turn.text" class="text">{{ turn.text }}</p>
    </div>
  </div>
</template>

<style scoped>
.message-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.empty {
  color: #888;
}

.turn {
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  max-width: 80%;
}

.turn.user {
  align-self: flex-end;
  background: #dbeafe;
}

.turn.assistant {
  align-self: flex-start;
  background: #f1f5f9;
}

.role {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  opacity: 0.6;
}

.text {
  margin: 0.25rem 0 0;
  white-space: pre-wrap;
}
</style>
