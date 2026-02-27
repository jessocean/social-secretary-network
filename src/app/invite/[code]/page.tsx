"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CalendarDays,
  Users,
  Clock,
  AlertCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";

interface InviteData {
  code: string;
  createdBy: string;
  createdByName: string;
  type: "full" | "calendar_only";
  usedBy: string | null;
  usedAt: string | null;
  expiresAt: string;
  createdAt: string;
  expired?: boolean;
  used?: boolean;
}

type PageState = "loading" | "valid" | "expired" | "used" | "error";

export default function InvitePage() {
  const params = useParams<{ code: string }>();
  const code = params.code;

  const [state, setState] = useState<PageState>("loading");
  const [invite, setInvite] = useState<InviteData | null>(null);

  useEffect(() => {
    async function fetchInvite() {
      try {
        const res = await fetch(`/api/invites?code=${code}`);
        const data = await res.json();

        if (res.status === 410) {
          setInvite(data.invite);
          setState(data.invite?.used ? "used" : "expired");
          return;
        }

        if (!res.ok) {
          setState("error");
          return;
        }

        setInvite(data.invite);
        setState("valid");
      } catch {
        setState("error");
      }
    }

    if (code) {
      fetchInvite();
    }
  }, [code]);

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      {/* Top accent bar */}
      <div className="h-1 bg-gray-900" />

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 py-8">
        {/* Logo / Branding */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-900">
            <CalendarDays className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Social Secretary</h1>
          <p className="text-sm text-muted-foreground">
            AI-powered social scheduling
          </p>
        </div>

        {/* Loading state */}
        {state === "loading" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <p className="text-sm text-muted-foreground">
              Loading invite...
            </p>
          </div>
        )}

        {/* Valid invite */}
        {state === "valid" && invite && (
          <div className="flex flex-1 flex-col">
            {/* Invite message */}
            <Card className="mb-6 border bg-white py-0">
              <CardContent className="p-5">
                <h2 className="mb-2 text-lg font-bold text-gray-900">
                  {invite.createdByName} invited you to Social Secretary
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Social Secretary is an AI-powered app that automatically finds
                  the best times for you and your friends to hang out. No more
                  endless back-and-forth scheduling texts.
                </p>
              </CardContent>
            </Card>

            {/* What you get */}
            <div className="mb-6 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">
                How would you like to connect?
              </h3>
            </div>

            {/* CTAs - recipient chooses */}
            <div className="mt-auto space-y-3">
              <Button
                asChild
                className="h-12 w-full bg-gray-900 text-base font-semibold text-white hover:bg-gray-800"
              >
                <Link href={`/login?invite=${code}&type=full`}>
                  Join Social Secretary
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="h-12 w-full text-base"
              >
                <Link href={`/login?invite=${code}&type=calendar`}>
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Just share my calendar
                </Link>
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                By continuing, you agree to our Terms of Service and Privacy
                Policy.
              </p>
            </div>
          </div>
        )}

        {/* Expired state */}
        {state === "expired" && (
          <ErrorState
            icon={<Clock className="h-8 w-8 text-gray-500" />}
            title="Invite expired"
            description="This invite link has expired. Ask your friend to send you a new one."
          />
        )}

        {/* Used state */}
        {state === "used" && (
          <ErrorState
            icon={<Users className="h-8 w-8 text-gray-500" />}
            title="Invite already used"
            description="This invite link has already been claimed. Ask your friend to send you a new one."
          />
        )}

        {/* Error state */}
        {state === "error" && (
          <ErrorState
            icon={<AlertCircle className="h-8 w-8 text-gray-500" />}
            title="Invalid invite"
            description="This invite link is not valid. Make sure you have the correct link from your friend."
          />
        )}
      </div>
    </div>
  );
}

function ErrorState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
        {icon}
      </div>
      <div>
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          {description}
        </p>
      </div>
      <Button asChild variant="outline" className="mt-2">
        <Link href="/">Go to homepage</Link>
      </Button>
    </div>
  );
}
