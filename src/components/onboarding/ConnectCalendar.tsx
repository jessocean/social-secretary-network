"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CalendarDays, Check, Loader2, HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ConnectCalendarProps {
  onNext: () => void;
  onBack: () => void;
}

const CALENDAR_MODE = process.env.NEXT_PUBLIC_CALENDAR_MODE || "mock";

export function ConnectCalendar({ onNext }: ConnectCalendarProps) {
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const searchParams = useSearchParams();

  // Check if we just returned from Google OAuth
  useEffect(() => {
    if (searchParams.get("gcal") === "connected") {
      setConnected(true);
      setTimeout(() => onNext(), 800);
      return;
    }

    // Check if user already has a connection (google mode only)
    if (CALENDAR_MODE === "google") {
      fetch("/api/calendar/status")
        .then((r) => r.json())
        .then((data) => {
          if (data.connected) {
            setConnected(true);
            setTimeout(() => onNext(), 800);
          }
        })
        .catch(() => {});
    }
  }, [searchParams, onNext]);

  const handleConnect = async () => {
    if (CALENDAR_MODE === "google") {
      // Redirect to Google OAuth
      window.location.href = "/api/auth/google/authorize?returnTo=/onboarding";
      return;
    }

    // Mock mode: simulate a brief connection
    setConnecting(true);
    await new Promise((r) => setTimeout(r, 1200));
    setConnected(true);
    setConnecting(false);
    setTimeout(() => onNext(), 800);
  };

  return (
    <div className="flex flex-col items-center gap-8 pt-8">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-gray-200 bg-white">
        <CalendarDays className="h-10 w-10 text-gray-700" />
      </div>

      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">
          Connect your calendar
        </h2>
        <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
          We&apos;ll read your calendar to find the best times for social plans.
          Nothing is shared without your approval.
        </p>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="mx-auto mt-3 flex items-center gap-1 text-xs text-muted-foreground hover:text-gray-700">
                <HelpCircle className="h-3.5 w-3.5" />
                Why do you need this?
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs text-center">
              <p>
                Social Secretary uses your calendar to negotiate on your behalf
                with other people&apos;s calendars to plan social engagements.
                Without calendar access, the app can&apos;t work.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="w-full">
        <Button
          onClick={handleConnect}
          disabled={connecting || connected}
          className="w-full bg-gray-900 text-white hover:bg-gray-800"
          size="lg"
        >
          {connected ? (
            <>
              <Check className="h-4 w-4" />
              Connected!
            </>
          ) : connecting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <CalendarDays className="h-4 w-4" />
              Connect Google Calendar
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
