import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock DB client — vi.mock is hoisted, so inline everything
vi.mock("@/lib/db/client", () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    }),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    }),
  },
}));

// Mock the oauth module — all inline, no external refs
vi.mock("@/lib/google/oauth", () => ({
  getCalendarClient: vi.fn().mockReturnValue({
    events: {
      list: vi.fn(),
      insert: vi.fn(),
      delete: vi.fn(),
    },
  }),
  refreshAccessToken: vi.fn().mockResolvedValue({
    access_token: "refreshed-token",
    expiry_date: Date.now() + 3600000,
  }),
}));

import { GoogleCalendarService } from "@/lib/calendar/google";
import { db } from "@/lib/db/client";

describe("GoogleCalendarService", () => {
  let service: GoogleCalendarService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new GoogleCalendarService();
  });

  describe("getEvents", () => {
    it("falls back to DB when no token is available", async () => {
      const mockRows = [
        {
          id: "evt-1",
          title: "Test Event",
          startTime: new Date("2025-01-06T10:00:00Z"),
          endTime: new Date("2025-01-06T11:00:00Z"),
          isBusy: true,
          isAllDay: false,
          source: "google",
        },
      ];

      // No connection found → falls back to DB
      const mockWhere = vi.fn().mockResolvedValue([]);
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (db.select as ReturnType<typeof vi.fn>).mockReturnValueOnce({ from: mockFrom });

      // Second select for DB fallback
      const mockWhere2 = vi.fn().mockResolvedValue(mockRows);
      const mockFrom2 = vi.fn().mockReturnValue({ where: mockWhere2 });
      (db.select as ReturnType<typeof vi.fn>).mockReturnValueOnce({ from: mockFrom2 });

      const events = await service.getEvents(
        "user-1",
        new Date("2025-01-06"),
        new Date("2025-01-12")
      );

      expect(events).toHaveLength(1);
      expect(events[0].title).toBe("Test Event");
      expect(events[0].source).toBe("google");
    });
  });

  describe("createEvent", () => {
    it("returns mock event when writes are disabled", async () => {
      delete process.env.CALENDAR_WRITE_ENABLED;

      const event = await service.createEvent("user-1", {
        title: "Coffee with Alice",
        startTime: new Date("2025-01-06T10:00:00Z"),
        endTime: new Date("2025-01-06T11:00:00Z"),
        isBusy: true,
        isAllDay: false,
      });

      expect(event.title).toBe("Coffee with Alice");
      expect(event.source).toBe("google");
      expect(event.id).toBeDefined();
    });
  });

  describe("deleteEvent", () => {
    it("skips delete when writes are disabled", async () => {
      delete process.env.CALENDAR_WRITE_ENABLED;

      // Should not throw
      await service.deleteEvent("user-1", "event-123");
    });
  });

  describe("syncEvents", () => {
    it("returns cached events when no token is available", async () => {
      const mockRows = [
        {
          id: "evt-1",
          title: "Cached Event",
          startTime: new Date("2025-01-06T10:00:00Z"),
          endTime: new Date("2025-01-06T11:00:00Z"),
          isBusy: true,
          isAllDay: false,
          source: "google",
        },
      ];

      // No connection found
      const mockWhere = vi.fn().mockResolvedValue([]);
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (db.select as ReturnType<typeof vi.fn>).mockReturnValueOnce({ from: mockFrom });

      // Cached events
      const mockWhere2 = vi.fn().mockResolvedValue(mockRows);
      const mockFrom2 = vi.fn().mockReturnValue({ where: mockWhere2 });
      (db.select as ReturnType<typeof vi.fn>).mockReturnValueOnce({ from: mockFrom2 });

      const events = await service.syncEvents("user-1");

      expect(events).toHaveLength(1);
      expect(events[0].title).toBe("Cached Event");
    });
  });
});
