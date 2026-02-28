import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { googleCalendarConnections, calendarEvents } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function DELETE(request: NextRequest) {
  const userId = request.cookies.get("session_user_id")?.value;
  if (!userId) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  try {
    // Delete Google-sourced calendar events
    await db
      .delete(calendarEvents)
      .where(
        and(
          eq(calendarEvents.userId, userId),
          eq(calendarEvents.source, "google")
        )
      );

    // Delete the connection record
    await db
      .delete(googleCalendarConnections)
      .where(eq(googleCalendarConnections.userId, userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Calendar disconnect error:", error);
    return NextResponse.json(
      { error: "Failed to disconnect calendar" },
      { status: 500 }
    );
  }
}
