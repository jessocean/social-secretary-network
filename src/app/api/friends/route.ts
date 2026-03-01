import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { friendships, users } from "@/lib/db/schema";
import { eq, and, or } from "drizzle-orm";

function getUserId(request: NextRequest): string | null {
  return request.cookies.get("session_user_id")?.value ?? null;
}

export async function GET(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    // Get all friendships where this user is either userId or friendId
    const rows = await db
      .select({
        friendshipId: friendships.id,
        friendshipUserId: friendships.userId,
        friendshipFriendId: friendships.friendId,
        status: friendships.status,
        priority: friendships.priority,
        nickname: friendships.nickname,
        createdAt: friendships.createdAt,
      })
      .from(friendships)
      .where(
        or(eq(friendships.userId, userId), eq(friendships.friendId, userId))
      );

    // For each friendship, load the OTHER user's info
    const friendList = await Promise.all(
      rows.map(async (row) => {
        const otherUserId =
          row.friendshipUserId === userId
            ? row.friendshipFriendId
            : row.friendshipUserId;

        const [otherUser] = await db
          .select({
            id: users.id,
            displayName: users.displayName,
            phone: users.phone,
            avatarUrl: users.avatarUrl,
          })
          .from(users)
          .where(eq(users.id, otherUserId))
          .limit(1);

        // If this user received the request (they are friendId), show as pending for them to accept
        // If this user sent the request (they are userId), show as pending-sent
        let displayStatus = row.status;
        if (
          row.status === "pending" &&
          row.friendshipFriendId === userId
        ) {
          displayStatus = "pending"; // incoming — they can accept/decline
        } else if (
          row.status === "pending" &&
          row.friendshipUserId === userId
        ) {
          displayStatus = "pending"; // outgoing — waiting for friend
        }

        return {
          id: row.friendshipId,
          friendUserId: otherUserId,
          displayName: otherUser?.displayName ?? null,
          phone: otherUser?.phone ?? "",
          avatarUrl: otherUser?.avatarUrl ?? null,
          status: displayStatus,
          priority: row.priority,
          nickname: row.nickname,
          lastHangout: null,
          // Whether this is an incoming request (friend can accept/decline)
          incoming: row.friendshipFriendId === userId && row.status === "pending",
        };
      })
    );

    return NextResponse.json({ friends: friendList });
  } catch (err) {
    console.error("Error fetching friends:", err);
    return NextResponse.json(
      { error: "Failed to fetch friends" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, friendshipId, priority, nickname } = body;

    if (!action) {
      return NextResponse.json(
        { error: "action is required" },
        { status: 400 }
      );
    }

    if (action === "accept" && friendshipId) {
      // Accept: update status to active (only if this user is the friendId)
      const [updated] = await db
        .update(friendships)
        .set({ status: "active" })
        .where(
          and(
            eq(friendships.id, friendshipId),
            eq(friendships.friendId, userId)
          )
        )
        .returning();

      if (!updated) {
        return NextResponse.json(
          { error: "Friendship not found or not authorized" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, message: "Friend request accepted" });
    }

    if (action === "decline" && friendshipId) {
      // Decline: update status to declined
      const [updated] = await db
        .update(friendships)
        .set({ status: "declined" })
        .where(
          and(
            eq(friendships.id, friendshipId),
            eq(friendships.friendId, userId)
          )
        )
        .returning();

      if (!updated) {
        return NextResponse.json(
          { error: "Friendship not found or not authorized" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, message: "Friend request declined" });
    }

    if (action === "update" && friendshipId) {
      // Update nickname or priority
      const updateData: Record<string, unknown> = {};
      if (priority !== undefined) updateData.priority = priority;
      if (nickname !== undefined) updateData.nickname = nickname;

      await db
        .update(friendships)
        .set(updateData)
        .where(
          and(
            eq(friendships.id, friendshipId),
            or(
              eq(friendships.userId, userId),
              eq(friendships.friendId, userId)
            )
          )
        );

      return NextResponse.json({ success: true, message: "Friendship updated" });
    }

    if (action === "remove" && friendshipId) {
      // Delete the friendship row
      await db
        .delete(friendships)
        .where(
          and(
            eq(friendships.id, friendshipId),
            or(
              eq(friendships.userId, userId),
              eq(friendships.friendId, userId)
            )
          )
        );

      return NextResponse.json({ success: true, message: "Friend removed" });
    }

    return NextResponse.json({ error: "Invalid action or missing friendshipId" }, { status: 400 });
  } catch (err) {
    console.error("Error updating friendship:", err);
    return NextResponse.json(
      { error: "Failed to update friendship" },
      { status: 500 }
    );
  }
}
