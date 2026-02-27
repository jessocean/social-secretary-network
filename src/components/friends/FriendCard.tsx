"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ChevronDown,
  ChevronUp,
  Trash2,
  Calendar,
  Star,
  Check,
  X,
} from "lucide-react";

export interface Friend {
  id: string;
  displayName: string | null;
  phone: string;
  status: "active" | "pending" | "calendar_only" | "declined";
  priority: number;
  nickname: string | null;
  lastHangout?: string | null;
  avatarUrl?: string | null;
}

interface FriendCardProps {
  friend: Friend;
  onUpdatePriority: (friendId: string, priority: number) => void;
  onUpdateNickname: (friendId: string, nickname: string) => void;
  onRemove: (friendId: string) => void;
  onAccept?: (friendId: string) => void;
  onDecline?: (friendId: string) => void;
}

// Generate a consistent color based on the name
function getAvatarColor(name: string): string {
  const colors = [
    "bg-indigo-500",
    "bg-violet-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-rose-500",
    "bg-blue-500",
    "bg-cyan-500",
    "bg-teal-500",
    "bg-emerald-500",
    "bg-amber-500",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name: string | null, phone: string): string {
  if (!name) return phone.slice(-2);
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getStatusBadge(status: Friend["status"]) {
  switch (status) {
    case "active":
      return (
        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
          Active
        </Badge>
      );
    case "pending":
      return (
        <Badge className="bg-amber-100 text-amber-700 border-amber-200">
          Pending
        </Badge>
      );
    case "calendar_only":
      return (
        <Badge className="bg-blue-100 text-blue-700 border-blue-200">
          Calendar Only
        </Badge>
      );
    case "declined":
      return (
        <Badge className="bg-gray-100 text-gray-500 border-gray-200">
          Declined
        </Badge>
      );
  }
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "Never";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function FriendCard({
  friend,
  onUpdatePriority,
  onUpdateNickname,
  onRemove,
  onAccept,
  onDecline,
}: FriendCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [localPriority, setLocalPriority] = useState(friend.priority);
  const [localNickname, setLocalNickname] = useState(friend.nickname ?? "");
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const displayName = friend.displayName ?? friend.phone;
  const avatarColor = getAvatarColor(displayName);
  const initials = getInitials(friend.displayName, friend.phone);

  const handlePriorityChange = (value: number[]) => {
    setLocalPriority(value[0]);
  };

  const handlePriorityCommit = (value: number[]) => {
    onUpdatePriority(friend.id, value[0]);
  };

  const handleNicknameBlur = () => {
    if (localNickname !== (friend.nickname ?? "")) {
      onUpdateNickname(friend.id, localNickname);
    }
  };

  return (
    <Card className="overflow-hidden py-0 transition-shadow hover:shadow-md">
      {/* Main row - always visible */}
      <button
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <Avatar size="lg" className={avatarColor}>
          <AvatarFallback className={`${avatarColor} text-white font-medium`}>
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-gray-900">
              {friend.displayName ?? friend.phone}
            </span>
            {friend.nickname && (
              <span className="truncate text-xs text-muted-foreground">
                ({friend.nickname})
              </span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            {getStatusBadge(friend.status)}
            <div className="flex items-center gap-0.5" title={`Priority: ${friend.priority}/10`}>
              {Array.from({ length: 10 }, (_, i) => (
                <span
                  key={i}
                  className={`inline-block h-1.5 w-1.5 rounded-full ${
                    i < friend.priority
                      ? "bg-indigo-400"
                      : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
          </div>
          {friend.lastHangout !== undefined && (
            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Last hangout: {formatDate(friend.lastHangout)}</span>
            </div>
          )}
        </div>

        {expanded ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      {/* Pending actions */}
      {friend.status === "pending" && !expanded && (
        <div className="flex gap-2 border-t border-gray-100 px-4 py-2.5">
          <Button
            size="sm"
            className="flex-1 bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:from-indigo-600 hover:to-violet-600"
            onClick={(e) => {
              e.stopPropagation();
              onAccept?.(friend.id);
            }}
          >
            <Check className="mr-1 h-3.5 w-3.5" />
            Accept
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onDecline?.(friend.id);
            }}
          >
            <X className="mr-1 h-3.5 w-3.5" />
            Decline
          </Button>
        </div>
      )}

      {/* Expanded content */}
      {expanded && (
        <CardContent className="space-y-4 border-t border-gray-100 px-4 pt-4 pb-4">
          {/* Priority slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-gray-700">
                Priority
              </Label>
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 text-indigo-500" />
                <span className="text-sm font-semibold text-indigo-600">
                  {localPriority}
                </span>
                <span className="text-xs text-muted-foreground">/10</span>
              </div>
            </div>
            <Slider
              value={[localPriority]}
              min={1}
              max={10}
              step={1}
              onValueChange={handlePriorityChange}
              onValueCommit={handlePriorityCommit}
              className="w-full"
            />
            <p className="text-[11px] text-muted-foreground">
              Higher priority friends get scheduled more often
            </p>
          </div>

          <Separator />

          {/* Nickname */}
          <div className="space-y-1.5">
            <Label htmlFor={`nickname-${friend.id}`} className="text-xs font-medium text-gray-700">
              Nickname
            </Label>
            <Input
              id={`nickname-${friend.id}`}
              placeholder="Add a nickname..."
              value={localNickname}
              onChange={(e) => setLocalNickname(e.target.value)}
              onBlur={handleNicknameBlur}
              className="h-8 text-sm"
            />
          </div>

          <Separator />

          {/* Pending actions (in expanded view) */}
          {friend.status === "pending" && (
            <>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:from-indigo-600 hover:to-violet-600"
                  onClick={() => onAccept?.(friend.id)}
                >
                  <Check className="mr-1 h-3.5 w-3.5" />
                  Accept request
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => onDecline?.(friend.id)}
                >
                  <X className="mr-1 h-3.5 w-3.5" />
                  Decline
                </Button>
              </div>
              <Separator />
            </>
          )}

          {/* Remove friend */}
          {!showRemoveConfirm ? (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-red-500 hover:bg-red-50 hover:text-red-600"
              onClick={() => setShowRemoveConfirm(true)}
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Remove friend
            </Button>
          ) : (
            <div className="rounded-lg bg-red-50 p-3">
              <p className="mb-2 text-xs text-red-600">
                Remove {friend.displayName ?? "this friend"}? This cannot be undone.
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1"
                  onClick={() => onRemove(friend.id)}
                >
                  Remove
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowRemoveConfirm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
