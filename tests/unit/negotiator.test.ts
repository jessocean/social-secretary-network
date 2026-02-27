import { describe, it, expect } from "vitest";
import { negotiate } from "@/lib/agent/negotiator";
import type {
  NegotiationParams,
  UserAvailability,
  UserPrefs,
  Constraint,
  FreeSlot,
} from "@/lib/agent/types";

function makeDate(dayOffset: number, hour: number, minute = 0): Date {
  const base = new Date(2026, 2, 2); // Monday March 2, 2026
  const d = new Date(base);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function makeSlot(userId: string, dayOffset: number, startHour: number, endHour: number): FreeSlot {
  return {
    start: makeDate(dayOffset, startHour),
    end: makeDate(dayOffset, endHour),
    userId,
  };
}

describe("negotiate", () => {
  it("generates proposals from overlapping availability", () => {
    const users: UserAvailability[] = [
      {
        userId: "alice",
        freeSlots: [
          makeSlot("alice", 0, 9, 12),
          makeSlot("alice", 1, 9, 12),
          makeSlot("alice", 2, 9, 12),
        ],
        constraints: [],
      },
      {
        userId: "bob",
        freeSlots: [
          makeSlot("bob", 0, 10, 14),
          makeSlot("bob", 1, 10, 14),
          makeSlot("bob", 2, 10, 14),
        ],
        constraints: [],
      },
    ];

    const prefs = new Map<string, UserPrefs>([
      ["alice", {
        maxEventsPerWeek: 3,
        preferredTypes: ["coffee"],
        bufferMinutes: 0,
        preferMornings: true,
        preferAfternoons: false,
        preferEvenings: false,
        preferWeekends: false,
        weatherSensitive: false,
      }],
      ["bob", {
        maxEventsPerWeek: 5,
        preferredTypes: ["coffee"],
        bufferMinutes: 0,
        preferMornings: true,
        preferAfternoons: true,
        preferEvenings: true,
        preferWeekends: true,
        weatherSensitive: false,
      }],
    ]);

    const result = negotiate({
      users,
      preferences: prefs,
      friendships: [{ userId: "alice", friendId: "bob", priority: 8 }],
      locations: [],
      weekStart: makeDate(0, 0),
      engagementTypes: ["coffee"],
    });

    expect(result.proposals.length).toBeGreaterThan(0);
    expect(result.log.length).toBeGreaterThan(0);

    for (const p of result.proposals) {
      expect(p.participants).toContain("alice");
      expect(p.participants).toContain("bob");
      expect(p.type).toBe("coffee");
    }
  });

  it("respects per-user weekly cap", () => {
    // Alice has max 1 event per week
    const users: UserAvailability[] = [
      {
        userId: "alice",
        freeSlots: [
          makeSlot("alice", 0, 9, 12),
          makeSlot("alice", 1, 9, 12),
          makeSlot("alice", 2, 9, 12),
          makeSlot("alice", 3, 9, 12),
          makeSlot("alice", 4, 9, 12),
        ],
        constraints: [],
      },
      {
        userId: "bob",
        freeSlots: [
          makeSlot("bob", 0, 9, 12),
          makeSlot("bob", 1, 9, 12),
          makeSlot("bob", 2, 9, 12),
          makeSlot("bob", 3, 9, 12),
          makeSlot("bob", 4, 9, 12),
        ],
        constraints: [],
      },
    ];

    const prefs = new Map<string, UserPrefs>([
      ["alice", {
        maxEventsPerWeek: 1,
        preferredTypes: ["coffee"],
        bufferMinutes: 0,
        preferMornings: true,
        preferAfternoons: true,
        preferEvenings: true,
        preferWeekends: true,
        weatherSensitive: false,
      }],
      ["bob", {
        maxEventsPerWeek: 5,
        preferredTypes: ["coffee"],
        bufferMinutes: 0,
        preferMornings: true,
        preferAfternoons: true,
        preferEvenings: true,
        preferWeekends: true,
        weatherSensitive: false,
      }],
    ]);

    const result = negotiate({
      users,
      preferences: prefs,
      friendships: [{ userId: "alice", friendId: "bob", priority: 5 }],
      locations: [],
      weekStart: makeDate(0, 0),
      engagementTypes: ["coffee"],
    });

    // Alice should have at most 1 proposal
    const aliceProposals = result.proposals.filter((p) =>
      p.participants.includes("alice")
    );
    expect(aliceProposals.length).toBeLessThanOrEqual(1);
  });

  it("prevents double-booking for the same user", () => {
    const users: UserAvailability[] = [
      {
        userId: "alice",
        freeSlots: [makeSlot("alice", 0, 9, 14)],
        constraints: [],
      },
      {
        userId: "bob",
        freeSlots: [makeSlot("bob", 0, 9, 14)],
        constraints: [],
      },
    ];

    const prefs = new Map<string, UserPrefs>([
      ["alice", {
        maxEventsPerWeek: 5,
        preferredTypes: ["coffee", "walk"],
        bufferMinutes: 0,
        preferMornings: true,
        preferAfternoons: true,
        preferEvenings: true,
        preferWeekends: true,
        weatherSensitive: false,
      }],
      ["bob", {
        maxEventsPerWeek: 5,
        preferredTypes: ["coffee", "walk"],
        bufferMinutes: 0,
        preferMornings: true,
        preferAfternoons: true,
        preferEvenings: true,
        preferWeekends: true,
        weatherSensitive: false,
      }],
    ]);

    const result = negotiate({
      users,
      preferences: prefs,
      friendships: [{ userId: "alice", friendId: "bob", priority: 5 }],
      locations: [],
      weekStart: makeDate(0, 0),
      engagementTypes: ["coffee", "walk"],
    });

    // Check no two proposals overlap for the same user
    for (let i = 0; i < result.proposals.length; i++) {
      for (let j = i + 1; j < result.proposals.length; j++) {
        const a = result.proposals[i];
        const b = result.proposals[j];
        const sharedUsers = a.participants.filter((p) =>
          b.participants.includes(p)
        );

        if (sharedUsers.length > 0) {
          // These proposals share users - they should not overlap in time
          const aStart = a.slot.start.getTime();
          const aEnd = a.slot.end.getTime();
          const bStart = b.slot.start.getTime();
          const bEnd = b.slot.end.getTime();
          const overlaps = aStart < bEnd && bStart < aEnd;
          expect(overlaps).toBe(false);
        }
      }
    }
  });

  it("returns empty proposals when no overlaps exist", () => {
    const users: UserAvailability[] = [
      {
        userId: "alice",
        freeSlots: [makeSlot("alice", 0, 7, 9)],
        constraints: [],
      },
      {
        userId: "bob",
        freeSlots: [makeSlot("bob", 0, 15, 20)],
        constraints: [],
      },
    ];

    const prefs = new Map<string, UserPrefs>([
      ["alice", {
        maxEventsPerWeek: 3,
        preferredTypes: [],
        bufferMinutes: 0,
        preferMornings: true,
        preferAfternoons: true,
        preferEvenings: true,
        preferWeekends: true,
        weatherSensitive: false,
      }],
      ["bob", {
        maxEventsPerWeek: 3,
        preferredTypes: [],
        bufferMinutes: 0,
        preferMornings: true,
        preferAfternoons: true,
        preferEvenings: true,
        preferWeekends: true,
        weatherSensitive: false,
      }],
    ]);

    const result = negotiate({
      users,
      preferences: prefs,
      friendships: [],
      locations: [],
      weekStart: makeDate(0, 0),
      engagementTypes: ["coffee"],
    });

    expect(result.proposals).toHaveLength(0);
    expect(result.log.length).toBeGreaterThan(0);
  });

  it("includes negotiation log entries", () => {
    const users: UserAvailability[] = [
      {
        userId: "alice",
        freeSlots: [makeSlot("alice", 0, 9, 12)],
        constraints: [],
      },
      {
        userId: "bob",
        freeSlots: [makeSlot("bob", 0, 9, 12)],
        constraints: [],
      },
    ];

    const prefs = new Map<string, UserPrefs>([
      ["alice", {
        maxEventsPerWeek: 3,
        preferredTypes: ["coffee"],
        bufferMinutes: 0,
        preferMornings: true,
        preferAfternoons: true,
        preferEvenings: true,
        preferWeekends: true,
        weatherSensitive: false,
      }],
      ["bob", {
        maxEventsPerWeek: 3,
        preferredTypes: ["coffee"],
        bufferMinutes: 0,
        preferMornings: true,
        preferAfternoons: true,
        preferEvenings: true,
        preferWeekends: true,
        weatherSensitive: false,
      }],
    ]);

    const result = negotiate({
      users,
      preferences: prefs,
      friendships: [{ userId: "alice", friendId: "bob", priority: 5 }],
      locations: [],
      weekStart: makeDate(0, 0),
      engagementTypes: ["coffee"],
    });

    expect(result.log.some((l) => l.message.includes("Negotiation started"))).toBe(true);
    expect(result.log.some((l) => l.message.includes("Negotiation complete"))).toBe(true);
  });
});
