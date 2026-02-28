import { NextRequest, NextResponse } from "next/server";
import { getAuthUrl, generateNonce } from "@/lib/google/oauth";

export async function GET(request: NextRequest) {
  const userId = request.cookies.get("session_user_id")?.value;
  if (!userId) {
    return NextResponse.json(
      { error: "Must be logged in to connect calendar" },
      { status: 401 }
    );
  }

  const returnTo = request.nextUrl.searchParams.get("returnTo") || "/onboarding";
  const nonce = generateNonce();

  const authUrl = getAuthUrl(returnTo, nonce);

  const response = NextResponse.redirect(authUrl);
  response.cookies.set("google_oauth_state", nonce, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });

  return response;
}
