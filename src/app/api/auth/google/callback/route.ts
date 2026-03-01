import { NextRequest, NextResponse } from "next/server";
import { exchangeCode, getUserInfo } from "@/lib/google/oauth";
import { db } from "@/lib/db/client";
import { users, googleCalendarConnections } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { GoogleCalendarService } from "@/lib/calendar/google";
import { claimInvite } from "@/lib/auth/invite-utils";

interface OAuthState {
  nonce: string;
  inviteCode?: string;
  inviteType?: string;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const stateParam = request.nextUrl.searchParams.get("state");
  const errorParam = request.nextUrl.searchParams.get("error");
  const storedNonce = request.cookies.get("google_oauth_state")?.value;

  // Handle Google OAuth error (user denied consent, etc.)
  if (errorParam) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorParam)}`, request.url)
    );
  }

  if (!code || !stateParam || !storedNonce) {
    return NextResponse.redirect(
      new URL("/login?error=missing_params", request.url)
    );
  }

  // Validate CSRF nonce
  let state: OAuthState;
  try {
    state = JSON.parse(stateParam);
  } catch {
    return NextResponse.redirect(
      new URL("/login?error=invalid_state", request.url)
    );
  }

  if (state.nonce !== storedNonce) {
    return NextResponse.redirect(
      new URL("/login?error=csrf_mismatch", request.url)
    );
  }

  // Exchange code for tokens
  let tokens;
  try {
    tokens = await exchangeCode(code);
  } catch (err) {
    console.error("Google token exchange failed:", err);
    return NextResponse.redirect(
      new URL("/login?error=token_exchange", request.url)
    );
  }

  // Get user profile from Google
  let profile;
  try {
    if (!tokens.access_token) throw new Error("No access token");
    profile = await getUserInfo(tokens.access_token);
  } catch (err) {
    console.error("Failed to get Google user info:", err);
    return NextResponse.redirect(
      new URL("/login?error=profile_fetch", request.url)
    );
  }

  // Find or create user by email
  let user;
  try {
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, profile.email))
      .limit(1);

    if (existing) {
      user = existing;
      // Update avatar if not set
      if (!existing.avatarUrl && profile.picture) {
        await db
          .update(users)
          .set({ avatarUrl: profile.picture, updatedAt: new Date() })
          .where(eq(users.id, existing.id));
      }
    } else {
      // Create new user
      const [inserted] = await db
        .insert(users)
        .values({
          email: profile.email,
          displayName: profile.name,
          avatarUrl: profile.picture,
        })
        .returning();
      user = inserted;
    }
  } catch (err) {
    console.error("Failed to find/create user:", err);
    return NextResponse.redirect(
      new URL("/login?error=db_error", request.url)
    );
  }

  // Upsert calendar connection
  try {
    const existing = await db
      .select()
      .from(googleCalendarConnections)
      .where(eq(googleCalendarConnections.userId, user.id));

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
        .where(eq(googleCalendarConnections.userId, user.id));
    } else {
      await db.insert(googleCalendarConnections).values({
        userId: user.id,
        ...connectionData,
      });
    }
  } catch (err) {
    console.error("Failed to save calendar connection (non-fatal):", err);
  }

  // Claim invite if present
  if (state.inviteCode) {
    await claimInvite(state.inviteCode, user.id, state.inviteType);
  }

  // Trigger initial calendar sync
  try {
    if (tokens.access_token) {
      const googleService = new GoogleCalendarService();
      await googleService.syncEvents(user.id);
    }
  } catch (err) {
    console.error("Initial calendar sync failed (non-fatal):", err);
  }

  // Set session cookie and redirect
  const redirectTo = user.onboardingComplete ? "/dashboard" : "/onboarding";
  const response = NextResponse.redirect(new URL(redirectTo, request.url));

  response.cookies.set("session_user_id", user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });
  response.cookies.delete("google_oauth_state");

  return response;
}
