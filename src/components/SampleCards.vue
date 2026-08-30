<script setup lang="ts">
import { computed } from 'vue'
import SampleList from './SampleList.vue'
import { useSampleCards } from '@/composables/useSampleCards'

const { cards, error, isLoading } = useSampleCards()

const emit = defineEmits<{
  // Clicked a card — its number should be appended to the chat draft.
  pick: [cardNumber: string]
}>()

const items = computed(() =>
  cards.value.map((card) => ({ label: card.cardType, value: card.cardNumber })),
)
</script>

<template>
  <SampleList
    heading="Sample cards"
    error-title="Couldn't load sample cards"
    :items="items"
    :loading="isLoading"
    :error="error"
    badge-class="bg-emerald-100 text-emerald-700"
    @pick="emit('pick', $event)"
  />
</template>
