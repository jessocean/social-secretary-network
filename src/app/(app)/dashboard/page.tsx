"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format, addDays, startOfWeek } from "date-fns";
import {
  Sparkles,
  ChevronRight,
  CalendarCheck,
  UserPlus,
  FileText,
  Loader2,
  Coffee,
  UtensilsCrossed,
  TreePine,
  Home,
  GraduationCap,
  Footprints,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TYPE_ICONS: Record<string, typeof Coffee> = {
  coffee: Coffee,
  dinner: UtensilsCrossed,
  playground: TreePine,
  playdate_home: Home,
  park: TreePine,
  class: GraduationCap,
  walk: Footprints,
};

interface PendingProposal {
  id: string;
  type: string;
  title: string;
  status: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const [generating, setGenerating] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [pendingProposals, setPendingProposals] = useState<PendingProposal[]>([]);

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEndDate = addDays(weekStart, 6);
  const weekRangeStr = `${format(weekStart, "MMM d")} - ${format(weekEndDate, "MMM d")}`;

  // Load user name and pending proposals from localStorage
  useEffect(() => {
    try {
      const onboarding = JSON.parse(localStorage.getItem("ssn-onboarding") || "{}");
      if (onboarding.name) {
        setUserName(onboarding.name);
      }
    } catch {}

    try {
      const stored = localStorage.getItem("ssn-proposals");
      if (stored) {
        const proposals = JSON.parse(stored);
        const pending = proposals.filter(
          (p: PendingProposal) => p.status === "proposed" || p.status === "draft"
        );
        setPendingProposals(pending);
      }
    } catch {}
  }, []);

  const totalGoal = 5;
  const confirmedCount = 0;
  const pendingCount = pendingProposals.length;
  const progress = Math.min((confirmedCount / totalGoal) * 100, 100);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      // Read user's onboarding locations from localStorage
      let userLocations;
      try {
        const onboarding = JSON.parse(
          localStorage.getItem("ssn-onboarding") || "{}"
        );
        userLocations = onboarding.locations?.items;
      } catch {}

      const res = await fetch("/api/agent/negotiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekStart: weekStart.toISOString(),
          userLocations,
        }),
      });
      if (!res.ok) throw new Error("Failed to generate proposals");
      const data = await res.json();

      // Save proposals to localStorage so the proposals page picks them up
      if (data.proposals?.length > 0) {
        const proposals = data.proposals.map(
          (p: {
            type: string;
            title: string;
            locationName: string;
            startTime: string;
            endTime: string;
            score?: number;
            participants: { userId: string; name?: string }[];
          }, i: number) => ({
            id: `gen-${Date.now()}-${i}`,
            type: p.type,
            title: p.title,
            description: `${p.type} at ${p.locationName}`,
            locationName: p.locationName,
            startTime: p.startTime,
            endTime: p.endTime,
            status: "proposed",
            participants: p.participants.map(
              (part: { userId: string; name?: string }) => ({
                name: part.name || part.userId,
                response: "pending",
              })
            ),
          })
        );
        localStorage.setItem("ssn-proposals", JSON.stringify(proposals));
        setPendingProposals(proposals);
      }

      toast.success(
        `Generated ${data.proposals?.length ?? 0} new proposals! View them on the Proposals page.`
      );
    } catch {
      toast.error("Could not generate proposals. Try again.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 pt-6 pb-4">
      {/* Header */}
      <div className="mb-6">
        <p className="text-sm text-gray-500">
          {userName ? `Hello, ${userName}` : "Hello"}
        </p>
        <div className="flex items-baseline justify-between">
          <h1 className="text-2xl font-bold text-gray-900">This Week</h1>
          <span className="text-sm text-gray-500">{weekRangeStr}</span>
        </div>
      </div>

      {/* Stats bar */}
      <Card className="mb-5 gap-0 border-gray-200 bg-gray-50 py-0">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">
                {confirmedCount} of {totalGoal} hangouts planned
              </p>
              <p className="mt-0.5 text-xs text-gray-500">
                {pendingCount} pending proposal{pendingCount !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200">
              <CalendarCheck className="h-6 w-6 text-gray-600" />
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-gray-900 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Generate button */}
      <Button
        onClick={handleGenerate}
        disabled={generating}
        className="mb-5 w-full bg-gray-900 hover:bg-gray-800 shadow-md"
        size="lg"
      >
        {generating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Generate Proposals
          </>
        )}
      </Button>

      {/* Upcoming this week - empty initially */}
      <div className="mb-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Upcoming this week</h2>
          <Link
            href="/proposals"
            className="flex items-center gap-0.5 text-xs font-medium text-gray-600 hover:text-gray-700"
          >
            View all
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <Card className="gap-0 border-dashed py-0">
          <CardContent className="py-8 text-center">
            <CalendarCheck className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">
              No events yet. Generate proposals to get started!
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pending proposals */}
      {pendingProposals.length > 0 && (
        <div className="mb-5">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">
            Needs your review
          </h2>
          {pendingProposals.slice(0, 3).map((p) => {
            const Icon = TYPE_ICONS[p.type] ?? Coffee;

            return (
              <Link key={p.id} href="/proposals">
                <Card className="gap-0 border-dashed py-0 transition-colors hover:bg-gray-50">
                  <CardContent className="flex items-center gap-3 p-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {p.title}
                      </p>
                      <p className="text-xs text-gray-500">Tap to review</p>
                    </div>
                    <Badge variant="secondary" className="shrink-0 text-xs">
                      Review
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <Separator className="my-4" />

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/friends">
          <Card className="gap-0 py-0 transition-colors hover:bg-gray-50">
            <CardContent className="flex items-center gap-3 p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
                <UserPlus className="h-4 w-4 text-gray-700" />
              </div>
              <span className="text-sm font-medium text-gray-700">
                Invite a friend
              </span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/proposals">
          <Card className="gap-0 py-0 transition-colors hover:bg-gray-50">
            <CardContent className="flex items-center gap-3 p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
                <FileText className="h-4 w-4 text-gray-700" />
              </div>
              <span className="text-sm font-medium text-gray-700">
                All proposals
              </span>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
