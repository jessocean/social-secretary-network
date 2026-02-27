"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CalendarEvent } from "@/hooks/useOnboarding";

interface CalendarReviewProps {
  data: { events: CalendarEvent[] };
  onChange: (data: { events: CalendarEvent[] }) => void;
  onNext: () => void;
  onBack: () => void;
}

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const DAY_LABELS: Record<string, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

const MOCK_EVENTS: CalendarEvent[] = [
  { id: "1", title: "Morning yoga", day: "mon", startTime: "08:00", endTime: "09:00", isBusy: true },
  { id: "2", title: "Team standup", day: "mon", startTime: "10:00", endTime: "10:30", isBusy: true },
  { id: "3", title: "Lunch with Sarah", day: "tue", startTime: "12:00", endTime: "13:00", isBusy: true },
  { id: "4", title: "Dentist appointment", day: "tue", startTime: "15:00", endTime: "16:00", isBusy: true },
  { id: "5", title: "Grocery shopping", day: "wed", startTime: "10:00", endTime: "11:00", isBusy: false },
  { id: "6", title: "Piano lesson (kids)", day: "wed", startTime: "16:00", endTime: "17:00", isBusy: true },
  { id: "7", title: "Date night", day: "thu", startTime: "19:00", endTime: "21:00", isBusy: true },
  { id: "8", title: "Swim class", day: "fri", startTime: "09:00", endTime: "10:00", isBusy: true },
  { id: "9", title: "Farmers market", day: "sat", startTime: "09:00", endTime: "11:00", isBusy: false },
  { id: "10", title: "Birthday party", day: "sat", startTime: "14:00", endTime: "16:00", isBusy: true },
  { id: "11", title: "Family brunch", day: "sun", startTime: "10:00", endTime: "12:00", isBusy: true },
];

export function CalendarReview({ data, onChange, onNext, onBack }: CalendarReviewProps) {
  const [selectedDay, setSelectedDay] = useState(0);

  // Initialize with mock events if empty
  useEffect(() => {
    if (data.events.length === 0) {
      onChange({ events: MOCK_EVENTS });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const currentDay = DAYS[selectedDay];
  const dayEvents = data.events.filter((e) => e.day === currentDay);

  const toggleEvent = (eventId: string) => {
    onChange({
      events: data.events.map((e) =>
        e.id === eventId ? { ...e, isBusy: !e.isBusy } : e
      ),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Review your calendar</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Toggle events as busy or free to help us find the best times for social plans.
        </p>
      </div>

      {/* Day navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSelectedDay((d) => Math.max(0, d - 1))}
          disabled={selectedDay === 0}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex gap-1.5">
          {DAYS.map((day, i) => (
            <button
              key={day}
              onClick={() => setSelectedDay(i)}
              className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                i === selectedDay
                  ? "bg-indigo-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {day.charAt(0).toUpperCase() + day.slice(1, 3)}
            </button>
          ))}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSelectedDay((d) => Math.min(DAYS.length - 1, d + 1))}
          disabled={selectedDay === DAYS.length - 1}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Day label */}
      <h3 className="text-center text-sm font-semibold text-gray-700">
        {DAY_LABELS[currentDay]}
      </h3>

      {/* Events list */}
      <div className="flex flex-col gap-2">
        {dayEvents.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center">
              <p className="text-sm text-muted-foreground">No events this day</p>
            </CardContent>
          </Card>
        ) : (
          dayEvents.map((event) => (
            <Card
              key={event.id}
              className={`cursor-pointer border-2 transition-colors ${
                event.isBusy
                  ? "border-red-200 bg-red-50"
                  : "border-green-200 bg-green-50"
              }`}
              onClick={() => toggleEvent(event.id)}
            >
              <CardContent className="flex items-center justify-between py-3">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">
                    {event.title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {event.startTime} - {event.endTime}
                  </span>
                </div>
                <Badge
                  variant={event.isBusy ? "destructive" : "secondary"}
                  className={
                    event.isBusy
                      ? ""
                      : "bg-green-100 text-green-700 hover:bg-green-200"
                  }
                >
                  {event.isBusy ? "Busy" : "Free"}
                </Badge>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Tap an event to toggle between busy and free
      </p>

      {/* Navigation */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button
          onClick={onNext}
          className="flex-1 bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:from-indigo-600 hover:to-violet-600"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
