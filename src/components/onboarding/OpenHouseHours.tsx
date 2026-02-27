"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DoorOpen } from "lucide-react";

interface OpenHouseHoursProps {
  data: {
    day: string;
    startTime: string;
    endTime: string;
    note: string;
  };
  onChange: (data: OpenHouseHoursProps["data"]) => void;
  onNext: () => void;
  onBack: () => void;
}

const DAYS = [
  { value: "", label: "No open house" },
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
];

export function OpenHouseHours({ data, onChange, onNext, onBack }: OpenHouseHoursProps) {
  const hasOpenHouse = data.day !== "";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Open house hours</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Set a recurring time when friends can drop by without scheduling.
        </p>
      </div>

      {/* Day selector */}
      <Card>
        <CardContent className="flex flex-col gap-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
              <DoorOpen className="h-5 w-5 text-violet-600" />
            </div>
            <div className="flex flex-col">
              <Label className="text-sm font-medium">Open house day</Label>
              <span className="text-xs text-muted-foreground">
                Pick a day of the week
              </span>
            </div>
          </div>

          <Select
            value={data.day}
            onValueChange={(val) => onChange({ ...data, day: val })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a day" />
            </SelectTrigger>
            <SelectContent>
              {DAYS.map((d) => (
                <SelectItem key={d.value} value={d.value || "none"}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Time and note */}
      {hasOpenHouse && (
        <>
          <Card>
            <CardContent className="flex flex-col gap-4 py-4">
              <Label className="text-sm font-medium">Time window</Label>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">Start</Label>
                  <Input
                    type="time"
                    value={data.startTime}
                    onChange={(e) =>
                      onChange({ ...data, startTime: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
                <span className="mt-5 text-sm text-muted-foreground">to</span>
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">End</Label>
                  <Input
                    type="time"
                    value={data.endTime}
                    onChange={(e) =>
                      onChange({ ...data, endTime: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-3 py-4">
              <Label className="text-sm font-medium">Note (optional)</Label>
              <Textarea
                placeholder="e.g., Ring the bell, come around back, kids welcome!"
                value={data.note}
                onChange={(e) =>
                  onChange({ ...data, note: e.target.value })
                }
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                This will be shared with friends who want to drop by
              </p>
            </CardContent>
          </Card>
        </>
      )}

      {!hasOpenHouse && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <DoorOpen className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-2 text-sm text-muted-foreground">
              No open house set
            </p>
            <p className="text-xs text-muted-foreground">
              Select a day above to start
            </p>
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
          className="flex-1 bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:from-indigo-600 hover:to-violet-600"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
