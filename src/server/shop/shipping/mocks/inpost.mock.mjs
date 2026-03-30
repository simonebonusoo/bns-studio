import { createNormalizedRateQuote, createNormalizedShipment } from "../normalizers/shipment-normalizer.mjs"
import { buildMockLabelPath, buildMockTrackingPath } from "./mock-shipping-documents.mjs"

function createId(prefix = "INPOST") {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

export async function getRates({ orderContext }) {
  const hasA3 =
    Array.isArray(orderContext?.items) &&
    orderContext.items.some((item) => String(item?.format || item?.variantLabel || "").toUpperCase().includes("A3"))
  const amount = hasA3 ? 690 : 590

  return createNormalizedRateQuote({
    carrier: "inpost",
    method: "economy",
    methodLabel: "Spedizione economica",
    description: "Più conveniente, perfetta per risparmiare.",
    serviceName: "InPost Standard Mock",
    shippingCost: amount,
    currency: "EUR",
    rateSource: "inpost_mock_rate",
    rawProviderPayload: { mode: "mock", packageProfile: hasA3 ? "tube-medium" : "tube-small" },
  })
}

export async function createShipment({ orderContext }) {
  const shipmentReference = createId("INPOST-SHIP")
  const trackingNumber = createId("INPOST-TRK")

  return createNormalizedShipment({
    carrier: "inpost",
    method: "economy",
    methodLabel: "Spedizione economica",
    serviceName: "InPost Standard Mock",
    shippingCost: orderContext?.shippingCost ?? 590,
    trackingNumber,
    trackingUrl: buildMockTrackingPath(trackingNumber),
    labelUrl: buildMockLabelPath(shipmentReference),
    labelFormat: "pdf",
    shipmentReference,
    handoffMode: "dropoff",
    status: "created",
    rawProviderPayload: {
      provider: "inpost",
      mode: "mock",
      orderReference: orderContext?.order?.orderReference || orderContext?.orderReference || null,
    },
  })
}

export async function getTracking({ trackingNumber }) {
  return createNormalizedShipment({
    carrier: "inpost",
    method: "economy",
    methodLabel: "Spedizione economica",
    trackingNumber,
    trackingUrl: buildMockTrackingPath(trackingNumber || "missing"),
    handoffMode: "dropoff",
    status: "in_transit",
    rawProviderPayload: { provider: "inpost", mode: "mock", trackingNumber },
  })
}

export async function getLabel({ shipmentReference }) {
  return {
    labelUrl: buildMockLabelPath(shipmentReference || "shipment"),
    labelFormat: "pdf",
  }
}

export async function createPickup() {
  return {
    ok: true,
    status: "accepted",
  }
}

export async function validateAddress() {
  return {
    ok: true,
    valid: true,
    warnings: [],
  }
}
