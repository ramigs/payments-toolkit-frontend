import { useChat, fetchServerSentEvents } from '@tanstack/ai-vue'

// payments-toolkit-agent's /chat now speaks real AG-UI (see that repo's
// PLAN.md, step 7 fast-follow). mocks/mock-ag-ui-server.ts on :8787 is
// still available for offline frontend work — swap back to it if the
// backend isn't running locally.
const AGENT_CHAT_URL = 'http://localhost:3001/chat'

export function useAgentChat() {
  const chat = useChat({
    connection: fetchServerSentEvents(AGENT_CHAT_URL),
  })

  // Stop an in-flight agent turn.
  //
  // `stop()` aborts the SSE fetch; the backend treats that dropped
  // connection as a cancel via the request signal. The explicit
  // POST /chat/:runId/cancel side-channel is belt-and-suspenders for the
  // case the backend's PLAN.md (step 10) calls out: a buffering proxy can
  // keep the upstream socket open after the fetch aborts, so the agent
  // would keep burning tokens. The frontend already holds the runId, so it
  // can hit the side-channel the moment Stop is clicked.
  //
  // Best-effort: a 404 just means the run already finished, and the local
  // stop() has already ended the turn for the user regardless.
  async function cancel(): Promise<void> {
    const runId = chat.runId.value
    chat.stop()
    if (!runId) return
    try {
      await fetch(`${AGENT_CHAT_URL}/${encodeURIComponent(runId)}/cancel`, {
        method: 'POST',
      })
    } catch {
      // network hiccup, or the run is already gone — nothing to recover
    }
  }

  return { ...chat, cancel }
}
