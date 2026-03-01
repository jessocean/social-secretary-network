"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FriendCard, type Friend } from "@/components/friends/FriendCard";
import { InviteSheet } from "@/components/friends/InviteSheet";
import { UserPlus, Search, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";

type TabValue = "all" | "pending" | "calendar_only";

interface ApiFriend {
  id: string;
  friendUserId: string;
  displayName: string | null;
  phone: string;
  avatarUrl: string | null;
  status: "active" | "pending" | "calendar_only" | "declined";
  priority: number;
  nickname: string | null;
  lastHangout: string | null;
  incoming: boolean;
}

function toFriend(af: ApiFriend): Friend {
  return {
    id: af.id,
    displayName: af.displayName,
    phone: af.phone,
    status: af.status,
    priority: af.priority,
    nickname: af.nickname,
    lastHangout: af.lastHangout,
    avatarUrl: af.avatarUrl,
  };
}

export default function FriendsPage() {
  const [apiFriends, setApiFriends] = useState<ApiFriend[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TabValue>("all");
  const [inviteOpen, setInviteOpen] = useState(false);

  const fetchFriends = useCallback(async () => {
    try {
      const res = await fetch("/api/friends");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setApiFriends(data.friends ?? []);
    } catch {
      // Silently fail — empty state will show
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  const friends = apiFriends.map(toFriend);

  // Filter friends by search and tab
  const filteredFriends = useMemo(() => {
    let filtered = friends;

    if (activeTab === "pending") {
      filtered = filtered.filter((f) => f.status === "pending");
    } else if (activeTab === "calendar_only") {
      filtered = filtered.filter((f) => f.status === "calendar_only");
    }

    if (search.trim()) {
      const query = search.toLowerCase();
      filtered = filtered.filter(
        (f) =>
          f.displayName?.toLowerCase().includes(query) ||
          f.phone.includes(query) ||
          f.nickname?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [friends, activeTab, search]);

  const pendingCount = friends.filter((f) => f.status === "pending").length;
  const calendarOnlyCount = friends.filter(
    (f) => f.status === "calendar_only"
  ).length;

  const apiAction = async (friendshipId: string, action: string, extra?: Record<string, unknown>) => {
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, friendshipId, ...extra }),
      });
      if (!res.ok) throw new Error("Failed");
      return true;
    } catch {
      toast.error("Something went wrong. Please try again.");
      return false;
    }
  };

  const handleUpdatePriority = async (friendId: string, priority: number) => {
    if (await apiAction(friendId, "update", { priority })) {
      setApiFriends((prev) =>
        prev.map((f) => (f.id === friendId ? { ...f, priority } : f))
      );
      toast.success("Priority updated");
    }
  };

  const handleUpdateNickname = async (friendId: string, nickname: string) => {
    if (await apiAction(friendId, "update", { nickname })) {
      setApiFriends((prev) =>
        prev.map((f) =>
          f.id === friendId ? { ...f, nickname: nickname || null } : f
        )
      );
      toast.success("Nickname updated");
    }
  };

  const handleRemove = async (friendId: string) => {
    const friend = apiFriends.find((f) => f.id === friendId);
    if (await apiAction(friendId, "remove")) {
      setApiFriends((prev) => prev.filter((f) => f.id !== friendId));
      toast.success(`${friend?.displayName ?? "Friend"} removed`);
    }
  };

  const handleAccept = async (friendId: string) => {
    const friend = apiFriends.find((f) => f.id === friendId);
    if (await apiAction(friendId, "accept")) {
      setApiFriends((prev) =>
        prev.map((f) =>
          f.id === friendId ? { ...f, status: "active" as const } : f
        )
      );
      toast.success(`${friend?.displayName ?? "Friend"} accepted!`);
    }
  };

  const handleDecline = async (friendId: string) => {
    if (await apiAction(friendId, "decline")) {
      setApiFriends((prev) => prev.filter((f) => f.id !== friendId));
      toast.success("Friend request declined");
    }
  };

  if (loading) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center bg-gray-50">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        <p className="mt-2 text-sm text-muted-foreground">Loading friends...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-50/95 px-4 pb-3 pt-6 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Friends</h1>
            <p className="text-sm text-muted-foreground">
              {friends.length} {friends.length === 1 ? "friend" : "friends"}
            </p>
          </div>
          <Button
            className="bg-gray-900 text-white hover:bg-gray-800"
            size="sm"
            onClick={() => setInviteOpen(true)}
          >
            <UserPlus className="mr-1.5 h-4 w-4" />
            Invite
          </Button>
        </div>

        {/* Search */}
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search friends..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9 bg-white"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 pb-3">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as TabValue)}
        >
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">
              All
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex-1">
              Pending
              {pendingCount > 0 && (
                <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-gray-700 px-1 text-[10px] font-semibold text-white">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="calendar_only" className="flex-1">
              Calendar Only
              {calendarOnlyCount > 0 && (
                <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-gray-500 px-1 text-[10px] font-semibold text-white">
                  {calendarOnlyCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <FriendList
              friends={filteredFriends}
              onUpdatePriority={handleUpdatePriority}
              onUpdateNickname={handleUpdateNickname}
              onRemove={handleRemove}
              onAccept={handleAccept}
              onDecline={handleDecline}
              onInvite={() => setInviteOpen(true)}
            />
          </TabsContent>
          <TabsContent value="pending">
            <FriendList
              friends={filteredFriends}
              onUpdatePriority={handleUpdatePriority}
              onUpdateNickname={handleUpdateNickname}
              onRemove={handleRemove}
              onAccept={handleAccept}
              onDecline={handleDecline}
              onInvite={() => setInviteOpen(true)}
              emptyMessage="No pending friend requests"
            />
          </TabsContent>
          <TabsContent value="calendar_only">
            <FriendList
              friends={filteredFriends}
              onUpdatePriority={handleUpdatePriority}
              onUpdateNickname={handleUpdateNickname}
              onRemove={handleRemove}
              onAccept={handleAccept}
              onDecline={handleDecline}
              onInvite={() => setInviteOpen(true)}
              emptyMessage="No calendar-only friends yet"
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Invite sheet */}
      <InviteSheet open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </div>
  );
}

// Friend list sub-component
function FriendList({
  friends,
  onUpdatePriority,
  onUpdateNickname,
  onRemove,
  onAccept,
  onDecline,
  onInvite,
  emptyMessage,
}: {
  friends: Friend[];
  onUpdatePriority: (friendId: string, priority: number) => void;
  onUpdateNickname: (friendId: string, nickname: string) => void;
  onRemove: (friendId: string) => void;
  onAccept: (friendId: string) => void;
  onDecline: (friendId: string) => void;
  onInvite: () => void;
  emptyMessage?: string;
}) {
  if (friends.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <Users className="h-8 w-8 text-gray-400" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-700">
            {emptyMessage ?? "No friends yet. Invite someone!"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Send an invite link and start scheduling hangouts together.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onInvite}
          className="mt-1"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Invite a friend
        </Button>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-2 pb-4 pt-1">
        {friends.map((friend) => (
          <FriendCard
            key={friend.id}
            friend={friend}
            onUpdatePriority={onUpdatePriority}
            onUpdateNickname={onUpdateNickname}
            onRemove={onRemove}
            onAccept={onAccept}
            onDecline={onDecline}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
