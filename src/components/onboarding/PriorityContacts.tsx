"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, UserPlus } from "lucide-react";

interface PriorityContactsProps {
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function PriorityContacts({ onNext, onBack }: PriorityContactsProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Priority contacts</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose which friends to prioritize for scheduling.
        </p>
      </div>

      {/* Placeholder state */}
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
            <Users className="h-8 w-8 text-indigo-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700">
              Invite friends first to set priorities
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Once your friends join Social Secretary, you can set who you want
              to see most often.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => {
              // Would navigate to invite flow
            }}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Invite friends
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-indigo-50/50">
        <CardContent className="py-4">
          <p className="text-xs text-muted-foreground">
            You can always set priority contacts later from the Friends tab.
            Higher priority friends will be scheduled more frequently.
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
