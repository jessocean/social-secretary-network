# Social Secretary Network

## What This Is
AI-powered social scheduling PWA where "secretary" agents negotiate hangouts between friends. Reads calendars, understands constraints (naps, transit, sleep), proposes weekly engagements users approve.

## Quick Start
```bash
npm run dev -- -p 3002      # dev server (port 3000 may be in use)
npm test                     # 45 unit tests (vitest)
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
`src/lib/calendar/types.ts` defines the interface. Two modes via `CALENDAR_MODE` env:
- `mock` (default) - in-memory, no network. 4 personas: alice, bob, carol, dave
- `google` - real Google Calendar via OAuth2. Reads events live, writes gated behind `CALENDAR_WRITE_ENABLED` env flag

Factory at `src/lib/calendar/factory.ts` returns the right implementation. Also set `NEXT_PUBLIC_CALENDAR_MODE` to match (client components need it).

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
Production (no `AUTH_MODE` or any value other than `dev`): real SMS OTP via Supabase Auth + Twilio. Requires Twilio configured in Supabase Dashboard → Auth → Providers → Phone.

### Database
Schema at `src/lib/db/schema.ts` — 12 tables with Drizzle. Cloud Supabase project (`social-secretary-app`, ref `tfwyrtkopvncsgxxnlpm`, region us-west-2). Schema pushed via `npm run db:push`, seeded via `npm run seed`. UI pages still use inline mock data.

## What's Done
- Full UI: landing, login, verify, onboarding (7 steps), dashboard, proposals, coordination, friends, settings, invite landing page
- Agent engine: scheduler, scorer, negotiator
- Negotiation service: DB-backed load → negotiate → persist pipeline
- Mock calendar with 4 test personas
- **Google Calendar OAuth2 integration** — real read/write via `googleapis` package
- 45 passing unit tests + 11 integration tests
- Cloud Supabase with seeded data (Alice, Bob, Carol, Dave)
- Seed script for 4 users
- PWA manifest + service worker
- Proposal state persists to localStorage
- Location autocomplete via Nominatim (OpenStreetMap) in onboarding
- Onboarding → DB sync (locations, constraints, preferences persisted on complete)
- Dashboard → Proposals data flow via localStorage + negotiate API
- Settings page: calendar connection management (connect/disconnect/re-sync)
- **Real phone OTP** via Supabase Auth + Twilio (send-otp and verify-otp routes wired up)
- **Vercel deployment** — auto-deploys on push to main. URL: `social-secretary-network.vercel.app`

## What's NOT Done Yet
- Playwright E2E tests
- Weather API integration
- Push notifications
- Auth middleware (pages don't gate on login yet)
- Native app conversion (Capacitor)

## Key Files
| File | Purpose |
|------|---------|
| `src/lib/db/schema.ts` | Drizzle schema (12 tables, all enums) |
| `src/lib/agent/types.ts` | Types for negotiation engine |
| `src/lib/agent/negotiator.ts` | Top-level negotiate() orchestrator |
| `src/lib/services/negotiation-service.ts` | DB-backed negotiation pipeline |
| `src/lib/calendar/mock.ts` | Mock calendar with 4 personas |
| `src/lib/calendar/google.ts` | GoogleCalendarService — real Calendar API |
| `src/lib/google/oauth.ts` | OAuth2 helpers (auth URL, token exchange, refresh) |
| `src/hooks/useOnboarding.ts` | Onboarding wizard state management |
| `src/hooks/useAddressSearch.ts` | Debounced Nominatim geocoding hook |
| `src/components/ui/address-autocomplete.tsx` | Address autocomplete dropdown |
| `src/app/api/geocode/search/route.ts` | Nominatim proxy with rate limiting |
| `scripts/seed-dev.ts` | Dev seed script (4 users) |
| `docs/SPEC.md` | Full product spec |

## Environment Variables
See `.env.example`. Key vars:
- `CALENDAR_MODE=mock|google` — which calendar implementation to use
- `NEXT_PUBLIC_CALENDAR_MODE=mock|google` — client-side mirror (must match CALENDAR_MODE)
- `AUTH_MODE=dev` — enables dev OTP (any code works). Omit or set to anything else for real SMS via Supabase + Twilio
- `DATABASE_URL` — Postgres connection (needed for seed, integration tests, and DB-backed negotiation)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth2 credentials (required when CALENDAR_MODE=google)
- `GOOGLE_REDIRECT_URI` — OAuth callback URL (default: `http://localhost:3002/api/auth/google/callback`)
- `CALENDAR_WRITE_ENABLED=false` — gates Google Calendar writes (create/delete events). Keep false until tested.

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

### Round 3 (location autocomplete + DB sync)
- Added Nominatim (OpenStreetMap) address autocomplete to LocationPicker onboarding step
  - API proxy at `/api/geocode/search` with rate limiting (1 req/sec) and US bias
  - Debounced search hook (`useAddressSearch`) with AbortController
  - Reusable `AddressAutocomplete` component with dropdown, loading spinner, click-outside
  - Captures lat/lng from geocoding results into Location objects
- Fixed onboarding → DB persistence: `/api/onboarding/complete` now saves locations, constraints, preferences to Postgres (was a stub)
- Fixed proposal generation data flow: Dashboard saves API results to localStorage, Proposals page reads them
- Fixed Proposals page refresh button to actually call the negotiate API
- Fixed negotiate API to accept user locations in request body for mock fallback
- Fixed participant names: API now maps DB UUIDs to display names (was showing truncated UUIDs)
- Fixed title generation: replaces truncated UUIDs with real names in proposal titles
- Fixed nested `<button>` hydration error in PreferencesEditor (Checkbox inside button → div with role="button")

### Round 4 (Google Calendar integration)
- Added `googleapis` package and Google OAuth2 flow
  - OAuth helper at `src/lib/google/oauth.ts` (auth URL, token exchange, refresh)
  - `/api/auth/google/authorize` initiates OAuth, `/api/auth/google/callback` handles return
  - Tokens stored in `googleCalendarConnections` table (already existed in schema)
  - CSRF protection via short-lived `google_oauth_state` cookie
- Created `GoogleCalendarService` at `src/lib/calendar/google.ts`
  - Implements `CalendarService` interface with real Google Calendar API
  - Token auto-refresh before each API call
  - Falls back to cached DB events if token is missing/expired
  - Writes gated behind `CALENDAR_WRITE_ENABLED` env flag (default: false)
  - UUID validation on user IDs to prevent Postgres errors from invalid cookies
- Updated calendar factory: modes are now `mock` | `google` (removed `sandbox`/`production` stubs)
- ConnectCalendar onboarding step: in google mode, redirects to real OAuth; detects `?gcal=connected` on return and checks existing connection via `/api/calendar/status`
- CalendarReview onboarding step: in google mode, fetches real events from `/api/calendar/sync` instead of using mock data
- Settings page: added calendar connection card (status, re-sync, disconnect) above delete account
- Sync API (`/api/calendar/sync`): now reads `session_user_id` cookie (body fallback for backward compat)
- Negotiation service: triggers `syncEvents()` for all users before running negotiation
- Added API routes: `GET /api/calendar/status`, `DELETE /api/calendar/connection`
- Added Suspense boundary in onboarding page for `useSearchParams()` (Next.js 15 requirement)
- 14 new unit tests: google-oauth (6), google-calendar (4), calendar-factory (4) — total now 45
- Google Cloud project: `social-secretary-app`, OAuth client credentials in `.env.local`

## Conventions
- Mobile-first, monochrome theme (gray-900 primary, no color accents)
- Client components use `"use client"` directive
- shadcn/ui components at `@/components/ui/`
- Agent engine is pure functions — never import DB in `src/lib/agent/`
- API routes at `src/app/api/` return JSON
