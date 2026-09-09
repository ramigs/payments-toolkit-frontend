import { ref } from 'vue'
import { useAuth } from './useAuth'

// Sibling of useSampleCards, same payments-toolkit-agent host (see that repo's
// src/app.ts and src/sample-ibans.ts). GET /sample-ibans returns one randomly
// chosen valid IBAN per country, re-rolled on every request — the frontend
// uses it to seed a "try a sample" list without shipping its own IBANs.
// Auth-gated by the agent like the chat endpoint.
const SAMPLE_IBANS_URL =
  import.meta.env.VITE_AGENT_CHAT_URL.replace(/\/chat$/, '') + '/sample-ibans'

export interface SampleIban {
  countryCode: string
  country: string
  iban: string
}

export function useSampleIbans() {
  const { getAccessToken } = useAuth()
  const ibans = ref<SampleIban[]>([])
  const error = ref<Error | null>(null)
  const isLoading = ref(false)

  async function load(): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      const token = await getAccessToken()
      const res = await fetch(SAMPLE_IBANS_URL, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error(`GET /sample-ibans → ${res.status}`)
      ibans.value = (await res.json()) as SampleIban[]
    } catch (e) {
      error.value = e instanceof Error ? e : new Error(String(e))
    } finally {
      isLoading.value = false
    }
  }

  load()

  return { ibans, error, isLoading, reload: load }
}
