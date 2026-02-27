# Social Secretary Network - Product Spec

## Vision
An AI-powered social scheduling app where personal "secretary" agents negotiate hangouts between friends. The app reads calendars, understands constraints (naps, transit, sleep), and proposes weekly social engagements that users approve via a simple mobile interface.

## Target Users
- Busy parents coordinating playdates and social time
- Friend groups wanting to see each other more without the scheduling overhead
- People who want to be more socially intentional but struggle with logistics

## Core Flow

### 1. Onboarding
1. User signs up via phone OTP (Partiful-style, no email/password)
2. Connects calendar (mock first, Google Calendar later)
3. Reviews their week day-by-day, confirming busy/free slots
4. Sets constraints: sleep schedule, kid nap times, transit buffers
5. Sets preferences: preferred engagement types, max per week, time-of-day preferences
6. Adds locations: home, favorite playgrounds, cafes (with hosting OK flag)
7. Sets weather preferences and rain alternatives
8. Optionally sets "open house" hours (standing invitation window)
9. Selects priority contacts from friend list
10. Shares invite link with friends

### 2. Weekly Negotiation
1. Agent reads all connected calendars weekly
2. Computes free slots per user (calendar events + constraints + buffers)
3. Finds overlapping availability across friend pairs/groups
4. Scores candidates using weighted preference algorithm
5. Generates proposals respecting per-user caps
6. Presents proposals in dashboard for user review

### 3. Coordination
1. User reviews weekly proposals (swipe/uncheck unwanted)
2. Approved proposals generate copy-paste messages for friends
3. User sends message to friend manually (text/WhatsApp)
4. User marks "she replied" -> system asks "can she make it?"
5. Confirmed events are written to calendar
6. Declined events are removed, cap freed up

### 4. Friend Network
- Full members: app users with their own secretary
- Calendar-only: shared calendar access but not on app
- Invite system: shareable links, full vs calendar-only join options
- Priority system: weight certain friends higher in proposals

## Engagement Types
- Playground meetup
- Coffee date
- Home playdate
- Dinner
- Park hangout
- Kids class (co-attend)
- Walk/stroller walk
- Custom/other

## Scoring Algorithm (Deterministic)
| Factor | Weight | Description |
|--------|--------|-------------|
| Time preference | 25% | Morning/afternoon/evening alignment |
| Event type fit | 20% | Match to preferred engagement types |
| Location convenience | 15% | Travel time, mutual convenience |
| Priority contact | 15% | Higher score for high-priority friends |
| Weather suitability | 10% | Outdoor vs indoor based on forecast |
| Recency | 10% | Longer since last hangout = higher |
| Cap distance | 5% | How close user is to weekly max |

## Technical Architecture
- **Frontend**: Next.js 15 PWA (mobile-first)
- **Database**: Supabase (Postgres + Auth + Realtime)
- **ORM**: Drizzle (type-safe)
- **Calendar**: Mock -> Google Calendar API v3
- **Auth**: Phone OTP (dev mode: any code works)
- **Deploy**: Vercel

## Calendar Modes
1. **Mock**: In-memory, no network. For dev/test.
2. **Sandbox**: Reads real calendar, writes to "Social Secretary (Test)" secondary calendar.
3. **Production**: Full read/write to primary calendar.

## Privacy & Security
- Calendar data stays in user's DB row, not shared
- Only free/busy slots shared with negotiation engine
- Event titles never shared between users
- Phone numbers used for auth only, not displayed
- Invite codes expire and are single-use
