import { watch } from 'vue'
import { useChat, fetchServerSentEvents } from '@tanstack/ai-vue'
import { useAuth } from './useAuth'

// payments-toolkit-agent's /chat now speaks real AG-UI (see that repo's
// PLAN.md, step 7 fast-follow). Point VITE_AGENT_CHAT_URL at the mock on
// :8787 (`pnpm run mock`) for offline frontend work. The cancel side-channel
// is derived from this as `<url>/<runId>/cancel`.
const AGENT_CHAT_URL = import.meta.env.VITE_AGENT_CHAT_URL

export function useAgentChat() {
  const { getAccessToken, signOut } = useAuth()

  // getAccessToken() reads through supabase.auth.getSession(), which refreshes a
  // stale token — so resolving this per request keeps every turn authenticated.
  async function authHeaders(): Promise<Record<string, string>> {
    const token = await getAccessToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  const chat = useChat({
    connection: fetchServerSentEvents(AGENT_CHAT_URL, async () => ({
      headers: await authHeaders(),
    })),
  })

  // A 401 back from the agent means the session is dead server-side (revoked, or
  // the refresh token expired) — autoRefreshToken can't recover it. Drop to the
  // login gate. The adapter reports it as "HTTP error! status: 401 ...".
  watch(
    () => chat.error.value,
    (err) => {
      if (err?.message.includes('status: 401')) void signOut()
    },
  )

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
        headers: await authHeaders(),
      })
    } catch {
      // network hiccup, or the run is already gone — nothing to recover
    }
  }

  return { ...chat, cancel }
}
