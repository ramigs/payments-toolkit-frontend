# PLAN: payments-toolkit-frontend

A Vue 3 SPA (plain Vite, no SSR/routing), built on
[TanStack AI](https://tanstack.com/ai)'s Vue client, that talks to
[payments-toolkit-agent](https://github.com/ramigs/payments-toolkit-agent)
over AG-UI and shows a user, live in the browser, an agent deciding to call
`validate_card_number` or `detect_card_type` or `validate_iban`, the
tool-call + result streaming in, and the final answer — not just a
spinner-then-answer chat box. This is step 2 of 2 in the larger project;
step 1 (`payments-toolkit-agent`) is the backend this consumes. Based on
the original brainstorming in `ag-ui.md` plus everything confirmed while
building step 1 (see "What we learned building the backend" below).

## Backend dependency (resolved)

`payments-toolkit-agent`'s `POST /chat` originally streamed this repo's own
event shapes (`tool_call`/`tool_result`/`content`/`error`/`done`), which a
real AG-UI client can't parse. The backend's hand-written AG-UI translator
(its PLAN.md, step 8) landed against `@ag-ui/core`'s official types — no
ADK↔AG-UI bridge exists for TypeScript, only Python's `ag_ui_adk` — and
step 5 below swapped this frontend onto it. The one-line URL swap held: the
mock and the real backend are interchangeable.

The local mock AG-UI SSE endpoint (step 2) is still maintained for offline
frontend work — no Gemini key or agent/MCP processes needed.

## What we learned building the backend

Worth carrying into this plan rather than re-discovering:

- **AG-UI standardizes the event shape, not the transport.** SSE,
  WebSocket, HTTP binary are all valid — the backend chose SSE (simplest
  correct choice for one agent, one user at a time, no need for
  bidirectional complexity).
- **TanStack AI is genuinely protocol-agnostic on both ends** — confirmed
  directly against TanStack's own docs/blog before committing to it here.
  `@tanstack/ai-vue`'s client can consume *any* correctly-shaped AG-UI SSE
  stream, regardless of what built the server (no requirement to also use
  TanStack's server-side helpers). So the backend doesn't need to adopt
  any TanStack-specific code — it just needs to emit spec-correct AG-UI
  events, and this frontend's client will understand it.
- **AG-UI is pre-1.0** (`@ag-ui/core` resolves to `0.1.1-canary.beta.0` in
  this repo's lockfile — transitively, via `@tanstack/ai@0.52.0`; the
  backend declares `@ag-ui/core@^0.0.58` directly) — expect some
  instability in exact event shapes/semantics. Build the
  tool-call-visibility UI against a small, deliberately chosen subset of
  event types first (tool call start/args/end/result, text content, run
  started/finished), not full spec coverage speculatively.
- **`@tanstack/ai` client bug — tool call before any text dropped the
  first text delta — fixed in `0.51.0`; this repo now runs `0.52.0` and
  carries no workaround.** In `0.49.1`, if `TOOL_CALL_START.parentMessageId`
  referenced a message id that hadn't had a `TEXT_MESSAGE_START` yet,
  `StreamProcessor.ensureAssistantMessage()` took its backward-compat
  auto-create path and set `pendingManualMessageId`. The real
  `TEXT_MESSAGE_START` that followed for that same id then hit the
  `pendingManualMessageId` branch instead of the "existing message"
  branch, which was the only branch that reset
  `hasToolCallsSinceTextStart` — so the *second* `TEXT_MESSAGE_CONTENT`
  delta silently wiped the first one instead of appending to it.
  Reproduced and root-caused directly against `StreamProcessor` outside
  Vue/HTTP. This is exactly the "tool call, then final answer" ordering
  this whole project renders, so any spec-correct AG-UI producer hit it.
  `0.51.0`'s `handleTextMessageStartEvent` adds an explicit branch that resets the
  segment accumulator (`currentSegmentText` / `lastEmittedText` /
  `hasToolCallsSinceTextStart`) when the message was already marked by a
  prior tool call — the same reset the "existing message" branch does.
  Until then the workaround was to emit an empty
  `TEXT_MESSAGE_START`/`TEXT_MESSAGE_END` pair for the assistant message
  id before any `TOOL_CALL_START` referenced it; that's been removed from
  `mocks/mock-ag-ui-server.ts`. The real backend's translator had the
  same empty-pair workaround (its PLAN.md, step 8); it's been removed
  there too now that the only consumer runs `@tanstack/ai >= 0.51.0`.

## Non-goals (for this iteration)

- No changes to `payments-toolkit-agent` or `payments-toolkit-mcp` beyond
  what's already tracked in their own PLAN.md files — this project
  consumes the backend, it doesn't own it.
- No multi-turn conversation persistence — the backend is single-turn per
  request (see its PLAN.md), so this frontend is too. A session history UI
  is a fast-follow blocked on the backend supporting it.
- No production deployment — local-first, matching the backend's own
  scope for this phase.
- No auth/guardrails — same deferral as the backend.

## Prerequisites

- Node.js `^22.18.0 || >=24.12.0` (see `package.json` `engines`; `.nvmrc`
  pins v24), pnpm
- Vue 3 via plain Vite (locked in — no SSR/routing needed for a one-screen demo)
- `payments-toolkit-agent` running locally (`pnpm run start:http`), or the
  local mock endpoint from step 2 for offline frontend work

## Project structure

```
payments-toolkit-frontend/
  src/
    App.vue                 # wires ChatInput + MessageList together via useAgentChat
    components/
      ChatInput.vue         # prompt box; send button becomes Stop while a turn streams
      MessageList.vue       # rendered conversation (user + agent turns)
      ToolCallTrace.vue     # live tool-call visibility: name, args, result, per turn
      McpAppView.vue        # hosts an MCP Apps `ui://` widget in a sandboxed iframe
    composables/
      useAgentChat.ts       # wraps @tanstack/ai-vue's useChat; points at the backend (or mock)
  mocks/
    mock-ag-ui-server.ts    # local dev server emitting hand-written AG-UI SSE events
                            # (offline stand-in for the backend; also mirrors its cancel surface)
  package.json
  tsconfig.json
  README.md
```

## Steps

### 1. Scaffold the project

- Vue 3 + TypeScript via plain Vite (locked in — no SSR/routing needed for
  what's actually a one-screen demo)
- `pnpm add @tanstack/ai @tanstack/ai-vue`
- Copy the `.nvmrc` / repo-hygiene conventions from `payments-toolkit-mcp`
  and `payments-toolkit-agent` for consistency across the three repos

### 2. Stand up a local mock AG-UI endpoint

- A tiny local server (`mocks/mock-ag-ui-server.ts`) that replays
  hand-written, spec-correct AG-UI event sequences over SSE, picked by a
  keyword in the prompt — enough to build and screenshot the UI against
  before the real backend can produce these events
- Scenarios: "valid IBAN" turn, "invalid card" turn, "card type" turn
  (adds the MCP Apps widget — see step 6), "declined out-of-scope" turn
- This unblocks steps 3-4 without waiting on `payments-toolkit-agent`'s
  translator work. Later grew a cancel surface to match the backend
  (step 8).

### 3. Build a minimal chat UI

- `ChatInput.vue` + `MessageList.vue`, wired to `@tanstack/ai-vue`'s
  `useChat` (via `fetchServerSentEvents`) pointed at the mock endpoint
- Text in, final agent response rendered — the baseline before adding
  tool-call visibility on top

### 4. Render live tool-call visibility — the actual point of this project

- `ToolCallTrace.vue`: as AG-UI tool-call-start/args/end/result events
  arrive, show them inline in the conversation as they happen (e.g. "🔧
  calling validate_iban(iban: DE89…) → valid: true"), not just a spinner
  that resolves to a final answer
- This is the differentiator identified in the original brainstorming —
  visible agent reasoning, not a black-box chat response

### 5. Swap the mock for the real backend — done

`payments-toolkit-agent`'s `/chat` now emits real AG-UI events (see that
repo's PLAN.md, step 8). `useAgentChat.ts`'s `AGENT_CHAT_URL` points at
`http://localhost:3001/chat`; the mock's `:8787` stays available for
offline frontend work.

- Verified live against the real backend, not just curl: single- and
  multi-tool-call turns both render correctly in `ToolCallTrace.vue`
  against genuine Gemini/MCP tool calls — this is the real-world
  validation step the backend's own PLAN.md flagged as the reason to
  defer its AG-UI work until a real consumer existed.
- One gap the mock didn't surface: the real backend had no CORS
  handling, so the browser silently failed reading the SSE response
  (`fetchServerSentEvents` surfaced this as "Stream response body read
  failed" — worth remembering as the symptom, since it doesn't look like
  a CORS error at first glance). Fixed backend-side with `hono/cors` on
  `/chat`; nothing changed here. The mock server already had CORS
  handling built in from the start (see step 2), which is why this
  didn't show up until the swap.

### 6. Render MCP Apps widgets inline — done

`payments-toolkit-mcp`'s `detect_card_type` advertises an MCP Apps UI
widget (a `ui://payments-toolkit/card-preview` resource). The backend
forwards it as an AG-UI `CUSTOM` event (`name: "ui-resource"`, its PLAN.md
step 9), which `@tanstack/ai` reconciles into a `ui-resource` message part.

- `McpAppView.vue` acts as the MCP Apps *host*: renders the self-contained
  widget HTML in a sandboxed iframe, runs the `@modelcontextprotocol/ext-apps`
  postMessage init handshake, then pushes the tool input/result in so the
  widget (which reads `structuredContent`) paints itself.
- `MessageList.vue` pairs each `ui-resource` part with its tool call/result
  by `toolCallId` and holds the widget back until the agent's answer text
  starts streaming — the event arrives right after the tool result, and
  popping the card in mid-stream reads as out-of-order.
- The mock's "card type" scenario forwards the real built widget from
  `../payments-toolkit-mcp/dist/ui/card-preview/` so the handshake is
  exercised offline against the genuine ext-apps SDK.

### 7. Cancel / interrupt for an in-flight turn — done

`payments-toolkit-agent` shipped its side (its PLAN.md, step 10): a client
disconnect on `/chat` cancels the turn via the request signal, and an
explicit `POST /chat/:runId/cancel` side-channel does the same without
waiting for the socket to drop (which a buffering proxy can delay).

- `ChatInput.vue`'s send button becomes a **Stop** button while a turn is
  in flight (`busy` prop); the text input stays locked, since the backend
  is single-turn.
- `useAgentChat.ts` exposes `cancel()`: it calls `@tanstack/ai-vue`'s
  `stop()` (aborts the SSE fetch — the zero-API-surface path the backend
  already honours) and *also* fires `POST /chat/:runId/cancel` with the
  runId the client already holds. Best-effort — a `404` just means the run
  already finished.
- A cancel that reaches the client as an AG-UI event surfaces as an error
  with message `"cancelled"` (backend has no `RUN_CANCELLED`); `App.vue`
  renders that as a muted "Turn stopped." notice, not a red error. The
  local `stop()` path doesn't set an error at all (`AbortError` is
  swallowed by the client), so this only matters for a backend-initiated
  cancel.
- `mocks/mock-ag-ui-server.ts` gained the same two triggers (a `res`
  'close' listener + a `POST /chat/:runId/cancel` route backed by an
  in-flight-run registry) so the Stop control is exercisable offline.
  Verified with `curl`: explicit cancel mid-stream ends the stream with
  `RUN_ERROR`/`cancelled`, client disconnect cleans the registry, a second
  cancel returns `404`.

### 8. README pass — ongoing

- Document setup, how to run against the mock vs. the real backend, and
  the dependency on `payments-toolkit-agent`
- Link back to both `payments-toolkit-mcp` and `payments-toolkit-agent` as
  the companion projects in this series
- Kept current as steps 6-7 landed (MCP Apps widgets, Stop control)

## Fast-follows (explicitly out of scope for this PLAN, tracked for later)

- Multi-turn conversation history/session UI, once the backend supports
  session state (see `payments-toolkit-agent`'s fast-follows)
- Visual/UX polish pass once the core loop (mock or real) is working end
  to end — this plan prioritizes proving the tool-call-visibility loop
  over demo polish
- Production deployment

## Definition of done for this iteration

- The chat UI runs against the local mock AG-UI endpoint and visibly
  renders tool-call start/args/result events as they stream in, not just
  a final answer
- The same UI works unmodified (beyond the endpoint URL, per step 5)
  against the real `payments-toolkit-agent` backend — verified live
- MCP Apps widgets forwarded by the backend render inline with their tool
  result (step 6); the Stop control cancels an in-flight turn (step 7)
- README explains setup, the mock/real backend split, and the
  cross-project dependency clearly enough that a stranger (or a future
  you) could pick this up cold
