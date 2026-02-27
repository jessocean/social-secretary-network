"use client";

import { useState } from "react";
import { addDays, startOfWeek, format } from "date-fns";
import {
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  Hourglass,
  Send,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ConfirmationFlow } from "@/components/coordination/ConfirmationFlow";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ParticipantStatus = "sent" | "awaiting" | "confirmed" | "declined";

interface CoordParticipant {
  id: string;
  name: string;
  status: ParticipantStatus;
}

interface CoordProposal {
  id: string;
  title: string;
  type: string;
  startTime: string;
  endTime: string;
  locationName?: string;
  participants: CoordParticipant[];
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const now = new Date();
const weekStart = startOfWeek(now, { weekStartsOn: 1 });

function makeTime(dayOffset: number, hour: number): string {
  const d = addDays(weekStart, dayOffset);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

const INITIAL_COORD: CoordProposal[] = [
  {
    id: "c1",
    title: "Coffee with Alice",
    type: "coffee",
    startTime: makeTime(1, 10),
    endTime: makeTime(1, 11),
    locationName: "Reveille Coffee Co",
    participants: [
      { id: "u1", name: "Alice Chen", status: "sent" },
    ],
  },
  {
    id: "c2",
    title: "Playground with Bob & kids",
    type: "playground",
    startTime: makeTime(3, 15),
    endTime: makeTime(3, 17),
    locationName: "Duboce Park",
    participants: [
      { id: "u2", name: "Bob Martinez", status: "awaiting" },
    ],
  },
  {
    id: "c3",
    title: "Dinner with Carol",
    type: "dinner",
    startTime: makeTime(4, 19),
    endTime: makeTime(4, 21),
    locationName: "Nopalito",
    participants: [
      { id: "u3", name: "Carol Johnson", status: "confirmed" },
    ],
  },
  {
    id: "c4",
    title: "Playdate at your place",
    type: "playdate_home",
    startTime: makeTime(5, 10),
    endTime: makeTime(5, 12),
    locationName: "Home (106 Corbett Ave)",
    participants: [
      { id: "u4", name: "Dave Kim", status: "confirmed" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  ParticipantStatus,
  { icon: typeof CheckCircle2; label: string; color: string }
> = {
  sent: {
    icon: Send,
    label: "Message sent",
    color: "text-gray-500",
  },
  awaiting: {
    icon: Hourglass,
    label: "Awaiting response",
    color: "text-gray-500",
  },
  confirmed: {
    icon: CheckCircle2,
    label: "Confirmed",
    color: "text-gray-700",
  },
  declined: {
    icon: XCircle,
    label: "Declined",
    color: "text-gray-400",
  },
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CoordinationPage() {
  const [proposals, setProposals] = useState<CoordProposal[]>(INITIAL_COORD);

  // Summary stats
  const allParticipants = proposals.flatMap((p) => p.participants);
  const awaitingCount = allParticipants.filter(
    (p) => p.status === "awaiting" || p.status === "sent"
  ).length;
  const confirmedCount = allParticipants.filter(
    (p) => p.status === "confirmed"
  ).length;
  const declinedCount = allParticipants.filter(
    (p) => p.status === "declined"
  ).length;

  const handleConfirm = (proposalId: string, participantId: string) => {
    setProposals((prev) =>
      prev.map((prop) =>
        prop.id === proposalId
          ? {
              ...prop,
              participants: prop.participants.map((p) =>
                p.id === participantId
                  ? { ...p, status: "confirmed" as const }
                  : p
              ),
            }
          : prop
      )
    );
    toast.success("Confirmed! The event is all set.");
  };

  const handleDecline = (proposalId: string, participantId: string) => {
    setProposals((prev) =>
      prev.map((prop) =>
        prop.id === proposalId
          ? {
              ...prop,
              participants: prop.participants.map((p) =>
                p.id === participantId
                  ? { ...p, status: "declined" as const }
                  : p
              ),
            }
          : prop
      )
    );
    toast("Marked as declined. You may want to reschedule.");
  };

  // Separate into "needs action" and "all good"
  const needsAction = proposals.filter((p) =>
    p.participants.some((pp) => pp.status === "awaiting" || pp.status === "sent")
  );
  const allGood = proposals.filter(
    (p) =>
      !p.participants.some(
        (pp) => pp.status === "awaiting" || pp.status === "sent"
      )
  );

  return (
    <div className="mx-auto max-w-lg px-4 pt-6 pb-4">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Coordination</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Track responses and confirm plans
        </p>
      </div>

      {/* Summary */}
      <div className="mb-5 flex items-center gap-3">
        <Badge
          variant="outline"
          className={cn(
            "border-gray-300 text-gray-600",
            awaitingCount === 0 && "border-gray-200 text-gray-400"
          )}
        >
          <Hourglass className="mr-1 h-3 w-3" />
          {awaitingCount} awaiting
        </Badge>
        <Badge
          variant="outline"
          className="border-gray-300 text-gray-700"
        >
          <CheckCircle2 className="mr-1 h-3 w-3" />
          {confirmedCount} confirmed
        </Badge>
        {declinedCount > 0 && (
          <Badge
            variant="outline"
            className="border-gray-200 text-gray-400"
          >
            <XCircle className="mr-1 h-3 w-3" />
            {declinedCount} declined
          </Badge>
        )}
      </div>

      {/* Needs action section */}
      {needsAction.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
            <MessageCircle className="h-4 w-4 text-gray-500" />
            Awaiting responses
          </h2>
          <div className="space-y-3">
            {needsAction.map((proposal) => {
              const startDate = new Date(proposal.startTime);
              const endDate = new Date(proposal.endTime);

              return (
                <Card key={proposal.id} className="gap-0 border-dashed py-0">
                  <CardContent className="p-4">
                    {/* Proposal details */}
                    <h3 className="text-sm font-semibold text-gray-900">
                      {proposal.title}
                    </h3>
                    <div className="mt-1.5 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Clock className="h-3.5 w-3.5" />
                        <span>
                          {format(startDate, "EEE, MMM d")} &middot;{" "}
                          {format(startDate, "h:mm a")} -{" "}
                          {format(endDate, "h:mm a")}
                        </span>
                      </div>
                      {proposal.locationName && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{proposal.locationName}</span>
                        </div>
                      )}
                    </div>

                    <Separator className="my-3" />

                    {/* Participants with status */}
                    <div className="space-y-2.5">
                      {proposal.participants.map((participant) => {
                        const config = STATUS_CONFIG[participant.status];
                        const StatusIcon = config.icon;
                        const needsReply =
                          participant.status === "awaiting" ||
                          participant.status === "sent";

                        return (
                          <div
                            key={participant.id}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2.5">
                              <Avatar size="sm">
                                <AvatarFallback className="bg-gray-100 text-gray-700 text-[10px] font-medium">
                                  {getInitials(participant.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {participant.name}
                                </p>
                                <div className="flex items-center gap-1">
                                  <StatusIcon
                                    className={cn(
                                      "h-3 w-3",
                                      config.color
                                    )}
                                  />
                                  <span
                                    className={cn(
                                      "text-xs",
                                      config.color
                                    )}
                                  >
                                    {config.label}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {needsReply && (
                              <ConfirmationFlow
                                participantName={participant.name}
                                proposalTitle={proposal.title}
                                onConfirm={() =>
                                  handleConfirm(proposal.id, participant.id)
                                }
                                onDecline={() =>
                                  handleDecline(proposal.id, participant.id)
                                }
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* All confirmed section */}
      {allGood.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
            <CheckCircle2 className="h-4 w-4 text-gray-700" />
            All confirmed
          </h2>
          <div className="space-y-3">
            {allGood.map((proposal) => {
              const startDate = new Date(proposal.startTime);
              const endDate = new Date(proposal.endTime);

              return (
                <Card
                  key={proposal.id}
                  className="gap-0 border bg-gray-50/30 py-0"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">
                          {proposal.title}
                        </h3>
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                          <Clock className="h-3.5 w-3.5" />
                          <span>
                            {format(startDate, "EEE, MMM d")} &middot;{" "}
                            {format(startDate, "h:mm a")} -{" "}
                            {format(endDate, "h:mm a")}
                          </span>
                        </div>
                        {proposal.locationName && (
                          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500">
                            <MapPin className="h-3.5 w-3.5" />
                            <span>{proposal.locationName}</span>
                          </div>
                        )}
                      </div>
                      <Badge variant="outline" className="border-gray-300 text-gray-700 text-xs">
                        All set
                      </Badge>
                    </div>

                    <div className="mt-2.5 flex items-center gap-1.5">
                      {proposal.participants.map((p) => (
                        <Avatar key={p.id} size="sm">
                          <AvatarFallback className="bg-gray-100 text-gray-700 text-[10px] font-medium">
                            {getInitials(p.name)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      <span className="ml-1 text-xs text-gray-500">
                        {proposal.participants
                          .map((p) => p.name.split(" ")[0])
                          .join(", ")}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {proposals.length === 0 && (
        <div className="py-16 text-center">
          <MessageCircle className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-sm font-medium text-gray-900">
            Nothing to coordinate
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Accept proposals from the proposals page to start coordinating.
          </p>
        </div>
      )}
    </div>
  );
}
