import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

type MaybeComponent = HTMLElement | { $el?: unknown } | null | undefined

interface Options {
  // How close to the bottom (px) still counts as "pinned".
  threshold?: number
}

/**
 * Stick-to-bottom scrolling for a shadcn-vue ScrollArea.
 *
 * `container` is a template ref to the <ScrollArea> component (or its root
 * element). While the user is at the bottom, new/streamed content keeps the
 * view pinned there; once they scroll up, auto-follow stops until they come
 * back down (or call `scrollToBottom()` — e.g. on their own send).
 */
export function useAutoScroll(container: Ref<MaybeComponent>, options: Options = {}) {
  const threshold = options.threshold ?? 80
  const isPinned = ref(true)

  let viewport: HTMLElement | null = null
  let mutation: MutationObserver | null = null
  let frame = 0

  function resolveViewport(): HTMLElement | null {
    const value = container.value
    const root = value instanceof HTMLElement ? value : ((value?.$el ?? null) as HTMLElement | null)
    return (
      root?.querySelector<HTMLElement>('[data-reka-scroll-area-viewport]') ??
      root?.querySelector<HTMLElement>('[data-slot="scroll-area-viewport"]') ??
      null
    )
  }

  function atBottom(): boolean {
    if (!viewport) return true
    return viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight <= threshold
  }

  function scrollToBottom(behavior: ScrollBehavior = 'auto'): void {
    if (!viewport) return
    viewport.scrollTo({ top: viewport.scrollHeight, behavior })
    isPinned.value = true
  }

  function onScroll(): void {
    isPinned.value = atBottom()
  }

  function followIfPinned(): void {
    if (!isPinned.value) return
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(() => {
      if (viewport) viewport.scrollTop = viewport.scrollHeight
    })
  }

  onMounted(() => {
    viewport = resolveViewport()
    if (!viewport) return
    viewport.addEventListener('scroll', onScroll, { passive: true })
    // Catches streamed text, new turns, tool traces, and late-rendering widgets.
    mutation = new MutationObserver(followIfPinned)
    mutation.observe(viewport, { childList: true, subtree: true, characterData: true })
    scrollToBottom()
  })

  onBeforeUnmount(() => {
    viewport?.removeEventListener('scroll', onScroll)
    mutation?.disconnect()
    cancelAnimationFrame(frame)
  })

  return { isPinned, scrollToBottom }
}
