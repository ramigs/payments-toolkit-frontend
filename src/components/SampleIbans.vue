<script setup lang="ts">
import { computed } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useSampleIbans } from '@/composables/useSampleIbans'

const { ibans, error, isLoading } = useSampleIbans()

const emit = defineEmits<{
  // Clicked an IBAN — it should be appended to the chat draft.
  pick: [iban: string]
}>()

// The endpoint returns one IBAN per country (currently eight) — cap the list.
const shown = computed(() => ibans.value.slice(0, 6))
</script>

<template>
  <section>
    <h2 class="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
      Sample IBANs
    </h2>
    <p v-if="isLoading" class="text-sm text-muted-foreground">Loading…</p>
    <p v-else-if="error" class="text-sm text-destructive">{{ error.message }}</p>
    <ul v-else class="flex flex-col gap-2">
      <li v-for="item in shown" :key="item.iban">
        <Button
          variant="outline"
          class="h-auto w-full flex-col items-start gap-1 px-3 py-2 whitespace-normal"
          @click="emit('pick', item.iban)"
        >
          <Badge variant="secondary" class="font-normal">{{ item.country }}</Badge>
          <span class="font-mono text-xs break-all">{{ item.iban }}</span>
        </Button>
      </li>
    </ul>
  </section>
</template>
