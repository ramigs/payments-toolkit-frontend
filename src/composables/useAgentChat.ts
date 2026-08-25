import { useChat, fetchServerSentEvents } from '@tanstack/ai-vue'

// payments-toolkit-agent's /chat now speaks real AG-UI (see that repo's
// PLAN.md, step 7 fast-follow). mocks/mock-ag-ui-server.ts on :8787 is
// still available for offline frontend work — swap back to it if the
// backend isn't running locally.
const AGENT_CHAT_URL = 'http://localhost:3001/chat'

export function useAgentChat() {
  return useChat({
    connection: fetchServerSentEvents(AGENT_CHAT_URL),
  })
}
