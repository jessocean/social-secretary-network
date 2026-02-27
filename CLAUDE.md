# Social Secretary Network

## What This Is
AI-powered social scheduling PWA where "secretary" agents negotiate hangouts between friends. Reads calendars, understands constraints (naps, transit, sleep), proposes weekly engagements users approve.

## Quick Start
```bash
npm run dev -- -p 3002      # dev server (port 3000 may be in use)
npm test                     # 31 unit tests (vitest)
npm run test:integration     # 11 integration tests (requires DB)
npm run test:all             # all tests (unit + integration)
npm run seed                 # seed DB with 4 test users
npm run build                # production build
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

### Negotiation Service (DB-Backed)
`src/lib/services/negotiation-service.ts` — loads data from DB, feeds agent engine, persists results:
1. Loads eligible users (onboarding complete), calendar events, constraints, preferences, friendships, locations
2. Maps DB rows → agent types, calls `computeWeekAvailability()` → `negotiate()`
3. Persists to `negotiations`, `proposals`, `proposalParticipants` tables
4. API route (`/api/agent/negotiate`) tries DB first, falls back to inline mock data

### Auth
Dev mode (`AUTH_MODE=dev`): any 6-digit OTP code works. No Supabase needed.
Production: would use Supabase Phone OTP (not yet wired).

### Database
Schema at `src/lib/db/schema.ts` — 12 tables with Drizzle. Cloud Supabase project (`social-secretary-app`, ref `tfwyrtkopvncsgxxnlpm`, region us-west-2). Schema pushed via `npm run db:push`, seeded via `npm run seed`. UI pages still use inline mock data.

## What's Done
- Full UI: landing, login, verify, onboarding (7 steps), dashboard, proposals, coordination, friends, settings, invite landing page
- Agent engine: scheduler, scorer, negotiator
- Negotiation service: DB-backed load → negotiate → persist pipeline
- Mock calendar with 4 test personas
- 31 passing unit tests + 11 integration tests
- Cloud Supabase with seeded data (Alice, Bob, Carol, Dave)
- Seed script for 4 users
- PWA manifest + service worker
- Proposal state persists to localStorage

## What's NOT Done Yet
- Playwright E2E tests
- Real Google Calendar OAuth2 + sync
- Real SMS OTP (Twilio)
- Weather API integration
- Push notifications
- Vercel deployment
- Auth middleware (pages don't gate on login yet)
- Database integration for UI pages (all use inline mock data)
- Native app conversion (Capacitor)

## Key Files
| File | Purpose |
|------|---------|
| `src/lib/db/schema.ts` | Drizzle schema (12 tables, all enums) |
| `src/lib/agent/types.ts` | Types for negotiation engine |
| `src/lib/agent/negotiator.ts` | Top-level negotiate() orchestrator |
| `src/lib/services/negotiation-service.ts` | DB-backed negotiation pipeline |
| `src/lib/calendar/mock.ts` | Mock calendar with 4 personas |
| `src/hooks/useOnboarding.ts` | Onboarding wizard state management |
| `scripts/seed-dev.ts` | Dev seed script (4 users) |
| `docs/SPEC.md` | Full product spec |

## Environment Variables
See `.env.example`. Key vars:
- `CALENDAR_MODE=mock` — which calendar implementation to use
- `AUTH_MODE=dev` — enables dev OTP (any code works)
- `DATABASE_URL` — Postgres connection (needed for seed, integration tests, and DB-backed negotiation)

## Prototype Feedback Changes

### Round 1 (commit 574de86)
- Replaced indigo/violet theme with monochrome (gray-900 primary)
- Simplified onboarding: removed Open House + Priority Contacts, added Connect Calendar step (7 steps)
- Rewrote CalendarReview with inline editing
- Fixed engagement flow: Proposed → Pending → Confirmed with 3-tab UI and messaging checkboxes
- Removed match percentages and priority dots from UI (backend fields kept)
- Fixed mock data consistency: Alice/Bob/Carol/Dave with SF locations
- Simplified invite flow: single link, recipient chooses join type
- Dashboard starts empty (no pre-confirmed events)

### Round 2 (commit 91373c6)
- Removed "Skip for now" from calendar step; added "Why do you need this?" tooltip
- Made constraints editable by clicking (especially sleep times)
- Added constraint suggestion examples (naptimes, daycare pickup, kids' bedtime, sabbath)
- Changed hosting subtitle from "playdates" to "Are you OK hosting people here?"
- Fixed pending proposals: removed accept/decline buttons, shows "Waiting for confirmation"
- Removed Carol (pending friend) from proposals — only confirmed friends get proposals
- Persisted proposal state to localStorage
- Created settings page with "Delete my account" flow

## Conventions
- Mobile-first, monochrome theme (gray-900 primary, no color accents)
- Client components use `"use client"` directive
- shadcn/ui components at `@/components/ui/`
- Agent engine is pure functions — never import DB in `src/lib/agent/`
- API routes at `src/app/api/` return JSON
