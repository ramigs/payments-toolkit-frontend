<script setup lang="ts">
import { computed } from 'vue'
import { useSampleIbans } from '../composables/useSampleIbans'

const { ibans, error, isLoading } = useSampleIbans()

const emit = defineEmits<{
  // Clicked an IBAN — it should be appended to the chat draft.
  pick: [iban: string]
}>()

// The endpoint returns one IBAN per country (currently eight) — cap the list.
const shown = computed(() => ibans.value.slice(0, 6))
</script>

<template>
  <section class="sample-ibans">
    <h2>Sample IBANs</h2>
    <p v-if="isLoading" class="muted">Loading…</p>
    <p v-else-if="error" class="error">{{ error.message }}</p>
    <ul v-else class="list">
      <li v-for="item in shown" :key="item.iban">
        <button type="button" class="card" @click="emit('pick', item.iban)">
          <span class="card-type">{{ item.country }}</span>
          <span class="card-number">{{ item.iban }}</span>
        </button>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.sample-ibans h2 {
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
  word-break: break-all;
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
