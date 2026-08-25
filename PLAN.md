# PLAN: payments-toolkit-frontend

A Vue/Nuxt frontend, built on [TanStack AI](https://tanstack.com/ai)'s Vue
client, that talks to
[payments-toolkit-agent](https://github.com/ramigs/payments-toolkit-agent)
over AG-UI and shows a user, live in the browser, an agent deciding to call
`validate_card_number` or `detect_card_type` or `validate_iban`, the
tool-call + result streaming in, and the final answer — not just a
spinner-then-answer chat box. This is step 2 of 2 in the larger project;
step 1 (`payments-toolkit-agent`) is the backend this consumes. Based on
the original brainstorming in `ag-ui.md` plus everything confirmed while
building step 1 (see "What we learned building the backend" below).

## Blocking dependency — read this first

`payments-toolkit-agent`'s `POST /chat` endpoint exists and streams SSE
today, but **not yet in AG-UI's event format** — it emits this repo's own
simple shapes (`tool_call`/`tool_result`/`content`/`error`/`done`). A real
AG-UI client (TanStack AI's `useChat` + `fetchServerSentEvents`, per the
Quick Start below) cannot correctly parse that stream as-is.

Turning it into real AG-UI events is tracked as a fast-follow in
`payments-toolkit-agent/PLAN.md`, not here — this is a frontend-only plan,
and that work happens in the backend repo. Confirmed while investigating
this: no ready-made ADK↔AG-UI bridge exists for TypeScript (only Python's
`ag_ui_adk`), so the backend's event mapping has to be written by hand
against `@ag-ui/core`'s official types. See that repo's PLAN.md for the
full investigation and decision.

**Until that lands**, this project's early steps (scaffolding, UI shell,
tool-call-visibility rendering) can be built and iterated against a local
mock AG-UI SSE endpoint (see step 2) — genuine AG-UI events are cheap to
fake by hand for a handful of fixed scenarios, so frontend work doesn't
have to sit idle waiting on the backend. Swapping the mock for the real
backend endpoint should be a one-line change (just the URL
`fetchServerSentEvents` points at) if both sides are honestly speaking
AG-UI.

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
- **AG-UI is pre-1.0** (`@ag-ui/core` at `0.1.1-canary.beta.0` in this
  repo's lockfile, `@tanstack/ai` at `0.49.1` — the `v0.0.58` originally
  noted here is stale) — expect some instability in exact event
  shapes/semantics. Build the tool-call-visibility UI against a small,
  deliberately chosen subset of event types first (tool call
  start/args/end/result, text content, run started/finished), not full
  spec coverage speculatively.
- **Known `@tanstack/ai@0.49.1` client bug — tool call before any text
  drops the first text delta.** If `TOOL_CALL_START.parentMessageId`
  references a message id that hasn't had a `TEXT_MESSAGE_START` yet,
  `StreamProcessor.ensureAssistantMessage()` takes its backward-compat
  auto-create path and sets `pendingManualMessageId`. The real
  `TEXT_MESSAGE_START` that follows for that same id then hits the
  `pendingManualMessageId` branch instead of the "existing message"
  branch, which is the only branch that resets
  `hasToolCallsSinceTextStart` — so the *second* `TEXT_MESSAGE_CONTENT`
  delta silently wipes the first one instead of appending to it.
  Reproduced and root-caused directly against `StreamProcessor` outside
  Vue/HTTP (not a mock- or app-specific bug). This is exactly the
  "tool call, then final answer" ordering this whole project renders —
  any spec-correct AG-UI producer hits it, including the real backend
  once its translator lands. **Workaround** (used in
  `mocks/mock-ag-ui-server.ts`): emit an empty
  `TEXT_MESSAGE_START`/`TEXT_MESSAGE_END` pair for the assistant message
  id *before* any `TOOL_CALL_START` references it as `parentMessageId`.
  This registers the message via the normal "new message" path so the
  later real `TEXT_MESSAGE_START` resets segment state correctly.
  `payments-toolkit-agent`'s AG-UI translator will need the same
  ordering — worth a note in that repo's PLAN.md when that work starts,
  or re-check whether a newer `@tanstack/ai` has fixed it by then.

## Non-goals (for this iteration)

- No changes to `payments-toolkit-agent` or `payments-toolkit-mcp` beyond
  what's already tracked in their own PLAN.md files — this project
  consumes the backend, it doesn't own it.
- No multi-turn conversation persistence — the backend is single-turn per
  request for now (see its PLAN.md), so this frontend is too. A session
  history UI is a fast-follow blocked on the backend supporting it.
- No cancel/interrupt control initially — genuinely one of AG-UI's new
  capabilities over plain chat UIs (per the original brainstorming), but
  blocked on the backend supporting mid-turn cancellation, which it
  doesn't yet. Fast-follow once the backend does.
- No production deployment — local-first, matching the backend's own
  scope for this phase.
- No auth/guardrails — same deferral as the backend.

## Prerequisites

- Node.js 18+, pnpm (matching the backend's requirements)
- Vue 3 via plain Vite (locked in — no SSR/routing needed for a one-screen demo)
- `payments-toolkit-agent` running locally, **once its `/chat` endpoint
  emits real AG-UI events** (see "Blocking dependency" above) — until
  then, the local mock endpoint from step 2 stands in for it

## Project structure

```
payments-toolkit-frontend/
  src/
    components/
      ChatInput.vue        # prompt box + send button
      MessageList.vue      # rendered conversation (user + agent turns)
      ToolCallTrace.vue    # live tool-call visibility: name, args, result, per turn
    composables/
      useAgentChat.ts       # wraps @tanstack/ai-vue's useChat, points at the backend (or mock)
    mocks/
      mock-ag-ui-server.ts  # local dev server emitting hand-written AG-UI SSE events,
                             # standing in for payments-toolkit-agent until its
                             # translator work lands
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

- A tiny local server (`mocks/mock-ag-ui-server.ts`) that replays a
  handful of hand-written, spec-correct AG-UI event sequences over SSE —
  e.g. one fixed "valid IBAN" turn, one "invalid card" turn, one "declined
  out-of-scope request" turn — enough to build and screenshot the UI
  against before the real backend can produce these events
- This unblocks steps 3-4 without waiting on `payments-toolkit-agent`'s
  translator work

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

### 6. README pass

- Document setup, how to run against the mock vs. the real backend, and
  the dependency on `payments-toolkit-agent`'s AG-UI support
- Link back to both `payments-toolkit-mcp` and `payments-toolkit-agent` as
  the companion projects in this series

## Fast-follows (explicitly out of scope for this PLAN, tracked for later)

- Cancel/interrupt control for an in-flight agent turn, once the backend
  supports it
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
- README explains setup, the mock/real backend split, and the
  cross-project dependency clearly enough that a stranger (or a future
  you) could pick this up cold
