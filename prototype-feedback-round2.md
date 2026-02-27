# Prototype Feedback — Round 2 Changes

## 1. Removed "Skip for now" from calendar connection
- Calendar is required for the app to function, so the skip option was misleading
- Added a "Why do you need this?" link with tooltip explaining the app uses your calendar to negotiate plans on your behalf
- `src/components/onboarding/ConnectCalendar.tsx`

## 2. Sleep constraint is now editable by clicking
- Clicking any constraint card (including the default sleep) opens an inline editor
- Can edit type, label, start/end times, and active days
- Save/Cancel buttons to confirm or discard changes
- `src/components/onboarding/ConstraintsEditor.tsx`

## 3. Added constraint suggestion examples
- Text below the "Add constraint" button with ideas: children's naptimes, picking kids up from daycare, kids' bedtime, sabbath — no driving
- `src/components/onboarding/ConstraintsEditor.tsx`

## 4. Updated "Hosting OK" subtitle
- Changed from "Can you host playdates here?" to "Are you OK hosting people here?"
- `src/components/onboarding/LocationPicker.tsx`

## 5. Fixed accept/decline buttons on pending proposals
- Accepted proposals no longer show Accept/Decline buttons
- Now shows "Waiting for the other party to confirm" with a spinner
- Root cause: pending tab was overriding proposal status to "proposed", which triggered the action buttons
- `src/components/proposals/ProposalCard.tsx`, `src/app/(app)/proposals/page.tsx`

## 6. Removed Carol from proposals
- Carol Johnson has friend status "pending" — proposals shouldn't include unconfirmed friends
- Removed the "Dinner with Carol" proposal from the initial mock data
- `src/app/(app)/proposals/page.tsx`

## 7. Proposal state now persists across navigation
- Accepting a proposal is saved to localStorage
- Navigating away and back (or hitting the back button) preserves the state
- `src/app/(app)/proposals/page.tsx`

## 8. Created Settings page
- New page at `/settings` with "Delete my account" option
- Confirmation dialog before deletion
- Clears all local data and redirects to landing page
- `src/app/(app)/settings/page.tsx`

## New dependencies
- Added `@radix-ui/react-tooltip` (shadcn tooltip component) for the calendar explanation hover
