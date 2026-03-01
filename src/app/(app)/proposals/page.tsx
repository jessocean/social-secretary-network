"use client";

import { useState, useCallback, useEffect } from "react";
import { startOfWeek } from "date-fns";
import { RefreshCw, CheckCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ProposalCard,
  type Proposal,
} from "@/components/proposals/ProposalCard";
import { MessageComposer } from "@/components/proposals/MessageComposer";

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

const STORAGE_KEY = "ssn-proposals";

function loadProposals(): Proposal[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>(loadProposals);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("proposed");
  const [messageSent, setMessageSent] = useState<Record<string, boolean>>({});
  const [messageSheet, setMessageSheet] = useState<{
    open: boolean;
    proposal: Proposal | null;
    friendName: string;
  }>({ open: false, proposal: null, friendName: "" });

  // Persist proposals to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(proposals));
    } catch {}
  }, [proposals]);

  // Filter proposals by tab
  const proposed = proposals.filter(
    (p) => p.status === "proposed" || p.status === "draft"
  );
  const pending = proposals.filter(
    (p) => p.status === "accepted"
  );
  const confirmed = proposals.filter(
    (p) => p.status === "confirmed"
  );
  const past = proposals.filter(
    (p) => p.status === "declined" || p.status === "cancelled"
  );

  // Auto-navigate tabs when lists empty
  useEffect(() => {
    if (activeTab === "proposed" && proposed.length === 0 && pending.length > 0) {
      setActiveTab("pending");
    } else if (activeTab === "pending" && pending.length === 0 && confirmed.length > 0) {
      setActiveTab("confirmed");
    }
  }, [activeTab, proposed.length, pending.length, confirmed.length]);

  // Handlers
  const handleAccept = useCallback((id: string) => {
    setProposals((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, status: "accepted" as const }
          : p
      )
    );
    toast.success("Proposal accepted! Coordinate with your friends.");
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
          ? { ...p, status: "accepted" as const }
          : p
      )
    );
    toast.success(`Accepted ${proposed.length} proposals!`);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

      // Read user's onboarding locations from localStorage
      let userLocations;
      try {
        const onboarding = JSON.parse(
          localStorage.getItem("ssn-onboarding") || "{}"
        );
        userLocations = onboarding.locations?.items;
      } catch {}

      const res = await fetch("/api/agent/negotiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekStart: weekStart.toISOString(),
          userLocations,
        }),
      });

      if (!res.ok) throw new Error("Failed to refresh");
      const data = await res.json();

      if (data.proposals?.length > 0) {
        const fresh = data.proposals.map(
          (p: {
            type: string;
            title: string;
            locationName: string;
            startTime: string;
            endTime: string;
            participants: { userId: string; name?: string }[];
          }, i: number) => ({
            id: `gen-${Date.now()}-${i}`,
            type: p.type,
            title: p.title,
            description: `${p.type} at ${p.locationName}`,
            locationName: p.locationName,
            startTime: p.startTime,
            endTime: p.endTime,
            status: "proposed" as const,
            participants: p.participants.map(
              (part: { userId: string; name?: string }) => ({
                name: part.name || part.userId,
                response: "pending" as const,
              })
            ),
          })
        );
        setProposals(fresh);
        toast.success(`Refreshed — ${fresh.length} proposals generated.`);
      } else {
        toast("No proposals generated for this week.");
      }
    } catch {
      toast.error("Could not refresh proposals. Try again.");
    } finally {
      setRefreshing(false);
    }
  };

  const toggleMessageSent = (proposalId: string, participantName: string) => {
    const key = `${proposalId}:${participantName}`;
    setMessageSent((prev) => ({ ...prev, [key]: !prev[key] }));
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="proposed" className="flex-1">
            Proposed
            {proposed.length > 0 && (
              <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-[10px] font-semibold text-gray-700">
                {proposed.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex-1">
            Pending
            {pending.length > 0 && (
              <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-[10px] font-semibold text-gray-700">
                {pending.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="confirmed" className="flex-1">
            Confirmed
            {confirmed.length > 0 && (
              <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-[10px] font-semibold text-gray-700">
                {confirmed.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Proposed Tab */}
        <TabsContent value="proposed">
          {proposed.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="mb-3 w-full"
              onClick={handleAcceptAll}
            >
              <CheckCheck className="h-4 w-4" />
              Accept all ({proposed.length})
            </Button>
          )}
          <div className="space-y-3">
            {proposed.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-gray-500">
                  No proposed events. Generate some from the dashboard!
                </p>
              </div>
            ) : (
              proposed.map((p) => (
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

        {/* Pending Tab - accepted by me, awaiting others */}
        <TabsContent value="pending">
          <div className="space-y-3">
            {pending.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-gray-500">
                  No pending events. Accept some proposals first!
                </p>
              </div>
            ) : (
              pending.map((p) => (
                <Card key={p.id} className="gap-0 border py-0">
                  <CardContent className="p-4">
                    <ProposalCard
                      proposal={p}
                      onCancel={handleCancel}
                    />

                    {/* Messaging checklist for each participant */}
                    <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
                      <p className="text-xs font-medium text-gray-600">
                        Coordinate with participants:
                      </p>
                      {p.participants.map((participant) => {
                        const key = `${p.id}:${participant.name}`;
                        const isSent = messageSent[key] ?? false;

                        return (
                          <label
                            key={participant.name}
                            className="flex cursor-pointer items-center gap-2 text-xs"
                          >
                            <Checkbox
                              checked={isSent}
                              onCheckedChange={() =>
                                toggleMessageSent(p.id, participant.name)
                              }
                            />
                            <span className={isSent ? "text-gray-400 line-through" : "text-gray-700"}>
                              Send message to invite {participant.name.split(" ")[0]}
                            </span>
                            {!isSent && (
                              <button
                                className="ml-auto text-xs font-medium text-gray-600 hover:text-gray-900 underline"
                                onClick={() => handleSendMessage(p.id)}
                              >
                                Compose
                              </button>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
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
                  No confirmed events yet. Events appear here once both parties confirm.
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

        {/* Past - small section */}
        {past.length > 0 && (
          <div className="mt-6 border-t border-gray-100 pt-4">
            <h3 className="mb-2 text-xs font-medium text-gray-400 uppercase">Past</h3>
            <div className="space-y-2">
              {past.map((p) => (
                <ProposalCard key={p.id} proposal={p} />
              ))}
            </div>
          </div>
        )}
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
