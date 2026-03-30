import { getShippingStatusLabel } from "./order-progress.mjs"
import { formatShippingMethodSummary } from "./shipping-methods.mjs"

function normalizeOptionalString(value) {
  const normalized = String(value || "").trim()
  return normalized || null
}

export function getOrderCarrierDisplay(order) {
  return normalizeOptionalString(order?.shippingCarrier)?.toUpperCase() || "Non disponibile"
}

export function getOrderShipmentReference(order) {
  return normalizeOptionalString(order?.shipmentReference || order?.dhlShipmentReference) || "Non disponibile"
}

export function getOrderTrackingNumberDisplay(order) {
  return normalizeOptionalString(order?.trackingNumber) || "Non ancora disponibile"
}

export function getOrderLabelDisplay(order) {
  return normalizeOptionalString(order?.labelUrl) || null
}

export function getOrderTrackingUrlDisplay(order) {
  return normalizeOptionalString(order?.trackingUrl) || null
}

export function getOrderShippingMethodDisplay(order) {
  const label = normalizeOptionalString(order?.shippingLabel)
  const carrier = normalizeOptionalString(order?.shippingCarrier)
  if (label) {
    return carrier ? `${label} (${carrier.toUpperCase()})` : label
  }
  return order?.shippingMethod ? formatShippingMethodSummary(order.shippingMethod) : "Non disponibile"
}

export function getOrderShippingStatusDisplay(order) {
  return getShippingStatusLabel(order?.shippingStatus, order?.fulfillmentStatus)
}

export function getOrderShippingHandoffModeLabel(value) {
  const normalized = String(value || "").trim().toLowerCase()
  if (normalized === "dropoff") return "Drop-off"
  if (normalized === "pickup") return "Pickup"
  return "Da definire"
}

export function buildAdminOrderShippingSummary(order) {
  return {
    carrier: getOrderCarrierDisplay(order),
    method: getOrderShippingMethodDisplay(order),
    status: getOrderShippingStatusDisplay(order),
    handoffMode: getOrderShippingHandoffModeLabel(order?.shippingHandoffMode),
    trackingNumber: getOrderTrackingNumberDisplay(order),
    trackingUrl: getOrderTrackingUrlDisplay(order),
    labelUrl: getOrderLabelDisplay(order),
    shipmentReference: getOrderShipmentReference(order),
    shippingCreatedAt: normalizeOptionalString(order?.shippingCreatedAt),
    shippingError: normalizeOptionalString(order?.shippingError),
  }
}
