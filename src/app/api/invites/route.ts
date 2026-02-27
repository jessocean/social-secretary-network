import { NextRequest, NextResponse } from "next/server";

// In-memory invite store for development
const inviteStore = new Map<
  string,
  {
    code: string;
    createdBy: string;
    createdByName: string;
    type: "full" | "calendar_only";
    usedBy: string | null;
    usedAt: string | null;
    expiresAt: string;
    createdAt: string;
  }
>();

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

  const invite = inviteStore.get(code);

  if (!invite) {
    // Return mock data for development if not found in store
    // This allows the invite/[code] page to render without creating an invite first
    return NextResponse.json({
      invite: {
        code,
        createdBy: "mock-user-1",
        createdByName: "Jessica",
        type: "full",
        usedBy: null,
        usedAt: null,
        expiresAt: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
        createdAt: new Date().toISOString(),
      },
    });
  }

  // Check if expired
  if (new Date(invite.expiresAt) < new Date()) {
    return NextResponse.json(
      { error: "Invite has expired", invite: { ...invite, expired: true } },
      { status: 410 }
    );
  }

  // Check if already used
  if (invite.usedBy) {
    return NextResponse.json(
      {
        error: "Invite has already been used",
        invite: { ...invite, used: true },
      },
      { status: 410 }
    );
  }

  return NextResponse.json({ invite });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { type } = body;

  if (!type || !["full", "calendar_only"].includes(type)) {
    return NextResponse.json(
      { error: "type must be 'full' or 'calendar_only'" },
      { status: 400 }
    );
  }

  const code = generateCode();
  const invite = {
    code,
    createdBy: "mock-user-1",
    createdByName: "Jessica",
    type: type as "full" | "calendar_only",
    usedBy: null,
    usedAt: null,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  };

  inviteStore.set(code, invite);

  return NextResponse.json({
    code,
    url: `/invite/${code}`,
    invite,
  });
}
