"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  TreePine,
  Coffee,
  Home,
  UtensilsCrossed,
  Sun,
  GraduationCap,
  Footprints,
} from "lucide-react";

interface PreferencesEditorProps {
  data: {
    engagementTypes: string[];
    maxEventsPerWeek: number;
    preferMornings: boolean;
    preferAfternoons: boolean;
    preferEvenings: boolean;
    preferWeekends: boolean;
  };
  onChange: (data: PreferencesEditorProps["data"]) => void;
  onNext: () => void;
  onBack: () => void;
}

const ENGAGEMENT_TYPES = [
  { value: "playground", label: "Playground", icon: TreePine },
  { value: "coffee", label: "Coffee", icon: Coffee },
  { value: "playdate_home", label: "Playdate at home", icon: Home },
  { value: "dinner", label: "Dinner", icon: UtensilsCrossed },
  { value: "park", label: "Park", icon: Sun },
  { value: "class", label: "Class", icon: GraduationCap },
  { value: "walk", label: "Walk", icon: Footprints },
];

const TIME_SLOTS = [
  { key: "preferMornings" as const, label: "Morning", desc: "8am - 12pm" },
  { key: "preferAfternoons" as const, label: "Afternoon", desc: "12pm - 5pm" },
  { key: "preferEvenings" as const, label: "Evening", desc: "5pm - 9pm" },
];

export function PreferencesEditor({ data, onChange, onNext, onBack }: PreferencesEditorProps) {
  const toggleEngagementType = (type: string) => {
    const types = data.engagementTypes.includes(type)
      ? data.engagementTypes.filter((t) => t !== type)
      : [...data.engagementTypes, type];
    onChange({ ...data, engagementTypes: types });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Your preferences</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          What kinds of social activities do you enjoy?
        </p>
      </div>

      {/* Engagement types */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium">Activity types</Label>
        <div className="grid grid-cols-2 gap-2">
          {ENGAGEMENT_TYPES.map((type) => {
            const isSelected = data.engagementTypes.includes(type.value);
            return (
              <button
                key={type.value}
                onClick={() => toggleEngagementType(type.value)}
                className={`flex items-center gap-2.5 rounded-xl border-2 px-3 py-2.5 text-left text-sm transition-colors ${
                  isSelected
                    ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                }`}
              >
                <Checkbox
                  checked={isSelected}
                  className="pointer-events-none"
                  tabIndex={-1}
                />
                <type.icon className="h-4 w-4 shrink-0" />
                <span className="text-xs font-medium">{type.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Max events per week */}
      <Card>
        <CardContent className="flex flex-col gap-3 py-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Max events per week</Label>
            <span className="text-sm font-semibold text-indigo-600">
              {data.maxEventsPerWeek}
            </span>
          </div>
          <Slider
            value={[data.maxEventsPerWeek]}
            onValueChange={([v]) =>
              onChange({ ...data, maxEventsPerWeek: v })
            }
            min={1}
            max={7}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1 event</span>
            <span>7 events</span>
          </div>
        </CardContent>
      </Card>

      {/* Time of day preferences */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium">Preferred times</Label>
        <div className="flex flex-col gap-2">
          {TIME_SLOTS.map((slot) => (
            <Card key={slot.key}>
              <CardContent className="flex items-center justify-between py-3">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{slot.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {slot.desc}
                  </span>
                </div>
                <Switch
                  checked={data[slot.key]}
                  onCheckedChange={(checked) =>
                    onChange({ ...data, [slot.key]: checked })
                  }
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Weekend preference */}
      <Card>
        <CardContent className="flex items-center justify-between py-3">
          <div className="flex flex-col">
            <span className="text-sm font-medium">Prefer weekends</span>
            <span className="text-xs text-muted-foreground">
              Prioritize Saturday & Sunday for social plans
            </span>
          </div>
          <Switch
            checked={data.preferWeekends}
            onCheckedChange={(checked) =>
              onChange({ ...data, preferWeekends: checked })
            }
          />
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
