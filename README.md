# payments-toolkit-frontend

A Vue 3 SPA, built on [TanStack AI](https://tanstack.com/ai)'s Vue client
(`@tanstack/ai-vue`), that talks to
[payments-toolkit-agent](https://github.com/ramigs/payments-toolkit-agent)
over [AG-UI](https://ag-ui.com) and shows an agent's tool calls live in the
browser as they happen — "🔧 calling `validate_iban(iban: DE89…)` →
`valid: true`" — instead of a spinner that resolves to a final answer. See
[PLAN.md](./PLAN.md) for the full step-by-step walkthrough, including the
reasoning behind each design decision (and a couple of interesting bugs
found along the way).

This is step 2 of 2 in a three-repo series:
[payments-toolkit-mcp](https://github.com/ramigs/payments-toolkit-mcp) (the
MCP server exposing the validation tools) →
[payments-toolkit-agent](https://github.com/ramigs/payments-toolkit-agent)
(the ADK-based agent backend, step 1) → this repo (the frontend, step 2).

## Prerequisites

- Node.js `^22.18.0 || >=24.12.0` (`.nvmrc` pins v24)
- [pnpm](https://pnpm.io)

Running against the real backend also needs
[`payments-toolkit-agent`](https://github.com/ramigs/payments-toolkit-agent)
set up and its `pnpm run start:http` running locally (see that repo's
README) — or use the local mock described below to work on the UI without
it.

## Setup

```bash
pnpm install
```

## Usage

Start the dev server:

```bash
pnpm dev
```

By default `src/composables/useAgentChat.ts` points at the real backend,
`http://localhost:3001/chat` (`payments-toolkit-agent`'s `pnpm run
start:http`, run separately). Type a prompt like "Is
DE89370400440532013000 a valid IBAN?" or "Check this card and tell me the
network: 4111111111111111" — the agent's tool calls, arguments, and results
render live, followed by its final answer.

While a turn is streaming, the send button becomes a **Stop** button. It
aborts the SSE fetch and also calls the backend's
`POST /chat/:runId/cancel` side-channel, so the model request is killed
even if a proxy keeps the socket open (see `payments-toolkit-agent`'s
PLAN.md, step 10).

### Running against the local mock instead

A tiny hand-rolled AG-UI SSE server (`mocks/mock-ag-ui-server.ts`) stands
in for the real backend — useful for working on the UI without a Gemini
API key or the agent/MCP processes running. It replays four fixed
scenarios based on a keyword in the prompt:

- `iban` → a valid-IBAN turn with a `validate_iban` tool call
- `type` / `network` → a `detect_card_type` turn that also renders an
  [MCP Apps](https://github.com/modelcontextprotocol) card-preview widget
  (forwards the real built widget from `../payments-toolkit-mcp/dist/ui/`)
- `card` → an invalid-card turn with a `validate_card_number` tool call
- anything else → a declined/out-of-scope turn with no tool call

It also mirrors the real backend's cancel surface
(`POST /chat/:runId/cancel` plus client-disconnect detection), so the Stop
button works against the mock too.

```bash
pnpm run mock
```

Then change `AGENT_CHAT_URL` in `src/composables/useAgentChat.ts` from
`http://localhost:3001/chat` to `http://localhost:8787/chat` and restart
the dev server (or just edit and save — Vite hot-reloads it).

### Type-checking, linting, formatting

```bash
pnpm run type-check
pnpm run lint     # oxlint + eslint, both --fix
pnpm run format   # prettier --write
```

## How the tool-call visibility works

`useAgentChat.ts` wraps `@tanstack/ai-vue`'s `useChat`, pointed at an AG-UI
SSE endpoint via `fetchServerSentEvents`. As tool-call and text events
stream in, `@tanstack/ai`'s client assembles them into typed message
parts — `tool-call`, `tool-result`, `text` — on the current assistant
message. `ToolCallTrace.vue` renders the `tool-call`/`tool-result` parts
live, pairing each call with its result by `toolCallId`;
`MessageList.vue` renders the accompanying `text` parts as the
conversation.

When a tool advertises an MCP Apps UI widget, the backend forwards it as a
`CUSTOM` `ui-resource` event, which `@tanstack/ai` reconciles into a
`ui-resource` message part. `McpAppView.vue` hosts that widget in a
sandboxed iframe and runs the `@modelcontextprotocol/ext-apps` init
handshake, then feeds the tool result in so the widget can paint itself.

## Project structure

```
src/
  App.vue                     # wires ChatInput + MessageList together via useAgentChat
  components/
    ChatInput.vue              # prompt box; send button becomes Stop while a turn streams
    MessageList.vue            # renders the conversation (user + agent turns)
    ToolCallTrace.vue          # live tool-call visibility: name, args, result, per message
    McpAppView.vue             # hosts an MCP Apps `ui://` widget in a sandboxed iframe
  composables/
    useAgentChat.ts             # wraps @tanstack/ai-vue's useChat, points at the backend (or mock)
mocks/
  mock-ag-ui-server.ts          # local dev server emitting hand-written AG-UI SSE events
```

## Scope

This is a deliberate first iteration, not an unfinished one:

- No multi-turn conversation persistence — the backend is single-turn per
  request, so this frontend is too
- No production deployment — local-first, matching the backend's own
  scope for this phase
- No auth/guardrails — same deferral as the backend

See the "Fast-follows" section of [PLAN.md](./PLAN.md) for what's tracked
for later.
