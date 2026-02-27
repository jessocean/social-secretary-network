"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CalendarDays, Check, Loader2 } from "lucide-react";

interface ConnectCalendarProps {
  onNext: () => void;
  onBack: () => void;
}

export function ConnectCalendar({ onNext }: ConnectCalendarProps) {
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    // In mock mode, simulate a brief connection
    await new Promise((r) => setTimeout(r, 1200));
    setConnected(true);
    setConnecting(false);
    // Auto-advance after showing success
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
      </div>

      <div className="w-full space-y-3">
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

        {!connected && (
          <button
            onClick={onNext}
            className="block w-full text-center text-sm text-muted-foreground hover:text-gray-700"
          >
            Skip for now
          </button>
        )}
      </div>
    </div>
  );
}
