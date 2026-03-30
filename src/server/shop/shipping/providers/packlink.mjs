import * as inpostMock from "../mocks/inpost.mock.mjs"
import { createNormalizedRateQuote, createNormalizedShipment } from "../normalizers/shipment-normalizer.mjs"

function normalizeOptionalString(value) {
  const normalized = String(value || "").trim()
  return normalized || null
}

function buildApiUrl(providerConfig, path) {
  return `${String(providerConfig.apiBaseUrl || "").replace(/\/$/, "")}/${String(path || "").replace(/^\//, "")}`
}

function logPacklink(event, details = {}) {
  console.info("[shipping:packlink]", event, details)
}

async function safeJson(response) {
  const text = await response.text()
  try {
    return text ? JSON.parse(text) : null
  } catch {
    return null
  }
}

function buildPacklinkHeaders(providerConfig) {
  return {
    Authorization: `Bearer ${providerConfig.apiKey || ""}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  }
}

function findFirstString(value, paths) {
  for (const path of paths) {
    let current = value
    for (const segment of path) {
      if (current == null) {
        current = undefined
        break
      }
      current = current[segment]
    }
    if (typeof current === "string" && current.trim()) {
      return current.trim()
    }
  }
  return null
}

function isPacklinkConfigured(providerConfig) {
  return Boolean(
    providerConfig.apiKey &&
      providerConfig.serviceId &&
      providerConfig.sender?.name &&
      providerConfig.sender?.email &&
      providerConfig.sender?.phone &&
      providerConfig.sender?.street1 &&
      providerConfig.sender?.city &&
      providerConfig.sender?.zip &&
      providerConfig.sender?.country,
  )
}

function buildRecipientName(orderContext) {
  return [orderContext?.shippingAddress?.firstName, orderContext?.shippingAddress?.lastName].filter(Boolean).join(" ").trim() || orderContext?.shippingAddress?.email || "Cliente"
}

function validateRecipientAddress(orderContext) {
  const shippingAddress = orderContext?.shippingAddress || {}
  const missing = []

  if (!buildRecipientName(orderContext)) missing.push("nome destinatario")
  if (!normalizeOptionalString(shippingAddress.email)) missing.push("email")
  if (!normalizeOptionalString(shippingAddress.phone)) missing.push("telefono")
  if (!normalizeOptionalString(shippingAddress.addressLine1)) missing.push("indirizzo")
  if (!normalizeOptionalString(shippingAddress.city)) missing.push("citta")
  if (!normalizeOptionalString(shippingAddress.postalCode)) missing.push("CAP")
  if (!normalizeOptionalString(shippingAddress.country)) missing.push("paese")

  return {
    ok: missing.length === 0,
    missing,
  }
}

function buildPacklinkShipmentPayload(orderContext, providerConfig) {
  const shippingAddress = orderContext?.shippingAddress || {}
  return {
    service_id: providerConfig.serviceId,
    from: {
      name: providerConfig.sender.name,
      email: providerConfig.sender.email,
      phone: providerConfig.sender.phone,
      street1: providerConfig.sender.street1,
      city: providerConfig.sender.city,
      zip: providerConfig.sender.zip,
      country: providerConfig.sender.country,
    },
    to: {
      name: buildRecipientName(orderContext),
      email: shippingAddress.email || null,
      phone: shippingAddress.phone || null,
      street1: [shippingAddress.addressLine1, shippingAddress.streetNumber].filter(Boolean).join(" ").trim(),
      city: shippingAddress.city || null,
      zip: shippingAddress.postalCode || null,
      country: shippingAddress.country || "IT",
    },
    parcels: [
      {
        weight: Number(providerConfig.parcelDefaults?.weightKg || 1),
        length: Number(providerConfig.parcelDefaults?.lengthCm || 30),
        width: Number(providerConfig.parcelDefaults?.widthCm || 20),
        height: Number(providerConfig.parcelDefaults?.heightCm || 5),
      },
    ],
  }
}

function parsePacklinkShipmentResponse(data, orderContext) {
  const shipmentId =
    findFirstString(data, [["shipment_id"], ["shipmentId"], ["id"], ["data", "shipment_id"], ["data", "id"]])
  const trackingNumber =
    findFirstString(data, [
      ["tracking_number"],
      ["trackingNumber"],
      ["tracking", "number"],
      ["data", "tracking_number"],
      ["data", "trackingNumber"],
      ["parcel", "tracking_number"],
    ])
  const trackingUrl =
    findFirstString(data, [
      ["tracking_url"],
      ["trackingUrl"],
      ["tracking", "url"],
      ["data", "tracking_url"],
      ["data", "trackingUrl"],
      ["links", "tracking"],
    ])
  const labelUrl =
    findFirstString(data, [
      ["label_url"],
      ["labelUrl"],
      ["label", "url"],
      ["data", "label_url"],
      ["data", "labelUrl"],
      ["labels", 0, "url"],
      ["documents", 0, "url"],
    ])
  const carrier =
    findFirstString(data, [["carrier"], ["carrier_name"], ["carrierName"], ["service", "carrier_name"], ["data", "carrier"]]) ||
    "BRT"
  const status =
    findFirstString(data, [["status"], ["shipment_status"], ["data", "status"]]) || (trackingNumber ? "created" : "failed")

  logPacklink("createShipment.parsed", {
    shipmentId,
    carrier,
    hasTrackingNumber: Boolean(trackingNumber),
    hasTrackingUrl: Boolean(trackingUrl),
    hasLabelUrl: Boolean(labelUrl),
    status,
  })

  return createNormalizedShipment({
    carrier,
    carrierLabel: carrier,
    method: "economy",
    methodLabel: "Spedizione economica",
    serviceName: normalizeOptionalString(data?.service_name) || "Packlink Economy",
    shippingCost: orderContext?.shippingCost ?? null,
    trackingNumber,
    trackingUrl,
    labelUrl,
    labelFormat: "pdf",
    shipmentReference: shipmentId,
    handoffMode: "dropoff",
    status,
    rawProviderPayload: data,
    errorMessage: trackingNumber ? null : "Risposta Packlink senza tracking number.",
  })
}

function parsePacklinkTrackingResponse(data, trackingNumber, shipmentReference = null) {
  const statusCode = String(
    findFirstString(data, [["status"], ["shipment_status"], ["tracking_status"], ["data", "status"], ["tracking", "status"]]) || "",
  )
    .trim()
    .toLowerCase()
  const carrier = findFirstString(data, [["carrier"], ["carrier_name"], ["carrierName"], ["service", "carrier_name"], ["data", "carrier"]]) || "BRT"

  const mappedStatus =
    statusCode.includes("out_for_delivery") || statusCode.includes("out for delivery")
        ? "out_for_delivery"
      : statusCode.includes("deliver")
        ? "delivered"
      : statusCode.includes("transit")
          ? "in_transit"
        : statusCode.includes("accept") || statusCode.includes("create")
            ? "accepted"
            : trackingNumber
              ? "accepted"
              : "pending"

  const trackingUrl =
    findFirstString(data, [["tracking_url"], ["trackingUrl"], ["tracking", "url"], ["data", "tracking_url"], ["links", "tracking"]])
  const labelUrl =
    findFirstString(data, [["label_url"], ["labelUrl"], ["label", "url"], ["data", "label_url"], ["labels", 0, "url"], ["documents", 0, "url"]])
  const resolvedShipmentReference =
    findFirstString(data, [["shipment_id"], ["shipmentId"], ["id"], ["data", "shipment_id"], ["data", "id"]]) || shipmentReference

  logPacklink("getTracking.parsed", {
    shipmentReference: resolvedShipmentReference,
    trackingNumber,
    carrier,
    status: mappedStatus,
    hasTrackingUrl: Boolean(trackingUrl),
    hasLabelUrl: Boolean(labelUrl),
  })

  return createNormalizedShipment({
    carrier,
    carrierLabel: carrier,
    method: "economy",
    methodLabel: "Spedizione economica",
    trackingNumber,
    trackingUrl,
    labelUrl,
    shipmentReference: resolvedShipmentReference,
    handoffMode: "dropoff",
    status: mappedStatus,
    rawProviderPayload: data,
  })
}

async function getMockFallbackShipment(orderContext, providerConfig, reason) {
  logPacklink("createShipment.fallback", {
    reason,
    orderReference: orderContext?.orderReference || orderContext?.order?.orderReference || null,
  })
  const fallback = await inpostMock.createShipment({ orderContext, providerConfig })
  return createNormalizedShipment({
    ...fallback,
    rawProviderPayload: {
      ...(fallback.rawProviderPayload || {}),
      provider: "packlink",
      fallbackReason: reason,
    },
  })
}

export function createPacklinkProvider(providerConfig) {
  return {
    key: "packlink",
    carrier: "packlink",
    method: "economy",
    async getRates({ orderContext }) {
      const fallback = await inpostMock.getRates({ orderContext, providerConfig })
      return createNormalizedRateQuote({
        ...fallback,
        source: "packlink_fallback_rate",
        meta: { ...(fallback.meta || {}), provider: "packlink" },
      })
    },
    async createShipment({ orderContext, fetchImpl = fetch }) {
      if (providerConfig.useMock || !isPacklinkConfigured(providerConfig)) {
        return getMockFallbackShipment(orderContext, providerConfig, providerConfig.useMock ? "mock_forced" : "missing_configuration")
      }

      const recipientValidation = validateRecipientAddress(orderContext)
      if (!recipientValidation.ok) {
        logPacklink("createShipment.invalid_order_data", {
          orderReference: orderContext?.orderReference || orderContext?.order?.orderReference || null,
          missing: recipientValidation.missing,
        })
        return createNormalizedShipment({
          carrier: "packlink",
          carrierLabel: "Packlink",
          method: "economy",
          methodLabel: "Spedizione economica",
          handoffMode: "dropoff",
          status: "failed",
          errorMessage: `Dati spedizione incompleti: ${recipientValidation.missing.join(", ")}.`,
        })
      }

      try {
        const payload = buildPacklinkShipmentPayload(orderContext, providerConfig)
        logPacklink("createShipment.real_request", {
          apiBaseUrl: providerConfig.apiBaseUrl,
          serviceId: providerConfig.serviceId,
          orderReference: orderContext?.orderReference || orderContext?.order?.orderReference || null,
          destinationCountry: payload?.to?.country || null,
          destinationZip: payload?.to?.zip || null,
        })
        const response = await fetchImpl(buildApiUrl(providerConfig, "/shipments"), {
          method: "POST",
          headers: buildPacklinkHeaders(providerConfig),
          body: JSON.stringify(payload),
        })
        const data = await safeJson(response)
        if (!response.ok) {
          console.error("Packlink createShipment failed", { status: response.status, data })
          return getMockFallbackShipment(orderContext, providerConfig, `http_${response.status}`)
        }
        return parsePacklinkShipmentResponse(data, orderContext)
      } catch (error) {
        console.error("Packlink createShipment error", error)
        return getMockFallbackShipment(orderContext, providerConfig, "request_failed")
      }
    },
    async getTracking({ trackingNumber, shipmentReference, currentStatus, fetchImpl = fetch }) {
      if (providerConfig.useMock || !providerConfig.apiKey) {
        return inpostMock.getTracking({ trackingNumber, currentStatus, providerConfig })
      }

      try {
        const lookupId = shipmentReference || trackingNumber
        logPacklink("getTracking.real_request", {
          lookupId,
          trackingNumber,
          currentStatus,
        })
        const response = await fetchImpl(buildApiUrl(providerConfig, `/shipments/${encodeURIComponent(lookupId || "")}`), {
          headers: buildPacklinkHeaders(providerConfig),
        })
        const data = await safeJson(response)
        if (!response.ok) {
          console.error("Packlink getTracking failed", { status: response.status, data })
          return inpostMock.getTracking({ trackingNumber, currentStatus, providerConfig })
        }
        return parsePacklinkTrackingResponse(data, trackingNumber, shipmentReference)
      } catch (error) {
        console.error("Packlink getTracking error", error)
        return inpostMock.getTracking({ trackingNumber, currentStatus, providerConfig })
      }
    },
    async getLabel({ shipmentReference }) {
      return inpostMock.getLabel({ shipmentReference, providerConfig })
    },
    async createPickup(context) {
      return inpostMock.createPickup(context)
    },
    async validateAddress(context) {
      return inpostMock.validateAddress(context)
    },
  }
}
