"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, X, Moon, Baby, Car } from "lucide-react";
import type { Constraint } from "@/hooks/useOnboarding";

interface ConstraintsEditorProps {
  data: {
    items: Constraint[];
    transitBuffer: number;
  };
  onChange: (data: { items: Constraint[]; transitBuffer: number }) => void;
  onNext: () => void;
  onBack: () => void;
}

const DAYS = [
  { value: "mon", label: "Mon" },
  { value: "tue", label: "Tue" },
  { value: "wed", label: "Wed" },
  { value: "thu", label: "Thu" },
  { value: "fri", label: "Fri" },
  { value: "sat", label: "Sat" },
  { value: "sun", label: "Sun" },
];

const TYPE_ICONS: Record<string, React.ReactNode> = {
  sleep: <Moon className="h-4 w-4" />,
  nap: <Baby className="h-4 w-4" />,
  transit: <Car className="h-4 w-4" />,
};

const TYPE_LABELS: Record<string, string> = {
  sleep: "Sleep",
  nap: "Nap time",
  transit: "Transit",
  work: "Work",
  custom: "Custom",
};

export function ConstraintsEditor({ data, onChange, onNext, onBack }: ConstraintsEditorProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [newType, setNewType] = useState<string>("nap");
  const [newLabel, setNewLabel] = useState("");
  const [newDays, setNewDays] = useState<string[]>([]);
  const [newStartTime, setNewStartTime] = useState("13:00");
  const [newEndTime, setNewEndTime] = useState("15:00");

  const removeConstraint = (id: string) => {
    onChange({
      ...data,
      items: data.items.filter((c) => c.id !== id),
    });
  };

  const addConstraint = () => {
    const constraint: Constraint = {
      id: `constraint-${Date.now()}`,
      type: newType as Constraint["type"],
      label: newLabel || TYPE_LABELS[newType] || "Custom",
      days: newDays.length > 0 ? newDays : ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
      startTime: newStartTime,
      endTime: newEndTime,
    };
    onChange({
      ...data,
      items: [...data.items, constraint],
    });
    setShowAdd(false);
    setNewLabel("");
    setNewDays([]);
    setNewStartTime("13:00");
    setNewEndTime("15:00");
  };

  const toggleDay = (day: string) => {
    setNewDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Set your constraints</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Block off times when you&apos;re not available for social plans.
        </p>
      </div>

      {/* Existing constraints */}
      <div className="flex flex-col gap-2">
        {data.items.map((constraint) => (
          <Card key={constraint.id} className="border">
            <CardContent className="flex items-start justify-between py-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                  {TYPE_ICONS[constraint.type] || <Moon className="h-4 w-4" />}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">
                    {constraint.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {constraint.startTime} - {constraint.endTime}
                  </span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {constraint.days.map((day) => (
                      <span
                        key={day}
                        className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600"
                      >
                        {day.charAt(0).toUpperCase() + day.slice(1)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-red-500"
                onClick={() => removeConstraint(constraint.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add constraint form */}
      {showAdd ? (
        <Card className="border-2 border-indigo-200 bg-indigo-50/50">
          <CardContent className="flex flex-col gap-4 py-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <Label className="text-xs">Type</Label>
                <Select value={newType} onValueChange={setNewType}>
                  <SelectTrigger className="mt-1 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sleep">Sleep</SelectItem>
                    <SelectItem value="nap">Nap time</SelectItem>
                    <SelectItem value="work">Work</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label className="text-xs">Label</Label>
                <Input
                  className="mt-1 bg-white"
                  placeholder={TYPE_LABELS[newType]}
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <Label className="text-xs">Start</Label>
                <Input
                  type="time"
                  className="mt-1 bg-white"
                  value={newStartTime}
                  onChange={(e) => setNewStartTime(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Label className="text-xs">End</Label>
                <Input
                  type="time"
                  className="mt-1 bg-white"
                  value={newEndTime}
                  onChange={(e) => setNewEndTime(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Days</Label>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {DAYS.map((day) => (
                  <label
                    key={day.value}
                    className="flex items-center gap-1.5"
                  >
                    <Checkbox
                      checked={newDays.includes(day.value)}
                      onCheckedChange={() => toggleDay(day.value)}
                    />
                    <span className="text-xs">{day.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdd(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={addConstraint}
                className="flex-1 bg-indigo-500 text-white hover:bg-indigo-600"
              >
                Add
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button
          variant="outline"
          onClick={() => setShowAdd(true)}
          className="border-dashed"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add constraint
        </Button>
      )}

      {/* Transit buffer slider */}
      <Card>
        <CardContent className="flex flex-col gap-3 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Car className="h-4 w-4 text-indigo-500" />
              <Label className="text-sm font-medium">Transit buffer</Label>
            </div>
            <span className="text-sm font-semibold text-indigo-600">
              {data.transitBuffer} min
            </span>
          </div>
          <Slider
            value={[data.transitBuffer]}
            onValueChange={([v]) =>
              onChange({ ...data, transitBuffer: v })
            }
            min={15}
            max={60}
            step={5}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Buffer time between events for travel
          </p>
        </CardContent>
      </Card>

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
