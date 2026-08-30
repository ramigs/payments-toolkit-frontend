import { ref } from 'vue'

// Sibling of useSampleCards, same payments-toolkit-agent host (see that repo's
// src/app.ts and src/sample-ibans.ts). GET /sample-ibans returns one randomly
// chosen valid IBAN per country, re-rolled on every request — the frontend
// uses it to seed a "try a sample" list without shipping its own IBANs.
const SAMPLE_IBANS_URL = 'http://localhost:3001/sample-ibans'

export interface SampleIban {
  countryCode: string
  country: string
  iban: string
}

export function useSampleIbans() {
  const ibans = ref<SampleIban[]>([])
  const error = ref<Error | null>(null)
  const isLoading = ref(false)

  async function load(): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      const res = await fetch(SAMPLE_IBANS_URL)
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
