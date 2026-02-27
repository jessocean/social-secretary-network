"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X, MapPin, Home, TreePine, Coffee } from "lucide-react";
import type { Location } from "@/hooks/useOnboarding";

interface LocationPickerProps {
  data: { items: Location[] };
  onChange: (data: { items: Location[] }) => void;
  onNext: () => void;
  onBack: () => void;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  home: <Home className="h-4 w-4" />,
  playground: <TreePine className="h-4 w-4" />,
  cafe: <Coffee className="h-4 w-4" />,
  park: <TreePine className="h-4 w-4" />,
  other: <MapPin className="h-4 w-4" />,
};

const TYPE_LABELS: Record<string, string> = {
  home: "Home",
  playground: "Playground",
  cafe: "Cafe",
  park: "Park",
  other: "Other",
};

export function LocationPicker({ data, onChange, onNext, onBack }: LocationPickerProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType] = useState("home");
  const [newAddress, setNewAddress] = useState("");
  const [newHostingOk, setNewHostingOk] = useState(false);

  const addLocation = () => {
    if (!newLabel.trim()) return;

    const location: Location = {
      id: `loc-${Date.now()}`,
      label: newLabel.trim(),
      type: newType as Location["type"],
      address: newAddress.trim(),
      hostingOk: newHostingOk,
    };

    onChange({ items: [...data.items, location] });
    setShowAdd(false);
    setNewLabel("");
    setNewType("home");
    setNewAddress("");
    setNewHostingOk(false);
  };

  const removeLocation = (id: string) => {
    onChange({ items: data.items.filter((l) => l.id !== id) });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Your locations</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Add places you frequently visit or can host at.
        </p>
      </div>

      {/* Existing locations */}
      {data.items.length > 0 && (
        <div className="flex flex-col gap-2">
          {data.items.map((location) => (
            <Card key={location.id}>
              <CardContent className="flex items-start justify-between py-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                    {TYPE_ICONS[location.type] || <MapPin className="h-4 w-4" />}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">
                      {location.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {TYPE_LABELS[location.type]}
                      {location.hostingOk && " \u00B7 Can host"}
                    </span>
                    {location.address && (
                      <span className="text-xs text-muted-foreground">
                        {location.address}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-400 hover:text-red-500"
                  onClick={() => removeLocation(location.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {data.items.length === 0 && !showAdd && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <MapPin className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-2 text-sm text-muted-foreground">
              No locations added yet
            </p>
          </CardContent>
        </Card>
      )}

      {/* Add location form */}
      {showAdd ? (
        <Card className="border-2 border-indigo-200 bg-indigo-50/50">
          <CardContent className="flex flex-col gap-4 py-4">
            <div>
              <Label className="text-xs">Name</Label>
              <Input
                className="mt-1 bg-white"
                placeholder="e.g., Central Park Playground"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
              />
            </div>

            <div>
              <Label className="text-xs">Type</Label>
              <Select value={newType} onValueChange={setNewType}>
                <SelectTrigger className="mt-1 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">Home</SelectItem>
                  <SelectItem value="playground">Playground</SelectItem>
                  <SelectItem value="cafe">Cafe</SelectItem>
                  <SelectItem value="park">Park</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Address (optional)</Label>
              <Input
                className="mt-1 bg-white"
                placeholder="123 Main St"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <Label className="text-sm">Hosting OK</Label>
                <span className="text-xs text-muted-foreground">
                  Can you host playdates here?
                </span>
              </div>
              <Switch
                checked={newHostingOk}
                onCheckedChange={setNewHostingOk}
              />
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
                onClick={addLocation}
                disabled={!newLabel.trim()}
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
          Add location
        </Button>
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
