import { getFulfillmentStatusLabel, getFulfillmentStatusSteps, getShippingStatusLabel } from "./order-progress.mjs"

export function getOrderStatusLabel(status: string) {
  if (status === "pending") return "In attesa"
  if (status === "paid") return "Pagato"
  if (status === "shipped") return "Spedito"
  return status
}

export function getOrderFulfillmentStatusLabel(status?: string | null, shippingStatus?: string | null) {
  return getFulfillmentStatusLabel(status, shippingStatus)
}

export function getOrderFulfillmentSteps(status?: string | null, shippingStatus?: string | null) {
  return getFulfillmentStatusSteps(status, shippingStatus)
}

export function getOrderShippingStatusLabel(status?: string | null, fulfillmentStatus?: string | null) {
  return getShippingStatusLabel(status, fulfillmentStatus)
}
