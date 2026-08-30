<script setup lang="ts">
import { CircleAlert } from '@lucide/vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
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

    <div v-if="isLoading" class="flex flex-col gap-2">
      <Skeleton v-for="n in 6" :key="n" class="h-14 w-full" />
    </div>

    <Alert v-else-if="error" variant="destructive">
      <CircleAlert />
      <AlertTitle>Couldn't load sample cards</AlertTitle>
      <AlertDescription>{{ error.message }}</AlertDescription>
    </Alert>

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
