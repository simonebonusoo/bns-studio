export const FULFILLMENT_STATUS_OPTIONS = ["processing", "accepted", "in_progress", "shipped", "completed"]
export const SHIPPING_STATUS_OPTIONS = ["pending", "accepted", "created", "in_transit", "out_for_delivery", "shipped", "delivered", "failed", "not_created"]

export function getTimelineFulfillmentStatus(fulfillmentStatus, shippingStatus) {
  const normalizedShipping = String(shippingStatus || "").trim().toLowerCase()
  if (normalizedShipping === "out_for_delivery") return "out_for_delivery"
  if (normalizedShipping === "delivered") return "completed"
  if (normalizedShipping === "shipped" || normalizedShipping === "in_transit") return "shipped"
  if (normalizedShipping === "created") return "in_progress"

  return normalizeFulfillmentStatus(fulfillmentStatus)
}

export function normalizeFulfillmentStatus(status) {
  const normalized = String(status || "").trim().toLowerCase()
  return FULFILLMENT_STATUS_OPTIONS.includes(normalized) ? normalized : "processing"
}

export function getFulfillmentStatusLabel(status, shippingStatus) {
  switch (getTimelineFulfillmentStatus(status, shippingStatus)) {
    case "accepted":
      return "Ordine accettato"
    case "in_progress":
      return "Spedizione creata"
    case "shipped":
      return "Ordine spedito"
    case "out_for_delivery":
      return "Ordine in consegna"
    case "completed":
      return "Ordine consegnato"
    case "processing":
    default:
      return "Ordine in lavorazione"
  }
}

export function getFulfillmentStatusSteps(status, shippingStatus) {
  const current = getTimelineFulfillmentStatus(status, shippingStatus)
  const sequence = [
    { key: "processing", label: "Ordine in lavorazione" },
    { key: "accepted", label: "Ordine accettato" },
    { key: "in_progress", label: "Spedizione creata" },
    { key: "shipped", label: "Ordine spedito" },
    { key: "out_for_delivery", label: "Ordine in consegna" },
    { key: "completed", label: "Ordine consegnato" },
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
    case "created":
      return "Spedizione creata"
    case "in_transit":
      return "Spedizione in transito"
    case "out_for_delivery":
      return "In consegna"
    case "shipped":
      return "Spedizione spedita"
    case "delivered":
      return "Spedizione consegnata"
    case "failed":
      return "Spedizione da completare"
    case "not_created":
      return "In attesa di creazione"
    case "pending":
    default:
      return "Spedizione in preparazione"
  }
}
