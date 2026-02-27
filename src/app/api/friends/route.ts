import { NextRequest, NextResponse } from "next/server";

// Mock friends data for development
const mockFriends = [
  {
    id: "f1",
    displayName: "Alice Chen",
    phone: "+1 555-0101",
    status: "active" as const,
    priority: 8,
    nickname: null,
    lastHangout: "2026-02-20",
    avatarUrl: null,
  },
  {
    id: "f2",
    displayName: "Bob Martinez",
    phone: "+1 555-0102",
    status: "active" as const,
    priority: 6,
    nickname: "Bobby",
    lastHangout: "2026-02-14",
    avatarUrl: null,
  },
  {
    id: "f3",
    displayName: "Carol Johnson",
    phone: "+1 555-0103",
    status: "pending" as const,
    priority: 5,
    nickname: null,
    lastHangout: null,
    avatarUrl: null,
  },
  {
    id: "f4",
    displayName: "Dave Kim",
    phone: "+1 555-0104",
    status: "calendar_only" as const,
    priority: 3,
    nickname: null,
    lastHangout: "2026-01-30",
    avatarUrl: null,
  },
];

export async function GET() {
  return NextResponse.json({ friends: mockFriends });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { friendId, action, priority, nickname } = body;

  if (!friendId || !action) {
    return NextResponse.json(
      { error: "friendId and action are required" },
      { status: 400 }
    );
  }

  const friend = mockFriends.find((f) => f.id === friendId);
  if (!friend) {
    return NextResponse.json({ error: "Friend not found" }, { status: 404 });
  }

  switch (action) {
    case "accept":
      return NextResponse.json({
        friendship: { ...friend, status: "active" },
        message: "Friend request accepted",
      });

    case "decline":
      return NextResponse.json({
        friendship: { ...friend, status: "declined" },
        message: "Friend request declined",
      });

    case "update":
      return NextResponse.json({
        friendship: {
          ...friend,
          priority: priority ?? friend.priority,
          nickname: nickname ?? friend.nickname,
        },
        message: "Friendship updated",
      });

    case "remove":
      return NextResponse.json({
        friendship: null,
        message: "Friend removed",
      });

    default:
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }
}
