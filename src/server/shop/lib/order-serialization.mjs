import {
  normalizeFulfillmentStatus,
  normalizeShippingCarrier,
  normalizeShippingStatus,
  normalizeTrackingNumber,
  normalizeTrackingUrl,
} from "../../../shop/lib/order-progress.mjs"

function parsePricingBreakdown(value) {
  if (!value) return null

  try {
    return typeof value === "string" ? JSON.parse(value) : value
  } catch {
    return null
  }
}

function normalizeOptionalString(value) {
  const normalized = String(value || "").trim()
  return normalized || null
}

export function serializeShopOrder(order) {
  return {
    ...order,
    fulfillmentStatus: normalizeFulfillmentStatus(order.fulfillmentStatus),
    shippingMethod: normalizeOptionalString(order.shippingMethod),
    shippingCarrier: normalizeShippingCarrier(order.shippingCarrier),
    shippingLabel: normalizeOptionalString(order.shippingLabel),
    shippingStatus: normalizeShippingStatus(order.shippingStatus, order.fulfillmentStatus),
    shippingCost: typeof order.shippingCost === "number" ? order.shippingCost : null,
    trackingNumber: normalizeTrackingNumber(order.trackingNumber),
    trackingUrl: normalizeTrackingUrl(order.trackingUrl),
    shippingCreatedAt: order.shippingCreatedAt ? new Date(order.shippingCreatedAt).toISOString() : null,
    dhlShipmentReference: normalizeOptionalString(order.dhlShipmentReference),
    labelUrl: normalizeTrackingUrl(order.labelUrl),
    shippingError: normalizeOptionalString(order.shippingError),
    pricingBreakdown: parsePricingBreakdown(order.pricingBreakdown),
  }
}
