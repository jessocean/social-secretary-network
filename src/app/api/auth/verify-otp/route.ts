import { NextRequest, NextResponse } from "next/server";
import { AUTH_CONFIG } from "@/lib/auth/config";
import { createSupabaseServerClient } from "@/lib/auth/supabase-server";
import { db } from "@/lib/db/client";
import { users, invites, friendships } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

async function findOrCreateUser(phone: string) {
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.phone, phone))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  const inserted = await db
    .insert(users)
    .values({ phone })
    .returning();
  return inserted[0];
}

async function claimInvite(inviteCode: string, newUserId: string, inviteType?: string) {
  try {
    // Find the invite
    const [invite] = await db
      .select()
      .from(invites)
      .where(eq(invites.code, inviteCode))
      .limit(1);

    if (!invite) return;
    if (invite.usedBy) return; // Already claimed
    if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) return; // Expired

    // Don't let someone invite themselves
    if (invite.createdBy === newUserId) return;

    // Mark invite as used
    await db
      .update(invites)
      .set({ usedBy: newUserId, usedAt: new Date() })
      .where(eq(invites.id, invite.id));

    // Determine friendship status based on invite type
    const friendshipStatus = inviteType === "calendar" ? "calendar_only" : "active";

    // Check if friendship already exists (in either direction)
    const existingFriendship = await db
      .select()
      .from(friendships)
      .where(
        eq(friendships.userId, invite.createdBy)
      )
      .then((rows) =>
        rows.find(
          (r) =>
            (r.userId === invite.createdBy && r.friendId === newUserId) ||
            (r.userId === newUserId && r.friendId === invite.createdBy)
        )
      );

    if (existingFriendship) {
      // Update existing friendship to active/calendar_only
      await db
        .update(friendships)
        .set({ status: friendshipStatus })
        .where(eq(friendships.id, existingFriendship.id));
    } else {
      // Create new friendship — immediately active since they accepted the invite
      await db.insert(friendships).values({
        userId: invite.createdBy,
        friendId: newUserId,
        status: friendshipStatus,
      });
    }
  } catch (err) {
    // Non-fatal — log but don't block signup
    console.error("Error claiming invite:", err);
  }
}

function buildSuccessResponse(user: {
  id: string;
  phone: string;
  displayName: string | null;
  onboardingComplete: boolean | null;
  onboardingStep: number | null;
  [key: string]: unknown;
}) {
  const response = NextResponse.json({
    success: true,
    user: {
      id: user.id,
      phone: user.phone,
      displayName: user.displayName,
      onboardingComplete: user.onboardingComplete,
      onboardingStep: user.onboardingStep,
    },
  });

  response.cookies.set("session_user_id", user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });

  return response;
}

export async function POST(request: NextRequest) {
  try {
    const { phone, code, inviteCode, inviteType } = await request.json();

    if (!phone || typeof phone !== "string") {
      return NextResponse.json(
        { error: "Phone number is required." },
        { status: 400 }
      );
    }

    if (!code || typeof code !== "string" || code.length !== 6) {
      return NextResponse.json(
        { error: "A 6-digit code is required." },
        { status: 400 }
      );
    }

    if (AUTH_CONFIG.isDevMode) {
      // Dev mode: any 6-digit code works
      let user;
      try {
        user = await findOrCreateUser(phone);
        // If there's an invite code, claim it and create friendship
        if (inviteCode) {
          await claimInvite(inviteCode, user.id, inviteType);
        }
      } catch {
        // Database might not be available in dev, return mock user
        user = {
          id: "dev-user-" + phone.replace(/\D/g, ""),
          phone,
          displayName: null,
          avatarUrl: null,
          onboardingComplete: false,
          onboardingStep: 0,
        };
      }

      return buildSuccessResponse(user);
    }

    // Production mode: verify OTP via Supabase Auth (Twilio under the hood)
    const supabase = await createSupabaseServerClient();

    // Strip non-digit chars except leading + for Supabase
    const cleaned = phone.startsWith("+")
      ? "+" + phone.slice(1).replace(/\D/g, "")
      : phone.replace(/\D/g, "");

    const { error } = await supabase.auth.verifyOtp({
      phone: cleaned,
      token: code,
      type: "sms",
    });

    if (error) {
      console.error("Supabase OTP verify error:", error.message);
      return NextResponse.json(
        { error: "Invalid or expired code. Please try again." },
        { status: 401 }
      );
    }

    // OTP verified — find or create user in our public.users table
    const user = await findOrCreateUser(phone);

    // If there's an invite code, claim it and create friendship
    if (inviteCode) {
      await claimInvite(inviteCode, user.id, inviteType);
    }

    return buildSuccessResponse(user);
  } catch {
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
