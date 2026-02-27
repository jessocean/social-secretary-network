# Social Secretary Network

## What This Is
AI-powered social scheduling PWA where "secretary" agents negotiate hangouts between friends. Reads calendars, understands constraints (naps, transit, sleep), proposes weekly engagements users approve.

## Quick Start
```bash
npm run dev -- -p 3002   # dev server (port 3000 may be in use)
npm test                  # 31 unit tests (vitest)
npm run seed              # seed DB with 4 test users (requires local Supabase)
npm run build             # production build
```

## Tech Stack
- **Next.js 15** (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Supabase** (Postgres + Auth) with **Drizzle ORM**
- **Vitest** for unit tests, Playwright for E2E (not yet set up)
- PWA with manifest + service worker

## Architecture

### Calendar Service (Strategy Pattern)
`src/lib/calendar/types.ts` defines the interface. Three modes via `CALENDAR_MODE` env:
- `mock` (default) - in-memory, no network. 4 personas: alice, bob, carol, dave
- `sandbox` - reads real Google Calendar, writes to secondary "test" calendar (not yet implemented)
- `production` - full read/write (not yet implemented)

Factory at `src/lib/calendar/factory.ts` returns the right implementation.

### Agent Negotiation Engine (Pure Functions)
All in `src/lib/agent/` — zero DB access, fully unit-testable:
1. **scheduler.ts** - `computeFreeSlots()`, `computeWeekAvailability()`, `findOverlaps()`
2. **scorer.ts** - `scoreSlot()`, `rankSlots()` with 7 weighted factors
3. **negotiator.ts** - `negotiate()` greedy selection respecting caps + no double-booking

### Auth
Dev mode (`AUTH_MODE=dev`): any 6-digit OTP code works. No Supabase needed.
Production: would use Supabase Phone OTP (not yet wired).

### Database
Schema at `src/lib/db/schema.ts` — 12 tables with Drizzle. Currently all UI uses inline mock data and doesn't require a running database.

## What's Done
- Full UI: landing, login, verify, onboarding (8 steps), dashboard, proposals, coordination, friends, invite landing page
- Agent engine: scheduler, scorer, negotiator
- Mock calendar with 4 test personas
- 31 passing unit tests
- Seed script for 4 users
- PWA manifest + service worker

## What's NOT Done Yet
- Playwright E2E tests
- Real Google Calendar OAuth2 + sync
- Real SMS OTP (Twilio)
- Weather API integration
- Push notifications
- Vercel deployment + cloud Supabase
- Auth middleware (pages don't gate on login yet)
- Database integration for UI pages (all use inline mock data)
- Native app conversion (Capacitor)

## Key Files
| File | Purpose |
|------|---------|
| `src/lib/db/schema.ts` | Drizzle schema (12 tables, all enums) |
| `src/lib/agent/types.ts` | Types for negotiation engine |
| `src/lib/agent/negotiator.ts` | Top-level negotiate() orchestrator |
| `src/lib/calendar/mock.ts` | Mock calendar with 4 personas |
| `src/hooks/useOnboarding.ts` | Onboarding wizard state management |
| `scripts/seed-dev.ts` | Dev seed script (4 users) |
| `docs/SPEC.md` | Full product spec |

## Environment Variables
See `.env.example`. Key vars:
- `CALENDAR_MODE=mock` — which calendar implementation to use
- `AUTH_MODE=dev` — enables dev OTP (any code works)
- `DATABASE_URL` — Postgres connection (only needed for seed script)

## Conventions
- Mobile-first, indigo/violet theme (#6366f1)
- Client components use `"use client"` directive
- shadcn/ui components at `@/components/ui/`
- Agent engine is pure functions — never import DB in `src/lib/agent/`
- API routes at `src/app/api/` return JSON
