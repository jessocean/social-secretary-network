"use client";

import { format } from "date-fns";
import {
  Coffee,
  Trees,
  Home,
  UtensilsCrossed,
  TreePine,
  GraduationCap,
  Footprints,
  Calendar,
  MapPin,
  Clock,
  Check,
  X,
  MessageCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AvatarGroup } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProposalParticipant {
  name: string;
  response: "pending" | "accepted" | "declined" | "tentative";
}

export interface Proposal {
  id: string;
  type: string;
  title: string;
  description?: string;
  locationName?: string;
  startTime: string;
  endTime: string;
  status: "draft" | "proposed" | "accepted" | "declined" | "confirmed" | "cancelled";
  score?: number;
  participants: ProposalParticipant[];
}

export interface ProposalCardProps {
  proposal: Proposal;
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
  onSendMessage?: (id: string) => void;
  onCancel?: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Icon map
// ---------------------------------------------------------------------------

const TYPE_ICONS: Record<string, typeof Coffee> = {
  playground: Trees,
  coffee: Coffee,
  playdate_home: Home,
  dinner: UtensilsCrossed,
  park: TreePine,
  class: GraduationCap,
  walk: Footprints,
  other: Calendar,
};

const TYPE_COLORS: Record<string, string> = {
  playground: "bg-gray-100 text-gray-700",
  coffee: "bg-gray-100 text-gray-700",
  playdate_home: "bg-gray-100 text-gray-700",
  dinner: "bg-gray-100 text-gray-700",
  park: "bg-gray-100 text-gray-700",
  class: "bg-gray-100 text-gray-700",
  walk: "bg-gray-100 text-gray-700",
  other: "bg-gray-100 text-gray-700",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getResponseColor(response: string): string {
  switch (response) {
    case "accepted":
      return "bg-green-500";
    case "declined":
      return "bg-red-500";
    case "tentative":
      return "bg-amber-500";
    default:
      return "bg-gray-400";
  }
}

function formatScorePercent(score: number): string {
  return `${Math.round(score * 100)}%`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProposalCard({
  proposal,
  onAccept,
  onDecline,
  onSendMessage,
  onCancel,
}: ProposalCardProps) {
  const Icon = TYPE_ICONS[proposal.type] ?? Calendar;
  const iconColorClass = TYPE_COLORS[proposal.type] ?? TYPE_COLORS.other;

  const startDate = new Date(proposal.startTime);
  const endDate = new Date(proposal.endTime);
  const dateStr = format(startDate, "EEE, MMM d");
  const timeStr = `${format(startDate, "h:mm a")} - ${format(endDate, "h:mm a")}`;

  const isPending = proposal.status === "proposed" || proposal.status === "draft";
  const isConfirmed = proposal.status === "confirmed" || proposal.status === "accepted";

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardContent className="p-4">
        {/* Top row: icon + title + score badge */}
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
              iconColorClass
            )}
          >
            <Icon className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="truncate text-sm font-semibold text-gray-900">
                {proposal.title}
              </h3>
            </div>

            {/* Date, time, location */}
            <div className="mt-1.5 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span>
                  {dateStr} &middot; {timeStr}
                </span>
              </div>
              {proposal.locationName && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{proposal.locationName}</span>
                </div>
              )}
            </div>

            {proposal.description && (
              <p className="mt-1.5 line-clamp-2 text-xs text-gray-500">
                {proposal.description}
              </p>
            )}
          </div>
        </div>

        {/* Participants */}
        {proposal.participants.length > 0 && (
          <div className="mt-3 flex items-center gap-2">
            <AvatarGroup>
              {proposal.participants.map((p) => (
                <Avatar key={p.name} size="sm" className="relative">
                  <AvatarFallback className="bg-gray-100 text-gray-700 text-[10px] font-medium">
                    {getInitials(p.name)}
                  </AvatarFallback>
                  <span
                    className={cn(
                      "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white",
                      getResponseColor(p.response)
                    )}
                  />
                </Avatar>
              ))}
            </AvatarGroup>
            <span className="text-xs text-gray-500">
              {proposal.participants.map((p) => p.name.split(" ")[0]).join(", ")}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="mt-3 flex items-center gap-2">
          {isPending && (
            <>
              <Button
                size="sm"
                className="flex-1 bg-gray-900 hover:bg-gray-800"
                onClick={() => onAccept?.(proposal.id)}
              >
                <Check className="h-4 w-4" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => onDecline?.(proposal.id)}
              >
                <X className="h-4 w-4" />
                Decline
              </Button>
            </>
          )}

          {isConfirmed && (
            <>
              <Button
                size="sm"
                className="flex-1 bg-gray-900 hover:bg-gray-800"
                onClick={() => onSendMessage?.(proposal.id)}
              >
                <MessageCircle className="h-4 w-4" />
                Send message
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => onCancel?.(proposal.id)}
              >
                Cancel
              </Button>
            </>
          )}

          {proposal.status === "declined" && (
            <Badge variant="secondary" className="text-gray-500">
              Declined
            </Badge>
          )}

          {proposal.status === "cancelled" && (
            <Badge variant="secondary" className="text-gray-500">
              Cancelled
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
