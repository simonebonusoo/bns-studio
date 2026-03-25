import dotenv from "dotenv";

dotenv.config();

function requireEnv(name, fallback = "") {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT || 4000),
  jwtSecret: requireEnv("JWT_SECRET", "change-this-secret"),
  paypalMeLink: requireEnv("PAYPAL_ME_LINK", "https://paypal.me/yourbrand"),
  paypalBusinessEmail: process.env.PAYPAL_BUSINESS_EMAIL || "",
  clientUrl: requireEnv("CLIENT_URL", "http://localhost:5173")
};

