<script setup lang="ts">
import { computed } from 'vue'
import type { UIMessage } from '@tanstack/ai-vue'
import ToolCallTrace from './ToolCallTrace.vue'

const props = defineProps<{
  messages: ReadonlyArray<UIMessage>
  loading?: boolean
}>()

function textOf(message: UIMessage): string {
  return message.parts
    .filter((part) => part.type === 'text')
    .map((part) => part.content)
    .join('')
}

function hasToolCalls(message: UIMessage): boolean {
  return message.parts.some((part) => part.type === 'tool-call')
}

const turns = computed(() => {
  const list = props.messages
    .filter((message) => message.role === 'user' || message.role === 'assistant')
    .map((message) => ({ id: message.id, role: message.role, text: textOf(message), message }))
  return list.map((turn, index) => ({
    ...turn,
    // Only true for the gap between sending and the first tool call or text
    // token arriving on THIS turn — once either appears, that's a better
    // "it's working" signal than a generic spinner, so this goes false on
    // its own once real content lands in the same message.
    isThinking:
      props.loading &&
      index === list.length - 1 &&
      turn.role === 'assistant' &&
      !turn.text &&
      !hasToolCalls(turn.message),
  }))
})

// The backend opens the assistant message with an empty
// TEXT_MESSAGE_START/END pair the instant a run starts (see
// payments-toolkit-agent's AgUiTranslator — a workaround for a
// @tanstack/ai client bug), so there's normally already an empty
// "assistant" turn to show the dots in via `isThinking` above. This only
// covers the earlier, narrower gap before that turn exists at all.
const showThinkingBeforeReply = computed(() => {
  if (!props.loading) return false
  const last = turns.value[turns.value.length - 1]
  return !last || last.role === 'user'
})
</script>

<template>
  <div class="message-list">
    <p v-if="turns.length === 0" class="empty">Ask about a card number or IBAN to get started.</p>
    <div v-for="turn in turns" :key="turn.id" class="turn" :class="turn.role">
      <span class="role">{{ turn.role === 'user' ? 'You' : 'Agent' }}</span>
      <ToolCallTrace v-if="turn.role === 'assistant'" :message="turn.message" />
      <p v-if="turn.text" class="text">{{ turn.text }}</p>
      <p v-else-if="turn.isThinking" class="thinking" aria-label="Agent is thinking">
        <span class="dot" /><span class="dot" /><span class="dot" />
      </p>
    </div>
    <div v-if="showThinkingBeforeReply" class="turn assistant">
      <span class="role">Agent</span>
      <p class="thinking" aria-label="Agent is thinking">
        <span class="dot" /><span class="dot" /><span class="dot" />
      </p>
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

.thinking {
  margin: 0.4rem 0 0;
  display: flex;
  gap: 0.25rem;
}

.dot {
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 50%;
  background: #94a3b8;
  animation: thinking-bounce 1.1s infinite ease-in-out;
}

.dot:nth-child(2) {
  animation-delay: 0.15s;
}

.dot:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes thinking-bounce {
  0%,
  60%,
  100% {
    opacity: 0.35;
    transform: translateY(0);
  }
  30% {
    opacity: 1;
    transform: translateY(-0.15rem);
  }
}
</style>
