# payments-toolkit-frontend

Payments Toolkit is a validation assistant for **card numbers** and **IBANs**.
Ask in plain English — it checks card numbers (Luhn checksum and card network)
and IBANs (format, country length, checksum) by running real validators.

Learn more: [What I learned building my first end-to-end AI
app](https://ramigs.dev/blog/what-i-learned-building-my-first-end-to-end-ai-app/)

This frontend is a Vue 3 SPA built on [TanStack AI](https://tanstack.com/ai)'s
Vue client (`@tanstack/ai-vue`), talking to
[payments-toolkit-agent](https://github.com/ramigs/payments-toolkit-agent) over
[AG-UI](https://ag-ui.com).

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Prerequisites](#prerequisites)
- [Setup](#setup)
  - [Environment variables](#environment-variables)
- [Usage](#usage)
  - [Type-checking, linting, formatting, building](#type-checking-linting-formatting-building)
- [TODO](#todo)
  - [MCP Apps display modes](#mcp-apps-display-modes)
  - [Session storage hardening](#session-storage-hardening)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Prerequisites

- Node.js `^22.18.0 || >=24.12.0` (`.nvmrc` pins v24)
- [pnpm](https://pnpm.io)
- A [Supabase](https://supabase.com) account and project, for the login gate

## Setup

```bash
pnpm install
```

### Environment variables

```bash
cp .env.example .env.local
```

Then fill in `.env.local`:

- `VITE_AGENT_CHAT_URL` — `payments-toolkit-agent`'s `/chat` endpoint, e.g.
  `http://localhost:3001/chat` for its local `pnpm run start:http`.
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` — from your Supabase project's
  Project Settings → API. The anon key is browser-safe and ships in the bundle —
  never put the service_role/secret key here.

`.env.local` is gitignored.

## Usage

First run `payments-toolkit-agent` (see that repo's README) — which in turn
spawns [`payments-toolkit-mcp`](https://github.com/ramigs/payments-toolkit-mcp)
as a child process, so build that first too (`pnpm run build`, which also
builds the MCP Apps widgets this frontend renders):

```bash
pnpm run start:http
```

Start the dev server:

```bash
pnpm dev
```

Type a prompt like "Is DE89370400440532013000 a valid IBAN?" or "Check this card
and tell me the network: 4111111111111111" — the agent's tool calls, arguments,
and results render live, followed by its final answer.

### Type-checking, linting, formatting, building

```bash
pnpm run type-check
pnpm run lint     # oxlint + eslint, both --fix
pnpm run format   # prettier --write
pnpm run build    # type-checks, then builds to dist/
pnpm run preview  # serves that build locally
pnpm run toc      # regenerates this README's table of contents
```

## TODO

### MCP Apps display modes

- **Handle `requestDisplayMode` (`inline` / `fullscreen` / `pip`).** Display
  mode is a separate axis the host currently ignores. The MCP Apps spec has
  `inline` / `fullscreen` / `pip` plus a `requestDisplayMode` request;
  `McpAppView.vue` neither advertises `availableDisplayModes` in its host
  context nor answers the request, so a widget asking to go fullscreen gets
  silence. Fix: host-side display-mode state, presentation CSS for the
  non-inline modes, and a `requestDisplayMode` handler that replies with the
  mode actually granted. Contained to this repo, but real UI work. (Importance:
  medium, effort: medium.)

### Session storage hardening

- **No BFF / HttpOnly cookie yet.** The Supabase session (and its bearer token)
  currently lives in `localStorage`, readable by any JS on the page — fine for
  now, but worth revisiting for defense-in-depth once there's a
  backend-for-frontend to move the session into an HttpOnly cookie instead.
