import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock googleapis before importing oauth module
vi.mock("googleapis", () => {
  const mockInstance = {
    generateAuthUrl: vi.fn().mockReturnValue("https://accounts.google.com/o/oauth2/v2/auth?mock=true"),
    getToken: vi.fn().mockResolvedValue({
      tokens: {
        access_token: "mock-access-token",
        refresh_token: "mock-refresh-token",
        expiry_date: Date.now() + 3600000,
      },
    }),
    refreshAccessToken: vi.fn().mockResolvedValue({
      credentials: {
        access_token: "refreshed-access-token",
        expiry_date: Date.now() + 3600000,
      },
    }),
    setCredentials: vi.fn(),
  };

  // Use a real class so `new` works
  class MockOAuth2 {
    generateAuthUrl = mockInstance.generateAuthUrl;
    getToken = mockInstance.getToken;
    refreshAccessToken = mockInstance.refreshAccessToken;
    setCredentials = mockInstance.setCredentials;
  }

  return {
    google: {
      auth: {
        OAuth2: MockOAuth2,
      },
      calendar: vi.fn().mockReturnValue({ events: {} }),
    },
  };
});

// Set env vars before importing
process.env.GOOGLE_CLIENT_ID = "test-client-id";
process.env.GOOGLE_CLIENT_SECRET = "test-client-secret";
process.env.GOOGLE_REDIRECT_URI = "http://localhost:3002/api/auth/google/callback";

import { generateNonce, getAuthUrl, exchangeCode, refreshAccessToken, getCalendarClient } from "@/lib/google/oauth";

describe("Google OAuth helpers", () => {
  it("generateNonce returns a 32-char hex string", () => {
    const nonce = generateNonce();
    expect(nonce).toMatch(/^[a-f0-9]{32}$/);
  });

  it("generateNonce returns unique values", () => {
    const a = generateNonce();
    const b = generateNonce();
    expect(a).not.toBe(b);
  });

  it("getAuthUrl returns a Google OAuth URL", () => {
    const url = getAuthUrl("/onboarding", "test-nonce");
    expect(url).toContain("https://accounts.google.com");
  });

  it("exchangeCode returns tokens", async () => {
    const tokens = await exchangeCode("test-auth-code");
    expect(tokens.access_token).toBe("mock-access-token");
    expect(tokens.refresh_token).toBe("mock-refresh-token");
    expect(tokens.expiry_date).toBeDefined();
  });

  it("refreshAccessToken returns new credentials", async () => {
    const creds = await refreshAccessToken("mock-refresh-token");
    expect(creds.access_token).toBe("refreshed-access-token");
  });

  it("getCalendarClient returns a calendar client", () => {
    const client = getCalendarClient("mock-access-token");
    expect(client).toBeDefined();
    expect(client.events).toBeDefined();
  });
});
