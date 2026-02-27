"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  Users,
  Sparkles,
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
    <div className="flex min-h-dvh flex-col bg-gradient-to-b from-indigo-50 via-white to-violet-50">
      {/* Top accent bar */}
      <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-violet-500" />

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 py-8">
        {/* Logo / Branding */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-200">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Social Secretary</h1>
          <p className="text-sm text-muted-foreground">
            AI-powered social scheduling
          </p>
        </div>

        {/* Loading state */}
        {state === "loading" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            <p className="text-sm text-muted-foreground">
              Loading invite...
            </p>
          </div>
        )}

        {/* Valid invite */}
        {state === "valid" && invite && (
          <div className="flex flex-1 flex-col">
            {/* Invite message */}
            <Card className="mb-6 border-indigo-100 bg-white py-0">
              <CardContent className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  {invite.type === "full" ? (
                    <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200">
                      <Users className="mr-1 h-3 w-3" />
                      Full invite
                    </Badge>
                  ) : (
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                      <CalendarDays className="mr-1 h-3 w-3" />
                      Calendar access
                    </Badge>
                  )}
                </div>

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
                {invite.type === "full"
                  ? "What you get as a member:"
                  : "What happens next:"}
              </h3>

              {invite.type === "full" ? (
                <div className="space-y-2.5">
                  <FeatureRow
                    icon={<Sparkles className="h-4 w-4 text-indigo-500" />}
                    text="AI assistant that schedules hangouts for you"
                  />
                  <FeatureRow
                    icon={<CalendarDays className="h-4 w-4 text-indigo-500" />}
                    text="Smart calendar integration that finds open slots"
                  />
                  <FeatureRow
                    icon={<Users className="h-4 w-4 text-indigo-500" />}
                    text="Set priority for friends you want to see most"
                  />
                  <FeatureRow
                    icon={<Clock className="h-4 w-4 text-indigo-500" />}
                    text="Automatic reminders and scheduling suggestions"
                  />
                </div>
              ) : (
                <div className="space-y-2.5">
                  <FeatureRow
                    icon={<CalendarDays className="h-4 w-4 text-blue-500" />}
                    text="Share your calendar availability securely"
                  />
                  <FeatureRow
                    icon={
                      <Sparkles className="h-4 w-4 text-blue-500" />
                    }
                    text={`${invite.createdByName}'s AI will find times that work for both of you`}
                  />
                  <FeatureRow
                    icon={<Clock className="h-4 w-4 text-blue-500" />}
                    text="No full account needed -- just calendar access"
                  />
                </div>
              )}
            </div>

            {/* CTA */}
            <div className="mt-auto space-y-3">
              {invite.type === "full" ? (
                <Button
                  asChild
                  className="h-12 w-full bg-gradient-to-r from-indigo-500 to-violet-500 text-base font-semibold text-white hover:from-indigo-600 hover:to-violet-600"
                >
                  <Link href={`/login?invite=${code}`}>
                    Join Social Secretary
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <Button
                  asChild
                  className="h-12 w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-base font-semibold text-white hover:from-blue-600 hover:to-indigo-600"
                >
                  <Link href={`/login?invite=${code}&type=calendar`}>
                    Share your calendar
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}

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
            icon={<Clock className="h-8 w-8 text-amber-500" />}
            title="Invite expired"
            description="This invite link has expired. Ask your friend to send you a new one."
          />
        )}

        {/* Used state */}
        {state === "used" && (
          <ErrorState
            icon={<Users className="h-8 w-8 text-blue-500" />}
            title="Invite already used"
            description="This invite link has already been claimed. Ask your friend to send you a new one."
          />
        )}

        {/* Error state */}
        {state === "error" && (
          <ErrorState
            icon={<AlertCircle className="h-8 w-8 text-red-500" />}
            title="Invalid invite"
            description="This invite link is not valid. Make sure you have the correct link from your friend."
          />
        )}
      </div>
    </div>
  );
}

function FeatureRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-gray-50 px-3 py-2.5">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span className="text-sm text-gray-700">{text}</span>
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
