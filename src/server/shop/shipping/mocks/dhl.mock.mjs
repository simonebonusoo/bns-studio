import { createNormalizedRateQuote, createNormalizedShipment } from "../normalizers/shipment-normalizer.mjs"

function createId(prefix = "DHL") {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

function buildMockUrl(path) {
  return `https://example.com/mock-shipping/${path.replace(/^\//, "")}`
}

export async function getRates() {
  return createNormalizedRateQuote({
    carrier: "dhl",
    method: "premium",
    methodLabel: "Spedizione premium",
    description: "Più rapida e premium, con esperienza di consegna più completa.",
    serviceName: "DHL Express Mock",
    shippingCost: 990,
    currency: "EUR",
    rateSource: "dhl_mock_rate",
    rawProviderPayload: { mode: "mock" },
  })
}

export async function createShipment({ orderContext }) {
  const shipmentReference = createId("DHL-SHIP")
  const trackingNumber = createId("DHL-TRK")

  return createNormalizedShipment({
    carrier: "dhl",
    method: "premium",
    methodLabel: "Spedizione premium",
    serviceName: "DHL Express Mock",
    shippingCost: orderContext?.shippingCost ?? 990,
    trackingNumber,
    trackingUrl: buildMockUrl(`/dhl/track/${encodeURIComponent(trackingNumber)}`),
    labelUrl: buildMockUrl(`/dhl/labels/${encodeURIComponent(shipmentReference)}.pdf`),
    labelFormat: "pdf",
    shipmentReference,
    handoffMode: "pickup",
    status: "created",
    rawProviderPayload: {
      provider: "dhl",
      mode: "mock",
      orderReference: orderContext?.order?.orderReference || orderContext?.orderReference || null,
    },
  })
}

export async function getTracking({ trackingNumber }) {
  return createNormalizedShipment({
    carrier: "dhl",
    method: "premium",
    methodLabel: "Spedizione premium",
    trackingNumber,
    trackingUrl: buildMockUrl(`/dhl/track/${encodeURIComponent(trackingNumber || "missing")}`),
    handoffMode: "pickup",
    status: "in_transit",
    rawProviderPayload: { provider: "dhl", mode: "mock", trackingNumber },
  })
}

export async function getLabel({ shipmentReference }) {
  return {
    labelUrl: buildMockUrl(`/dhl/labels/${encodeURIComponent(shipmentReference || "shipment")}.pdf`),
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
