export const SHIPPING_METHOD_OPTIONS = ["economy", "premium"]
export const DEFAULT_SHIPPING_METHOD = ""

const SHIPPING_METHOD_MAP = {
  economy: {
    key: "economy",
    carrier: "inpost",
    carrierLabel: "Standard",
    label: "Standard",
    description: "5 giorni lavorativi",
    cost: 700,
  },
  premium: {
    key: "premium",
    carrier: "dhl",
    carrierLabel: "Premium",
    label: "Premium",
    description: "3 giorni lavorativi",
    cost: 1000,
  },
}

export function normalizeShippingMethod(value) {
  const normalized = String(value || "").trim().toLowerCase()
  return SHIPPING_METHOD_OPTIONS.includes(normalized) ? normalized : null
}

export function getShippingMethodConfig(value) {
  const normalized = normalizeShippingMethod(value) || "economy"
  return SHIPPING_METHOD_MAP[normalized]
}

export function getShippingMethodOptions() {
  return SHIPPING_METHOD_OPTIONS.map((key) => SHIPPING_METHOD_MAP[key])
}

export function formatShippingMethodSummary(value) {
  const method = getShippingMethodConfig(value)
  return `${method.label} — ${method.description}`
}
