<script setup lang="ts">
import { useSampleCards } from '../composables/useSampleCards'

const { cards, error, isLoading } = useSampleCards()

const emit = defineEmits<{
  // Clicked a card — its number should be appended to the chat draft.
  pick: [cardNumber: string]
}>()
</script>

<template>
  <section class="sample-cards">
    <h2>Sample cards</h2>
    <p v-if="isLoading" class="muted">Loading…</p>
    <p v-else-if="error" class="error">{{ error.message }}</p>
    <ul v-else class="list">
      <li v-for="card in cards" :key="card.cardNumber">
        <button type="button" class="card" @click="emit('pick', card.cardNumber)">
          <span class="card-type">{{ card.cardType }}</span>
          <span class="card-number">{{ card.cardNumber }}</span>
        </button>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.sample-cards h2 {
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

.card {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  padding: 0.625rem 0.75rem;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.card:hover {
  border-color: #94a3b8;
  background: #f8fafc;
}

.card:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 1px;
}

.card-type {
  font-size: 0.75rem;
  color: #64748b;
}

.card-number {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.875rem;
  color: #0f172a;
}

.muted {
  color: #64748b;
  font-size: 0.875rem;
}

.error {
  color: #b91c1c;
  font-size: 0.875rem;
}
</style>
