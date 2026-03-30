import * as inpostMock from "../mocks/inpost.mock.mjs"
import {
  buildInpostAuthHeaders,
  buildInpostRateQuote,
  buildInpostShipmentPayload,
  buildInpostTrackingUrl,
  isInpostConfigured,
  parseInpostShipmentResponse,
  parseInpostTrackingResponse,
} from "../adapters/inpost-adapter.mjs"
import { createNormalizedShipment } from "../normalizers/shipment-normalizer.mjs"

function buildApiUrl(providerConfig, path) {
  return `${String(providerConfig.apiBaseUrl || "").replace(/\/$/, "")}/${String(path || "").replace(/^\//, "")}`
}

async function safeJson(response) {
  const text = await response.text()
  try {
    return text ? JSON.parse(text) : null
  } catch {
    return null
  }
}

export function createInpostProvider(providerConfig) {
  return {
    key: "inpost",
    carrier: "inpost",
    method: "economy",
    async getRates({ orderContext }) {
      if (providerConfig.useMock) {
        return inpostMock.getRates({ orderContext, providerConfig })
      }
      return buildInpostRateQuote(orderContext, providerConfig)
    },
    async createShipment({ orderContext, fetchImpl = fetch }) {
      if (providerConfig.useMock) {
        return inpostMock.createShipment({ orderContext, providerConfig })
      }

      if (!isInpostConfigured(providerConfig)) {
        return createNormalizedShipment({
          carrier: "inpost",
          method: "economy",
          methodLabel: "Spedizione economica",
          handoffMode: "dropoff",
          status: "failed",
          errorMessage: "Configurazione InPost incompleta.",
        })
      }

      try {
        const response = await fetchImpl(buildApiUrl(providerConfig, "/shipments"), {
          method: "POST",
          headers: buildInpostAuthHeaders(providerConfig),
          body: JSON.stringify(buildInpostShipmentPayload(orderContext, providerConfig)),
        })
        const data = await safeJson(response)
        if (!response.ok) {
          return createNormalizedShipment({
            carrier: "inpost",
            method: "economy",
            methodLabel: "Spedizione economica",
            handoffMode: "dropoff",
            status: "failed",
            rawProviderPayload: data,
            errorMessage: `InPost ha risposto con stato ${response.status}.`,
          })
        }
        return parseInpostShipmentResponse(data, providerConfig, orderContext)
      } catch (error) {
        return createNormalizedShipment({
          carrier: "inpost",
          method: "economy",
          methodLabel: "Spedizione economica",
          handoffMode: "dropoff",
          status: "failed",
          errorMessage: error?.message || "Creazione spedizione InPost non riuscita.",
        })
      }
    },
    async getTracking({ trackingNumber, fetchImpl = fetch }) {
      if (providerConfig.useMock) {
        return inpostMock.getTracking({ trackingNumber, providerConfig })
      }

      if (!isInpostConfigured(providerConfig)) {
        return createNormalizedShipment({
          carrier: "inpost",
          method: "economy",
          methodLabel: "Spedizione economica",
          trackingNumber,
          trackingUrl: buildInpostTrackingUrl(trackingNumber, providerConfig),
          handoffMode: "dropoff",
          status: "pending",
          errorMessage: "Tracking InPost non configurato.",
        })
      }

      try {
        const response = await fetchImpl(buildApiUrl(providerConfig, `/shipments/${encodeURIComponent(trackingNumber || "")}`), {
          headers: buildInpostAuthHeaders(providerConfig),
        })
        const data = await safeJson(response)
        if (!response.ok) throw new Error(`InPost tracking error ${response.status}`)
        return parseInpostTrackingResponse(data, providerConfig)
      } catch (error) {
        return createNormalizedShipment({
          carrier: "inpost",
          method: "economy",
          methodLabel: "Spedizione economica",
          trackingNumber,
          trackingUrl: buildInpostTrackingUrl(trackingNumber, providerConfig),
          handoffMode: "dropoff",
          status: "pending",
          errorMessage: error?.message || "Tracking InPost non disponibile.",
        })
      }
    },
    async getLabel({ shipmentReference }) {
      if (providerConfig.useMock) {
        return inpostMock.getLabel({ shipmentReference, providerConfig })
      }

      return {
        labelUrl: providerConfig.apiBaseUrl ? `${providerConfig.apiBaseUrl.replace(/\/$/, "")}/shipments/${encodeURIComponent(shipmentReference || "shipment")}/label` : null,
        labelFormat: "pdf",
      }
    },
    async createPickup(context) {
      if (providerConfig.useMock) {
        return inpostMock.createPickup(context)
      }

      return {
        ok: false,
        status: "pending",
        message: "Pickup InPost predisposto ma non ancora attivo.",
      }
    },
    async validateAddress(context) {
      if (providerConfig.useMock) {
        return inpostMock.validateAddress(context)
      }

      return {
        ok: true,
        valid: true,
        warnings: [],
      }
    },
  }
}
