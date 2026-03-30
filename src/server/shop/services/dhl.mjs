import { buildShippingConfig } from "../shipping/config.mjs"
import {
  buildDhlShipmentPayload as buildPayload,
  buildDhlTrackingUrl as buildTrackingUrl,
  isDhlConfigured as isConfigured,
} from "../shipping/adapters/dhl-adapter.mjs"
import { createDhlProvider } from "../shipping/providers/dhl.mjs"
import { createCarrierShipmentForOrder, shouldCreateShipmentForOrder } from "../shipping/index.mjs"

export function getDhlApiBaseUrl(currentEnv) {
  return buildShippingConfig(currentEnv).dhl.apiBaseUrl
}

export function buildDhlTrackingUrl(trackingNumber, currentEnv) {
  return buildTrackingUrl(trackingNumber, buildShippingConfig(currentEnv).dhl)
}

export function isDhlConfigured(currentEnv) {
  return isConfigured(buildShippingConfig(currentEnv).dhl)
}

export function shouldCreateDhlShipment(order) {
  return shouldCreateShipmentForOrder(order)
}

export function buildDhlShipmentPayload(order, currentEnv) {
  return buildPayload({ order, items: order?.items || [] }, buildShippingConfig(currentEnv).dhl)
}

export async function createDhlShipment({ order, currentEnv, fetchImpl = fetch }) {
  const provider = createDhlProvider(buildShippingConfig(currentEnv).dhl)
  return provider.createShipment({ orderContext: { order, items: order?.items || [] }, fetchImpl })
}

export async function syncDhlShipmentForPaidOrder({ db, order, currentEnv, fetchImpl = fetch }) {
  return createCarrierShipmentForOrder({ db, order, currentEnv, fetchImpl })
}
