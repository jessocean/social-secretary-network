"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get("invite");
  const inviteType = searchParams.get("type");
  const errorParam = searchParams.get("error");

  const error = errorParam ? decodeError(errorParam) : "";
  const googleAuthUrl = buildGoogleAuthUrl(inviteCode, inviteType);

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Branding */}
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-900 shadow-lg">
          <span className="text-2xl font-bold text-white">S</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Social Secretary
        </h1>
        <p className="text-sm text-muted-foreground">
          AI-powered social scheduling for busy parents
        </p>
      </div>

      {inviteCode && (
        <p className="text-sm text-center text-muted-foreground">
          Sign in to accept your friend&apos;s invite
        </p>
      )}

      <Card className="w-full border-0 shadow-lg">
        <CardHeader className="pb-4 pt-6 text-center">
          <h2 className="text-lg font-semibold">Sign in</h2>
          <p className="text-sm text-muted-foreground">
            Connect your Google account to get started
          </p>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="flex flex-col gap-4">
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button
              asChild
              className="w-full bg-gray-900 text-white hover:bg-gray-800"
              size="lg"
            >
              <a href={googleAuthUrl}>
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Sign in with Google
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function buildGoogleAuthUrl(inviteCode: string | null, inviteType: string | null): string {
  const params = new URLSearchParams();
  if (inviteCode) params.set("invite", inviteCode);
  if (inviteType) params.set("type", inviteType);
  const qs = params.toString();
  return `/api/auth/google/authorize${qs ? `?${qs}` : ""}`;
}

function decodeError(error: string): string {
  const messages: Record<string, string> = {
    missing_params: "Something went wrong. Please try again.",
    invalid_state: "Session expired. Please try again.",
    csrf_mismatch: "Session expired. Please try again.",
    token_exchange: "Failed to connect with Google. Please try again.",
    profile_fetch: "Failed to get your Google profile. Please try again.",
    db_error: "Something went wrong. Please try again.",
    access_denied: "Google sign-in was cancelled.",
  };
  return messages[error] || "Something went wrong. Please try again.";
}
