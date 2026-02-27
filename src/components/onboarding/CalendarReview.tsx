"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
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
  { id: "3", title: "Lunch with Alice", day: "tue", startTime: "12:00", endTime: "13:00", isBusy: true },
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
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [showSaveBanner, setShowSaveBanner] = useState(false);

  // Initialize with mock events if empty
  useEffect(() => {
    if (data.events.length === 0) {
      onChange({ events: MOCK_EVENTS });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const currentDay = DAYS[selectedDay];
  const dayEvents = data.events.filter((e) => e.day === currentDay);

  const toggleEvent = (eventId: string) => {
    if (expandedEventId === eventId) {
      setExpandedEventId(null);
    } else {
      setExpandedEventId(eventId);
    }
  };

  const updateEvent = (eventId: string, updates: Partial<CalendarEvent>) => {
    onChange({
      events: data.events.map((e) =>
        e.id === eventId ? { ...e, ...updates } : e
      ),
    });
    setShowSaveBanner(true);
  };

  const deleteEvent = (eventId: string) => {
    onChange({
      events: data.events.filter((e) => e.id !== eventId),
    });
    setExpandedEventId(null);
    setShowSaveBanner(true);
  };

  const addEvent = () => {
    const newEvent: CalendarEvent = {
      id: `new-${Date.now()}`,
      title: "New event",
      day: currentDay,
      startTime: "12:00",
      endTime: "13:00",
      isBusy: true,
    };
    onChange({ events: [...data.events, newEvent] });
    setExpandedEventId(newEvent.id);
    setShowSaveBanner(true);
  };

  const dismissBanner = () => {
    setShowSaveBanner(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Review your calendar</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tap events to edit details or toggle busy/free.
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
              onClick={() => {
                setSelectedDay(i);
                setExpandedEventId(null);
              }}
              className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                i === selectedDay
                  ? "bg-gray-900 text-white"
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
          dayEvents.map((event) => {
            const isExpanded = expandedEventId === event.id;
            return (
              <Card
                key={event.id}
                className={`overflow-hidden border-2 transition-colors ${
                  event.isBusy
                    ? "border-gray-300 bg-gray-100"
                    : "border-dashed border-gray-200 bg-white"
                }`}
              >
                {/* Collapsed row */}
                <button
                  className="flex w-full items-center justify-between px-4 py-3 text-left"
                  onClick={() => toggleEvent(event.id)}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">
                      {event.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {event.startTime} - {event.endTime}
                      {event.location && ` \u00B7 ${event.location}`}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      event.isBusy
                        ? "border-gray-400 text-gray-700"
                        : "border-dashed border-gray-300 text-gray-500"
                    }
                  >
                    {event.isBusy ? "Busy" : "Free"}
                  </Badge>
                </button>

                {/* Expanded edit form */}
                {isExpanded && (
                  <CardContent className="border-t border-gray-200 px-4 pb-4 pt-3">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">Title</Label>
                        <Input
                          className="mt-1 h-8 text-sm"
                          value={event.title}
                          onChange={(e) =>
                            updateEvent(event.id, { title: e.target.value })
                          }
                        />
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Label className="text-xs">Start</Label>
                          <Input
                            type="time"
                            className="mt-1 h-8 text-sm"
                            value={event.startTime}
                            onChange={(e) =>
                              updateEvent(event.id, { startTime: e.target.value })
                            }
                          />
                        </div>
                        <div className="flex-1">
                          <Label className="text-xs">End</Label>
                          <Input
                            type="time"
                            className="mt-1 h-8 text-sm"
                            value={event.endTime}
                            onChange={(e) =>
                              updateEvent(event.id, { endTime: e.target.value })
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Location</Label>
                        <Input
                          className="mt-1 h-8 text-sm"
                          placeholder="Add a location..."
                          value={event.location ?? ""}
                          onChange={(e) =>
                            updateEvent(event.id, { location: e.target.value })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() =>
                            updateEvent(event.id, { isBusy: !event.isBusy })
                          }
                          className="text-xs font-medium text-gray-600 hover:text-gray-900"
                        >
                          Mark as {event.isBusy ? "free" : "busy"}
                        </button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-red-500 hover:bg-red-50 hover:text-red-600"
                          onClick={() => deleteEvent(event.id)}
                        >
                          <Trash2 className="mr-1 h-3 w-3" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })
        )}

        {/* Add event button */}
        <Button
          variant="outline"
          size="sm"
          className="border-dashed"
          onClick={addEvent}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add event
        </Button>
      </div>

      {/* Save banner */}
      {showSaveBanner && (
        <Card className="border-gray-300 bg-gray-50">
          <CardContent className="py-3">
            <p className="mb-2 text-xs text-gray-600">
              Save changes to Google Calendar too, or keep only for Secretary?
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs"
                onClick={dismissBanner}
              >
                Update Google Calendar
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs"
                onClick={dismissBanner}
              >
                Keep for Secretary only
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button
          onClick={onNext}
          className="flex-1 bg-gray-900 text-white hover:bg-gray-800"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
