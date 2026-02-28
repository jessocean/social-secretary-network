export const AUTH_CONFIG = {
  /** In dev mode, any OTP code works. Must be explicitly set — no NODE_ENV fallback. */
  isDevMode: process.env.AUTH_MODE === "dev",

  /** Default OTP code in dev mode */
  devOtpCode: "123456",

  /** OTP expiry in seconds */
  otpExpirySeconds: 300,
};
