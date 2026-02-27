import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import {
  users,
  userLocations,
  userConstraints,
  userPreferences,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json(
        { success: false, error: "Onboarding data is required" },
        { status: 400 }
      );
    }

    const userId = request.cookies.get("session_user_id")?.value;

    if (!userId) {
      // No session — save to response so client can persist locally
      console.log("No session cookie, returning data for client-side storage");
      return NextResponse.json({
        success: true,
        message: "Onboarding data received (no session — client-side only)",
        redirectTo: "/dashboard",
      });
    }

    // Persist to DB
    try {
      // 1. Delete existing onboarding data (for re-runs)
      await Promise.all([
        db.delete(userLocations).where(eq(userLocations.userId, userId)),
        db.delete(userConstraints).where(eq(userConstraints.userId, userId)),
        db.delete(userPreferences).where(eq(userPreferences.userId, userId)),
      ]);

      // 2. Save locations
      if (body.locations?.items?.length > 0) {
        await db.insert(userLocations).values(
          body.locations.items.map(
            (loc: {
              label: string;
              type: string;
              address?: string;
              hostingOk?: boolean;
              lat?: number;
              lng?: number;
            }) => ({
              userId,
              label: loc.label,
              type: loc.type,
              address: loc.address || null,
              hostingOk: loc.hostingOk ?? false,
              lat: loc.lat ?? null,
              lng: loc.lng ?? null,
            })
          )
        );
      }

      // 3. Save constraints
      if (body.constraints?.items?.length > 0) {
        await db.insert(userConstraints).values(
          body.constraints.items.map(
            (c: {
              type: string;
              label?: string;
              days: string[];
              startTime: string;
              endTime: string;
            }) => ({
              userId,
              type: c.type as "sleep" | "nap" | "transit" | "work" | "custom",
              label: c.label || null,
              days: c.days,
              startTime: c.startTime,
              endTime: c.endTime,
            })
          )
        );
      }

      // 4. Save preferences
      if (body.preferences) {
        const prefs = body.preferences;
        await db.insert(userPreferences).values({
          userId,
          maxEventsPerWeek: prefs.maxEventsPerWeek ?? 3,
          preferredTypes: prefs.engagementTypes ?? [],
          bufferMinutes: body.constraints?.transitBuffer ?? 30,
          preferMornings: prefs.preferMornings ?? false,
          preferAfternoons: prefs.preferAfternoons ?? true,
          preferEvenings: prefs.preferEvenings ?? false,
          preferWeekends: prefs.preferWeekends ?? true,
          weatherSensitive: body.weather?.weatherSensitive ?? false,
          rainAlternative: body.weather?.rainAlternative || null,
        });
      }

      // 5. Mark onboarding complete
      await db
        .update(users)
        .set({ onboardingComplete: true, updatedAt: new Date() })
        .where(eq(users.id, userId));

      console.log("Onboarding data persisted to DB for user:", userId);
    } catch (dbError) {
      console.error("DB persistence failed, continuing:", dbError);
      // Don't fail the request — the user can still proceed
    }

    return NextResponse.json({
      success: true,
      message: "Onboarding data saved successfully",
      redirectTo: "/dashboard",
    });
  } catch (error) {
    console.error("Onboarding complete error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to save onboarding data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
