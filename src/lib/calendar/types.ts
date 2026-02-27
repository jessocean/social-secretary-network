export interface CalendarEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  isBusy: boolean;
  isAllDay: boolean;
  source: "mock" | "google" | "manual";
}

export interface TimeSlot {
  start: Date;
  end: Date;
}

export interface CalendarService {
  /** Get events for a user within a date range */
  getEvents(
    userId: string,
    start: Date,
    end: Date
  ): Promise<CalendarEvent[]>;

  /** Create an event on the user's calendar */
  createEvent(
    userId: string,
    event: Omit<CalendarEvent, "id" | "source">
  ): Promise<CalendarEvent>;

  /** Delete an event from the user's calendar */
  deleteEvent(userId: string, eventId: string): Promise<void>;

  /** Sync events from external source (no-op for mock) */
  syncEvents(userId: string): Promise<CalendarEvent[]>;
}
