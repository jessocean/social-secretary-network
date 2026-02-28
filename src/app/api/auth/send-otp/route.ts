import { NextRequest, NextResponse } from "next/server";
import { AUTH_CONFIG } from "@/lib/auth/config";
import { createSupabaseServerClient } from "@/lib/auth/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();

    if (!phone || typeof phone !== "string") {
      return NextResponse.json(
        { error: "Phone number is required." },
        { status: 400 }
      );
    }

    // Strip non-digit chars except leading +
    const cleaned = phone.startsWith("+")
      ? "+" + phone.slice(1).replace(/\D/g, "")
      : phone.replace(/\D/g, "");

    if (cleaned.replace(/\D/g, "").length < 7) {
      return NextResponse.json(
        { error: "Invalid phone number." },
        { status: 400 }
      );
    }

    if (AUTH_CONFIG.isDevMode) {
      // Dev mode: no actual SMS sent
      return NextResponse.json({
        success: true,
        message: "OTP sent (dev mode).",
      });
    }

    // Production mode: send OTP via Supabase Auth (uses Twilio under the hood)
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithOtp({ phone: cleaned });

    if (error) {
      console.error("Supabase OTP send error:", error.message);
      return NextResponse.json(
        { error: "Failed to send verification code. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Verification code sent.",
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
