"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CloudRain, Sun } from "lucide-react";

interface WeatherPrefsProps {
  data: {
    weatherSensitive: boolean;
    rainAlternative: string;
  };
  onChange: (data: WeatherPrefsProps["data"]) => void;
  onNext: () => void;
  onBack: () => void;
}

export function WeatherPrefs({ data, onChange, onNext, onBack }: WeatherPrefsProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Weather preferences</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Should we adjust plans based on the weather?
        </p>
      </div>

      {/* Weather sensitive toggle */}
      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
              <Sun className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex flex-col">
              <Label className="text-sm font-medium">Weather sensitive</Label>
              <span className="text-xs text-muted-foreground">
                Move outdoor plans inside on bad weather days
              </span>
            </div>
          </div>
          <Switch
            checked={data.weatherSensitive}
            onCheckedChange={(checked) =>
              onChange({ ...data, weatherSensitive: checked })
            }
          />
        </CardContent>
      </Card>

      {/* Rain alternative */}
      {data.weatherSensitive && (
        <Card className="border-2 border-blue-200 bg-blue-50/50">
          <CardContent className="flex flex-col gap-3 py-4">
            <div className="flex items-center gap-2">
              <CloudRain className="h-4 w-4 text-blue-500" />
              <Label className="text-sm font-medium">Rain alternative</Label>
            </div>
            <Textarea
              placeholder="e.g., Move to indoor play area at the mall, or reschedule to next available slot"
              value={data.rainAlternative}
              onChange={(e) =>
                onChange({ ...data, rainAlternative: e.target.value })
              }
              className="bg-white"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              What should happen when outdoor plans get rained out?
            </p>
          </CardContent>
        </Card>
      )}

      {!data.weatherSensitive && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <CloudRain className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-2 text-sm text-muted-foreground">
              Weather won&apos;t affect your plans
            </p>
            <p className="text-xs text-muted-foreground">
              Toggle above to set a rain alternative
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
