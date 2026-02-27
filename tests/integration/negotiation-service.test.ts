/**
 * Integration tests for the negotiation service.
 *
 * These tests run against the seeded local Supabase database.
 * Prerequisites:
 *   1. supabase start
 *   2. npm run db:push
 *   3. npm run seed
 *
 * If the database is unreachable, all tests are skipped with a clear message.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/db/schema";
import {
  loadEligibleUsers,
  loadCalendarEvents,
  loadConstraints,
  loadPreferences,
  loadActiveFriendships,
  loadLocations,
  runNegotiation,
} from "@/lib/services/negotiation-service";
import { startOfWeek, addDays } from "date-fns";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

let dbAvailable = false;
let testClient: ReturnType<typeof postgres> | null = null;
let testDb: ReturnType<typeof drizzle> | null = null;

// Track negotiation IDs created during tests for cleanup
const createdNegotiationIds: string[] = [];

beforeAll(async () => {
  try {
    testClient = postgres(connectionString, { connect_timeout: 3 });
    testDb = drizzle(testClient, { schema });
    // Quick connectivity check
    await testDb.select().from(schema.users).limit(1);
    dbAvailable = true;
  } catch {
    console.warn(
      "\n⚠️  Database not available — skipping integration tests.\n" +
        "   To run these tests:\n" +
        "     1. Install Docker\n" +
        "     2. supabase start\n" +
        "     3. npm run db:push\n" +
        "     4. npm run seed\n"
    );
  }
});

afterAll(async () => {
  if (testDb && createdNegotiationIds.length > 0) {
    // Clean up proposals + participants via cascade from negotiations
    for (const id of createdNegotiationIds) {
      try {
        await testDb
          .delete(schema.negotiations)
          .where(eq(schema.negotiations.id, id));
      } catch {
        // Ignore cleanup errors
      }
    }
  }
  if (testClient) {
    await testClient.end();
  }
});

describe("negotiation service (integration)", () => {
  // ---------- Loading data ----------

  it("loads eligible users (onboarding complete)", async () => {
    if (!dbAvailable) return;

    const eligible = await loadEligibleUsers();

    // Seed creates Alice, Bob, Carol (onboarding complete) and Dave (incomplete)
    expect(eligible.length).toBeGreaterThanOrEqual(3);

    const names = eligible.map((u) => u.displayName);
    expect(names).toContain("Alice");
    expect(names).toContain("Bob");
    expect(names).toContain("Carol");
    expect(names).not.toContain("Dave");
  });

  it("loads calendar events for a user", async () => {
    if (!dbAvailable) return;

    const eligible = await loadEligibleUsers();
    const alice = eligible.find((u) => u.displayName === "Alice");
    expect(alice).toBeDefined();

    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 7);
    const events = await loadCalendarEvents(alice!.id, weekStart, weekEnd);

    // Alice has mock calendar events from the seed
    expect(Array.isArray(events)).toBe(true);
    for (const evt of events) {
      expect(evt).toHaveProperty("id");
      expect(evt).toHaveProperty("title");
      expect(evt).toHaveProperty("startTime");
      expect(evt).toHaveProperty("endTime");
      expect(evt).toHaveProperty("isBusy");
      expect(evt).toHaveProperty("isAllDay");
    }
  });

  it("maps DB constraints to agent Constraint type", async () => {
    if (!dbAvailable) return;

    const eligible = await loadEligibleUsers();
    const alice = eligible.find((u) => u.displayName === "Alice");
    const constraints = await loadConstraints(alice!.id);

    // Alice has nap, sleep, and transit constraints
    expect(constraints.length).toBeGreaterThanOrEqual(2);

    const nap = constraints.find((c) => c.type === "nap");
    expect(nap).toBeDefined();
    expect(nap!.days).toContain("mon");
    expect(nap!.startTime).toBe("12:30");
    expect(nap!.endTime).toBe("14:30");

    // Each constraint has the right shape
    for (const c of constraints) {
      expect(["sleep", "nap", "transit", "work", "custom"]).toContain(c.type);
      expect(Array.isArray(c.days)).toBe(true);
      expect(c.startTime).toMatch(/^\d{2}:\d{2}$/);
      expect(c.endTime).toMatch(/^\d{2}:\d{2}$/);
    }
  });

  it("maps DB preferences to agent UserPrefs type", async () => {
    if (!dbAvailable) return;

    const eligible = await loadEligibleUsers();
    const alice = eligible.find((u) => u.displayName === "Alice");
    const prefs = await loadPreferences(alice!.id);

    expect(prefs).not.toBeNull();
    expect(prefs!.maxEventsPerWeek).toBe(3);
    expect(prefs!.preferredTypes).toContain("playground");
    expect(prefs!.bufferMinutes).toBe(30);
    expect(typeof prefs!.preferMornings).toBe("boolean");
    expect(typeof prefs!.preferAfternoons).toBe("boolean");
    expect(typeof prefs!.preferEvenings).toBe("boolean");
    expect(typeof prefs!.preferWeekends).toBe("boolean");
    expect(typeof prefs!.weatherSensitive).toBe("boolean");
  });

  it("loads active friendships between eligible users only", async () => {
    if (!dbAvailable) return;

    const eligible = await loadEligibleUsers();
    const eligibleIds = eligible.map((u) => u.id);
    const active = await loadActiveFriendships(eligibleIds);

    // Should have friendships between Alice, Bob, Carol (all active)
    expect(active.length).toBeGreaterThanOrEqual(3);

    // Each friendship should be between eligible users
    for (const f of active) {
      expect(eligibleIds).toContain(f.userId);
      expect(eligibleIds).toContain(f.friendId);
    }

    // Dave should not appear (he's not eligible: onboarding incomplete)
    const dave = eligible.find((u) => u.displayName === "Dave");
    expect(dave).toBeUndefined(); // Dave shouldn't be in eligible list
  });

  it("loads locations for a user", async () => {
    if (!dbAvailable) return;

    const eligible = await loadEligibleUsers();
    const alice = eligible.find((u) => u.displayName === "Alice");
    const locs = await loadLocations(alice!.id);

    expect(locs.length).toBeGreaterThanOrEqual(1);
    for (const loc of locs) {
      expect(loc.userId).toBe(alice!.id);
      expect(typeof loc.locationName).toBe("string");
      expect(typeof loc.locationId).toBe("string");
      expect(typeof loc.travelMinutes).toBe("number");
    }
  });

  // ---------- Full negotiation ----------

  it("generates proposals from seeded data", async () => {
    if (!dbAvailable) return;

    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 7);

    const { negotiationId, result, proposalIds } = await runNegotiation(
      weekStart,
      weekEnd
    );
    createdNegotiationIds.push(negotiationId);

    expect(result.proposals.length).toBeGreaterThan(0);
    expect(proposalIds.length).toBe(result.proposals.length);
    expect(result.log.length).toBeGreaterThan(0);
  });

  it("proposals respect weekly caps", async () => {
    if (!dbAvailable) return;

    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 7);

    const { negotiationId, result } = await runNegotiation(weekStart, weekEnd);
    createdNegotiationIds.push(negotiationId);

    // Count proposals per participant
    const counts = new Map<string, number>();
    for (const p of result.proposals) {
      for (const uid of p.participants) {
        counts.set(uid, (counts.get(uid) ?? 0) + 1);
      }
    }

    // Load preferences to check caps
    const eligible = await loadEligibleUsers();
    for (const user of eligible) {
      const prefs = await loadPreferences(user.id);
      const cap = prefs?.maxEventsPerWeek ?? 3;
      const count = counts.get(user.id) ?? 0;
      expect(count).toBeLessThanOrEqual(cap);
    }
  });

  it("proposals have no double-booking", async () => {
    if (!dbAvailable) return;

    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 7);

    const { negotiationId, result } = await runNegotiation(weekStart, weekEnd);
    createdNegotiationIds.push(negotiationId);

    // Group proposals by participant
    const byUser = new Map<string, { start: Date; end: Date }[]>();
    for (const p of result.proposals) {
      for (const uid of p.participants) {
        const slots = byUser.get(uid) ?? [];
        slots.push({ start: p.slot.start, end: p.slot.end });
        byUser.set(uid, slots);
      }
    }

    // Check no overlaps for any user
    for (const [userId, slots] of byUser) {
      const sorted = slots.sort(
        (a, b) => a.start.getTime() - b.start.getTime()
      );
      for (let i = 1; i < sorted.length; i++) {
        expect(
          sorted[i].start.getTime() >= sorted[i - 1].end.getTime(),
          `Double-booking detected for user ${userId}`
        ).toBe(true);
      }
    }
  });

  it("persists negotiation and proposals to the database", async () => {
    if (!dbAvailable || !testDb) return;

    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 7);

    const { negotiationId, result, proposalIds } = await runNegotiation(
      weekStart,
      weekEnd
    );
    createdNegotiationIds.push(negotiationId);

    // Verify negotiation row
    const negRows = await testDb
      .select()
      .from(schema.negotiations)
      .where(eq(schema.negotiations.id, negotiationId));
    expect(negRows.length).toBe(1);
    expect(negRows[0].status).toBe("proposed");

    // Verify proposal rows
    for (const proposalId of proposalIds) {
      const propRows = await testDb
        .select()
        .from(schema.proposals)
        .where(eq(schema.proposals.id, proposalId));
      expect(propRows.length).toBe(1);
      expect(propRows[0].negotiationId).toBe(negotiationId);

      // Verify participants
      const participantRows = await testDb
        .select()
        .from(schema.proposalParticipants)
        .where(eq(schema.proposalParticipants.proposalId, proposalId));
      expect(participantRows.length).toBeGreaterThan(0);

      // Exactly one organizer per proposal
      const organizers = participantRows.filter((p) => p.isOrganizer);
      expect(organizers.length).toBe(1);
    }
  });

  it("does not include Dave (incomplete onboarding) in proposals", async () => {
    if (!dbAvailable || !testDb) return;

    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 7);

    // Get Dave's ID
    const allUsers = await testDb.select().from(schema.users);
    const dave = allUsers.find((u) => u.displayName === "Dave");
    if (!dave) return; // Dave not in DB, test is vacuously true

    const { negotiationId, result } = await runNegotiation(weekStart, weekEnd);
    createdNegotiationIds.push(negotiationId);

    // Dave should not appear as a participant in any proposal
    for (const p of result.proposals) {
      expect(p.participants).not.toContain(dave.id);
    }
  });
});
