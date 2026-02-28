import { describe, it, expect, beforeEach } from "vitest";
import { getCalendarService, resetCalendarService } from "@/lib/calendar/factory";
import { MockCalendarService } from "@/lib/calendar/mock";

describe("Calendar Factory", () => {
  beforeEach(() => {
    resetCalendarService();
    // Ensure mock mode for these tests
    process.env.CALENDAR_MODE = "mock";
  });

  it("returns MockCalendarService in mock mode", () => {
    const service = getCalendarService();
    expect(service).toBeInstanceOf(MockCalendarService);
  });

  it("returns the same singleton instance", () => {
    const a = getCalendarService();
    const b = getCalendarService();
    expect(a).toBe(b);
  });

  it("returns MockCalendarService for unknown modes", () => {
    process.env.CALENDAR_MODE = "unknown";
    const service = getCalendarService();
    expect(service).toBeInstanceOf(MockCalendarService);
  });

  it("resets singleton on resetCalendarService()", () => {
    const a = getCalendarService();
    resetCalendarService();
    const b = getCalendarService();
    expect(a).not.toBe(b);
  });
});
