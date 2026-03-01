import { NextRequest, NextResponse } from "next/server";
import { AUTH_CONFIG } from "@/lib/auth/config";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { claimInvite } from "@/lib/auth/invite-utils";

export async function POST(request: NextRequest) {
  if (!AUTH_CONFIG.isDevMode) {
    return NextResponse.json(
      { error: "Dev login is only available in dev mode" },
      { status: 403 }
    );
  }

  try {
    const { email, inviteCode, inviteType } = await request.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required." },
        { status: 400 }
      );
    }

    // Find or create user by email
    let user;
    try {
      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existing) {
        user = existing;
      } else {
        const [inserted] = await db
          .insert(users)
          .values({ email })
          .returning();
        user = inserted;
      }

      // Claim invite if present
      if (inviteCode) {
        await claimInvite(inviteCode, user.id, inviteType);
      }
    } catch {
      // Database might not be available in dev, return mock user
      user = {
        id: "dev-user-" + email.replace(/[^a-z0-9]/gi, ""),
        email,
        displayName: null,
        avatarUrl: null,
        onboardingComplete: false,
        onboardingStep: 0,
      };
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
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
  } catch {
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
