import type { CalendarService } from "./types";
import { MockCalendarService } from "./mock";
import { GoogleCalendarService } from "./google";

export type CalendarMode = "mock" | "google";

let instance: CalendarService | null = null;

export function getCalendarService(): CalendarService {
  if (instance) return instance;

  const mode = (process.env.CALENDAR_MODE || "mock") as CalendarMode;

  switch (mode) {
    case "google":
      instance = new GoogleCalendarService();
      break;
    case "mock":
    default:
      instance = new MockCalendarService();
  }

  return instance;
}

/** Reset singleton (for testing) */
export function resetCalendarService() {
  instance = null;
}
