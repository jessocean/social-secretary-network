/**
 * Development Seed Script
 *
 * Creates 4 test users with realistic calendars, constraints, preferences,
 * locations, friendships, and pre-computed proposals.
 *
 * Usage: npm run seed
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { v4 as uuid } from "uuid";
import { addDays, startOfWeek } from "date-fns";
import * as schema from "../src/lib/db/schema";
import { MockCalendarService } from "../src/lib/calendar/mock";
import { computeWeekAvailability } from "../src/lib/agent/scheduler";
import { negotiate } from "../src/lib/agent/negotiator";
import type { Constraint, UserPrefs, UserAvailability } from "../src/lib/agent/types";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

async function seed() {
  console.log("Seeding database...\n");

  const client = postgres(connectionString);
  const db = drizzle(client, { schema });

  // Clean existing data
  console.log("Clearing existing data...");
  await db.delete(schema.proposalParticipants);
  await db.delete(schema.proposals);
  await db.delete(schema.negotiations);
  await db.delete(schema.invites);
  await db.delete(schema.friendships);
  await db.delete(schema.userLocations);
  await db.delete(schema.userPreferences);
  await db.delete(schema.userConstraints);
  await db.delete(schema.calendarEvents);
  await db.delete(schema.googleCalendarConnections);
  await db.delete(schema.users);

  // ---------- Users ----------
  console.log("Creating users...");

  const aliceId = uuid();
  const bobId = uuid();
  const carolId = uuid();
  const daveId = uuid();

  const userIds = { alice: aliceId, bob: bobId, carol: carolId, dave: daveId };

  await db.insert(schema.users).values([
    {
      id: aliceId,
      email: "alice@example.com",
      displayName: "Alice",
      onboardingComplete: true,
      onboardingStep: 8,
    },
    {
      id: bobId,
      email: "bob@example.com",
      displayName: "Bob",
      onboardingComplete: true,
      onboardingStep: 8,
    },
    {
      id: carolId,
      email: "carol@example.com",
      displayName: "Carol",
      onboardingComplete: true,
      onboardingStep: 8,
    },
    {
      id: daveId,
      email: "dave@example.com",
      displayName: "Dave",
      onboardingComplete: false,
      onboardingStep: 0,
    },
  ]);

  // ---------- Calendar Events ----------
  console.log("Creating calendar events...");

  const calService = new MockCalendarService();
  calService.loadPersona(aliceId, "alice");
  calService.loadPersona(bobId, "bob");
  calService.loadPersona(carolId, "carol");
  calService.loadPersona(daveId, "dave");

  for (const [name, uid] of Object.entries(userIds)) {
    const events = calService.getAllEvents(uid);
    if (events.length > 0) {
      await db.insert(schema.calendarEvents).values(
        events.map((e) => ({
          id: uuid(),
          userId: uid,
          title: e.title,
          startTime: e.startTime,
          endTime: e.endTime,
          isBusy: e.isBusy,
          isAllDay: e.isAllDay,
          source: "mock" as const,
        }))
      );
    }
    console.log(`  ${name}: ${events.length} events`);
  }

  // ---------- Constraints ----------
  console.log("Creating constraints...");

  await db.insert(schema.userConstraints).values([
    // Alice: nap times for kids, sleep schedule
    {
      userId: aliceId,
      type: "nap" as const,
      label: "Baby nap",
      days: ["mon", "tue", "wed", "thu", "fri"],
      startTime: "12:30",
      endTime: "14:30",
    },
    {
      userId: aliceId,
      type: "sleep" as const,
      label: "Sleep",
      days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
      startTime: "21:00",
      endTime: "07:00",
    },
    {
      userId: aliceId,
      type: "transit" as const,
      label: "School pickup",
      days: ["mon", "wed", "fri"],
      startTime: "14:30",
      endTime: "15:15",
    },

    // Bob: flexible, just sleep
    {
      userId: bobId,
      type: "sleep" as const,
      label: "Sleep",
      days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
      startTime: "23:00",
      endTime: "06:30",
    },

    // Carol: work hours, sleep
    {
      userId: carolId,
      type: "work" as const,
      label: "Office hours",
      days: ["mon", "tue", "wed", "thu", "fri"],
      startTime: "09:00",
      endTime: "17:00",
    },
    {
      userId: carolId,
      type: "transit" as const,
      label: "Commute",
      days: ["mon", "tue", "wed", "thu", "fri"],
      startTime: "08:00",
      endTime: "09:00",
    },
    {
      userId: carolId,
      type: "sleep" as const,
      label: "Sleep",
      days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
      startTime: "22:30",
      endTime: "07:00",
    },

    // Dave: work constraint only
    {
      userId: daveId,
      type: "work" as const,
      label: "Work",
      days: ["mon", "tue", "wed", "thu", "fri"],
      startTime: "09:00",
      endTime: "17:30",
    },
  ]);

  // ---------- Preferences ----------
  console.log("Creating preferences...");

  await db.insert(schema.userPreferences).values([
    {
      userId: aliceId,
      maxEventsPerWeek: 3,
      preferredTypes: ["playground", "playdate_home", "walk", "coffee"],
      bufferMinutes: 30,
      preferMornings: true,
      preferAfternoons: false,
      preferEvenings: false,
      preferWeekends: true,
      weatherSensitive: true,
      rainAlternative: "Indoor play cafe",
      openHouseDay: "saturday",
      openHouseStart: "10:00",
      openHouseEnd: "12:00",
      openHouseNote: "Drop by anytime! Kids play in the backyard.",
    },
    {
      userId: bobId,
      maxEventsPerWeek: 5,
      preferredTypes: ["coffee", "dinner", "walk", "park"],
      bufferMinutes: 15,
      preferMornings: true,
      preferAfternoons: true,
      preferEvenings: true,
      preferWeekends: true,
      weatherSensitive: false,
    },
    {
      userId: carolId,
      maxEventsPerWeek: 3,
      preferredTypes: ["dinner", "coffee", "park"],
      bufferMinutes: 30,
      preferMornings: false,
      preferAfternoons: false,
      preferEvenings: true,
      preferWeekends: true,
      weatherSensitive: true,
      rainAlternative: "Movie night instead",
    },
  ]);

  // ---------- Locations ----------
  console.log("Creating locations...");

  const aliceHomeId = uuid();
  const bobHomeId = uuid();

  await db.insert(schema.userLocations).values([
    {
      id: aliceHomeId,
      userId: aliceId,
      label: "Home",
      type: "home",
      address: "123 Oak St, Brooklyn, NY",
      travelMinutes: 0,
      hostingOk: true,
    },
    {
      userId: aliceId,
      label: "Prospect Park Playground",
      type: "playground",
      address: "Prospect Park, Brooklyn, NY",
      travelMinutes: 10,
      hostingOk: false,
    },
    {
      userId: aliceId,
      label: "Cafe Grumpy",
      type: "cafe",
      address: "193 Meserole Ave, Brooklyn, NY",
      travelMinutes: 15,
      hostingOk: false,
    },
    {
      id: bobHomeId,
      userId: bobId,
      label: "Home",
      type: "home",
      address: "456 Maple Ave, Brooklyn, NY",
      travelMinutes: 0,
      hostingOk: true,
    },
    {
      userId: bobId,
      label: "Blue Bottle Coffee",
      type: "cafe",
      address: "76 N 4th St, Brooklyn, NY",
      travelMinutes: 10,
      hostingOk: false,
    },
    {
      userId: carolId,
      label: "Home",
      type: "home",
      address: "789 Pine Rd, Manhattan, NY",
      travelMinutes: 0,
      hostingOk: true,
    },
    {
      userId: carolId,
      label: "Central Park",
      type: "park",
      address: "Central Park, Manhattan, NY",
      travelMinutes: 15,
      hostingOk: false,
    },
  ]);

  // ---------- Friendships ----------
  console.log("Creating friendships...");

  await db.insert(schema.friendships).values([
    // Alice <-> Bob (active, high priority)
    { userId: aliceId, friendId: bobId, status: "active" as const, priority: 8 },
    { userId: bobId, friendId: aliceId, status: "active" as const, priority: 7 },

    // Alice <-> Carol (active, medium priority)
    { userId: aliceId, friendId: carolId, status: "active" as const, priority: 6 },
    { userId: carolId, friendId: aliceId, status: "active" as const, priority: 6 },

    // Bob <-> Carol (active)
    { userId: bobId, friendId: carolId, status: "active" as const, priority: 5 },
    { userId: carolId, friendId: bobId, status: "active" as const, priority: 5 },

    // Alice <-> Dave (calendar-only)
    { userId: aliceId, friendId: daveId, status: "calendar_only" as const, priority: 3 },

    // Bob <-> Dave (pending)
    { userId: bobId, friendId: daveId, status: "pending" as const, priority: 4 },
  ]);

  // ---------- Invites ----------
  console.log("Creating invites...");

  await db.insert(schema.invites).values([
    {
      code: "ALICE123",
      createdBy: aliceId,
      type: "full" as const,
    },
    {
      code: "BOB456",
      createdBy: bobId,
      type: "full" as const,
    },
    {
      code: "CALONLY",
      createdBy: aliceId,
      type: "calendar_only" as const,
    },
  ]);

  // ---------- Run Negotiation ----------
  console.log("Running negotiation engine...");

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 7);

  // Build availability for Alice, Bob, Carol
  const constraints: Record<string, Constraint[]> = {
    [aliceId]: [
      { type: "nap", days: ["mon", "tue", "wed", "thu", "fri"], startTime: "12:30", endTime: "14:30" },
      { type: "sleep", days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"], startTime: "21:00", endTime: "07:00" },
    ],
    [bobId]: [
      { type: "sleep", days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"], startTime: "23:00", endTime: "06:30" },
    ],
    [carolId]: [
      { type: "work", days: ["mon", "tue", "wed", "thu", "fri"], startTime: "09:00", endTime: "17:00" },
      { type: "sleep", days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"], startTime: "22:30", endTime: "07:00" },
    ],
  };

  const prefs: Record<string, UserPrefs> = {
    [aliceId]: {
      maxEventsPerWeek: 3,
      preferredTypes: ["playground", "playdate_home", "walk", "coffee"],
      bufferMinutes: 30,
      preferMornings: true,
      preferAfternoons: false,
      preferEvenings: false,
      preferWeekends: true,
      weatherSensitive: true,
    },
    [bobId]: {
      maxEventsPerWeek: 5,
      preferredTypes: ["coffee", "dinner", "walk", "park"],
      bufferMinutes: 15,
      preferMornings: true,
      preferAfternoons: true,
      preferEvenings: true,
      preferWeekends: true,
      weatherSensitive: false,
    },
    [carolId]: {
      maxEventsPerWeek: 3,
      preferredTypes: ["dinner", "coffee", "park"],
      bufferMinutes: 30,
      preferMornings: false,
      preferAfternoons: false,
      preferEvenings: true,
      preferWeekends: true,
      weatherSensitive: true,
    },
  };

  // Compute availability
  const userAvailabilities: UserAvailability[] = [];
  for (const uid of [aliceId, bobId, carolId]) {
    const events = calService.getAllEvents(uid);
    const slots = computeWeekAvailability(
      events,
      constraints[uid],
      weekStart,
      prefs[uid].bufferMinutes
    );
    // Set userId on free slots
    const slotsWithUser = slots.map((s) => ({ ...s, userId: uid }));
    userAvailabilities.push({
      userId: uid,
      freeSlots: slotsWithUser,
      constraints: constraints[uid],
    });
  }

  const prefsMap = new Map(Object.entries(prefs));
  const result = negotiate({
    users: userAvailabilities,
    preferences: prefsMap,
    friendships: [
      { userId: aliceId, friendId: bobId, priority: 8 },
      { userId: aliceId, friendId: carolId, priority: 6 },
      { userId: bobId, friendId: carolId, priority: 5 },
    ],
    locations: [
      { userId: aliceId, locationName: "Prospect Park Playground", locationId: uuid(), travelMinutes: 10 },
      { userId: bobId, locationName: "Blue Bottle Coffee", locationId: uuid(), travelMinutes: 10 },
      { userId: carolId, locationName: "Central Park", locationId: uuid(), travelMinutes: 15 },
    ],
    weekStart,
    engagementTypes: ["coffee", "playground", "walk", "dinner"],
  });

  console.log(`  Generated ${result.proposals.length} proposals`);

  // Save negotiation + proposals
  if (result.proposals.length > 0) {
    const negotiationId = uuid();
    await db.insert(schema.negotiations).values({
      id: negotiationId,
      status: "proposed" as const,
      weekStart,
      weekEnd,
      context: { userIds: [aliceId, bobId, carolId] },
      log: result.log,
    });

    for (const proposal of result.proposals) {
      const proposalId = uuid();
      // Alternate statuses for realistic display
      const statuses = ["proposed", "accepted", "confirmed", "proposed"] as const;
      const status = statuses[result.proposals.indexOf(proposal) % statuses.length];

      await db.insert(schema.proposals).values({
        id: proposalId,
        negotiationId,
        type: proposal.type as "playground" | "coffee" | "playdate_home" | "dinner" | "park" | "class" | "walk" | "other",
        title: proposal.title,
        locationName: proposal.locationName,
        startTime: proposal.slot.start,
        endTime: proposal.slot.end,
        status,
        score: proposal.slot.score,
        scoreBreakdown: proposal.slot.scoreBreakdown,
      });

      // Add participants
      for (let i = 0; i < proposal.participants.length; i++) {
        const pResponse =
          status === "confirmed"
            ? ("accepted" as const)
            : status === "accepted" && i === 0
              ? ("accepted" as const)
              : ("pending" as const);

        await db.insert(schema.proposalParticipants).values({
          proposalId,
          userId: proposal.participants[i],
          response: pResponse,
          isOrganizer: i === 0,
        });
      }
    }
  }

  // Print negotiation log
  console.log("\nNegotiation log:");
  for (const entry of result.log) {
    console.log(`  ${entry.message}`);
  }

  console.log("\n--- Seed complete ---");
  console.log(`Users: 4 (Alice, Bob, Carol, Dave)`);
  console.log(`Calendar events: ${[aliceId, bobId, carolId, daveId].reduce(
    (sum, uid) => sum + calService.getAllEvents(uid).length,
    0
  )}`);
  console.log(`Proposals: ${result.proposals.length}`);
  console.log(`Friendships: 8`);
  console.log(`Invites: 3`);

  await client.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
