<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { AppBridge, PostMessageTransport } from '@modelcontextprotocol/ext-apps/app-bridge'

// One MCP Apps widget: the `ui://` resource the agent forwarded on a
// `ui-resource` event (see payments-toolkit-agent's AgUiTranslator.uiResource),
// reconciled by @tanstack/ai into a `ui-resource` message part. We act as the
// MCP Apps *host*: render the self-contained HTML in a sandboxed iframe, run
// the postMessage init handshake, then push the tool result in so the widget
// (payments-toolkit-mcp's card-preview, which reads `structuredContent`) can
// paint itself.
const props = defineProps<{
  resource: { uri: string; mimeType: string; text?: string }
  toolName: string
  toolInput?: Record<string, unknown>
  toolResult?: Record<string, unknown>
}>()

const frame = ref<HTMLIFrameElement | null>(null)
const size = ref({ width: 320, height: 200 })

let bridge: AppBridge | null = null
let ready = false

function pushToolData() {
  if (!bridge || !ready) return
  if (props.toolInput) {
    void bridge.sendToolInput({ arguments: props.toolInput })
  }
  if (props.toolResult) {
    void bridge.sendToolResult({
      content: [{ type: 'text', text: JSON.stringify(props.toolResult) }],
      structuredContent: props.toolResult,
    })
  }
}

onMounted(async () => {
  const el = frame.value
  if (!el?.contentWindow || !props.resource.text) return

  bridge = new AppBridge(null, { name: 'payments-toolkit-frontend', version: '0.0.0' }, {})
  bridge.onsizechange = ({ width, height }) => {
    if (width != null) size.value.width = width
    if (height != null) size.value.height = height
  }
  bridge.oninitialized = () => {
    ready = true
    pushToolData()
  }

  // Register the transport listener now, before the iframe's own script runs
  // and sends `ui/initialize` — the iframe document loads on a later task, so
  // the host is always listening in time.
  await bridge.connect(new PostMessageTransport(el.contentWindow, el.contentWindow))
})

// The result is already on the message by the time this widget renders, but
// re-push if it changes (or arrives after a slow handshake).
watch(() => props.toolResult, pushToolData)

onBeforeUnmount(async () => {
  if (!bridge) return
  try {
    await bridge.teardownResource({})
  } catch {
    // Widget may be gone already — nothing to tear down.
  }
  await bridge.close()
  bridge = null
})
</script>

<template>
  <figure class="mcp-app">
    <iframe
      ref="frame"
      class="frame"
      :title="`${toolName} widget`"
      sandbox="allow-scripts"
      :srcdoc="resource.text"
      :style="{ width: `${size.width}px`, height: `${size.height}px` }"
    />
  </figure>
</template>

<style scoped>
.mcp-app {
  margin: 0.5rem 0 0;
}

.frame {
  border: 0;
  display: block;
  max-width: 100%;
  color-scheme: normal;
}
</style>
