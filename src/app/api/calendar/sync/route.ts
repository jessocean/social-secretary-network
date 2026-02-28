import { NextRequest, NextResponse } from "next/server";
import { getCalendarService } from "@/lib/calendar/factory";

export async function POST(request: NextRequest) {
  try {
    // Prefer session cookie; fall back to body for backward compatibility
    const userId =
      request.cookies.get("session_user_id")?.value ??
      ((await request.json().catch(() => ({}))) as { userId?: string }).userId;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId is required (cookie or body)" },
        { status: 400 }
      );
    }

    const calendarService = getCalendarService();
    const events = await calendarService.syncEvents(userId);

    return NextResponse.json({
      success: true,
      events: events.map((e) => ({
        id: e.id,
        title: e.title,
        startTime: e.startTime.toISOString(),
        endTime: e.endTime.toISOString(),
        isBusy: e.isBusy,
        isAllDay: e.isAllDay,
        source: e.source,
      })),
      count: events.length,
    });
  } catch (error) {
    console.error("Calendar sync error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to sync calendar",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
