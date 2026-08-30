<script setup lang="ts">
import { computed } from 'vue'
import type { UIMessage } from '@tanstack/ai-vue'
import type { MessagePart } from '@tanstack/ai/client'
import { ChevronRight, Wrench } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

const props = defineProps<{
  message: UIMessage
}>()

type ToolCallPart = Extract<MessagePart, { type: 'tool-call' }>
type ToolResultPart = Extract<MessagePart, { type: 'tool-result' }>

interface ToolTrace {
  id: string
  name: string
  argsLabel: string
  hasResult: boolean
  isError: boolean
}

function formatEntries(value: unknown): string {
  if (value !== null && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, entryValue]) => `${key}: ${JSON.stringify(entryValue)}`)
      .join(', ')
  }
  return JSON.stringify(value)
}

function formatArgs(part: ToolCallPart): string {
  if (part.input !== undefined) return formatEntries(part.input)
  return part.arguments
}

const traces = computed<Array<ToolTrace>>(() => {
  const parts = props.message.parts
  const toolCalls = parts.filter((part): part is ToolCallPart => part.type === 'tool-call')
  const results = parts.filter((part): part is ToolResultPart => part.type === 'tool-result')

  return toolCalls.map((call) => {
    const result = results.find((r) => r.toolCallId === call.id)
    return {
      id: call.id,
      name: call.name,
      argsLabel: formatArgs(call),
      // The result payload isn't shown — the widget renders it, and the raw
      // { valid, flagSvg, … } blob is noise in the trace. Keep only whether
      // it has landed (to drop the pending "…") and whether it errored.
      hasResult: result !== undefined,
      isError: call.state === 'error' || result?.state === 'error',
    }
  })
})

const names = computed(() => traces.value.map((trace) => trace.name).join(', '))
const anyError = computed(() => traces.value.some((trace) => trace.isError))
const anyPending = computed(() =>
  traces.value.some((trace) => !trace.hasResult && !trace.isError),
)
</script>

<template>
  <Collapsible v-if="traces.length" class="w-full text-xs">
    <CollapsibleTrigger
      class="group flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
    >
      <Wrench class="size-3 shrink-0" />
      <span class="font-medium">{{ names }}</span>
      <Badge v-if="anyError" variant="destructive" class="px-1.5 py-0 text-[10px]">failed</Badge>
      <span v-else-if="anyPending" class="animate-pulse">…</span>
      <ChevronRight
        class="size-3 shrink-0 transition-transform group-data-[state=open]:rotate-90"
      />
    </CollapsibleTrigger>
    <CollapsibleContent
      class="mt-1 flex flex-col gap-1 border-l pl-3 font-mono text-muted-foreground"
    >
      <div v-for="trace in traces" :key="trace.id" :class="{ 'text-destructive': trace.isError }">
        {{ trace.name }}({{ trace.argsLabel }})
      </div>
    </CollapsibleContent>
  </Collapsible>
</template>
