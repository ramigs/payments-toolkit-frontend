<script setup lang="ts">
import { computed } from 'vue'
import type { UIMessage } from '@tanstack/ai-vue'
import type { MessagePart } from '@tanstack/ai/client'

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
</script>

<template>
  <div v-if="traces.length" class="tool-trace">
    <div v-for="trace in traces" :key="trace.id" class="trace-line" :class="{ error: trace.isError }">
      <span class="icon">🔧</span>
      <span class="call">calling {{ trace.name }}({{ trace.argsLabel }})</span>
      <span v-if="trace.isError" class="result">→ failed</span>
      <span v-else-if="!trace.hasResult" class="pending">…</span>
    </div>
  </div>
</template>

<style scoped>
.tool-trace {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
}

.trace-line {
  font-family:
    ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.8rem;
  color: #475569;
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.trace-line.error {
  color: #b91c1c;
}

.result {
  font-weight: 600;
}

.pending {
  opacity: 0.6;
}
</style>
