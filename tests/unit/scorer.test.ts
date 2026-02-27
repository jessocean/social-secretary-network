import { describe, it, expect } from "vitest";
import { scoreSlot, rankSlots } from "@/lib/agent/scorer";
import type {
  OverlapSlot,
  UserPrefs,
  ScoringContext,
} from "@/lib/agent/types";

function makeDate(dayOffset: number, hour: number, minute = 0): Date {
  const base = new Date(2026, 2, 2); // Monday March 2, 2026
  const d = new Date(base);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d;
}

const defaultPrefs: UserPrefs = {
  maxEventsPerWeek: 3,
  preferredTypes: ["coffee", "playground"],
  bufferMinutes: 30,
  preferMornings: true,
  preferAfternoons: false,
  preferEvenings: false,
  preferWeekends: true,
  weatherSensitive: false,
};

const defaultContext: ScoringContext = {
  proposedType: "coffee",
  currentWeekEventCount: new Map([["alice", 0], ["bob", 0]]),
  lastHangoutDays: new Map(),
};

describe("scoreSlot", () => {
  it("produces a score between 0 and 1", () => {
    const slot: OverlapSlot = {
      start: makeDate(0, 9, 0),
      end: makeDate(0, 11, 0),
      userIds: ["alice", "bob"],
    };
    const prefs = new Map<string, UserPrefs>([
      ["alice", defaultPrefs],
      ["bob", defaultPrefs],
    ]);

    const scored = scoreSlot(slot, prefs, [], defaultContext);
    expect(scored.score).toBeGreaterThan(0);
    expect(scored.score).toBeLessThanOrEqual(1);
  });

  it("scores higher for preferred time of day", () => {
    const morningSlot: OverlapSlot = {
      start: makeDate(0, 9, 0),
      end: makeDate(0, 11, 0),
      userIds: ["alice", "bob"],
    };
    const eveningSlot: OverlapSlot = {
      start: makeDate(0, 19, 0),
      end: makeDate(0, 21, 0),
      userIds: ["alice", "bob"],
    };

    const morningPrefs = new Map<string, UserPrefs>([
      ["alice", { ...defaultPrefs, preferMornings: true, preferEvenings: false }],
      ["bob", { ...defaultPrefs, preferMornings: true, preferEvenings: false }],
    ]);

    const morningScore = scoreSlot(morningSlot, morningPrefs, [], defaultContext);
    const eveningScore = scoreSlot(eveningSlot, morningPrefs, [], defaultContext);

    expect(morningScore.score).toBeGreaterThan(eveningScore.score);
  });

  it("scores higher for preferred event types", () => {
    const slot: OverlapSlot = {
      start: makeDate(0, 10, 0),
      end: makeDate(0, 12, 0),
      userIds: ["alice", "bob"],
    };

    const prefs = new Map<string, UserPrefs>([
      ["alice", { ...defaultPrefs, preferredTypes: ["coffee"] }],
      ["bob", { ...defaultPrefs, preferredTypes: ["coffee"] }],
    ]);

    const coffeeContext = { ...defaultContext, proposedType: "coffee" };
    const dinnerContext = { ...defaultContext, proposedType: "dinner" };

    const coffeeScore = scoreSlot(slot, prefs, [], coffeeContext);
    const dinnerScore = scoreSlot(slot, prefs, [], dinnerContext);

    expect(coffeeScore.score).toBeGreaterThan(dinnerScore.score);
  });

  it("includes score breakdown with all 7 factors", () => {
    const slot: OverlapSlot = {
      start: makeDate(0, 10, 0),
      end: makeDate(0, 12, 0),
      userIds: ["alice", "bob"],
    };
    const prefs = new Map<string, UserPrefs>([
      ["alice", defaultPrefs],
      ["bob", defaultPrefs],
    ]);

    const scored = scoreSlot(slot, prefs, [], defaultContext);

    expect(scored.scoreBreakdown).toHaveProperty("timePreference");
    expect(scored.scoreBreakdown).toHaveProperty("eventTypeFit");
    expect(scored.scoreBreakdown).toHaveProperty("locationConvenience");
    expect(scored.scoreBreakdown).toHaveProperty("priorityContact");
    expect(scored.scoreBreakdown).toHaveProperty("weatherSuitability");
    expect(scored.scoreBreakdown).toHaveProperty("recency");
    expect(scored.scoreBreakdown).toHaveProperty("capDistance");
  });

  it("scores higher for high-priority friends", () => {
    const slot: OverlapSlot = {
      start: makeDate(0, 10, 0),
      end: makeDate(0, 12, 0),
      userIds: ["alice", "bob"],
    };
    const prefs = new Map<string, UserPrefs>([
      ["alice", defaultPrefs],
      ["bob", defaultPrefs],
    ]);

    const highPriority = [{ userId: "alice", friendId: "bob", priority: 10 }];
    const lowPriority = [{ userId: "alice", friendId: "bob", priority: 1 }];

    const highScore = scoreSlot(slot, prefs, highPriority, defaultContext);
    const lowScore = scoreSlot(slot, prefs, lowPriority, defaultContext);

    expect(highScore.score).toBeGreaterThan(lowScore.score);
  });

  it("scores higher when users have more cap remaining", () => {
    const slot: OverlapSlot = {
      start: makeDate(0, 10, 0),
      end: makeDate(0, 12, 0),
      userIds: ["alice", "bob"],
    };
    const prefs = new Map<string, UserPrefs>([
      ["alice", { ...defaultPrefs, maxEventsPerWeek: 5 }],
      ["bob", { ...defaultPrefs, maxEventsPerWeek: 5 }],
    ]);

    const freshContext = {
      ...defaultContext,
      currentWeekEventCount: new Map([["alice", 0], ["bob", 0]]),
    };
    const nearCapContext = {
      ...defaultContext,
      currentWeekEventCount: new Map([["alice", 4], ["bob", 4]]),
    };

    const freshScore = scoreSlot(slot, prefs, [], freshContext);
    const nearCapScore = scoreSlot(slot, prefs, [], nearCapContext);

    expect(freshScore.score).toBeGreaterThan(nearCapScore.score);
  });
});

describe("rankSlots", () => {
  it("returns slots sorted by score descending", () => {
    const slots: OverlapSlot[] = [
      // Evening slot (low for morning-preferring users)
      { start: makeDate(0, 19, 0), end: makeDate(0, 21, 0), userIds: ["alice", "bob"] },
      // Morning slot (high for morning-preferring users)
      { start: makeDate(0, 9, 0), end: makeDate(0, 11, 0), userIds: ["alice", "bob"] },
      // Afternoon slot (medium)
      { start: makeDate(0, 13, 0), end: makeDate(0, 15, 0), userIds: ["alice", "bob"] },
    ];

    const prefs = new Map<string, UserPrefs>([
      ["alice", defaultPrefs],
      ["bob", defaultPrefs],
    ]);

    const ranked = rankSlots(slots, prefs, [], defaultContext);
    expect(ranked).toHaveLength(3);

    // Verify descending order
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i - 1].score).toBeGreaterThanOrEqual(ranked[i].score);
    }
  });
});
