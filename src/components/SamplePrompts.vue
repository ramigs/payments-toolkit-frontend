<script setup lang="ts">
const emit = defineEmits<{
  // A starter prompt was clicked — send it as-is.
  ask: [prompt: string]
}>()

// Runnable examples: one per capability, phrased the way a user would.
const examples = [
  'Is 4111 1111 1111 1111 a valid card number?',
  'What network is 6011000990139424 on?',
  'Validate IBAN DE89370400440532013000',
]
</script>

<template>
  <section class="sample-prompts">
    <h2>Try one</h2>
    <ul class="list">
      <li v-for="example in examples" :key="example">
        <button type="button" class="prompt" @click="emit('ask', example)">
          {{ example }}
        </button>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.sample-prompts h2 {
  margin: 0 0 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.prompt {
  width: 100%;
  padding: 0.625rem 0.75rem;
  font: inherit;
  text-align: left;
  color: #0f172a;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  cursor: pointer;
}

.prompt:hover {
  border-color: #94a3b8;
  background: #f8fafc;
}

.prompt:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 1px;
}
</style>
