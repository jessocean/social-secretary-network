import type { CalendarService } from "./types";
import { MockCalendarService } from "./mock";

export type CalendarMode = "mock" | "sandbox" | "production";

let instance: CalendarService | null = null;

export function getCalendarService(): CalendarService {
  if (instance) return instance;

  const mode = (process.env.CALENDAR_MODE || "mock") as CalendarMode;

  switch (mode) {
    case "mock":
      instance = new MockCalendarService();
      break;
    case "sandbox":
      // TODO: implement GoogleSandboxCalendarService
      console.warn("Sandbox calendar not yet implemented, falling back to mock");
      instance = new MockCalendarService();
      break;
    case "production":
      // TODO: implement GoogleProductionCalendarService
      console.warn("Production calendar not yet implemented, falling back to mock");
      instance = new MockCalendarService();
      break;
    default:
      instance = new MockCalendarService();
  }

  return instance;
}

/** Reset singleton (for testing) */
export function resetCalendarService() {
  instance = null;
}
