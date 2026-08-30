<script setup lang="ts">
import { Button } from '@/components/ui/button'

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
  <section>
    <h2 class="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
      Try one
    </h2>
    <ul class="flex flex-col gap-2">
      <li v-for="example in examples" :key="example">
        <Button
          variant="outline"
          class="h-auto w-full justify-start px-3 py-2 text-left leading-snug whitespace-normal"
          @click="emit('ask', example)"
        >
          {{ example }}
        </Button>
      </li>
    </ul>
  </section>
</template>
