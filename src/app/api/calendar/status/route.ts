import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { googleCalendarConnections } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const userId = request.cookies.get("session_user_id")?.value;
  if (!userId) {
    return NextResponse.json(
      { connected: false, error: "Not authenticated" },
      { status: 401 }
    );
  }

  try {
    const rows = await db
      .select()
      .from(googleCalendarConnections)
      .where(eq(googleCalendarConnections.userId, userId));

    if (rows.length === 0) {
      return NextResponse.json({ connected: false });
    }

    const connection = rows[0];
    return NextResponse.json({
      connected: true,
      calendarId: connection.calendarId,
      lastSyncAt: connection.lastSyncAt?.toISOString() ?? null,
    });
  } catch (error) {
    console.error("Calendar status error:", error);
    return NextResponse.json(
      { connected: false, error: "Failed to check calendar status" },
      { status: 500 }
    );
  }
}
