import { v4 as uuid } from "uuid";
import { addDays, setHours, setMinutes, startOfWeek } from "date-fns";
import type { CalendarEvent, CalendarService } from "./types";

// In-memory event store keyed by userId
const eventStore = new Map<string, CalendarEvent[]>();

function generateMockEvents(userId: string): CalendarEvent[] {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const events: CalendarEvent[] = [];

  const makeEvent = (
    title: string,
    dayOffset: number,
    startHour: number,
    startMin: number,
    endHour: number,
    endMin: number
  ): CalendarEvent => ({
    id: uuid(),
    title,
    startTime: setMinutes(setHours(addDays(weekStart, dayOffset), startHour), startMin),
    endTime: setMinutes(setHours(addDays(weekStart, dayOffset), endHour), endMin),
    isBusy: true,
    isAllDay: false,
    source: "mock",
  });

  // Generate 12 realistic events spread across the week
  events.push(
    makeEvent("Morning yoga", 0, 7, 0, 8, 0),
    makeEvent("Team standup", 0, 9, 30, 10, 0),
    makeEvent("Dentist appointment", 1, 10, 0, 11, 0),
    makeEvent("Lunch with coworker", 1, 12, 0, 13, 0),
    makeEvent("Kids swim class", 2, 15, 30, 16, 30),
    makeEvent("Grocery shopping", 2, 17, 0, 18, 0),
    makeEvent("Date night", 3, 19, 0, 21, 0),
    makeEvent("Work presentation", 4, 14, 0, 15, 30),
    makeEvent("Family brunch", 5, 10, 0, 12, 0),
    makeEvent("Playground time", 5, 14, 0, 16, 0),
    makeEvent("Soccer game", 6, 9, 0, 10, 30),
    makeEvent("Meal prep", 6, 16, 0, 17, 30)
  );

  return events;
}

// Persona-specific event generators
export const MOCK_PERSONAS = {
  alice: (userId: string): CalendarEvent[] => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const make = (
      t: string,
      d: number,
      sh: number,
      sm: number,
      eh: number,
      em: number
    ): CalendarEvent => ({
      id: uuid(),
      title: t,
      startTime: setMinutes(setHours(addDays(weekStart, d), sh), sm),
      endTime: setMinutes(setHours(addDays(weekStart, d), eh), em),
      isBusy: true,
      isAllDay: false,
      source: "mock",
    });

    return [
      make("Kids school dropoff", 0, 8, 0, 8, 30),
      make("Pediatrician visit", 0, 10, 0, 11, 0),
      make("Baby nap time", 0, 12, 30, 14, 30),
      make("Music class (toddler)", 1, 9, 30, 10, 30),
      make("Baby nap time", 1, 12, 30, 14, 30),
      make("Grocery run", 1, 15, 0, 16, 0),
      make("Kids school dropoff", 2, 8, 0, 8, 30),
      make("Baby nap time", 2, 12, 30, 14, 30),
      make("Swimming lessons", 2, 15, 30, 16, 30),
      make("Kids school dropoff", 3, 8, 0, 8, 30),
      make("Baby nap time", 3, 12, 30, 14, 30),
      make("Play kitchen class", 3, 10, 0, 11, 30),
      make("Family dinner prep", 4, 16, 30, 18, 0),
      make("Saturday farmers market", 5, 8, 30, 10, 0),
      make("Playground meetup", 5, 10, 30, 12, 0),
    ];
  },

  bob: (userId: string): CalendarEvent[] => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const make = (
      t: string,
      d: number,
      sh: number,
      sm: number,
      eh: number,
      em: number
    ): CalendarEvent => ({
      id: uuid(),
      title: t,
      startTime: setMinutes(setHours(addDays(weekStart, d), sh), sm),
      endTime: setMinutes(setHours(addDays(weekStart, d), eh), em),
      isBusy: true,
      isAllDay: false,
      source: "mock",
    });

    return [
      make("Morning coffee ritual", 0, 7, 0, 7, 45),
      make("Freelance client call", 0, 10, 0, 11, 0),
      make("Coworking space", 1, 9, 0, 17, 0),
      make("Coffee tasting event", 1, 18, 0, 19, 30),
      make("Freelance client call", 2, 14, 0, 15, 0),
      make("Gym", 2, 17, 0, 18, 30),
      make("Podcast recording", 3, 10, 0, 12, 0),
      make("Lunch meetup downtown", 3, 12, 30, 13, 30),
      make("Freelance deadline", 4, 9, 0, 17, 0),
      make("Weekend hike", 5, 7, 0, 11, 0),
      make("Board game night", 5, 19, 0, 22, 0),
      make("Brunch at Blue Bottle", 6, 10, 0, 11, 30),
    ];
  },

  carol: (userId: string): CalendarEvent[] => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const make = (
      t: string,
      d: number,
      sh: number,
      sm: number,
      eh: number,
      em: number
    ): CalendarEvent => ({
      id: uuid(),
      title: t,
      startTime: setMinutes(setHours(addDays(weekStart, d), sh), sm),
      endTime: setMinutes(setHours(addDays(weekStart, d), eh), em),
      isBusy: true,
      isAllDay: false,
      source: "mock",
    });

    return [
      make("Morning commute", 0, 8, 0, 9, 0),
      make("Work", 0, 9, 0, 17, 0),
      make("Evening commute", 0, 17, 0, 18, 0),
      make("Work", 1, 9, 0, 17, 0),
      make("After-work drinks", 1, 18, 0, 19, 30),
      make("Work", 2, 9, 0, 17, 0),
      make("Pilates class", 2, 18, 30, 19, 30),
      make("Work", 3, 9, 0, 17, 0),
      make("Work", 4, 9, 0, 17, 0),
      make("Date night", 4, 19, 0, 21, 30),
      make("Sleep in + errands", 5, 10, 0, 12, 0),
      make("Weekend brunch", 5, 12, 30, 14, 0),
      make("Sunday meal prep", 6, 15, 0, 17, 0),
    ];
  },

  dave: (userId: string): CalendarEvent[] => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const make = (
      t: string,
      d: number,
      sh: number,
      sm: number,
      eh: number,
      em: number
    ): CalendarEvent => ({
      id: uuid(),
      title: t,
      startTime: setMinutes(setHours(addDays(weekStart, d), sh), sm),
      endTime: setMinutes(setHours(addDays(weekStart, d), eh), em),
      isBusy: true,
      isAllDay: false,
      source: "mock",
    });

    return [
      make("Work (remote)", 0, 9, 0, 17, 30),
      make("Work (remote)", 1, 9, 0, 17, 30),
      make("Work (office)", 2, 8, 30, 18, 0),
      make("Work (remote)", 3, 9, 0, 17, 30),
      make("Work (office)", 4, 8, 30, 18, 0),
      make("Soccer league", 5, 8, 0, 10, 0),
      make("Kids birthday party", 5, 14, 0, 16, 0),
      make("Family outing", 6, 10, 0, 15, 0),
    ];
  },
};

export class MockCalendarService implements CalendarService {
  async getEvents(
    userId: string,
    start: Date,
    end: Date
  ): Promise<CalendarEvent[]> {
    const events = eventStore.get(userId) || [];
    return events.filter(
      (e) => e.startTime >= start && e.endTime <= end
    );
  }

  async createEvent(
    userId: string,
    event: Omit<CalendarEvent, "id" | "source">
  ): Promise<CalendarEvent> {
    const newEvent: CalendarEvent = {
      ...event,
      id: uuid(),
      source: "mock",
    };
    const events = eventStore.get(userId) || [];
    events.push(newEvent);
    eventStore.set(userId, events);
    return newEvent;
  }

  async deleteEvent(userId: string, eventId: string): Promise<void> {
    const events = eventStore.get(userId) || [];
    eventStore.set(
      userId,
      events.filter((e) => e.id !== eventId)
    );
  }

  async syncEvents(userId: string): Promise<CalendarEvent[]> {
    // For mock, just regenerate default events if none exist
    if (!eventStore.has(userId)) {
      const events = generateMockEvents(userId);
      eventStore.set(userId, events);
    }
    return eventStore.get(userId)!;
  }

  /** Load persona-specific events for a user */
  loadPersona(userId: string, persona: keyof typeof MOCK_PERSONAS) {
    const events = MOCK_PERSONAS[persona](userId);
    eventStore.set(userId, events);
  }

  /** Get all events in store (for testing) */
  getAllEvents(userId: string): CalendarEvent[] {
    return eventStore.get(userId) || [];
  }

  /** Clear all events (for testing) */
  clear() {
    eventStore.clear();
  }
}
