export const FULFILLMENT_STATUS_OPTIONS = ["processing", "accepted", "in_progress", "shipped", "completed"]

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
