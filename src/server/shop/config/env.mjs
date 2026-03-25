import dotenv from "dotenv"

dotenv.config()

function requireEnv(name, fallback = "") {
  const value = process.env[name] ?? fallback
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export const env = {
  port: Number(process.env.PORT || 4000),
  jwtSecret: requireEnv("JWT_SECRET", "bns-shop-local-secret"),
  clientUrl: requireEnv("CLIENT_URL", "http://localhost:5173"),
  paypalMeLink: process.env.PAYPAL_ME_LINK || "",
  paypalBusinessEmail: process.env.PAYPAL_BUSINESS_EMAIL || "",
  paypalCurrencyCode: process.env.PAYPAL_CURRENCY_CODE || "EUR",
  paypalStoreName: process.env.PAYPAL_STORE_NAME || "BNS Studio Shop",
}
