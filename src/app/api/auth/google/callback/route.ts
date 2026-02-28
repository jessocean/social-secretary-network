import { NextRequest, NextResponse } from "next/server";
import { exchangeCode } from "@/lib/google/oauth";
import { db } from "@/lib/db/client";
import { googleCalendarConnections, calendarEvents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { GoogleCalendarService } from "@/lib/calendar/google";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const stateParam = request.nextUrl.searchParams.get("state");
  const storedNonce = request.cookies.get("google_oauth_state")?.value;
  const userId = request.cookies.get("session_user_id")?.value;

  if (!userId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!code || !stateParam || !storedNonce) {
    return NextResponse.redirect(
      new URL("/onboarding?gcal=error&reason=missing_params", request.url)
    );
  }

  // Validate CSRF nonce
  let state: { returnTo: string; nonce: string };
  try {
    state = JSON.parse(stateParam);
  } catch {
    return NextResponse.redirect(
      new URL("/onboarding?gcal=error&reason=invalid_state", request.url)
    );
  }

  if (state.nonce !== storedNonce) {
    return NextResponse.redirect(
      new URL("/onboarding?gcal=error&reason=csrf_mismatch", request.url)
    );
  }

  // Exchange code for tokens
  let tokens;
  try {
    tokens = await exchangeCode(code);
  } catch (err) {
    console.error("Google token exchange failed:", err);
    return NextResponse.redirect(
      new URL(`${state.returnTo}?gcal=error&reason=token_exchange`, request.url)
    );
  }

  // Upsert calendar connection
  const existing = await db
    .select()
    .from(googleCalendarConnections)
    .where(eq(googleCalendarConnections.userId, userId));

  const connectionData = {
    accessToken: tokens.access_token ?? null,
    refreshToken: tokens.refresh_token ?? null,
    tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    calendarId: "primary",
    lastSyncAt: new Date(),
  };

  if (existing.length > 0) {
    await db
      .update(googleCalendarConnections)
      .set(connectionData)
      .where(eq(googleCalendarConnections.userId, userId));
  } else {
    await db.insert(googleCalendarConnections).values({
      userId,
      ...connectionData,
    });
  }

  // Do an initial sync of this week's events
  try {
    if (tokens.access_token) {
      const googleService = new GoogleCalendarService();
      await googleService.syncEvents(userId);
    }
  } catch (err) {
    console.error("Initial calendar sync failed (non-fatal):", err);
  }

  // Clear the CSRF cookie and redirect
  const returnTo = state.returnTo || "/onboarding";
  const response = NextResponse.redirect(
    new URL(`${returnTo}?gcal=connected`, request.url)
  );
  response.cookies.delete("google_oauth_state");

  return response;
}
