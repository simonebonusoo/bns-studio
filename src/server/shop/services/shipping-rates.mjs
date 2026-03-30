import { env } from "../config/env.mjs"

const SHIPPING_METHODS = {
  economy: {
    key: "economy",
    carrier: "inpost",
    carrierLabel: "InPost",
    label: "Spedizione economica",
    description: "Più conveniente, perfetta per risparmiare.",
  },
  premium: {
    key: "premium",
    carrier: "dhl",
    carrierLabel: "DHL",
    label: "Spedizione premium",
    description: "Più rapida e premium, con esperienza di consegna più completa.",
  },
}

function toPositiveCents(value, fallback) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) return fallback
  return Math.round(parsed)
}

function normalizeFormatLabel(item) {
  return String(item?.variantLabel || item?.format || "").trim().toUpperCase()
}

function derivePackageProfile(items = []) {
  const quantity = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
  const hasA3 = items.some((item) => normalizeFormatLabel(item).includes("A3"))
  const hasOversize = quantity >= 4

  if (hasA3 || hasOversize) {
    return {
      profile: "tube-medium",
      inpostRate: toPositiveCents(process.env.INPOST_ECONOMY_A3_RATE_CENTS, 690),
    }
  }

  return {
    profile: "tube-small",
    inpostRate: toPositiveCents(process.env.INPOST_ECONOMY_A4_RATE_CENTS, 590),
  }
}

async function getDhlPremiumRate({ items }) {
  const fallbackRate = toPositiveCents(process.env.DHL_PREMIUM_FALLBACK_RATE_CENTS, 990)

  return {
    amount: fallbackRate,
    source: "dhl_fallback_rate",
    meta: {
      quoteMode: env.dhlApiKey && env.dhlApiSecret && env.dhlAccountNumber ? "api_ready_fallback" : "config_fallback",
      items: items.length,
    },
  }
}

async function getInpostEconomyRate({ items }) {
  const profile = derivePackageProfile(items)

  return {
    amount: profile.inpostRate,
    source: "inpost_dimension_profile",
    meta: {
      packageProfile: profile.profile,
      items: items.length,
    },
  }
}

export async function getAvailableShippingRates({ items }) {
  const [economyQuote, premiumQuote] = await Promise.all([getInpostEconomyRate({ items }), getDhlPremiumRate({ items })])

  return [
    {
      ...SHIPPING_METHODS.economy,
      cost: economyQuote.amount,
      source: economyQuote.source,
      meta: economyQuote.meta,
    },
    {
      ...SHIPPING_METHODS.premium,
      cost: premiumQuote.amount,
      source: premiumQuote.source,
      meta: premiumQuote.meta,
    },
  ]
}

export function normalizeShippingMethodSelection(value) {
  const normalized = String(value || "").trim().toLowerCase()
  return normalized === "economy" || normalized === "premium" ? normalized : null
}

export async function resolveSelectedShippingRate({ items, shippingMethod }) {
  const selectedMethod = normalizeShippingMethodSelection(shippingMethod)
  const rates = await getAvailableShippingRates({ items })

  return {
    selectedMethod,
    rates,
    selectedRate: selectedMethod ? rates.find((entry) => entry.key === selectedMethod) || null : null,
  }
}
