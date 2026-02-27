import { describe, it, expect } from "vitest";
import {
  computeFreeSlots,
  computeWeekAvailability,
  findOverlaps,
} from "@/lib/agent/scheduler";
import type { CalendarEvent } from "@/lib/calendar/types";
import type { Constraint, UserAvailability } from "@/lib/agent/types";

// Helper: create a date at specific hour on a given day
function makeDate(dayOffset: number, hour: number, minute = 0): Date {
  // Use a fixed Monday as base
  const base = new Date(2026, 2, 2); // Monday March 2, 2026
  const d = new Date(base);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function makeEvent(
  title: string,
  dayOffset: number,
  startHour: number,
  startMin: number,
  endHour: number,
  endMin: number
): CalendarEvent {
  return {
    id: `evt-${title}`,
    title,
    startTime: makeDate(dayOffset, startHour, startMin),
    endTime: makeDate(dayOffset, endHour, endMin),
    isBusy: true,
    isAllDay: false,
    source: "mock",
  };
}

describe("computeFreeSlots", () => {
  it("returns full day when no events or constraints", () => {
    const date = makeDate(0, 0); // Monday
    const slots = computeFreeSlots([], [], date, 0);
    expect(slots).toHaveLength(1);
    expect(slots[0].start.getHours()).toBe(7);
    expect(slots[0].end.getHours()).toBe(22);
  });

  it("splits around a mid-day event", () => {
    const date = makeDate(0, 0);
    const events = [makeEvent("Meeting", 0, 10, 0, 11, 0)];
    const slots = computeFreeSlots(events, [], date, 0);
    expect(slots).toHaveLength(2);
    // First slot: 7:00 - 10:00
    expect(slots[0].start.getHours()).toBe(7);
    expect(slots[0].end.getHours()).toBe(10);
    // Second slot: 11:00 - 22:00
    expect(slots[1].start.getHours()).toBe(11);
    expect(slots[1].end.getHours()).toBe(22);
  });

  it("applies buffer around events", () => {
    const date = makeDate(0, 0);
    const events = [makeEvent("Meeting", 0, 12, 0, 13, 0)];
    const slots = computeFreeSlots(events, [], date, 30);
    expect(slots).toHaveLength(2);
    // First slot ends at 11:30 (30 min buffer before 12:00)
    expect(slots[0].end.getHours()).toBe(11);
    expect(slots[0].end.getMinutes()).toBe(30);
    // Second slot starts at 13:30 (30 min buffer after 13:00)
    expect(slots[1].start.getHours()).toBe(13);
    expect(slots[1].start.getMinutes()).toBe(30);
  });

  it("applies constraints on matching days", () => {
    const date = makeDate(0, 0); // Monday
    const constraints: Constraint[] = [
      {
        type: "nap",
        days: ["mon"],
        startTime: "13:00",
        endTime: "15:00",
      },
    ];
    const slots = computeFreeSlots([], constraints, date, 0);
    expect(slots).toHaveLength(2);
    expect(slots[0].end.getHours()).toBe(13);
    expect(slots[1].start.getHours()).toBe(15);
  });

  it("ignores constraints on non-matching days", () => {
    const date = makeDate(0, 0); // Monday
    const constraints: Constraint[] = [
      {
        type: "nap",
        days: ["tue", "thu"],
        startTime: "13:00",
        endTime: "15:00",
      },
    ];
    const slots = computeFreeSlots([], constraints, date, 0);
    expect(slots).toHaveLength(1); // Full day, constraint doesn't apply
  });

  it("handles overlapping events and constraints", () => {
    const date = makeDate(0, 0);
    const events = [makeEvent("Meeting", 0, 9, 0, 11, 0)];
    const constraints: Constraint[] = [
      {
        type: "nap",
        days: ["mon"],
        startTime: "10:00",
        endTime: "14:00",
      },
    ];
    // Event 9-11, constraint 10-14 -> merged busy: 9-14
    const slots = computeFreeSlots(events, constraints, date, 0);
    expect(slots).toHaveLength(2);
    expect(slots[0].end.getHours()).toBe(9);
    expect(slots[1].start.getHours()).toBe(14);
  });

  it("skips non-busy events", () => {
    const date = makeDate(0, 0);
    const events: CalendarEvent[] = [
      {
        id: "free-event",
        title: "Tentative",
        startTime: makeDate(0, 10, 0),
        endTime: makeDate(0, 11, 0),
        isBusy: false,
        isAllDay: false,
        source: "mock",
      },
    ];
    const slots = computeFreeSlots(events, [], date, 0);
    expect(slots).toHaveLength(1); // Full day, event is free
  });
});

describe("computeWeekAvailability", () => {
  it("returns slots for all 7 days", () => {
    const weekStart = makeDate(0, 0);
    const slots = computeWeekAvailability([], [], weekStart, 0);
    // Each day should have at least 1 slot (7am-10pm)
    expect(slots.length).toBe(7);
  });

  it("correctly filters events to their respective days", () => {
    const weekStart = makeDate(0, 0);
    const events = [
      makeEvent("Monday meeting", 0, 10, 0, 11, 0),
      makeEvent("Friday meeting", 4, 14, 0, 16, 0),
    ];
    const slots = computeWeekAvailability(events, [], weekStart, 0);
    // Monday should have 2 slots (split by meeting)
    const mondaySlots = slots.filter(
      (s) => s.start.getDate() === weekStart.getDate()
    );
    expect(mondaySlots).toHaveLength(2);
  });
});

describe("findOverlaps", () => {
  it("finds overlapping free slots between two users", () => {
    const userA: UserAvailability = {
      userId: "alice",
      freeSlots: [
        { start: makeDate(0, 9, 0), end: makeDate(0, 12, 0), userId: "alice" },
      ],
      constraints: [],
    };
    const userB: UserAvailability = {
      userId: "bob",
      freeSlots: [
        { start: makeDate(0, 10, 0), end: makeDate(0, 14, 0), userId: "bob" },
      ],
      constraints: [],
    };

    const overlaps = findOverlaps([userA, userB], 60);
    expect(overlaps.length).toBeGreaterThanOrEqual(1);
    // Overlap should be 10:00 - 12:00
    const first = overlaps[0];
    expect(first.start.getHours()).toBe(10);
    expect(first.end.getHours()).toBe(12);
    expect(first.userIds).toContain("alice");
    expect(first.userIds).toContain("bob");
  });

  it("returns empty when no overlap exists", () => {
    const userA: UserAvailability = {
      userId: "alice",
      freeSlots: [
        { start: makeDate(0, 7, 0), end: makeDate(0, 9, 0), userId: "alice" },
      ],
      constraints: [],
    };
    const userB: UserAvailability = {
      userId: "bob",
      freeSlots: [
        { start: makeDate(0, 14, 0), end: makeDate(0, 16, 0), userId: "bob" },
      ],
      constraints: [],
    };

    const overlaps = findOverlaps([userA, userB], 60);
    expect(overlaps).toHaveLength(0);
  });

  it("filters out overlaps shorter than minimum duration", () => {
    const userA: UserAvailability = {
      userId: "alice",
      freeSlots: [
        { start: makeDate(0, 10, 0), end: makeDate(0, 10, 30), userId: "alice" },
      ],
      constraints: [],
    };
    const userB: UserAvailability = {
      userId: "bob",
      freeSlots: [
        { start: makeDate(0, 10, 0), end: makeDate(0, 10, 30), userId: "bob" },
      ],
      constraints: [],
    };

    // Min duration 60 minutes, overlap is only 30 minutes
    const overlaps = findOverlaps([userA, userB], 60);
    expect(overlaps).toHaveLength(0);
  });

  it("finds group overlaps with 3 users", () => {
    const freeSlot = { start: makeDate(0, 10, 0), end: makeDate(0, 14, 0) };
    const users: UserAvailability[] = [
      { userId: "alice", freeSlots: [{ ...freeSlot, userId: "alice" }], constraints: [] },
      { userId: "bob", freeSlots: [{ ...freeSlot, userId: "bob" }], constraints: [] },
      { userId: "carol", freeSlots: [{ ...freeSlot, userId: "carol" }], constraints: [] },
    ];

    const overlaps = findOverlaps(users, 60);
    // Should find pair overlaps and at least one 3-way overlap
    const groupOverlap = overlaps.find((o) => o.userIds.length === 3);
    expect(groupOverlap).toBeDefined();
  });
});
