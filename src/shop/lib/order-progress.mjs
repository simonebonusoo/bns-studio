export const FULFILLMENT_STATUS_OPTIONS = ["processing", "accepted", "in_progress", "shipped", "completed"]
export const SHIPPING_STATUS_OPTIONS = ["pending", "accepted", "shipped", "failed"]

export function normalizeFulfillmentStatus(status) {
  const normalized = String(status || "").trim().toLowerCase()
  return FULFILLMENT_STATUS_OPTIONS.includes(normalized) ? normalized : "processing"
}

export function getFulfillmentStatusLabel(status) {
  switch (normalizeFulfillmentStatus(status)) {
    case "accepted":
      return "Ordine accettato"
    case "in_progress":
      return "Ordine in corso"
    case "shipped":
      return "Ordine spedito"
    case "completed":
      return "Ordine completato"
    case "processing":
    default:
      return "Ordine in lavorazione"
  }
}

export function getFulfillmentStatusSteps(status) {
  const current = normalizeFulfillmentStatus(status)
  const sequence = [
    { key: "processing", label: "In lavorazione" },
    { key: "accepted", label: "Accettato" },
    { key: "in_progress", label: "In corso" },
    { key: "shipped", label: "Spedito" },
    { key: "completed", label: "Completato" },
  ]
  const currentIndex = sequence.findIndex((step) => step.key === current)

  return sequence.map((step, index) => ({
    ...step,
    active: index <= currentIndex,
    current: step.key === current,
  }))
}

export function normalizeTrackingUrl(value) {
  const normalized = String(value || "").trim()
  if (!normalized) return null
  return normalized
}

export function normalizeTrackingNumber(value) {
  const normalized = String(value || "").trim()
  return normalized || null
}

export function normalizeShippingCarrier(value) {
  const normalized = String(value || "").trim()
  return normalized || null
}

export function normalizeShippingStatus(status, fulfillmentStatus) {
  const normalized = String(status || "").trim().toLowerCase()
  if (SHIPPING_STATUS_OPTIONS.includes(normalized)) {
    return normalized
  }

  const fulfillment = normalizeFulfillmentStatus(fulfillmentStatus)
  if (fulfillment === "shipped" || fulfillment === "completed") {
    return "shipped"
  }
  if (fulfillment === "accepted" || fulfillment === "in_progress") {
    return "accepted"
  }
  return "pending"
}

export function getShippingStatusLabel(status, fulfillmentStatus) {
  switch (normalizeShippingStatus(status, fulfillmentStatus)) {
    case "accepted":
      return "Spedizione accettata"
    case "shipped":
      return "Spedizione spedita"
    case "failed":
      return "Spedizione da completare"
    case "pending":
    default:
      return "Spedizione in preparazione"
  }
}
