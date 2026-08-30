<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { Send, Square } from '@lucide/vue'
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
  <form class="flex items-end gap-2" @submit.prevent="submit">
    <Textarea
      ref="textarea"
      v-model="draft"
      placeholder="Ask about a card number or IBAN…"
      class="max-h-40 min-h-10 flex-1 resize-none focus-visible:border-ring focus-visible:ring-0 focus-visible:shadow-sm"
      :disabled="busy"
      autofocus
      @keydown="onKeydown"
    />
    <Tooltip v-if="busy">
      <TooltipTrigger as-child>
        <Button
          type="button"
          variant="destructive"
          size="icon"
          aria-label="Stop generating"
          @click="emit('stop')"
        >
          <Square class="fill-current" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Stop generating</TooltipContent>
    </Tooltip>
    <Tooltip v-else>
      <TooltipTrigger as-child>
        <Button type="submit" size="icon" :disabled="!draft.trim()" aria-label="Send message">
          <Send />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Send · Enter</TooltipContent>
    </Tooltip>
  </form>
</template>
