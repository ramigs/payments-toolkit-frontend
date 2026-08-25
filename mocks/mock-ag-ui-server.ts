/**
 * Local stand-in for payments-toolkit-agent's POST /chat, until that
 * endpoint speaks real AG-UI (see PLAN.md's "Blocking dependency").
 *
 * Replays one of three fixed, hand-written AG-UI event sequences over SSE,
 * chosen by keyword-sniffing the last user message. Event shapes follow
 * @ag-ui/core's EventType + the spec keys TanStack's client strips wire
 * chunks down to (see stripToSpec in @tanstack/ai), so swapping this
 * server's URL for the real backend's should be a one-line change.
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'

const PORT = 8787

interface WireMessage {
  role: string
  content?: unknown
}

interface RunAgentInput {
  threadId: string
  runId: string
  messages?: Array<WireMessage>
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function sseLine(event: Record<string, unknown>): string {
  return `data: ${JSON.stringify({ timestamp: Date.now(), ...event })}\n\n`
}

function chunksOf(text: string, size = 24): Array<string> {
  const out: Array<string> = []
  for (let i = 0; i < text.length; i += size) out.push(text.slice(i, i + size))
  return out
}

function lastUserText(messages: Array<WireMessage>): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i]
    if (message?.role === 'user' && typeof message.content === 'string') {
      return message.content
    }
  }
  return ''
}

type Scenario = 'iban' | 'card' | 'declined'

function pickScenario(text: string): Scenario {
  const lower = text.toLowerCase()
  if (lower.includes('iban')) return 'iban'
  if (lower.includes('card')) return 'card'
  return 'declined'
}

/**
 * Registers the assistant message via an empty TEXT_MESSAGE_START/END pair
 * before any TOOL_CALL_START references it as parentMessageId.
 *
 * Works around a bug in @tanstack/ai@0.49.1's StreamProcessor: when
 * TOOL_CALL_START's parentMessageId points at a message with no prior
 * TEXT_MESSAGE_START, ensureAssistantMessage() takes its "backward compat"
 * auto-create path and sets pendingManualMessageId. The *real* subsequent
 * TEXT_MESSAGE_START for that id then hits the pendingManualMessageId branch
 * instead of the "existing message" branch, which skips resetting
 * hasToolCallsSinceTextStart — so the first TEXT_MESSAGE_CONTENT delta after
 * the tool call gets silently dropped from the rendered text. Pre-registering
 * the message keeps TEXT_MESSAGE_START on the normal "new message" path and
 * avoids the bug. Verified against @tanstack/ai's StreamProcessor directly.
 */
async function* openAssistantMessage(messageId: string) {
  yield sseLine({ type: 'TEXT_MESSAGE_START', messageId, role: 'assistant' })
  yield sseLine({ type: 'TEXT_MESSAGE_END', messageId })
}

async function* finalAnswer(messageId: string, text: string) {
  yield sseLine({ type: 'TEXT_MESSAGE_START', messageId, role: 'assistant' })
  for (const delta of chunksOf(text)) {
    yield sseLine({ type: 'TEXT_MESSAGE_CONTENT', messageId, delta })
    await sleep(40)
  }
  yield sseLine({ type: 'TEXT_MESSAGE_END', messageId })
}

async function* ibanScenario(threadId: string, runId: string) {
  const assistantMessageId = `msg-${runId}-assistant`
  const toolCallId = `call-${runId}-iban`

  yield sseLine({ type: 'RUN_STARTED', threadId, runId })
  await sleep(200)
  yield* openAssistantMessage(assistantMessageId)

  yield sseLine({
    type: 'TOOL_CALL_START',
    toolCallId,
    toolCallName: 'validate_iban',
    parentMessageId: assistantMessageId,
  })
  await sleep(150)
  yield sseLine({ type: 'TOOL_CALL_ARGS', toolCallId, delta: '{"iban":"DE89370400440532013000"}' })
  await sleep(150)
  yield sseLine({ type: 'TOOL_CALL_END', toolCallId })
  await sleep(200)
  yield sseLine({
    type: 'TOOL_CALL_RESULT',
    messageId: `tool-${toolCallId}`,
    toolCallId,
    role: 'tool',
    content: JSON.stringify({ valid: true, country: 'DE', bban: '370400440532013000' }),
  })
  await sleep(200)

  yield* finalAnswer(
    assistantMessageId,
    'That IBAN is valid — DE89370400440532013000 is a well-formed German account number.',
  )

  yield sseLine({ type: 'RUN_FINISHED', threadId, runId })
}

async function* cardScenario(threadId: string, runId: string) {
  const assistantMessageId = `msg-${runId}-assistant`
  const toolCallId = `call-${runId}-card`

  yield sseLine({ type: 'RUN_STARTED', threadId, runId })
  await sleep(200)
  yield* openAssistantMessage(assistantMessageId)

  yield sseLine({
    type: 'TOOL_CALL_START',
    toolCallId,
    toolCallName: 'validate_card_number',
    parentMessageId: assistantMessageId,
  })
  await sleep(150)
  yield sseLine({ type: 'TOOL_CALL_ARGS', toolCallId, delta: '{"card_number":"4111111111111112"}' })
  await sleep(150)
  yield sseLine({ type: 'TOOL_CALL_END', toolCallId })
  await sleep(200)
  yield sseLine({
    type: 'TOOL_CALL_RESULT',
    messageId: `tool-${toolCallId}`,
    toolCallId,
    role: 'tool',
    content: JSON.stringify({ valid: false, reason: 'failed Luhn checksum' }),
  })
  await sleep(200)

  yield* finalAnswer(
    assistantMessageId,
    "That card number isn't valid — it fails the Luhn checksum, so it can't be a real card number.",
  )

  yield sseLine({ type: 'RUN_FINISHED', threadId, runId })
}

async function* declinedScenario(threadId: string, runId: string) {
  const assistantMessageId = `msg-${runId}-assistant`

  yield sseLine({ type: 'RUN_STARTED', threadId, runId })
  await sleep(200)

  yield* finalAnswer(
    assistantMessageId,
    'I can only help with card number validation, card type detection, and IBAN validation — that request is outside what I can do here.',
  )

  yield sseLine({ type: 'RUN_FINISHED', threadId, runId })
}

function scenarioFor(scenario: Scenario, threadId: string, runId: string) {
  switch (scenario) {
    case 'iban':
      return ibanScenario(threadId, runId)
    case 'card':
      return cardScenario(threadId, runId)
    case 'declined':
      return declinedScenario(threadId, runId)
  }
}

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Run-Id',
  }
}

async function readJsonBody(req: IncomingMessage): Promise<RunAgentInput> {
  const chunks: Array<Buffer> = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  return JSON.parse(Buffer.concat(chunks).toString('utf-8')) as RunAgentInput
}

async function handleChat(req: IncomingMessage, res: ServerResponse) {
  const input = await readJsonBody(req)
  const scenario = pickScenario(lastUserText(input.messages ?? []))

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    ...corsHeaders(),
  })

  for await (const line of scenarioFor(scenario, input.threadId, input.runId)) {
    res.write(line)
  }
  res.end()
}

const server = createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders())
    res.end()
    return
  }

  if (req.method === 'POST' && req.url === '/chat') {
    handleChat(req, res).catch((error: unknown) => {
      console.error('mock-ag-ui-server: request failed', error)
      if (!res.headersSent) res.writeHead(500, corsHeaders())
      res.end()
    })
    return
  }

  res.writeHead(404, corsHeaders())
  res.end('Not found')
})

server.listen(PORT, () => {
  console.log(`mock-ag-ui-server listening on http://localhost:${PORT}/chat`)
  console.log('Scenarios: mention "iban" -> valid IBAN, "card" -> invalid card, anything else -> declined')
})
