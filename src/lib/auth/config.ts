export const AUTH_CONFIG = {
  /** In dev mode, any email works without Google OAuth. Must be explicitly set — no NODE_ENV fallback. */
  isDevMode: process.env.AUTH_MODE === "dev",
};
