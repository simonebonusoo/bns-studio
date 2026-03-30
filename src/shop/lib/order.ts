import { getFulfillmentStatusLabel, getFulfillmentStatusSteps } from "./order-progress.mjs"

export function getOrderStatusLabel(status: string) {
  if (status === "pending") return "In attesa"
  if (status === "paid") return "Pagato"
  if (status === "shipped") return "Spedito"
  return status
}

export function getOrderFulfillmentStatusLabel(status?: string | null) {
  return getFulfillmentStatusLabel(status)
}

export function getOrderFulfillmentSteps(status?: string | null) {
  return getFulfillmentStatusSteps(status)
}
