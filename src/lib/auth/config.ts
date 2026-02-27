export const AUTH_CONFIG = {
  /** In dev mode, any OTP code works */
  isDevMode: process.env.AUTH_MODE === "dev" || process.env.NODE_ENV === "development",

  /** Default OTP code in dev mode */
  devOtpCode: "123456",

  /** OTP expiry in seconds */
  otpExpirySeconds: 300,
};
