/**
 * Agent Negotiation Engine - Scheduler
 *
 * Pure functions for computing free time slots from calendar events and
 * constraints, then finding overlapping availability across users.
 *
 * No database access - fully testable with plain data.
 */

import type { CalendarEvent } from "@/lib/calendar/types";
import type { Constraint, FreeSlot, UserAvailability, OverlapSlot } from "./types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Earliest schedulable hour (inclusive). */
const DAY_START_HOUR = 7;
/** Latest schedulable hour (exclusive - slots must end by this time). */
const DAY_END_HOUR = 22;

/** Map abbreviated day names to JS Date.getDay() values (0 = Sunday). */
const DAY_NAME_TO_NUMBER: Record<string, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parse an "HH:mm" string into total minutes since midnight.
 */
function parseHHMM(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Create a Date on the given day at the specified hour/minute (local time).
 */
function dateAtTime(day: Date, hours: number, minutes: number = 0): Date {
  const d = new Date(day);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

/**
 * Subtract a sorted array of "busy" intervals from a single "free" interval.
 * All intervals are represented as [start, end] in epoch milliseconds.
 * Returns the remaining free intervals, guaranteed non-overlapping and sorted.
 */
function subtractIntervals(
  free: [number, number],
  busy: [number, number][]
): [number, number][] {
  const result: [number, number][] = [];
  let [curStart, curEnd] = free;

  for (const [bStart, bEnd] of busy) {
    if (bEnd <= curStart) continue; // busy block entirely before cursor
    if (bStart >= curEnd) break;    // busy block entirely after remaining free

    // If there's a gap before this busy block, keep it
    if (bStart > curStart) {
      result.push([curStart, bStart]);
    }

    // Advance cursor past the busy block
    curStart = Math.max(curStart, bEnd);
  }

  // Remaining tail
  if (curStart < curEnd) {
    result.push([curStart, curEnd]);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Core: single-day free slots
// ---------------------------------------------------------------------------

/**
 * Compute free time slots for a single day.
 *
 * Algorithm:
 * 1. Start with the schedulable window [7:00, 22:00].
 * 2. Collect all "busy" intervals: calendar events (with buffer) + matching constraints.
 * 3. Subtract busy intervals from the schedulable window.
 * 4. Return the remaining free slots (minimum 1 minute duration).
 *
 * @param events     All calendar events for this day (may include multi-day; only the
 *                   overlapping portion with the day window is considered).
 * @param constraints Recurring constraints (e.g. nap 13:00-14:30 on Mon/Wed/Fri).
 * @param date       The day to compute (time portion is ignored).
 * @param bufferMinutes Minutes of buffer to add before AND after each calendar event.
 * @returns          Sorted array of FreeSlot (userId is empty string - caller should set it).
 */
export function computeFreeSlots(
  events: CalendarEvent[],
  constraints: Constraint[],
  date: Date,
  bufferMinutes: number
): FreeSlot[] {
  const dayStart = dateAtTime(date, DAY_START_HOUR).getTime();
  const dayEnd = dateAtTime(date, DAY_END_HOUR).getTime();
  const dayOfWeek = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getDay();
  const bufferMs = bufferMinutes * 60_000;

  // --- Collect busy intervals ---
  const busy: [number, number][] = [];

  // Calendar events (only busy ones, and only the portion overlapping our window)
  for (const evt of events) {
    if (!evt.isBusy) continue;

    let evtStart = evt.startTime.getTime();
    let evtEnd = evt.endTime.getTime();

    // All-day events block the entire schedulable window
    if (evt.isAllDay) {
      evtStart = dayStart;
      evtEnd = dayEnd;
    }

    // Apply buffer
    const bufferedStart = evtStart - bufferMs;
    const bufferedEnd = evtEnd + bufferMs;

    // Clamp to day window
    const clampedStart = Math.max(bufferedStart, dayStart);
    const clampedEnd = Math.min(bufferedEnd, dayEnd);

    if (clampedStart < clampedEnd) {
      busy.push([clampedStart, clampedEnd]);
    }
  }

  // Constraints that apply to this day of the week
  for (const c of constraints) {
    const matchesDay = c.days.some(
      (dayName) => DAY_NAME_TO_NUMBER[dayName.toLowerCase()] === dayOfWeek
    );
    if (!matchesDay) continue;

    const cStartMin = parseHHMM(c.startTime);
    const cEndMin = parseHHMM(c.endTime);
    const cStart = dateAtTime(date, 0, cStartMin).getTime();
    const cEnd = dateAtTime(date, 0, cEndMin).getTime();

    // Clamp to day window
    const clampedStart = Math.max(cStart, dayStart);
    const clampedEnd = Math.min(cEnd, dayEnd);

    if (clampedStart < clampedEnd) {
      busy.push([clampedStart, clampedEnd]);
    }
  }

  // Sort busy intervals by start time (ties broken by end time)
  busy.sort((a, b) => a[0] - b[0] || a[1] - b[1]);

  // Merge overlapping busy intervals
  const merged: [number, number][] = [];
  for (const interval of busy) {
    if (merged.length === 0 || interval[0] > merged[merged.length - 1][1]) {
      merged.push([...interval]);
    } else {
      merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], interval[1]);
    }
  }

  // Subtract from day window
  const freeIntervals = subtractIntervals([dayStart, dayEnd], merged);

  return freeIntervals.map(([s, e]) => ({
    start: new Date(s),
    end: new Date(e),
    userId: "", // caller sets this
  }));
}

// ---------------------------------------------------------------------------
// Core: week availability
// ---------------------------------------------------------------------------

/**
 * Compute free slots for an entire week (Mon-Sun).
 *
 * @param events       All calendar events for the week.
 * @param constraints  User's recurring constraints.
 * @param weekStart    The Monday that starts the week (time portion ignored).
 * @param bufferMinutes Buffer to apply around each calendar event.
 * @returns            Sorted array of FreeSlot for the whole week.
 */
export function computeWeekAvailability(
  events: CalendarEvent[],
  constraints: Constraint[],
  weekStart: Date,
  bufferMinutes: number
): FreeSlot[] {
  const allSlots: FreeSlot[] = [];

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const day = new Date(weekStart);
    day.setDate(day.getDate() + dayOffset);

    // Filter events that overlap with this day's schedulable window
    const dayWindowStart = dateAtTime(day, DAY_START_HOUR);
    const dayWindowEnd = dateAtTime(day, DAY_END_HOUR);

    const dayEvents = events.filter((evt) => {
      const evtStart = evt.startTime.getTime();
      const evtEnd = evt.endTime.getTime();
      return evtStart < dayWindowEnd.getTime() && evtEnd > dayWindowStart.getTime();
    });

    const daySlots = computeFreeSlots(dayEvents, constraints, day, bufferMinutes);
    allSlots.push(...daySlots);
  }

  return allSlots;
}

// ---------------------------------------------------------------------------
// Core: overlap finding
// ---------------------------------------------------------------------------

/**
 * Find time slots where two or more users are simultaneously free.
 *
 * Algorithm:
 * - For every pair of users, iterate through their sorted free slots using a
 *   two-pointer sweep to find overlapping regions.
 * - Then merge overlaps across pairs: if users A,B overlap at 10-11 and users
 *   A,C also overlap at 10:30-11:30, the result includes both entries (they
 *   represent different participant sets).
 * - Overlaps shorter than minDurationMinutes are discarded.
 *
 * @param availabilities Each user's free slots (userId must be set on FreeSlot).
 * @param minDurationMinutes Minimum overlap duration (default 60).
 * @returns Sorted array of OverlapSlot.
 */
export function findOverlaps(
  availabilities: UserAvailability[],
  minDurationMinutes: number = 60
): OverlapSlot[] {
  const minDurationMs = minDurationMinutes * 60_000;
  const overlaps: OverlapSlot[] = [];

  // Build a sorted free-slot list per user (they should already be sorted, but
  // we sort here defensively).
  const userSlots = new Map<string, FreeSlot[]>();
  for (const ua of availabilities) {
    const sorted = [...ua.freeSlots].sort(
      (a, b) => a.start.getTime() - b.start.getTime()
    );
    userSlots.set(ua.userId, sorted);
  }

  const userIds = Array.from(userSlots.keys());

  // Pairwise sweep
  for (let i = 0; i < userIds.length; i++) {
    for (let j = i + 1; j < userIds.length; j++) {
      const slotsA = userSlots.get(userIds[i])!;
      const slotsB = userSlots.get(userIds[j])!;
      let ai = 0;
      let bi = 0;

      while (ai < slotsA.length && bi < slotsB.length) {
        const a = slotsA[ai];
        const b = slotsB[bi];

        const overlapStart = Math.max(a.start.getTime(), b.start.getTime());
        const overlapEnd = Math.min(a.end.getTime(), b.end.getTime());

        if (overlapEnd - overlapStart >= minDurationMs) {
          overlaps.push({
            start: new Date(overlapStart),
            end: new Date(overlapEnd),
            userIds: [userIds[i], userIds[j]],
          });
        }

        // Advance the pointer whose slot ends earlier
        if (a.end.getTime() <= b.end.getTime()) {
          ai++;
        } else {
          bi++;
        }
      }
    }
  }

  // For groups of 3+ users, check if any pair-overlaps are contained within a
  // third user's free time. If so, create a combined OverlapSlot.
  if (userIds.length > 2) {
    const groupOverlaps: OverlapSlot[] = [];

    for (const overlap of overlaps) {
      // Try to extend this overlap with additional users
      const extendedUserIds = [...overlap.userIds];

      for (const uid of userIds) {
        if (extendedUserIds.includes(uid)) continue;

        const slots = userSlots.get(uid)!;
        const oStart = overlap.start.getTime();
        const oEnd = overlap.end.getTime();

        // Check if any of this user's free slots fully contain the overlap
        // (or at least overlap by minDurationMs)
        for (const s of slots) {
          const intersectStart = Math.max(s.start.getTime(), oStart);
          const intersectEnd = Math.min(s.end.getTime(), oEnd);

          if (intersectEnd - intersectStart >= minDurationMs) {
            extendedUserIds.push(uid);
            break;
          }
        }
      }

      if (extendedUserIds.length > overlap.userIds.length) {
        // Recalculate the actual overlap across ALL extended users
        let narrowStart = overlap.start.getTime();
        let narrowEnd = overlap.end.getTime();

        for (const uid of extendedUserIds) {
          if (overlap.userIds.includes(uid)) continue;
          const slots = userSlots.get(uid)!;
          let bestStart = 0;
          let bestEnd = 0;

          for (const s of slots) {
            const intStart = Math.max(s.start.getTime(), narrowStart);
            const intEnd = Math.min(s.end.getTime(), narrowEnd);
            if (intEnd - intStart > bestEnd - bestStart) {
              bestStart = intStart;
              bestEnd = intEnd;
            }
          }

          narrowStart = bestStart;
          narrowEnd = bestEnd;
        }

        if (narrowEnd - narrowStart >= minDurationMs) {
          groupOverlaps.push({
            start: new Date(narrowStart),
            end: new Date(narrowEnd),
            userIds: extendedUserIds.sort(),
          });
        }
      }
    }

    // Add group overlaps (deduplicated)
    const seen = new Set<string>();
    for (const o of groupOverlaps) {
      const key = `${o.start.getTime()}-${o.end.getTime()}-${o.userIds.join(",")}`;
      if (!seen.has(key)) {
        seen.add(key);
        overlaps.push(o);
      }
    }
  }

  // Sort by start time
  overlaps.sort((a, b) => a.start.getTime() - b.start.getTime());

  return overlaps;
}
