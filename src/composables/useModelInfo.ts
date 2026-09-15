import { ref } from 'vue'
import { useAuth } from './useAuth'

// Companion to useAgentChat, served by the same payments-toolkit-agent host
// (see that repo's src/app.ts). GET /model-info returns the model backing the
// agent, meant to be shown once under the chat box rather than on every
// streamed run. Same host and auth as the chat endpoint.
const MODEL_INFO_URL =
  import.meta.env.VITE_AGENT_CHAT_URL.replace(/\/chat$/, '') + '/model-info'

export function useModelInfo() {
  const { getAccessToken } = useAuth()
  const model = ref<string | null>(null)
  const error = ref<Error | null>(null)

  async function load(): Promise<void> {
    try {
      const token = await getAccessToken()
      const res = await fetch(MODEL_INFO_URL, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error(`GET /model-info → ${res.status}`)
      const data = (await res.json()) as { model: string }
      model.value = data.model
    } catch (e) {
      error.value = e instanceof Error ? e : new Error(String(e))
    }
  }

  load()

  return { model, error }
}
