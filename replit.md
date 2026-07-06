# CommsPro

A full-stack professional communication platform with Voice Calling, WhatsApp, SMS, Dashboard, Admin Panel, and AI Agent Management System — connected to Twilio.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/comms-platform run dev` — run the frontend (uses $PORT)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Login Credentials (seeded)

| Email | Password | Role |
|-------|----------|------|
| admin@commspro.io | admin123 | admin |
| marcus@commspro.io | agent123 | agent |
| aisha@commspro.io | agent123 | agent |
| james@commspro.io | agent123 | viewer |

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + TailwindCSS + shadcn/ui (dark terminal theme)
- API: Express 5 + JWT auth
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec at `lib/api-spec/`)
- Build: esbuild (CJS bundle)
- Telephony: Twilio SDK (Voice, SMS, WhatsApp)

## Where things live

- `artifacts/api-server/src/routes/` — all API route handlers
- `artifacts/comms-platform/src/pages/` — all frontend pages
- `artifacts/comms-platform/src/components/layout/` — Sidebar, AppLayout
- `lib/db/src/schema/` — Drizzle ORM schema (source of truth)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contract)
- `lib/api-client-react/src/generated/` — generated hooks + Zod schemas (do not edit manually)

## Architecture decisions

- Contract-first API: OpenAPI spec → Orval generates typed React Query hooks + Zod schemas
- JWT tokens stored in localStorage; `setAuthTokenGetter` wires the token into all API calls
- All `from`/`to` fields use E.164 phone numbers (not `fromNumber`/`toNumber`)
- `WhatsappConversation` uses `phone` field (not `contactNumber`) for the contact's number
- TanStack Query v5 requires `queryKey` in `UseQueryOptions`; pass `{ query: { ... } as any }` when only setting `refetchInterval`
- AgentInputType is a const enum — must import and cast when creating agents

## Product — Phase 1 Complete

- **Voice Calls** — outgoing/incoming via Twilio, call history, live status, answer/reject/end
- **SMS** — send via Twilio, message history, delivery status
- **WhatsApp** — conversations, message thread, send/receive, unread counts
- **Dashboard** — live stats (calls, SMS, WhatsApp, contacts, agents, online users), recent activity feed, team online panel
- **Admin → Users** — create/delete users, role management (admin/agent/viewer)
- **Admin → Logs** — full audit trail, filterable by channel (call/sms/whatsapp)
- **Contacts** — CRUD, search
- **AI Agents** — create agents, enable/disable toggle, assign tasks, activity log
- **Settings** — Twilio phone numbers, account SID, webhook URLs reference

## Twilio Webhooks (configure in Twilio console)

| Purpose | Path |
|---------|------|
| Voice | POST /api/calls/webhook |
| SMS | POST /api/sms/webhook |
| WhatsApp | POST /api/whatsapp/webhook |
| Call Status | POST /api/calls/status |

## User preferences

- Dark terminal/cyberpunk aesthetic (monospace font, uppercase labels, cyan primary)
- Mobile-friendly layout
- Production-ready, secure, Twilio-connected

## Gotchas

- Always run codegen after changing `lib/api-spec/openapi.yaml`
- Run `pnpm run typecheck:libs` after changing any `lib/*` package before checking leaf artifacts
- Do not call `pnpm dev` at workspace root — use workflows or `--filter` flag
- `useGetAgentTasks(id: number)` and `useGetAgentActivity(id: number)` take a plain number, not `{ id }`
- `useGetWhatsappMessages(phone: string)` takes a plain string

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
