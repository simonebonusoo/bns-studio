import * as dhlMock from "../mocks/dhl.mock.mjs"
import {
  buildDhlAuthHeaders,
  buildDhlRatePayload,
  buildDhlShipmentPayload,
  buildDhlTrackingUrl,
  isDhlConfigured,
  parseDhlRateResponse,
  parseDhlShipmentResponse,
  parseDhlTrackingResponse,
} from "../adapters/dhl-adapter.mjs"
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

export function createDhlProvider(providerConfig) {
  return {
    key: "dhl",
    carrier: "dhl",
    method: "premium",
    async getRates({ orderContext, fetchImpl = fetch }) {
      if (providerConfig.useMock) {
        return dhlMock.getRates({ orderContext, providerConfig })
      }

      if (!isDhlConfigured(providerConfig)) {
        const fallback = await dhlMock.getRates({ orderContext, providerConfig })
        return {
          ...fallback,
          source: "dhl_config_fallback",
          meta: { ...(fallback.meta || {}), fallbackReason: "missing_configuration" },
        }
      }

      try {
        const response = await fetchImpl(buildApiUrl(providerConfig, "/rates"), {
          method: "POST",
          headers: buildDhlAuthHeaders(providerConfig),
          body: JSON.stringify(buildDhlRatePayload(orderContext, providerConfig)),
        })
        const data = await safeJson(response)
        if (!response.ok) throw new Error(`DHL rate error ${response.status}`)
        return parseDhlRateResponse(data)
      } catch {
        const fallback = await dhlMock.getRates({ orderContext, providerConfig })
        return {
          ...fallback,
          source: "dhl_runtime_fallback",
          meta: { ...(fallback.meta || {}), fallbackReason: "request_failed" },
        }
      }
    },
    async createShipment({ orderContext, fetchImpl = fetch }) {
      if (providerConfig.useMock) {
        return dhlMock.createShipment({ orderContext, providerConfig })
      }

      if (!isDhlConfigured(providerConfig)) {
        return createNormalizedShipment({
          carrier: "dhl",
          method: "premium",
          methodLabel: "Spedizione premium",
          handoffMode: "pickup",
          status: "failed",
          errorMessage: "Configurazione DHL incompleta.",
        })
      }

      try {
        const response = await fetchImpl(buildApiUrl(providerConfig, "/shipments"), {
          method: "POST",
          headers: buildDhlAuthHeaders(providerConfig),
          body: JSON.stringify(buildDhlShipmentPayload(orderContext, providerConfig)),
        })
        const data = await safeJson(response)
        if (!response.ok) {
          return createNormalizedShipment({
            carrier: "dhl",
            method: "premium",
            methodLabel: "Spedizione premium",
            handoffMode: "pickup",
            status: "failed",
            rawProviderPayload: data,
            errorMessage: `DHL ha risposto con stato ${response.status}.`,
          })
        }
        return parseDhlShipmentResponse(data, providerConfig, orderContext)
      } catch (error) {
        return createNormalizedShipment({
          carrier: "dhl",
          method: "premium",
          methodLabel: "Spedizione premium",
          handoffMode: "pickup",
          status: "failed",
          errorMessage: error?.message || "Creazione spedizione DHL non riuscita.",
        })
      }
    },
    async getTracking({ trackingNumber, fetchImpl = fetch }) {
      if (providerConfig.useMock) {
        return dhlMock.getTracking({ trackingNumber, providerConfig })
      }

      if (!isDhlConfigured(providerConfig)) {
        return createNormalizedShipment({
          carrier: "dhl",
          method: "premium",
          methodLabel: "Spedizione premium",
          trackingNumber,
          trackingUrl: buildDhlTrackingUrl(trackingNumber, providerConfig),
          handoffMode: "pickup",
          status: "pending",
          errorMessage: "Tracking DHL non configurato.",
        })
      }

      try {
        const url = new URL(buildApiUrl(providerConfig, "/tracking"))
        if (trackingNumber) url.searchParams.set("trackingNumber", trackingNumber)
        const response = await fetchImpl(url.toString(), {
          headers: buildDhlAuthHeaders(providerConfig),
        })
        const data = await safeJson(response)
        if (!response.ok) throw new Error(`DHL tracking error ${response.status}`)
        return parseDhlTrackingResponse(data, providerConfig)
      } catch (error) {
        return createNormalizedShipment({
          carrier: "dhl",
          method: "premium",
          methodLabel: "Spedizione premium",
          trackingNumber,
          trackingUrl: buildDhlTrackingUrl(trackingNumber, providerConfig),
          handoffMode: "pickup",
          status: "pending",
          errorMessage: error?.message || "Tracking DHL non disponibile.",
        })
      }
    },
    async getLabel({ shipmentReference }) {
      if (providerConfig.useMock) {
        return dhlMock.getLabel({ shipmentReference, providerConfig })
      }

      return {
        labelUrl: null,
        labelFormat: "pdf",
      }
    },
    async createPickup(context) {
      if (providerConfig.useMock) {
        return dhlMock.createPickup(context)
      }

      return {
        ok: false,
        status: "pending",
        message: "Pickup DHL predisposto ma non ancora attivo.",
      }
    },
    async validateAddress(context) {
      if (providerConfig.useMock) {
        return dhlMock.validateAddress(context)
      }

      return {
        ok: true,
        valid: true,
        warnings: [],
      }
    },
  }
}
