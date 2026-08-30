import { ref } from 'vue'

// Companion to useAgentChat, served by the same payments-toolkit-agent host
// (see that repo's src/app.ts). GET /sample-cards returns one randomly chosen
// valid test PAN per network, re-rolled on every request — the frontend uses
// it to seed a "try a sample" list without shipping its own card numbers.
const SAMPLE_CARDS_URL = 'http://localhost:3001/sample-cards'

export interface SampleCard {
  cardType: string
  cardNumber: string
}

export function useSampleCards() {
  const cards = ref<SampleCard[]>([])
  const error = ref<Error | null>(null)
  const isLoading = ref(false)

  async function load(): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      const res = await fetch(SAMPLE_CARDS_URL)
      if (!res.ok) throw new Error(`GET /sample-cards → ${res.status}`)
      cards.value = (await res.json()) as SampleCard[]
    } catch (e) {
      error.value = e instanceof Error ? e : new Error(String(e))
    } finally {
      isLoading.value = false
    }
  }

  load()

  return { cards, error, isLoading, reload: load }
}
