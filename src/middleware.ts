import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PATHS = [
  "/dashboard",
  "/proposals",
  "/friends",
  "/coordination",
  "/onboarding",
  "/settings",
];

const PUBLIC_PATHS = ["/", "/login", "/invite"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if this is a protected path
  const isProtected = PROTECTED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  // Check for session cookie
  const sessionUserId = request.cookies.get("session_user_id")?.value;

  if (!sessionUserId) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/proposals/:path*",
    "/friends/:path*",
    "/coordination/:path*",
    "/onboarding/:path*",
    "/settings/:path*",
  ],
};
