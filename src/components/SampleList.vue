<script setup lang="ts">
import { CircleAlert } from '@lucide/vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export interface SampleItem {
  // Shown as a Badge (network, country, …).
  label: string
  // The mono value clicked into the chat draft (card number, IBAN, …).
  value: string
}

withDefaults(
  defineProps<{
    heading: string
    errorTitle: string
    items: SampleItem[]
    loading?: boolean
    error?: Error | null
    // Font-size utility for the mono value — IBANs need the smaller one.
    valueClass?: string
  }>(),
  { valueClass: 'text-sm' },
)

const emit = defineEmits<{
  // A row was clicked — its value should be appended to the chat draft.
  pick: [value: string]
}>()
</script>

<template>
  <section>
    <h2 class="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
      {{ heading }}
    </h2>

    <div v-if="loading" class="flex flex-col gap-2">
      <Skeleton v-for="n in 6" :key="n" class="h-14 w-full" />
    </div>

    <Alert v-else-if="error" variant="destructive">
      <CircleAlert />
      <AlertTitle>{{ errorTitle }}</AlertTitle>
      <AlertDescription>{{ error.message }}</AlertDescription>
    </Alert>

    <ul v-else class="flex flex-col gap-2">
      <li v-for="item in items" :key="item.value">
        <Button
          variant="outline"
          class="h-auto w-full flex-col items-start gap-1 px-3 py-2 whitespace-normal"
          @click="emit('pick', item.value)"
        >
          <Badge variant="secondary" class="font-normal">{{ item.label }}</Badge>
          <span class="font-mono break-all" :class="valueClass">{{ item.value }}</span>
        </Button>
      </li>
    </ul>
  </section>
</template>
