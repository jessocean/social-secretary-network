import { v4 as uuid } from "uuid";
import { startOfWeek, endOfWeek } from "date-fns";
import { db } from "@/lib/db/client";
import { googleCalendarConnections, calendarEvents } from "@/lib/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import {
  getCalendarClient,
  refreshAccessToken,
} from "@/lib/google/oauth";
import type { CalendarEvent, CalendarService } from "./types";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Get a valid access token for a user, refreshing if expired */
async function getValidToken(userId: string): Promise<{
  accessToken: string;
  connectionId: string;
} | null> {
  // Skip DB query if userId isn't a valid UUID
  if (!UUID_REGEX.test(userId)) return null;

  const rows = await db
    .select()
    .from(googleCalendarConnections)
    .where(eq(googleCalendarConnections.userId, userId));

  if (rows.length === 0 || !rows[0].refreshToken) return null;

  const connection = rows[0];
  const now = new Date();
  const isExpired =
    !connection.tokenExpiry || connection.tokenExpiry <= now;

  if (isExpired) {
    try {
      const refreshed = await refreshAccessToken(connection.refreshToken!);
      const newAccessToken = refreshed.access_token ?? connection.accessToken;
      const newExpiry = refreshed.expiry_date
        ? new Date(refreshed.expiry_date)
        : null;

      await db
        .update(googleCalendarConnections)
        .set({
          accessToken: newAccessToken,
          tokenExpiry: newExpiry,
        })
        .where(eq(googleCalendarConnections.id, connection.id));

      return newAccessToken
        ? { accessToken: newAccessToken, connectionId: connection.id }
        : null;
    } catch (err) {
      console.error("Failed to refresh Google token:", err);
      return null;
    }
  }

  return connection.accessToken
    ? { accessToken: connection.accessToken, connectionId: connection.id }
    : null;
}

/** Map a Google Calendar event to our CalendarEvent type */
function mapGoogleEvent(
  gEvent: {
    id?: string | null;
    summary?: string | null;
    start?: { dateTime?: string | null; date?: string | null } | null;
    end?: { dateTime?: string | null; date?: string | null } | null;
    transparency?: string | null;
  }
): CalendarEvent | null {
  const startStr = gEvent.start?.dateTime || gEvent.start?.date;
  const endStr = gEvent.end?.dateTime || gEvent.end?.date;
  if (!startStr || !endStr) return null;

  const isAllDay = !gEvent.start?.dateTime;

  return {
    id: uuid(),
    title: gEvent.summary || "(No title)",
    startTime: new Date(startStr),
    endTime: new Date(endStr),
    isBusy: gEvent.transparency !== "transparent",
    isAllDay,
    source: "google",
  };
}

export class GoogleCalendarService implements CalendarService {
  async getEvents(
    userId: string,
    start: Date,
    end: Date
  ): Promise<CalendarEvent[]> {
    // Try fetching live from Google first
    const token = await getValidToken(userId);
    if (token) {
      try {
        const calendar = getCalendarClient(token.accessToken);
        const response = await calendar.events.list({
          calendarId: "primary",
          timeMin: start.toISOString(),
          timeMax: end.toISOString(),
          singleEvents: true,
          orderBy: "startTime",
          maxResults: 250,
        });

        const events: CalendarEvent[] = [];
        for (const item of response.data.items || []) {
          const mapped = mapGoogleEvent(item);
          if (mapped) events.push(mapped);
        }
        return events;
      } catch (err) {
        console.error("Google Calendar API error, falling back to DB:", err);
      }
    }

    // Fall back to locally cached events
    const rows = await db
      .select()
      .from(calendarEvents)
      .where(
        and(
          eq(calendarEvents.userId, userId),
          lte(calendarEvents.startTime, end),
          gte(calendarEvents.endTime, start)
        )
      );

    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      startTime: r.startTime,
      endTime: r.endTime,
      isBusy: r.isBusy,
      isAllDay: r.isAllDay,
      source: r.source as CalendarEvent["source"],
    }));
  }

  async createEvent(
    userId: string,
    event: Omit<CalendarEvent, "id" | "source">
  ): Promise<CalendarEvent> {
    if (process.env.CALENDAR_WRITE_ENABLED !== "true") {
      console.warn(
        "Calendar writes disabled (CALENDAR_WRITE_ENABLED != true). Returning mock event."
      );
      return { ...event, id: uuid(), source: "google" };
    }

    const token = await getValidToken(userId);
    if (!token) {
      throw new Error("No valid Google Calendar connection for user");
    }

    const calendar = getCalendarClient(token.accessToken);
    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: event.title,
        start: {
          dateTime: event.startTime.toISOString(),
        },
        end: {
          dateTime: event.endTime.toISOString(),
        },
      },
    });

    const newEvent: CalendarEvent = {
      id: response.data.id || uuid(),
      title: event.title,
      startTime: event.startTime,
      endTime: event.endTime,
      isBusy: event.isBusy,
      isAllDay: event.isAllDay,
      source: "google",
    };

    // Also persist locally
    await db.insert(calendarEvents).values({
      userId,
      googleEventId: response.data.id,
      title: newEvent.title,
      startTime: newEvent.startTime,
      endTime: newEvent.endTime,
      isBusy: newEvent.isBusy,
      isAllDay: newEvent.isAllDay,
      source: "google",
    });

    return newEvent;
  }

  async deleteEvent(userId: string, eventId: string): Promise<void> {
    if (process.env.CALENDAR_WRITE_ENABLED !== "true") {
      console.warn(
        "Calendar writes disabled (CALENDAR_WRITE_ENABLED != true). Skipping delete."
      );
      return;
    }

    const token = await getValidToken(userId);
    if (!token) {
      throw new Error("No valid Google Calendar connection for user");
    }

    const calendar = getCalendarClient(token.accessToken);
    await calendar.events.delete({
      calendarId: "primary",
      eventId,
    });

    // Remove local cache too
    await db
      .delete(calendarEvents)
      .where(
        and(
          eq(calendarEvents.userId, userId),
          eq(calendarEvents.googleEventId, eventId)
        )
      );
  }

  async syncEvents(userId: string): Promise<CalendarEvent[]> {
    const token = await getValidToken(userId);
    if (!token) {
      // No token — return whatever we have cached
      const rows = await db
        .select()
        .from(calendarEvents)
        .where(eq(calendarEvents.userId, userId));

      return rows.map((r) => ({
        id: r.id,
        title: r.title,
        startTime: r.startTime,
        endTime: r.endTime,
        isBusy: r.isBusy,
        isAllDay: r.isAllDay,
        source: r.source as CalendarEvent["source"],
      }));
    }

    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    const calendar = getCalendarClient(token.accessToken);
    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: weekStart.toISOString(),
      timeMax: weekEnd.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 250,
    });

    const googleEvents = (response.data.items || [])
      .map(mapGoogleEvent)
      .filter((e): e is CalendarEvent => e !== null);

    // Delete existing Google-sourced events for this user in this week range
    // then insert fresh ones
    const existingRows = await db
      .select()
      .from(calendarEvents)
      .where(
        and(
          eq(calendarEvents.userId, userId),
          eq(calendarEvents.source, "google"),
          gte(calendarEvents.startTime, weekStart),
          lte(calendarEvents.endTime, weekEnd)
        )
      );

    if (existingRows.length > 0) {
      for (const row of existingRows) {
        await db
          .delete(calendarEvents)
          .where(eq(calendarEvents.id, row.id));
      }
    }

    // Insert synced events
    for (const event of googleEvents) {
      await db.insert(calendarEvents).values({
        userId,
        googleEventId: event.id,
        title: event.title,
        startTime: event.startTime,
        endTime: event.endTime,
        isBusy: event.isBusy,
        isAllDay: event.isAllDay,
        source: "google",
      });
    }

    // Update last sync timestamp
    await db
      .update(googleCalendarConnections)
      .set({ lastSyncAt: new Date() })
      .where(eq(googleCalendarConnections.userId, userId));

    return googleEvents;
  }
}
