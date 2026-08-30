<script setup lang="ts">
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useSampleCards } from '@/composables/useSampleCards'

const { cards, error, isLoading } = useSampleCards()

const emit = defineEmits<{
  // Clicked a card — its number should be appended to the chat draft.
  pick: [cardNumber: string]
}>()
</script>

<template>
  <section>
    <h2 class="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
      Sample cards
    </h2>
    <p v-if="isLoading" class="text-sm text-muted-foreground">Loading…</p>
    <p v-else-if="error" class="text-sm text-destructive">{{ error.message }}</p>
    <ul v-else class="flex flex-col gap-2">
      <li v-for="card in cards" :key="card.cardNumber">
        <Button
          variant="outline"
          class="h-auto w-full flex-col items-start gap-1 px-3 py-2 whitespace-normal"
          @click="emit('pick', card.cardNumber)"
        >
          <Badge variant="secondary" class="font-normal">{{ card.cardType }}</Badge>
          <span class="font-mono text-sm">{{ card.cardNumber }}</span>
        </Button>
      </li>
    </ul>
  </section>
</template>
