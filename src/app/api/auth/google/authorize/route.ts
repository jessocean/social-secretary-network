import { NextRequest, NextResponse } from "next/server";
import { getAuthUrl, generateNonce } from "@/lib/google/oauth";

export async function GET(request: NextRequest) {
  const inviteCode = request.nextUrl.searchParams.get("invite") || undefined;
  const inviteType = request.nextUrl.searchParams.get("type") || undefined;
  const nonce = generateNonce();

  const authUrl = getAuthUrl({ nonce, inviteCode, inviteType });

  const response = NextResponse.redirect(authUrl);
  response.cookies.set("google_oauth_state", nonce, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });

  return response;
}
