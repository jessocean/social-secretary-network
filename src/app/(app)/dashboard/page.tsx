"use client";

import { useState } from "react";
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
  Trees,
  Home,
  UtensilsCrossed,
  MapPin,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const now = new Date();
const weekStart = startOfWeek(now, { weekStartsOn: 1 });

const MOCK_UPCOMING = [
  {
    id: "1",
    type: "coffee",
    title: "Coffee with Sarah",
    locationName: "Blue Bottle Coffee",
    startTime: addDays(weekStart, 1).toISOString().replace("T00:", "T10:"),
    endTime: addDays(weekStart, 1).toISOString().replace("T00:", "T11:"),
    status: "confirmed" as const,
    friendName: "Sarah M.",
  },
  {
    id: "2",
    type: "playground",
    title: "Playground with Emma & kids",
    locationName: "Central Park Playground",
    startTime: addDays(weekStart, 3).toISOString().replace("T00:", "T15:"),
    endTime: addDays(weekStart, 3).toISOString().replace("T00:", "T17:"),
    status: "confirmed" as const,
    friendName: "Emma L.",
  },
  {
    id: "3",
    type: "playdate_home",
    title: "Playdate at Jessica's",
    locationName: "Home",
    startTime: addDays(weekStart, 5).toISOString().replace("T00:", "T10:"),
    endTime: addDays(weekStart, 5).toISOString().replace("T00:", "T12:"),
    status: "confirmed" as const,
    friendName: "Amy K.",
  },
];

const MOCK_PENDING = [
  {
    id: "4",
    type: "dinner",
    title: "Dinner with Rachel",
    status: "proposed" as const,
    score: 0.88,
  },
];

const TYPE_ICONS: Record<string, typeof Coffee> = {
  coffee: Coffee,
  playground: Trees,
  playdate_home: Home,
  dinner: UtensilsCrossed,
};

const TYPE_COLORS: Record<string, string> = {
  coffee: "bg-amber-100 text-amber-700",
  playground: "bg-green-100 text-green-700",
  playdate_home: "bg-pink-100 text-pink-700",
  dinner: "bg-orange-100 text-orange-700",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const [generating, setGenerating] = useState(false);

  const totalGoal = 5;
  const confirmedCount = MOCK_UPCOMING.length;
  const pendingCount = MOCK_PENDING.length;
  const progress = Math.min((confirmedCount / totalGoal) * 100, 100);

  const weekEndDate = addDays(weekStart, 6);
  const weekRangeStr = `${format(weekStart, "MMM d")} - ${format(weekEndDate, "MMM d")}`;

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/agent/negotiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekStart: weekStart.toISOString() }),
      });
      if (!res.ok) throw new Error("Failed to generate proposals");
      const data = await res.json();
      toast.success(`Generated ${data.proposals?.length ?? 0} new proposals!`);
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
        <p className="text-sm text-gray-500">Hello, Jessica</p>
        <div className="flex items-baseline justify-between">
          <h1 className="text-2xl font-bold text-gray-900">This Week</h1>
          <span className="text-sm text-gray-500">{weekRangeStr}</span>
        </div>
      </div>

      {/* Stats bar */}
      <Card className="mb-5 gap-0 border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50 py-0">
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
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
              <CalendarCheck className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-indigo-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Generate button */}
      <Button
        onClick={handleGenerate}
        disabled={generating}
        className="mb-5 w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-md"
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

      {/* Upcoming confirmed events */}
      <div className="mb-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Upcoming this week</h2>
          <Link
            href="/proposals"
            className="flex items-center gap-0.5 text-xs font-medium text-indigo-600 hover:text-indigo-700"
          >
            View all
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="space-y-3">
          {MOCK_UPCOMING.map((event) => {
            const Icon = TYPE_ICONS[event.type] ?? Coffee;
            const colorClass = TYPE_COLORS[event.type] ?? "bg-gray-100 text-gray-700";
            const startDate = new Date(event.startTime);

            return (
              <Card key={event.id} className="gap-0 py-0">
                <CardContent className="flex items-center gap-3 p-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                      colorClass
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {event.title}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(startDate, "EEE h:mm a")}
                      </span>
                      {event.locationName && (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="h-3 w-3" />
                          {event.locationName}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className="shrink-0 bg-green-100 text-green-700 text-xs"
                  >
                    Confirmed
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Pending proposals */}
      {MOCK_PENDING.length > 0 && (
        <div className="mb-5">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">
            Needs your review
          </h2>
          {MOCK_PENDING.map((p) => {
            const Icon = TYPE_ICONS[p.type] ?? Coffee;
            const colorClass = TYPE_COLORS[p.type] ?? "bg-gray-100 text-gray-700";

            return (
              <Link key={p.id} href="/proposals">
                <Card className="gap-0 border-amber-100 bg-amber-50/50 py-0 transition-colors hover:bg-amber-50">
                  <CardContent className="flex items-center gap-3 p-3">
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                        colorClass
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {p.title}
                      </p>
                      <p className="text-xs text-amber-600">Tap to review</p>
                    </div>
                    {p.score != null && (
                      <Badge className="shrink-0 bg-gradient-to-r from-indigo-500 to-violet-500 text-white border-0 text-xs">
                        {Math.round(p.score * 100)}% match
                      </Badge>
                    )}
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
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100">
                <UserPlus className="h-4 w-4 text-violet-700" />
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
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100">
                <FileText className="h-4 w-4 text-indigo-700" />
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
