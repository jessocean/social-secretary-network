import { NextRequest, NextResponse } from "next/server";
import { getCalendarService } from "@/lib/calendar/factory";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const userId = body.userId as string | undefined;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId is required" },
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
