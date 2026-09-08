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

// Width is the host's to decide: the iframe fills the transcript column up to
// MAX_WIDTH and the widget adapts to whatever width it's handed (we send that
// down as `containerDimensions`). Height is the widget's to report — its
// content height, pushed up by the ext-apps `autoResize` ResizeObserver — which
// we clamp so a runaway widget can't take over the view; content past the cap
// scrolls inside the iframe.
const MAX_WIDTH = 360
const MIN_HEIGHT = 96
const MAX_HEIGHT_FRACTION = 0.8

const frame = ref<HTMLIFrameElement | null>(null)
const container = ref<HTMLElement | null>(null)
// Reserve a plausible box before the handshake so the card doesn't pop the
// layout when its first measurement lands. Once resource `_meta` frame hints
// are threaded through @tanstack/ai (its `UIResourcePart.meta` is reserved but
// unpopulated today), seed this per-widget instead of guessing.
const height = ref(210)
const measured = ref(false)

let bridge: AppBridge | null = null
let ready = false
let resizeObserver: ResizeObserver | null = null

function maxHeight() {
  return Math.round(window.innerHeight * MAX_HEIGHT_FRACTION)
}

function width() {
  return Math.min(container.value?.clientWidth ?? MAX_WIDTH, MAX_WIDTH)
}

function pushContainerDimensions() {
  // setHostContext diffs internally and no-ops when nothing changed, so it's
  // cheap to call on every ResizeObserver / window-resize tick.
  bridge?.setHostContext({
    containerDimensions: { width: width(), maxHeight: maxHeight() },
  })
}

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

  bridge = new AppBridge(
    null,
    { name: 'payments-toolkit-frontend', version: '0.0.0' },
    {},
    // Seed the box in the init handshake so the widget's first paint already
    // knows its width budget instead of laying out at some default and reflowing.
    { hostContext: { containerDimensions: { width: width(), maxHeight: maxHeight() } } },
  )
  // Height only — width is ours. Clamp to [MIN_HEIGHT, maxHeight]; anything
  // taller scrolls inside the iframe rather than growing the transcript.
  bridge.onsizechange = ({ height: reported }) => {
    if (reported == null) return
    height.value = Math.max(MIN_HEIGHT, Math.min(Math.round(reported), maxHeight()))
    measured.value = true
  }
  bridge.oninitialized = () => {
    ready = true
    pushToolData()
  }

  // Register the transport listener now, before the iframe's own script runs
  // and sends `ui/initialize` — the iframe document loads on a later task, so
  // the host is always listening in time.
  await bridge.connect(new PostMessageTransport(el.contentWindow, el.contentWindow))

  // Tell the widget when its width budget changes (column reflow, window
  // resize) so responsive widgets can re-fit.
  resizeObserver = new ResizeObserver(pushContainerDimensions)
  if (container.value) resizeObserver.observe(container.value)
  window.addEventListener('resize', pushContainerDimensions)
})

// The result is already on the message by the time this widget renders, but
// re-push if it changes (or arrives after a slow handshake).
watch(() => props.toolResult, pushToolData)

onBeforeUnmount(async () => {
  resizeObserver?.disconnect()
  window.removeEventListener('resize', pushContainerDimensions)
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
  <figure ref="container" class="mcp-app">
    <iframe
      ref="frame"
      class="frame"
      :class="{ measured }"
      :title="`${toolName} widget`"
      sandbox="allow-scripts"
      :srcdoc="resource.text"
      :style="{ height: `${height}px` }"
    />
  </figure>
</template>

<style scoped>
.mcp-app {
  margin: 0.5rem 0 0;
  /* Keep in sync with MAX_WIDTH — this is what the iframe (and so the width we
     report to the widget) is capped at. */
  max-width: 360px;
}

.frame {
  border: 0;
  display: block;
  width: 100%;
  color-scheme: normal;
}

/* Animate real reflows, but not the initial jump off the reserved height. */
.frame.measured {
  transition: height 0.15s ease;
}
</style>
