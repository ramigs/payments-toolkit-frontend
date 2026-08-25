<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  disabled?: boolean
}>()

const emit = defineEmits<{
  send: [message: string]
}>()

const draft = ref('')

function submit() {
  const message = draft.value.trim()
  if (!message || props.disabled) return
  emit('send', message)
  draft.value = ''
}
</script>

<template>
  <form class="chat-input" @submit.prevent="submit">
    <input
      v-model="draft"
      type="text"
      placeholder="Ask about a card number or IBAN…"
      :disabled="disabled"
      autofocus
    />
    <button type="submit" :disabled="disabled || !draft.trim()">Send</button>
  </form>
</template>

<style scoped>
.chat-input {
  display: flex;
  gap: 0.5rem;
}

input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  font-size: 1rem;
}

button {
  padding: 0.5rem 1rem;
  font-size: 1rem;
}
</style>
