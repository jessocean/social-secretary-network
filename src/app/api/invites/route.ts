import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { invites, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json(
      { error: "code query parameter is required" },
      { status: 400 }
    );
  }

  try {
    const [invite] = await db
      .select()
      .from(invites)
      .where(eq(invites.code, code))
      .limit(1);

    if (!invite) {
      return NextResponse.json(
        { error: "Invite not found" },
        { status: 404 }
      );
    }

    // Get inviter's name
    const [inviter] = await db
      .select({ displayName: users.displayName, phone: users.phone })
      .from(users)
      .where(eq(users.id, invite.createdBy))
      .limit(1);

    const inviteData = {
      code: invite.code,
      createdBy: invite.createdBy,
      createdByName: inviter?.displayName ?? inviter?.phone ?? "A friend",
      type: invite.type,
      usedBy: invite.usedBy,
      usedAt: invite.usedAt?.toISOString() ?? null,
      expiresAt: invite.expiresAt?.toISOString() ?? null,
      createdAt: invite.createdAt.toISOString(),
    };

    // Check if expired
    if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: "Invite has expired", invite: { ...inviteData, expired: true } },
        { status: 410 }
      );
    }

    // Check if already used
    if (invite.usedBy) {
      return NextResponse.json(
        { error: "Invite has already been used", invite: { ...inviteData, used: true } },
        { status: 410 }
      );
    }

    return NextResponse.json({ invite: inviteData });
  } catch (err) {
    console.error("Error fetching invite:", err);
    return NextResponse.json(
      { error: "Failed to fetch invite" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const userId = request.cookies.get("session_user_id")?.value;
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const type = body.type === "calendar_only" ? "calendar_only" : "full";

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const [invite] = await db
      .insert(invites)
      .values({
        code,
        createdBy: userId,
        type,
        expiresAt,
      })
      .returning();

    return NextResponse.json({
      code: invite.code,
      url: `/invite/${invite.code}`,
      invite,
    });
  } catch (err) {
    console.error("Error creating invite:", err);
    return NextResponse.json(
      { error: "Failed to create invite" },
      { status: 500 }
    );
  }
}
