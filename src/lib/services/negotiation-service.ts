/**
 * Negotiation Service
 *
 * Loads user data from the database, feeds it to the pure-function agent engine,
 * and persists the resulting proposals back to the DB.
 */

import { db } from "@/lib/db/client";
import {
  users,
  calendarEvents,
  userConstraints,
  userPreferences,
  friendships,
  userLocations,
  negotiations,
  proposals,
  proposalParticipants,
} from "@/lib/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { computeWeekAvailability } from "@/lib/agent/scheduler";
import { negotiate } from "@/lib/agent/negotiator";
import type {
  Constraint,
  UserPrefs,
  UserAvailability,
  NegotiationResult,
  NegotiationParams,
} from "@/lib/agent/types";
import type { CalendarEvent } from "@/lib/calendar/types";
import { v4 as uuid } from "uuid";

const ENGAGEMENT_TYPES = [
  "coffee",
  "playground",
  "playdate_home",
  "dinner",
  "park",
  "walk",
] as const;

export interface NegotiationServiceResult {
  negotiationId: string;
  result: NegotiationResult;
  proposalIds: string[];
}

/**
 * Load eligible users (onboarding complete) from the database.
 */
export async function loadEligibleUsers() {
  return db
    .select()
    .from(users)
    .where(eq(users.onboardingComplete, true));
}

/**
 * Load calendar events for a user within a date range.
 */
export async function loadCalendarEvents(
  userId: string,
  weekStart: Date,
  weekEnd: Date
): Promise<CalendarEvent[]> {
  const rows = await db
    .select()
    .from(calendarEvents)
    .where(
      and(
        eq(calendarEvents.userId, userId),
        lte(calendarEvents.startTime, weekEnd),
        gte(calendarEvents.endTime, weekStart)
      )
    );

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    startTime: r.startTime,
    endTime: r.endTime,
    isBusy: r.isBusy,
    isAllDay: r.isAllDay,
    source: r.source as CalendarEvent["source"],
  }));
}

/**
 * Load constraints for a user and map to agent types.
 */
export async function loadConstraints(userId: string): Promise<Constraint[]> {
  const rows = await db
    .select()
    .from(userConstraints)
    .where(eq(userConstraints.userId, userId));

  return rows.map((r) => ({
    type: r.type,
    days: r.days as string[],
    startTime: r.startTime,
    endTime: r.endTime,
  }));
}

/**
 * Load preferences for a user and map to agent types.
 */
export async function loadPreferences(
  userId: string
): Promise<UserPrefs | null> {
  const rows = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId));

  if (rows.length === 0) return null;

  const r = rows[0];
  return {
    maxEventsPerWeek: r.maxEventsPerWeek,
    preferredTypes: r.preferredTypes as string[],
    bufferMinutes: r.bufferMinutes,
    preferMornings: r.preferMornings,
    preferAfternoons: r.preferAfternoons,
    preferEvenings: r.preferEvenings,
    preferWeekends: r.preferWeekends,
    weatherSensitive: r.weatherSensitive,
  };
}

/**
 * Load active friendships between eligible users.
 */
export async function loadActiveFriendships(eligibleUserIds: string[]) {
  const rows = await db
    .select()
    .from(friendships)
    .where(eq(friendships.status, "active"));

  // Filter to only friendships where both users are eligible
  return rows
    .filter(
      (r) =>
        eligibleUserIds.includes(r.userId) &&
        eligibleUserIds.includes(r.friendId)
    )
    .map((r) => ({
      userId: r.userId,
      friendId: r.friendId,
      priority: r.priority,
    }));
}

/**
 * Load locations for a user.
 */
export async function loadLocations(userId: string) {
  const rows = await db
    .select()
    .from(userLocations)
    .where(eq(userLocations.userId, userId));

  return rows.map((r) => ({
    userId: r.userId,
    locationName: r.label,
    locationId: r.id,
    travelMinutes: r.travelMinutes ?? 0,
  }));
}

/**
 * Run the full negotiation pipeline:
 * 1. Load eligible users from DB
 * 2. Load each user's calendar events, constraints, preferences, locations
 * 3. Load active friendships
 * 4. Feed everything to the agent engine
 * 5. Persist results to negotiations, proposals, proposal_participants
 */
export async function runNegotiation(
  weekStart: Date,
  weekEnd: Date
): Promise<NegotiationServiceResult> {
  // 1. Load eligible users
  const eligibleUsers = await loadEligibleUsers();
  if (eligibleUsers.length === 0) {
    throw new Error("No eligible users found (onboarding must be complete)");
  }

  const eligibleUserIds = eligibleUsers.map((u) => u.id);

  // 2. Load data for each user
  const userAvailabilities: UserAvailability[] = [];
  const preferencesMap = new Map<string, UserPrefs>();
  const allLocations: NegotiationParams["locations"] = [];

  for (const user of eligibleUsers) {
    // Calendar events
    const events = await loadCalendarEvents(user.id, weekStart, weekEnd);

    // Constraints
    const constraints = await loadConstraints(user.id);

    // Preferences
    const prefs = await loadPreferences(user.id);
    const effectivePrefs: UserPrefs = prefs ?? {
      maxEventsPerWeek: 3,
      preferredTypes: ["coffee", "walk"],
      bufferMinutes: 30,
      preferMornings: false,
      preferAfternoons: true,
      preferEvenings: false,
      preferWeekends: true,
      weatherSensitive: false,
    };
    preferencesMap.set(user.id, effectivePrefs);

    // Compute free slots
    const freeSlots = computeWeekAvailability(
      events,
      constraints,
      weekStart,
      effectivePrefs.bufferMinutes
    );
    for (const slot of freeSlots) {
      slot.userId = user.id;
    }

    userAvailabilities.push({
      userId: user.id,
      freeSlots,
      constraints,
    });

    // Locations
    const locs = await loadLocations(user.id);
    allLocations.push(...locs);
  }

  // 3. Load active friendships
  const activeFriendships = await loadActiveFriendships(eligibleUserIds);

  // 4. Run the negotiation engine
  const params: NegotiationParams = {
    users: userAvailabilities,
    preferences: preferencesMap,
    friendships: activeFriendships,
    locations: allLocations,
    weekStart,
    engagementTypes: [...ENGAGEMENT_TYPES],
  };

  const result = negotiate(params);

  // 5. Persist to DB
  const negotiationId = uuid();
  await db.insert(negotiations).values({
    id: negotiationId,
    status: "proposed",
    weekStart,
    weekEnd,
    context: { userIds: eligibleUserIds },
    log: result.log,
  });

  const proposalIds: string[] = [];

  for (const proposal of result.proposals) {
    const proposalId = uuid();
    proposalIds.push(proposalId);

    await db.insert(proposals).values({
      id: proposalId,
      negotiationId,
      type: proposal.type as (typeof ENGAGEMENT_TYPES)[number],
      title: proposal.title,
      locationName: proposal.locationName,
      locationId: proposal.locationId,
      startTime: proposal.slot.start,
      endTime: proposal.slot.end,
      status: "proposed",
      score: proposal.slot.score,
      scoreBreakdown: proposal.slot.scoreBreakdown,
    });

    for (let i = 0; i < proposal.participants.length; i++) {
      await db.insert(proposalParticipants).values({
        proposalId,
        userId: proposal.participants[i],
        response: "pending",
        isOrganizer: i === 0,
      });
    }
  }

  return { negotiationId, result, proposalIds };
}
