/**
 * Agent Negotiation Engine - Scorer
 *
 * Deterministic weighted scoring of candidate time slots.
 * Seven factors, each producing a 0.0-1.0 score, multiplied by a fixed weight.
 *
 * No database access - fully testable with plain data.
 */

import type {
  OverlapSlot,
  ScoredSlot,
  UserPrefs,
  ScoringContext,
} from "./types";

// ---------------------------------------------------------------------------
// Weight configuration
// ---------------------------------------------------------------------------

const WEIGHTS = {
  timePreference: 0.25,
  eventTypeFit: 0.20,
  locationConvenience: 0.15,
  priorityContact: 0.15,
  weatherSuitability: 0.10,
  recency: 0.10,
  capDistance: 0.05,
} as const;

// ---------------------------------------------------------------------------
// Individual scoring factors (each returns 0.0 - 1.0)
// ---------------------------------------------------------------------------

/**
 * Time preference score.
 *
 * Determines which time-of-day bucket the slot falls into, then checks each
 * participant's preference alignment. Returns the average across participants.
 *
 * Buckets: morning [7-12), afternoon [12-17), evening [17-22).
 * Weekend bonus: if the slot is on Sat/Sun and a user preferWeekends, +0.3 (capped at 1.0).
 */
function scoreTimePreference(
  slot: OverlapSlot,
  prefs: Map<string, UserPrefs>
): number {
  const slotHour = slot.start.getHours();
  const slotDay = slot.start.getDay(); // 0=Sun, 6=Sat
  const isWeekend = slotDay === 0 || slotDay === 6;

  let totalScore = 0;
  let count = 0;

  for (const uid of slot.userIds) {
    const p = prefs.get(uid);
    if (!p) {
      totalScore += 0.5; // neutral if prefs unknown
      count++;
      continue;
    }

    let base = 0.3; // default: not a preferred time

    if (slotHour >= 7 && slotHour < 12 && p.preferMornings) {
      base = 1.0;
    } else if (slotHour >= 12 && slotHour < 17 && p.preferAfternoons) {
      base = 1.0;
    } else if (slotHour >= 17 && slotHour < 22 && p.preferEvenings) {
      base = 1.0;
    }

    // Weekend bonus
    if (isWeekend && p.preferWeekends) {
      base = Math.min(1.0, base + 0.3);
    }

    totalScore += base;
    count++;
  }

  return count > 0 ? totalScore / count : 0.5;
}

/**
 * Event type fit score.
 *
 * Checks how many participants list the proposed type in their preferredTypes.
 * If a user has no preferred types, they are treated as neutral (0.5).
 */
function scoreEventTypeFit(
  slot: OverlapSlot,
  prefs: Map<string, UserPrefs>,
  proposedType: string
): number {
  let totalScore = 0;
  let count = 0;

  for (const uid of slot.userIds) {
    const p = prefs.get(uid);
    if (!p || p.preferredTypes.length === 0) {
      totalScore += 0.5;
    } else if (p.preferredTypes.includes(proposedType)) {
      totalScore += 1.0;
    } else {
      totalScore += 0.2;
    }
    count++;
  }

  return count > 0 ? totalScore / count : 0.5;
}

/**
 * Location convenience score.
 *
 * If travel time data is provided, shorter travel is better.
 * - 0 minutes  -> 1.0
 * - 30 minutes -> 0.5
 * - 60+ minutes -> 0.0
 *
 * If no travel data, returns neutral 0.5.
 */
function scoreLocationConvenience(
  slot: OverlapSlot,
  travelMinutes?: Map<string, number>
): number {
  if (!travelMinutes || travelMinutes.size === 0) return 0.5;

  let totalScore = 0;
  let count = 0;

  for (const uid of slot.userIds) {
    const travel = travelMinutes.get(uid);
    if (travel === undefined) {
      totalScore += 0.5;
    } else {
      // Linear scale: 0 min = 1.0, 60 min = 0.0
      totalScore += Math.max(0, 1.0 - travel / 60);
    }
    count++;
  }

  return count > 0 ? totalScore / count : 0.5;
}

/**
 * Priority contact score.
 *
 * Average friendship priority across all participant pairs, normalized from
 * the 1-10 scale to 0.0-1.0.
 */
function scorePriorityContact(
  slot: OverlapSlot,
  friendships: { userId: string; friendId: string; priority: number }[]
): number {
  const priorities: number[] = [];

  for (let i = 0; i < slot.userIds.length; i++) {
    for (let j = i + 1; j < slot.userIds.length; j++) {
      const uid = slot.userIds[i];
      const fid = slot.userIds[j];

      // Look up in both directions
      const f =
        friendships.find(
          (fr) =>
            (fr.userId === uid && fr.friendId === fid) ||
            (fr.userId === fid && fr.friendId === uid)
        );

      if (f) {
        priorities.push(f.priority);
      } else {
        priorities.push(5); // default mid priority
      }
    }
  }

  if (priorities.length === 0) return 0.5;

  const avg = priorities.reduce((a, b) => a + b, 0) / priorities.length;
  // Normalize 1-10 to 0.0-1.0
  return (avg - 1) / 9;
}

/**
 * Weather suitability score.
 *
 * TODO: Integrate real weather API. For now, returns 0.7 (neutral-good).
 */
function scoreWeatherSuitability(): number {
  return 0.7;
}

/**
 * Recency score.
 *
 * More days since last hangout with these friends = higher score (we want
 * to encourage catching up with people we haven't seen recently).
 *
 * - 0 days  -> 0.0  (just saw them)
 * - 14 days -> ~0.47 (default if unknown)
 * - 30+ days -> 1.0  (cap)
 */
function scoreRecency(
  slot: OverlapSlot,
  lastHangoutDays: Map<string, number>
): number {
  const daysSinceValues: number[] = [];

  for (let i = 0; i < slot.userIds.length; i++) {
    for (let j = i + 1; j < slot.userIds.length; j++) {
      const pairKey = [slot.userIds[i], slot.userIds[j]].sort().join("-");
      const days = lastHangoutDays.get(pairKey) ?? 14; // default 14 days
      daysSinceValues.push(days);
    }
  }

  if (daysSinceValues.length === 0) return 0.5;

  const avg =
    daysSinceValues.reduce((a, b) => a + b, 0) / daysSinceValues.length;
  // Linear scale capped at 30 days
  return Math.min(1.0, avg / 30);
}

/**
 * Cap distance score.
 *
 * How many events each user has remaining in their weekly cap.
 * More remaining = higher score (we prefer users who aren't over-scheduled).
 *
 * Score per user: remaining / maxEventsPerWeek, capped at 1.0.
 * Final score: average across participants.
 */
function scoreCapDistance(
  slot: OverlapSlot,
  prefs: Map<string, UserPrefs>,
  currentWeekEventCount: Map<string, number>
): number {
  let totalScore = 0;
  let count = 0;

  for (const uid of slot.userIds) {
    const p = prefs.get(uid);
    const max = p?.maxEventsPerWeek ?? 3;
    const current = currentWeekEventCount.get(uid) ?? 0;
    const remaining = Math.max(0, max - current);

    totalScore += Math.min(1.0, remaining / max);
    count++;
  }

  return count > 0 ? totalScore / count : 0.5;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Score a single overlap slot using all 7 weighted factors.
 *
 * Each factor produces a value in [0.0, 1.0], which is multiplied by its
 * weight. The final score is the sum (also in [0.0, 1.0] since weights sum
 * to 1.0).
 */
export function scoreSlot(
  slot: OverlapSlot,
  prefs: Map<string, UserPrefs>,
  friendships: { userId: string; friendId: string; priority: number }[],
  context: ScoringContext
): ScoredSlot {
  const timePref = scoreTimePreference(slot, prefs);
  const typeFit = scoreEventTypeFit(slot, prefs, context.proposedType);
  const location = scoreLocationConvenience(slot, context.travelMinutes);
  const priority = scorePriorityContact(slot, friendships);
  const weather = scoreWeatherSuitability();
  const recency = scoreRecency(slot, context.lastHangoutDays);
  const cap = scoreCapDistance(slot, prefs, context.currentWeekEventCount);

  const scoreBreakdown: Record<string, number> = {
    timePreference: round(timePref * WEIGHTS.timePreference),
    eventTypeFit: round(typeFit * WEIGHTS.eventTypeFit),
    locationConvenience: round(location * WEIGHTS.locationConvenience),
    priorityContact: round(priority * WEIGHTS.priorityContact),
    weatherSuitability: round(weather * WEIGHTS.weatherSuitability),
    recency: round(recency * WEIGHTS.recency),
    capDistance: round(cap * WEIGHTS.capDistance),
  };

  const totalScore = Object.values(scoreBreakdown).reduce((a, b) => a + b, 0);

  return {
    ...slot,
    score: round(totalScore),
    scoreBreakdown,
  };
}

/**
 * Score and rank all overlap slots. Returns slots sorted descending by score.
 */
export function rankSlots(
  slots: OverlapSlot[],
  prefs: Map<string, UserPrefs>,
  friendships: { userId: string; friendId: string; priority: number }[],
  context: ScoringContext
): ScoredSlot[] {
  const scored = slots.map((slot) => scoreSlot(slot, prefs, friendships, context));
  scored.sort((a, b) => b.score - a.score);
  return scored;
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/** Round to 4 decimal places to avoid floating-point noise. */
function round(n: number): number {
  return Math.round(n * 10000) / 10000;
}
