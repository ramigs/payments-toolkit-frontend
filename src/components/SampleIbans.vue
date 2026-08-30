<script setup lang="ts">
import { computed } from 'vue'
import SampleList from './SampleList.vue'
import { useSampleIbans } from '@/composables/useSampleIbans'

const { ibans, error, isLoading } = useSampleIbans()

const emit = defineEmits<{
  // Clicked an IBAN — it should be appended to the chat draft.
  pick: [iban: string]
}>()

// The endpoint returns one IBAN per country (currently eight) — cap the list.
const items = computed(() =>
  ibans.value.slice(0, 6).map((item) => ({ label: item.country, value: item.iban })),
)
</script>

<template>
  <SampleList
    heading="Sample IBANs"
    error-title="Couldn't load sample IBANs"
    :items="items"
    :loading="isLoading"
    :error="error"
    value-class="text-xs"
    badge-class="bg-sky-100 text-sky-700"
    @pick="emit('pick', $event)"
  />
</template>
