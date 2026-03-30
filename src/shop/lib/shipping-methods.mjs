export const SHIPPING_METHOD_OPTIONS = ["economy", "premium"]
export const DEFAULT_SHIPPING_METHOD = "economy"

const SHIPPING_METHOD_MAP = {
  economy: {
    key: "economy",
    carrier: "inpost",
    carrierLabel: "InPost",
    label: "Spedizione economica",
    description: "Opzione più conveniente con consegna standard.",
    cost: 590,
  },
  premium: {
    key: "premium",
    carrier: "dhl",
    carrierLabel: "DHL",
    label: "Spedizione premium",
    description: "Consegna premium con tracking completo.",
    cost: 990,
  },
}

export function normalizeShippingMethod(value) {
  const normalized = String(value || "").trim().toLowerCase()
  return SHIPPING_METHOD_OPTIONS.includes(normalized) ? normalized : DEFAULT_SHIPPING_METHOD
}

export function getShippingMethodConfig(value) {
  return SHIPPING_METHOD_MAP[normalizeShippingMethod(value)]
}

export function getShippingMethodOptions() {
  return SHIPPING_METHOD_OPTIONS.map((key) => SHIPPING_METHOD_MAP[key])
}

export function formatShippingMethodSummary(value) {
  const method = getShippingMethodConfig(value)
  return `${method.label} (${method.carrierLabel})`
}

export function calculateShippingCharge({ shippingMethod, rules = [], itemCount = 0, now = new Date() }) {
  const method = getShippingMethodConfig(shippingMethod)
  let shippingTotal = method.cost
  const appliedRules = []

  for (const rule of rules) {
    const withinStart = !rule.startsAt || rule.startsAt <= now
    const withinEnd = !rule.endsAt || rule.endsAt >= now

    if (!withinStart || !withinEnd) continue

    if (rule.ruleType === "free_shipping_quantity" && itemCount >= rule.threshold) {
      shippingTotal = 0
      appliedRules.push({ type: "shipping", label: rule.name, amount: method.cost })
    }
  }

  return {
    shippingMethod: method.key,
    shippingCarrier: method.carrier,
    shippingLabel: method.label,
    shippingCost: method.cost,
    shippingBase: method.cost,
    shippingTotal,
    appliedRules,
  }
}
