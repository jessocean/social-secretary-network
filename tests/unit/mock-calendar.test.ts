import { describe, it, expect, beforeEach } from "vitest";
import { MockCalendarService } from "@/lib/calendar/mock";
import { addDays, startOfWeek, endOfWeek } from "date-fns";

describe("MockCalendarService", () => {
  let service: MockCalendarService;

  beforeEach(() => {
    service = new MockCalendarService();
    service.clear();
  });

  it("generates default events on first sync", async () => {
    const events = await service.syncEvents("user-1");
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].source).toBe("mock");
  });

  it("returns events within date range", async () => {
    await service.syncEvents("user-1");
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    const events = await service.getEvents("user-1", weekStart, weekEnd);
    for (const e of events) {
      expect(e.startTime.getTime()).toBeGreaterThanOrEqual(weekStart.getTime());
      expect(e.endTime.getTime()).toBeLessThanOrEqual(weekEnd.getTime());
    }
  });

  it("creates new events", async () => {
    const event = await service.createEvent("user-1", {
      title: "Test Event",
      startTime: new Date(),
      endTime: addDays(new Date(), 1),
      isBusy: true,
      isAllDay: false,
    });

    expect(event.id).toBeDefined();
    expect(event.title).toBe("Test Event");
    expect(event.source).toBe("mock");
  });

  it("deletes events", async () => {
    const event = await service.createEvent("user-1", {
      title: "To Delete",
      startTime: new Date(),
      endTime: addDays(new Date(), 1),
      isBusy: true,
      isAllDay: false,
    });

    await service.deleteEvent("user-1", event.id);
    const all = service.getAllEvents("user-1");
    expect(all.find((e) => e.id === event.id)).toBeUndefined();
  });

  it("loads persona-specific events", () => {
    service.loadPersona("alice-id", "alice");
    const events = service.getAllEvents("alice-id");
    expect(events.length).toBeGreaterThan(10);
    // Alice has nap times and school dropoffs
    expect(events.some((e) => e.title.includes("nap") || e.title.includes("Nap"))).toBe(true);
  });

  it("isolates events between users", async () => {
    await service.createEvent("user-a", {
      title: "User A Event",
      startTime: new Date(),
      endTime: addDays(new Date(), 1),
      isBusy: true,
      isAllDay: false,
    });

    const userBEvents = service.getAllEvents("user-b");
    expect(userBEvents).toHaveLength(0);
  });
});
