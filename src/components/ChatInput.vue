<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  // A turn is in flight: the input is locked (the backend is single-turn)
  // and the send button becomes a Stop button.
  busy?: boolean
}>()

const emit = defineEmits<{
  send: [message: string]
  stop: []
}>()

const draft = ref('')

function submit() {
  const message = draft.value.trim()
  if (!message || props.busy) return
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
      :disabled="busy"
      autofocus
    />
    <button v-if="busy" type="button" class="stop" @click="emit('stop')">Stop</button>
    <button v-else type="submit" :disabled="!draft.trim()">Send</button>
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

.stop {
  border-color: #b91c1c;
  color: #b91c1c;
}
</style>
