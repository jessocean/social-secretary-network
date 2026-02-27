"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  Clock,
  MapPin,
  CloudRain,
  Heart,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import type { OnboardingData } from "@/hooks/useOnboarding";

interface ReviewCompleteProps {
  data: OnboardingData;
  onChange: (data: Record<string, unknown>) => void;
  onNext: () => void;
  onBack: () => void;
  onComplete?: () => Promise<void>;
  isSaving?: boolean;
}

const ENGAGEMENT_LABELS: Record<string, string> = {
  playground: "Playground",
  coffee: "Coffee",
  playdate_home: "Playdate at home",
  dinner: "Dinner",
  park: "Park",
  class: "Class",
  walk: "Walk",
};

export function ReviewComplete({
  data,
  onBack,
  onComplete,
  isSaving,
}: ReviewCompleteProps) {
  const busyEvents = data.calendar.events.filter((e) => e.isBusy).length;
  const freeEvents = data.calendar.events.filter((e) => !e.isBusy).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
          <CheckCircle2 className="h-7 w-7 text-gray-700" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">All set!</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s a summary of your preferences.
        </p>
      </div>

      {/* Calendar summary */}
      <Card>
        <CardContent className="flex items-start gap-3 py-3">
          <Calendar className="mt-0.5 h-4 w-4 text-gray-500" />
          <div className="flex flex-col">
            <span className="text-sm font-medium">Calendar</span>
            <span className="text-xs text-muted-foreground">
              {busyEvents} busy events, {freeEvents} free events marked
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Constraints summary */}
      <Card>
        <CardContent className="flex items-start gap-3 py-3">
          <Clock className="mt-0.5 h-4 w-4 text-gray-500" />
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">Constraints</span>
            <span className="text-xs text-muted-foreground">
              {data.constraints.items.length} constraint
              {data.constraints.items.length !== 1 ? "s" : ""},{" "}
              {data.constraints.transitBuffer}min transit buffer
            </span>
            <div className="flex flex-wrap gap-1">
              {data.constraints.items.map((c) => (
                <Badge key={c.id} variant="secondary" className="text-[10px]">
                  {c.label}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preferences summary */}
      <Card>
        <CardContent className="flex items-start gap-3 py-3">
          <Heart className="mt-0.5 h-4 w-4 text-gray-500" />
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">Preferences</span>
            <span className="text-xs text-muted-foreground">
              Max {data.preferences.maxEventsPerWeek} events/week
            </span>
            {data.preferences.engagementTypes.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {data.preferences.engagementTypes.map((type) => (
                  <Badge key={type} variant="secondary" className="text-[10px]">
                    {ENGAGEMENT_LABELS[type] || type}
                  </Badge>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
              {data.preferences.preferMornings && <span>Mornings</span>}
              {data.preferences.preferAfternoons && <span>Afternoons</span>}
              {data.preferences.preferEvenings && <span>Evenings</span>}
              {data.preferences.preferWeekends && <span>Weekends</span>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Locations summary */}
      <Card>
        <CardContent className="flex items-start gap-3 py-3">
          <MapPin className="mt-0.5 h-4 w-4 text-gray-500" />
          <div className="flex flex-col">
            <span className="text-sm font-medium">Locations</span>
            <span className="text-xs text-muted-foreground">
              {data.locations.items.length} location
              {data.locations.items.length !== 1 ? "s" : ""} added
              {data.locations.items.some((l) => l.hostingOk) &&
                ", can host at " +
                  data.locations.items
                    .filter((l) => l.hostingOk)
                    .map((l) => l.label)
                    .join(", ")}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Weather summary */}
      <Card>
        <CardContent className="flex items-start gap-3 py-3">
          <CloudRain className="mt-0.5 h-4 w-4 text-gray-500" />
          <div className="flex flex-col">
            <span className="text-sm font-medium">Weather</span>
            <span className="text-xs text-muted-foreground">
              {data.weather.weatherSensitive
                ? `Weather sensitive${data.weather.rainAlternative ? ": " + data.weather.rainAlternative : ""}`
                : "Not weather sensitive"}
            </span>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Navigation */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button
          onClick={onComplete}
          disabled={isSaving}
          className="flex-1 bg-gray-900 text-white hover:bg-gray-800"
          size="lg"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Start using Social Secretary"
          )}
        </Button>
      </div>
    </div>
  );
}
