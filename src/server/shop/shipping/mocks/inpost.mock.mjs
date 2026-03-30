import { createNormalizedRateQuote, createNormalizedShipment } from "../normalizers/shipment-normalizer.mjs"

function createId(prefix = "INPOST") {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

function buildMockUrl(path) {
  return `https://example.com/mock-shipping/${path.replace(/^\//, "")}`
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
    trackingUrl: buildMockUrl(`/inpost/track/${encodeURIComponent(trackingNumber)}`),
    labelUrl: buildMockUrl(`/inpost/labels/${encodeURIComponent(shipmentReference)}.pdf`),
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
    trackingUrl: buildMockUrl(`/inpost/track/${encodeURIComponent(trackingNumber || "missing")}`),
    handoffMode: "dropoff",
    status: "in_transit",
    rawProviderPayload: { provider: "inpost", mode: "mock", trackingNumber },
  })
}

export async function getLabel({ shipmentReference }) {
  return {
    labelUrl: buildMockUrl(`/inpost/labels/${encodeURIComponent(shipmentReference || "shipment")}.pdf`),
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
