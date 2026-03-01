import { google } from "googleapis";
import crypto from "crypto";

const SCOPES = [
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events",
];

function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "Missing Google OAuth env vars: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI"
    );
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/** Generate a CSRF nonce for OAuth state */
export function generateNonce(): string {
  return crypto.randomBytes(16).toString("hex");
}

interface AuthUrlOptions {
  nonce: string;
  inviteCode?: string;
  inviteType?: string;
}

/** Build the Google OAuth consent URL */
export function getAuthUrl(options: AuthUrlOptions): string {
  const client = getOAuth2Client();
  const state = JSON.stringify({
    nonce: options.nonce,
    ...(options.inviteCode && { inviteCode: options.inviteCode }),
    ...(options.inviteType && { inviteType: options.inviteType }),
  });

  return client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
    state,
  });
}

/** Exchange an authorization code for tokens */
export async function exchangeCode(code: string) {
  const client = getOAuth2Client();
  const { tokens } = await client.getToken(code);
  return tokens;
}

/** Refresh an expired access token */
export async function refreshAccessToken(refreshToken: string) {
  const client = getOAuth2Client();
  client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await client.refreshAccessToken();
  return credentials;
}

/** Get an authenticated Calendar v3 client */
export function getCalendarClient(accessToken: string) {
  const client = getOAuth2Client();
  client.setCredentials({ access_token: accessToken });
  return google.calendar({ version: "v3", auth: client });
}

export interface GoogleUserInfo {
  email: string;
  name: string | null;
  picture: string | null;
  googleId: string;
}

/** Get user profile info from Google using an access token */
export async function getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const client = getOAuth2Client();
  client.setCredentials({ access_token: accessToken });
  const oauth2 = google.oauth2({ version: "v2", auth: client });
  const { data } = await oauth2.userinfo.get();

  if (!data.email) {
    throw new Error("No email returned from Google profile");
  }

  return {
    email: data.email,
    name: data.name ?? null,
    picture: data.picture ?? null,
    googleId: data.id ?? "",
  };
}
