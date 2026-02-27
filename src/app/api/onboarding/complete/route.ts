import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    // Validate that we received onboarding data
    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json(
        { success: false, error: "Onboarding data is required" },
        { status: 400 }
      );
    }

    // In production, this would:
    // 1. Validate the session / auth token
    // 2. Save preferences to user_preferences table
    // 3. Save constraints to user_constraints table
    // 4. Save locations to user_locations table
    // 5. Update users.onboarding_complete = true
    // 6. Optionally trigger initial calendar sync
    // 7. Optionally trigger first negotiation run

    // For now, log the data and return success
    console.log("Onboarding complete - received data:", {
      hasPreferences: !!body.preferences,
      hasConstraints: !!body.constraints,
      hasLocations: !!body.locations,
      hasContacts: !!body.contacts,
      hasWeatherPrefs: !!body.weatherPrefs,
      hasOpenHouse: !!body.openHouse,
    });

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
