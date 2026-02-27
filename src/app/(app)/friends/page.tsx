"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FriendCard, type Friend } from "@/components/friends/FriendCard";
import { InviteSheet } from "@/components/friends/InviteSheet";
import { UserPlus, Search, Users } from "lucide-react";
import { toast } from "sonner";

// Mock friends data (inline)
const MOCK_FRIENDS: Friend[] = [
  {
    id: "f1",
    displayName: "Alice Chen",
    phone: "+1 555-0101",
    status: "active",
    priority: 8,
    nickname: null,
    lastHangout: "2026-02-20",
  },
  {
    id: "f2",
    displayName: "Bob Martinez",
    phone: "+1 555-0102",
    status: "active",
    priority: 6,
    nickname: "Bobby",
    lastHangout: "2026-02-14",
  },
  {
    id: "f3",
    displayName: "Carol Johnson",
    phone: "+1 555-0103",
    status: "pending",
    priority: 5,
    nickname: null,
    lastHangout: null,
  },
  {
    id: "f4",
    displayName: "Dave Kim",
    phone: "+1 555-0104",
    status: "calendar_only",
    priority: 3,
    nickname: null,
    lastHangout: "2026-01-30",
  },
];

type TabValue = "all" | "pending" | "calendar_only";

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>(MOCK_FRIENDS);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TabValue>("all");
  const [inviteOpen, setInviteOpen] = useState(false);

  // Filter friends by search and tab
  const filteredFriends = useMemo(() => {
    let filtered = friends;

    // Filter by tab
    if (activeTab === "pending") {
      filtered = filtered.filter((f) => f.status === "pending");
    } else if (activeTab === "calendar_only") {
      filtered = filtered.filter((f) => f.status === "calendar_only");
    }

    // Filter by search
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

  const handleUpdatePriority = (friendId: string, priority: number) => {
    setFriends((prev) =>
      prev.map((f) => (f.id === friendId ? { ...f, priority } : f))
    );
    toast.success("Priority updated");
  };

  const handleUpdateNickname = (friendId: string, nickname: string) => {
    setFriends((prev) =>
      prev.map((f) =>
        f.id === friendId ? { ...f, nickname: nickname || null } : f
      )
    );
    toast.success("Nickname updated");
  };

  const handleRemove = (friendId: string) => {
    const friend = friends.find((f) => f.id === friendId);
    setFriends((prev) => prev.filter((f) => f.id !== friendId));
    toast.success(`${friend?.displayName ?? "Friend"} removed`);
  };

  const handleAccept = (friendId: string) => {
    setFriends((prev) =>
      prev.map((f) => (f.id === friendId ? { ...f, status: "active" as const } : f))
    );
    const friend = friends.find((f) => f.id === friendId);
    toast.success(`${friend?.displayName ?? "Friend"} accepted!`);
  };

  const handleDecline = (friendId: string) => {
    setFriends((prev) => prev.filter((f) => f.id !== friendId));
    toast.success("Friend request declined");
  };

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
            className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:from-indigo-600 hover:to-violet-600"
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
                <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-semibold text-white">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="calendar_only" className="flex-1">
              Calendar Only
              {calendarOnlyCount > 0 && (
                <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-500 px-1 text-[10px] font-semibold text-white">
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
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
          <Users className="h-8 w-8 text-indigo-400" />
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
