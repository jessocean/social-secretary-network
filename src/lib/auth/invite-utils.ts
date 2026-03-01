import { db } from "@/lib/db/client";
import { invites, friendships } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function claimInvite(inviteCode: string, newUserId: string, inviteType?: string) {
  try {
    // Find the invite
    const [invite] = await db
      .select()
      .from(invites)
      .where(eq(invites.code, inviteCode))
      .limit(1);

    if (!invite) return;
    if (invite.usedBy) return; // Already claimed
    if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) return; // Expired

    // Don't let someone invite themselves
    if (invite.createdBy === newUserId) return;

    // Mark invite as used
    await db
      .update(invites)
      .set({ usedBy: newUserId, usedAt: new Date() })
      .where(eq(invites.id, invite.id));

    // Determine friendship status based on invite type
    const friendshipStatus = inviteType === "calendar" ? "calendar_only" : "active";

    // Check if friendship already exists (in either direction)
    const existingFriendship = await db
      .select()
      .from(friendships)
      .where(
        eq(friendships.userId, invite.createdBy)
      )
      .then((rows) =>
        rows.find(
          (r) =>
            (r.userId === invite.createdBy && r.friendId === newUserId) ||
            (r.userId === newUserId && r.friendId === invite.createdBy)
        )
      );

    if (existingFriendship) {
      // Update existing friendship to active/calendar_only
      await db
        .update(friendships)
        .set({ status: friendshipStatus })
        .where(eq(friendships.id, existingFriendship.id));
    } else {
      // Create new friendship — immediately active since they accepted the invite
      await db.insert(friendships).values({
        userId: invite.createdBy,
        friendId: newUserId,
        status: friendshipStatus,
      });
    }
  } catch (err) {
    // Non-fatal — log but don't block signup
    console.error("Error claiming invite:", err);
  }
}
