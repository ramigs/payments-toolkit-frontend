<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { ArrowUp, Square } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const props = defineProps<{
  // A turn is in flight: the input is locked (the backend is single-turn)
  // and the send button becomes a Stop button.
  busy?: boolean
}>()

const emit = defineEmits<{
  send: [message: string]
  stop: []
}>()

// Owned by the parent so the sample-card / sample-IBAN rails can append to it.
const draft = defineModel<string>({ default: '' })

function submit() {
  const message = draft.value.trim()
  if (!message || props.busy) return
  emit('send', message)
  draft.value = ''
}

// Enter sends; Shift+Enter inserts a newline. Ignore Enter mid-IME-composition.
function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault()
    submit()
  }
}

// Let the parent pull focus here after a sample is clicked. The Textarea's
// single root element is the <textarea> itself, so $el is that node.
const textarea = useTemplateRef<{ $el: HTMLTextAreaElement }>('textarea')
defineExpose({ focus: () => textarea.value?.$el?.focus() })
</script>

<template>
  <form class="relative" @submit.prevent="submit">
    <Textarea
      ref="textarea"
      v-model="draft"
      placeholder="Ask about a card number or IBAN…"
      class="max-h-40 min-h-10 w-full resize-none py-4 pr-14 focus-visible:border-ring focus-visible:ring-0 focus-visible:shadow-sm"
      :disabled="busy"
      autofocus
      @keydown="onKeydown"
    />
    <div class="absolute right-2 bottom-2">
      <Tooltip v-if="busy">
        <TooltipTrigger as-child>
          <Button
            type="button"
            variant="destructive"
            size="icon-sm"
            class="rounded-lg"
            aria-label="Stop generating"
            @click="emit('stop')"
          >
            <Square class="fill-current" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Stop generating</TooltipContent>
      </Tooltip>
      <Transition
        v-else
        enter-active-class="transition duration-150 ease-out"
        enter-from-class="opacity-0 scale-90"
        leave-active-class="transition duration-100 ease-in"
        leave-to-class="opacity-0 scale-90"
      >
        <Tooltip v-if="draft.trim()">
          <TooltipTrigger as-child>
            <Button type="submit" size="icon-sm" class="rounded-lg" aria-label="Send message">
              <ArrowUp class="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Send · Enter</TooltipContent>
        </Tooltip>
      </Transition>
    </div>
  </form>
</template>
