import { NextRequest, NextResponse } from "next/server";
import { AUTH_CONFIG } from "@/lib/auth/config";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { phone, code } = await request.json();

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
      // Try to find or create user by phone
      let user;
      try {
        const existing = await db
          .select()
          .from(users)
          .where(eq(users.phone, phone))
          .limit(1);

        if (existing.length > 0) {
          user = existing[0];
        } else {
          const inserted = await db
            .insert(users)
            .values({ phone })
            .returning();
          user = inserted[0];
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

      // In a full implementation, we'd set a session cookie here.
      // For now, return the user data.
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

      // Set a simple dev session cookie
      response.cookies.set("session_user_id", user.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      });

      return response;
    }

    // Production mode: would verify OTP against stored code
    return NextResponse.json(
      { error: "OTP verification not configured. Set AUTH_MODE=dev for development." },
      { status: 501 }
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
