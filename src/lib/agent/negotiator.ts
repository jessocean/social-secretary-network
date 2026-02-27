/**
 * Agent Negotiation Engine - Negotiator
 *
 * Top-level orchestration: finds overlaps, scores them, and greedily selects
 * the best non-conflicting proposals respecting per-user weekly caps.
 *
 * No database access - fully testable with plain data.
 */

import type {
  NegotiationParams,
  NegotiationResult,
  ProposalCandidate,
  ScoredSlot,
  ScoringContext,
  UserPrefs,
} from "./types";
import { findOverlaps } from "./scheduler";
import { rankSlots } from "./scorer";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a display title for a proposal.
 * Examples:
 *   "Coffee with Bob"
 *   "Playground meetup with Alice & Carol"
 */
function buildTitle(
  type: string,
  participantIds: string[],
  displayNameMap: Map<string, string>
): string {
  // Capitalize the engagement type nicely
  const typeLabel = formatEngagementType(type);

  // Get participant display names (fall back to truncated ID)
  const names = participantIds.map(
    (id) => displayNameMap.get(id) ?? id.slice(0, 8)
  );

  if (names.length === 1) {
    return `${typeLabel} with ${names[0]}`;
  }
  if (names.length === 2) {
    return `${typeLabel} with ${names[0]} & ${names[1]}`;
  }

  // 3+ participants
  const allButLast = names.slice(0, -1).join(", ");
  const last = names[names.length - 1];
  return `${typeLabel} with ${allButLast} & ${last}`;
}

/**
 * Convert an engagement type slug to a human-friendly label.
 * "playground" -> "Playground meetup"
 * "playdate_home" -> "Playdate at home"
 * "coffee" -> "Coffee"
 */
function formatEngagementType(type: string): string {
  const map: Record<string, string> = {
    playground: "Playground meetup",
    coffee: "Coffee",
    playdate_home: "Playdate at home",
    dinner: "Dinner",
    park: "Park hangout",
    class: "Class",
    walk: "Walk",
    other: "Hangout",
  };
  return map[type] ?? type.charAt(0).toUpperCase() + type.slice(1);
}

/**
 * Check if two time intervals overlap.
 */
function intervalsOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date
): boolean {
  return aStart.getTime() < bEnd.getTime() && bStart.getTime() < aEnd.getTime();
}

/**
 * Create a deterministic display name map from user IDs.
 * In a real app this would come from the database; here we just use the
 * userId as-is (callers can override via the participants in NegotiationParams).
 */
function buildDisplayNameMap(userIds: string[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const id of userIds) {
    map.set(id, id.slice(0, 8));
  }
  return map;
}

/**
 * Create a log entry with an ISO timestamp.
 */
function logEntry(message: string): { timestamp: string; message: string } {
  return { timestamp: new Date().toISOString(), message };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Run the full negotiation algorithm.
 *
 * 1. Find all overlapping free slots across user pairs/groups.
 * 2. For each engagement type, score the overlapping slots.
 * 3. Greedily select top-scoring slots while respecting constraints:
 *    - Per-user weekly event cap (maxEventsPerWeek)
 *    - No double-booking (selected slots cannot overlap for the same user)
 *    - At least 1 different friend per proposal (avoid scheduling the
 *      exact same group repeatedly)
 * 4. Build proposal candidates with human-friendly titles.
 * 5. Return proposals + a negotiation log.
 */
export function negotiate(params: NegotiationParams): NegotiationResult {
  const {
    users,
    preferences,
    friendships,
    locations,
    weekStart,
    engagementTypes,
  } = params;

  const log: { timestamp: string; message: string }[] = [];
  log.push(logEntry(`Negotiation started for week of ${weekStart.toISOString()}`));
  log.push(
    logEntry(
      `Participants: ${users.map((u) => u.userId).join(", ")} | Types: ${engagementTypes.join(", ")}`
    )
  );

  // --- 1. Find overlaps ---
  const overlaps = findOverlaps(users);
  log.push(logEntry(`Found ${overlaps.length} overlapping time slots`));

  if (overlaps.length === 0) {
    log.push(logEntry("No overlapping availability found. Negotiation complete."));
    return { proposals: [], log };
  }

  // --- Build context data ---
  // Pre-compute travel time per user from locations
  const travelMinutes = new Map<string, number>();
  for (const loc of locations) {
    // Use the minimum travel time if a user has multiple locations
    const existing = travelMinutes.get(loc.userId);
    if (existing === undefined || loc.travelMinutes < existing) {
      travelMinutes.set(loc.userId, loc.travelMinutes);
    }
  }

  // Pre-compute current week event counts (start at 0 for each user)
  const currentWeekEventCount = new Map<string, number>();
  for (const u of users) {
    currentWeekEventCount.set(u.userId, 0);
  }

  // Build display name map (use userId as fallback)
  const allUserIds = users.map((u) => u.userId);
  const displayNameMap = buildDisplayNameMap(allUserIds);

  // --- 2. Score overlaps for each engagement type ---
  const allScoredByType: { type: string; scored: ScoredSlot[] }[] = [];

  for (const engType of engagementTypes) {
    const context: ScoringContext = {
      proposedType: engType,
      currentWeekEventCount,
      lastHangoutDays: new Map(), // Caller can populate; defaults to 14 in scorer
      travelMinutes,
    };

    const ranked = rankSlots(overlaps, preferences, friendships, context);
    allScoredByType.push({ type: engType, scored: ranked });

    log.push(
      logEntry(
        `Scored ${ranked.length} slots for type "${engType}". ` +
          `Top score: ${ranked.length > 0 ? ranked[0].score.toFixed(3) : "N/A"}`
      )
    );
  }

  // --- 3. Greedy selection ---
  // Merge all scored slots (tagged with type) into one list, sort by score desc.
  const candidates: { type: string; slot: ScoredSlot }[] = [];
  for (const { type, scored } of allScoredByType) {
    for (const s of scored) {
      candidates.push({ type, slot: s });
    }
  }
  candidates.sort((a, b) => b.slot.score - a.slot.score);

  // Track state during greedy selection
  const selectedProposals: ProposalCandidate[] = [];
  /** Per-user count of selected proposals this week. */
  const userProposalCount = new Map<string, number>();
  /** Slots already claimed per user (for double-booking check). */
  const userBookedSlots = new Map<string, { start: Date; end: Date }[]>();
  /** Track which exact participant sets we've already scheduled. */
  const usedGroupKeys = new Set<string>();

  for (const u of users) {
    userProposalCount.set(u.userId, 0);
    userBookedSlots.set(u.userId, []);
  }

  for (const { type, slot } of candidates) {
    // Check per-user caps
    let allUnderCap = true;
    for (const uid of slot.userIds) {
      const maxEvents = preferences.get(uid)?.maxEventsPerWeek ?? 3;
      const currentCount = userProposalCount.get(uid) ?? 0;
      if (currentCount >= maxEvents) {
        allUnderCap = false;
        break;
      }
    }
    if (!allUnderCap) continue;

    // Check no double-booking
    let hasConflict = false;
    for (const uid of slot.userIds) {
      const booked = userBookedSlots.get(uid) ?? [];
      for (const b of booked) {
        if (intervalsOverlap(slot.start, slot.end, b.start, b.end)) {
          hasConflict = true;
          break;
        }
      }
      if (hasConflict) break;
    }
    if (hasConflict) continue;

    // Check that this exact participant group hasn't been used too much
    // (allow the same group for different types, but not the same type+group)
    const groupKey = `${type}:${[...slot.userIds].sort().join(",")}`;
    if (usedGroupKeys.has(groupKey)) continue;

    // Pick a location if available
    let locationName: string | undefined;
    let locationId: string | undefined;
    for (const loc of locations) {
      if (slot.userIds.includes(loc.userId)) {
        locationName = loc.locationName;
        locationId = loc.locationId;
        break;
      }
    }

    // Build the title - exclude the "initiator" (first user) to show only friends
    // In a pair, show the other person; in a group, show everyone except user[0]
    const friendIds = slot.userIds.slice(1);
    const title = buildTitle(type, friendIds, displayNameMap);

    const proposal: ProposalCandidate = {
      slot,
      type,
      title,
      locationName,
      locationId,
      participants: [...slot.userIds],
    };

    selectedProposals.push(proposal);
    usedGroupKeys.add(groupKey);

    // Update bookkeeping
    for (const uid of slot.userIds) {
      userProposalCount.set(uid, (userProposalCount.get(uid) ?? 0) + 1);
      const booked = userBookedSlots.get(uid) ?? [];
      booked.push({ start: slot.start, end: slot.end });
      userBookedSlots.set(uid, booked);
    }

    log.push(
      logEntry(
        `Selected: "${title}" (${type}) at ${slot.start.toISOString()} ` +
          `[score=${slot.score.toFixed(3)}]`
      )
    );
  }

  log.push(
    logEntry(
      `Negotiation complete. Generated ${selectedProposals.length} proposal(s).`
    )
  );

  return { proposals: selectedProposals, log };
}
