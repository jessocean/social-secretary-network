"use client";

import { useState, useCallback } from "react";
import { addDays, startOfWeek, subDays } from "date-fns";
import { RefreshCw, CheckCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  ProposalCard,
  type Proposal,
} from "@/components/proposals/ProposalCard";
import { MessageComposer } from "@/components/proposals/MessageComposer";

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

const INITIAL_PROPOSALS: Proposal[] = [
  {
    id: "p1",
    type: "coffee",
    title: "Coffee with Sarah",
    description: "Catch up over lattes at your favorite spot.",
    locationName: "Blue Bottle Coffee",
    startTime: makeTime(1, 10),
    endTime: makeTime(1, 11),
    status: "proposed",
    score: 0.92,
    participants: [
      { name: "Sarah Martinez", response: "pending" },
    ],
  },
  {
    id: "p2",
    type: "playground",
    title: "Playground with Emma & kids",
    description: "Let the kids play while you and Emma catch up.",
    locationName: "Central Park Playground",
    startTime: makeTime(3, 15),
    endTime: makeTime(3, 17),
    status: "proposed",
    score: 0.87,
    participants: [
      { name: "Emma Lewis", response: "pending" },
    ],
  },
  {
    id: "p3",
    type: "dinner",
    title: "Dinner with Rachel & Tom",
    description: "Double date night at the new Italian place.",
    locationName: "Lucia's Kitchen",
    startTime: makeTime(4, 19),
    endTime: makeTime(4, 21),
    status: "proposed",
    score: 0.81,
    participants: [
      { name: "Rachel Kim", response: "pending" },
      { name: "Tom Kim", response: "pending" },
    ],
  },
  {
    id: "p4",
    type: "playdate_home",
    title: "Playdate at your place",
    description: "Amy and her toddler come over for an indoor playdate.",
    locationName: "Home",
    startTime: makeTime(5, 10),
    endTime: makeTime(5, 12),
    status: "confirmed",
    score: 0.95,
    participants: [
      { name: "Amy Chen", response: "accepted" },
    ],
  },
  {
    id: "p5",
    type: "walk",
    title: "Morning walk with Priya",
    locationName: "Riverside Park",
    startTime: makeTime(2, 8),
    endTime: makeTime(2, 9),
    status: "confirmed",
    score: 0.78,
    participants: [
      { name: "Priya Patel", response: "accepted" },
    ],
  },
  {
    id: "p6",
    type: "coffee",
    title: "Coffee with Dana",
    locationName: "Stumptown Coffee",
    startTime: subDays(weekStart, 3).toISOString().replace("T00:", "T10:"),
    endTime: subDays(weekStart, 3).toISOString().replace("T00:", "T11:"),
    status: "confirmed",
    score: 0.85,
    participants: [
      { name: "Dana Wright", response: "accepted" },
    ],
  },
  {
    id: "p7",
    type: "park",
    title: "Park hangout with Lisa",
    locationName: "Prospect Park",
    startTime: subDays(weekStart, 5).toISOString().replace("T00:", "T14:"),
    endTime: subDays(weekStart, 5).toISOString().replace("T00:", "T16:"),
    status: "declined",
    score: 0.72,
    participants: [
      { name: "Lisa Johnson", response: "declined" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>(INITIAL_PROPOSALS);
  const [refreshing, setRefreshing] = useState(false);
  const [messageSheet, setMessageSheet] = useState<{
    open: boolean;
    proposal: Proposal | null;
    friendName: string;
  }>({ open: false, proposal: null, friendName: "" });

  // Filter proposals by tab
  const pending = proposals.filter(
    (p) => p.status === "proposed" || p.status === "draft"
  );
  const confirmed = proposals.filter(
    (p) => p.status === "confirmed" || p.status === "accepted"
  );
  const past = proposals.filter(
    (p) => p.status === "declined" || p.status === "cancelled"
  );

  // Handlers
  const handleAccept = useCallback((id: string) => {
    setProposals((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              status: "accepted" as const,
              participants: p.participants.map((pp) => ({
                ...pp,
                response: "accepted" as const,
              })),
            }
          : p
      )
    );
    toast.success("Proposal accepted! Time to send messages.");
  }, []);

  const handleDecline = useCallback((id: string) => {
    setProposals((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status: "declined" as const } : p
      )
    );
    toast("Proposal declined.");
  }, []);

  const handleSendMessage = useCallback(
    (id: string) => {
      const proposal = proposals.find((p) => p.id === id);
      if (!proposal) return;
      const friendName = proposal.participants[0]?.name ?? "Friend";
      setMessageSheet({ open: true, proposal, friendName });
    },
    [proposals]
  );

  const handleCancel = useCallback((id: string) => {
    setProposals((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status: "cancelled" as const } : p
      )
    );
    toast("Event cancelled.");
  }, []);

  const handleAcceptAll = () => {
    setProposals((prev) =>
      prev.map((p) =>
        p.status === "proposed"
          ? {
              ...p,
              status: "accepted" as const,
              participants: p.participants.map((pp) => ({
                ...pp,
                response: "accepted" as const,
              })),
            }
          : p
      )
    );
    toast.success(`Accepted ${pending.length} proposals!`);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 1000));
    setRefreshing(false);
    toast.success("Proposals refreshed.");
  };

  return (
    <div className="mx-auto max-w-lg px-4 pt-6 pb-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Proposals</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefresh}
          disabled={refreshing}
          className="text-gray-500"
        >
          {refreshing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <RefreshCw className="h-5 w-5" />
          )}
        </Button>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="pending" className="flex-1">
            Pending
            {pending.length > 0 && (
              <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-semibold text-indigo-700">
                {pending.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="confirmed" className="flex-1">
            Confirmed
            {confirmed.length > 0 && (
              <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-[10px] font-semibold text-green-700">
                {confirmed.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="past" className="flex-1">
            Past
          </TabsTrigger>
        </TabsList>

        {/* Pending Tab */}
        <TabsContent value="pending">
          {pending.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="mb-3 w-full border-indigo-200 text-indigo-600 hover:bg-indigo-50"
              onClick={handleAcceptAll}
            >
              <CheckCheck className="h-4 w-4" />
              Accept all recommended ({pending.length})
            </Button>
          )}
          <div className="space-y-3">
            {pending.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-gray-500">
                  No pending proposals. Generate some from the dashboard!
                </p>
              </div>
            ) : (
              pending.map((p) => (
                <ProposalCard
                  key={p.id}
                  proposal={p}
                  onAccept={handleAccept}
                  onDecline={handleDecline}
                />
              ))
            )}
          </div>
        </TabsContent>

        {/* Confirmed Tab */}
        <TabsContent value="confirmed">
          <div className="space-y-3">
            {confirmed.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-gray-500">
                  No confirmed events yet. Accept some proposals to get started!
                </p>
              </div>
            ) : (
              confirmed.map((p) => (
                <ProposalCard
                  key={p.id}
                  proposal={p}
                  onSendMessage={handleSendMessage}
                  onCancel={handleCancel}
                />
              ))
            )}
          </div>
        </TabsContent>

        {/* Past Tab */}
        <TabsContent value="past">
          <div className="space-y-3">
            {past.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-gray-500">
                  No past or declined proposals.
                </p>
              </div>
            ) : (
              past.map((p) => (
                <ProposalCard key={p.id} proposal={p} />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Message Composer Sheet */}
      {messageSheet.proposal && (
        <MessageComposer
          open={messageSheet.open}
          onOpenChange={(open) =>
            setMessageSheet((prev) => ({ ...prev, open }))
          }
          proposal={{
            title: messageSheet.proposal.title,
            type: messageSheet.proposal.type,
            startTime: messageSheet.proposal.startTime,
            locationName: messageSheet.proposal.locationName,
          }}
          friendName={messageSheet.friendName}
        />
      )}
    </div>
  );
}
