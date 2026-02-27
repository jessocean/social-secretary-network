import { NextRequest, NextResponse } from "next/server";
import { runNegotiation } from "@/lib/services/negotiation-service";
import { negotiate } from "@/lib/agent/negotiator";
import { computeWeekAvailability } from "@/lib/agent/scheduler";
import { getCalendarService } from "@/lib/calendar/factory";
import { MockCalendarService } from "@/lib/calendar/mock";
import type {
  NegotiationParams,
  UserAvailability,
  UserPrefs,
  Constraint,
} from "@/lib/agent/types";
import { startOfWeek, addDays } from "date-fns";

// ---------------------------------------------------------------------------
// Mock fallback data (used when DB is unavailable)
// ---------------------------------------------------------------------------

const MOCK_USERS = [
  { id: "user-jessica", name: "Jessica", persona: "alice" as const },
  { id: "user-sarah", name: "Sarah", persona: "bob" as const },
  { id: "user-emma", name: "Emma", persona: "carol" as const },
  { id: "user-rachel", name: "Rachel", persona: "dave" as const },
];

const MOCK_PREFS: Record<string, UserPrefs> = {
  "user-jessica": {
    maxEventsPerWeek: 5,
    preferredTypes: ["coffee", "playground", "playdate_home"],
    bufferMinutes: 30,
    preferMornings: true,
    preferAfternoons: true,
    preferEvenings: false,
    preferWeekends: true,
    weatherSensitive: true,
  },
  "user-sarah": {
    maxEventsPerWeek: 3,
    preferredTypes: ["coffee", "walk"],
    bufferMinutes: 15,
    preferMornings: false,
    preferAfternoons: true,
    preferEvenings: true,
    preferWeekends: true,
    weatherSensitive: false,
  },
  "user-emma": {
    maxEventsPerWeek: 4,
    preferredTypes: ["playground", "park", "dinner"],
    bufferMinutes: 30,
    preferMornings: false,
    preferAfternoons: true,
    preferEvenings: true,
    preferWeekends: true,
    weatherSensitive: true,
  },
  "user-rachel": {
    maxEventsPerWeek: 3,
    preferredTypes: ["dinner", "coffee", "walk"],
    bufferMinutes: 20,
    preferMornings: false,
    preferAfternoons: false,
    preferEvenings: true,
    preferWeekends: true,
    weatherSensitive: false,
  },
};

const MOCK_CONSTRAINTS: Record<string, Constraint[]> = {
  "user-jessica": [
    {
      type: "nap",
      days: ["mon", "tue", "wed", "thu", "fri"],
      startTime: "12:30",
      endTime: "14:30",
    },
  ],
  "user-sarah": [],
  "user-emma": [
    {
      type: "work",
      days: ["mon", "tue", "wed", "thu", "fri"],
      startTime: "09:00",
      endTime: "17:00",
    },
  ],
  "user-rachel": [
    {
      type: "work",
      days: ["mon", "tue", "wed", "thu", "fri"],
      startTime: "09:00",
      endTime: "17:30",
    },
  ],
};

const MOCK_FRIENDSHIPS = [
  { userId: "user-jessica", friendId: "user-sarah", priority: 9 },
  { userId: "user-jessica", friendId: "user-emma", priority: 8 },
  { userId: "user-jessica", friendId: "user-rachel", priority: 7 },
  { userId: "user-sarah", friendId: "user-emma", priority: 5 },
];

const MOCK_LOCATIONS = [
  {
    userId: "user-jessica",
    locationName: "Blue Bottle Coffee",
    locationId: "loc-1",
    travelMinutes: 10,
  },
  {
    userId: "user-jessica",
    locationName: "Central Park Playground",
    locationId: "loc-2",
    travelMinutes: 15,
  },
  {
    userId: "user-jessica",
    locationName: "Home",
    locationId: "loc-3",
    travelMinutes: 0,
  },
  {
    userId: "user-emma",
    locationName: "Lucia's Kitchen",
    locationId: "loc-4",
    travelMinutes: 20,
  },
];

// ---------------------------------------------------------------------------
// Mock fallback negotiation (no DB required)
// ---------------------------------------------------------------------------

async function negotiateWithMockData(weekStartDate: Date, weekEndDate: Date) {
  const calendarService = getCalendarService();
  const mockService = calendarService as MockCalendarService;

  for (const user of MOCK_USERS) {
    if (typeof mockService.loadPersona === "function") {
      mockService.loadPersona(user.id, user.persona);
    }
  }

  const userAvailabilities: UserAvailability[] = [];

  for (const user of MOCK_USERS) {
    const events = await calendarService.getEvents(
      user.id,
      weekStartDate,
      weekEndDate
    );
    const constraints = MOCK_CONSTRAINTS[user.id] ?? [];
    const prefs = MOCK_PREFS[user.id];
    const bufferMinutes = prefs?.bufferMinutes ?? 30;

    const freeSlots = computeWeekAvailability(
      events,
      constraints,
      weekStartDate,
      bufferMinutes
    );

    for (const slot of freeSlots) {
      slot.userId = user.id;
    }

    userAvailabilities.push({
      userId: user.id,
      freeSlots,
      constraints,
    });
  }

  const preferencesMap = new Map<string, UserPrefs>();
  for (const [userId, prefs] of Object.entries(MOCK_PREFS)) {
    preferencesMap.set(userId, prefs);
  }

  const params: NegotiationParams = {
    users: userAvailabilities,
    preferences: preferencesMap,
    friendships: MOCK_FRIENDSHIPS,
    locations: MOCK_LOCATIONS,
    weekStart: weekStartDate,
    engagementTypes: [
      "coffee",
      "playground",
      "playdate_home",
      "dinner",
      "park",
      "walk",
    ],
  };

  return negotiate(params);
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const weekStartStr = body.weekStart as string | undefined;

    const weekStartDate = weekStartStr
      ? startOfWeek(new Date(weekStartStr), { weekStartsOn: 1 })
      : startOfWeek(new Date(), { weekStartsOn: 1 });

    const weekEndDate = addDays(weekStartDate, 7);

    // Try DB-backed negotiation first, fall back to mock data
    let result;
    let negotiationId: string | undefined;
    let source: "db" | "mock";

    try {
      const dbResult = await runNegotiation(weekStartDate, weekEndDate);
      result = dbResult.result;
      negotiationId = dbResult.negotiationId;
      source = "db";
    } catch {
      result = await negotiateWithMockData(weekStartDate, weekEndDate);
      source = "mock";
    }

    return NextResponse.json({
      success: true,
      source,
      negotiationId,
      proposals: result.proposals.map((p) => ({
        type: p.type,
        title: p.title,
        locationName: p.locationName,
        locationId: p.locationId,
        participants: p.participants,
        startTime: p.slot.start.toISOString(),
        endTime: p.slot.end.toISOString(),
        score: p.slot.score,
        scoreBreakdown: p.slot.scoreBreakdown,
      })),
      log: result.log,
      weekStart: weekStartDate.toISOString(),
    });
  } catch (error) {
    console.error("Negotiation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to run negotiation engine",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
