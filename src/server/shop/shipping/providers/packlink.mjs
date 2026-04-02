import { createNormalizedRateQuote, createNormalizedShipment } from "../normalizers/shipment-normalizer.mjs"

function normalizeOptionalString(value) {
  const normalized = String(value || "").trim()
  return normalized || null
}

function normalizePacklinkApiBaseUrl(baseUrl) {
  const normalized = String(baseUrl || "").trim().replace(/\/+$/, "")
  if (!normalized) return ""
  if (/\/v1$/i.test(normalized)) return normalized
  return `${normalized}/v1`
}

function buildApiUrl(providerConfig, path) {
  const normalizedBaseUrl = normalizePacklinkApiBaseUrl(providerConfig.apiBaseUrl)
  return `${normalizedBaseUrl}/${String(path || "").replace(/^\/+/, "")}`
}

function summarizePacklinkResponseBody(data) {
  if (!data || typeof data !== "object") return data ? "[response]" : null

  const summary = {}
  const shipmentId = findFirstString(data, [["shipment_id"], ["shipmentId"], ["id"], ["data", "shipment_id"], ["data", "id"]])
  const trackingNumber = findFirstString(data, [["tracking_number"], ["trackingNumber"], ["tracking", "number"], ["data", "tracking_number"]])
  const trackingUrl = findFirstString(data, [["tracking_url"], ["trackingUrl"], ["tracking", "url"], ["data", "tracking_url"]])
  const labelUrl = findFirstString(data, [["label_url"], ["labelUrl"], ["label", "url"], ["data", "label_url"]])
  const carrier = findFirstString(data, [["carrier"], ["carrier_name"], ["carrierName"], ["service", "carrier_name"], ["data", "carrier"]])
  const status = findFirstString(data, [["status"], ["shipment_status"], ["tracking_status"], ["data", "status"], ["tracking", "status"]])

  if (shipmentId) summary.shipmentId = shipmentId
  if (carrier) summary.carrier = carrier
  if (status) summary.status = status
  if (trackingNumber) summary.hasTrackingNumber = true
  if (trackingUrl) summary.hasTrackingUrl = true
  if (labelUrl) summary.hasLabelUrl = true

  return Object.keys(summary).length ? summary : "[response]"
}

function redactPacklinkLogDetails(details = {}) {
  const redacted = { ...details }

  if ("payload" in redacted) {
    redacted.payload = "[redacted]"
  }
  if ("body" in redacted) {
    redacted.body = summarizePacklinkResponseBody(redacted.body)
  }
  if ("data" in redacted) {
    redacted.data = summarizePacklinkResponseBody(redacted.data)
  }
  if ("destinationZip" in redacted && redacted.destinationZip) {
    redacted.destinationZip = "[redacted]"
  }
  if ("trackingNumber" in redacted && redacted.trackingNumber) {
    redacted.trackingNumber = "[redacted]"
  }

  return redacted
}

function logPacklink(event, details = {}) {
  console.info("[shipping:packlink]", event, redactPacklinkLogDetails(details))
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

function buildPacklinkConfigValidation(providerConfig) {
  const missing = []

  if (!providerConfig.apiKey) missing.push("PACKLINK_API_KEY")
  if (!providerConfig.apiBaseUrl) missing.push("PACKLINK_API_BASE_URL")
  if (!providerConfig.sender?.name) missing.push("PACKLINK_SENDER_NAME")
  if (!providerConfig.sender?.email) missing.push("PACKLINK_SENDER_EMAIL")
  if (!providerConfig.sender?.phone) missing.push("PACKLINK_SENDER_PHONE")
  if (!providerConfig.sender?.street1) missing.push("PACKLINK_SENDER_STREET1")
  if (!providerConfig.sender?.city) missing.push("PACKLINK_SENDER_CITY")
  if (!providerConfig.sender?.zip) missing.push("PACKLINK_SENDER_ZIP")
  if (!providerConfig.sender?.country) missing.push("PACKLINK_SENDER_COUNTRY")
  if (!Number(providerConfig.parcelDefaults?.weightKg || 0)) missing.push("PACKLINK_PARCEL_WEIGHT_KG")
  if (!Number(providerConfig.parcelDefaults?.lengthCm || 0)) missing.push("PACKLINK_PARCEL_LENGTH_CM")
  if (!Number(providerConfig.parcelDefaults?.widthCm || 0)) missing.push("PACKLINK_PARCEL_WIDTH_CM")
  if (!Number(providerConfig.parcelDefaults?.heightCm || 0)) missing.push("PACKLINK_PARCEL_HEIGHT_CM")

  return {
    ok: missing.length === 0,
    missing,
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
  return buildPacklinkConfigValidation(providerConfig).ok
}

function buildRecipientName(orderContext) {
  return [orderContext?.shippingAddress?.firstName, orderContext?.shippingAddress?.lastName].filter(Boolean).join(" ").trim() || orderContext?.shippingAddress?.email || "Cliente"
}

function validateRecipientAddress(orderContext) {
  const shippingAddress = orderContext?.shippingAddress || {}
  const missing = []

  if (!buildRecipientName(orderContext)) missing.push("nome destinatario")
  if (!normalizeOptionalString(shippingAddress.email) && !normalizeOptionalString(shippingAddress.phone)) missing.push("email o telefono")
  if (!normalizeOptionalString(shippingAddress.addressLine1)) missing.push("indirizzo")
  if (!normalizeOptionalString(shippingAddress.city)) missing.push("citta")
  if (!normalizeOptionalString(shippingAddress.postalCode)) missing.push("CAP")
  if (!normalizeOptionalString(shippingAddress.country)) missing.push("paese")

  return {
    ok: missing.length === 0,
    missing,
  }
}

function buildPacklinkBasePayload(orderContext, providerConfig) {
  const shippingAddress = orderContext?.shippingAddress || {}
  return {
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

function buildPacklinkShipmentPayload(orderContext, providerConfig, serviceId) {
  return {
    ...buildPacklinkBasePayload(orderContext, providerConfig),
    service_id: serviceId,
  }
}

function buildPacklinkQuotesPayload(orderContext, providerConfig) {
  return buildPacklinkBasePayload(orderContext, providerConfig)
}

function normalizeCarrierName(value) {
  return String(value || "").trim().toLowerCase()
}

function normalizeQuoteAmount(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function extractQuoteCandidates(data) {
  const rawCandidates = Array.isArray(data)
    ? data
    : Array.isArray(data?.quotes)
      ? data.quotes
      : Array.isArray(data?.services)
        ? data.services
        : Array.isArray(data?.results)
          ? data.results
          : Array.isArray(data?.data)
            ? data.data
            : []

  return rawCandidates
    .map((entry) => {
      const serviceId =
        findFirstString(entry, [["service_id"], ["serviceId"], ["id"], ["service", "id"], ["service", "service_id"]])
      const carrier =
        findFirstString(entry, [["carrier"], ["carrier_name"], ["carrierName"], ["service", "carrier_name"], ["service", "carrier"], ["carrier", "name"]])
      const label =
        findFirstString(entry, [["label"], ["name"], ["service_name"], ["service", "name"], ["service", "label"]]) ||
        carrier ||
        "Servizio Packlink"
      const amount =
        normalizeQuoteAmount(entry?.amount) ??
        normalizeQuoteAmount(entry?.price) ??
        normalizeQuoteAmount(entry?.total_price) ??
        normalizeQuoteAmount(entry?.totalPrice) ??
        normalizeQuoteAmount(entry?.price?.amount) ??
        normalizeQuoteAmount(entry?.base_price)

      return {
        serviceId,
        carrier,
        label,
        amount,
        raw: entry,
      }
    })
    .filter((entry) => entry.serviceId && typeof entry.amount === "number")
}

function pickBestQuote(quotes, providerConfig) {
  const preferredCarrier = normalizeCarrierName(providerConfig.defaultCarrier)
  const normalizedQuotes = Array.isArray(quotes) ? quotes : []
  const matchingPreferred =
    preferredCarrier
      ? normalizedQuotes.filter((quote) => normalizeCarrierName(quote.carrier).includes(preferredCarrier))
      : []
  const pool = matchingPreferred.length ? matchingPreferred : normalizedQuotes
  if (!pool.length) return null
  return [...pool].sort((left, right) => left.amount - right.amount)[0]
}

async function getBestQuote(orderContext, providerConfig, fetchImpl = fetch) {
  const payload = buildPacklinkQuotesPayload(orderContext, providerConfig)
  const endpoint = buildApiUrl(providerConfig, "/quotes")

  logPacklink("quotes.final_url", {
    finalUrl: endpoint,
    method: "POST",
  })

  logPacklink("quotes.real_request", {
    endpoint,
    payload,
    orderReference: orderContext?.orderReference || orderContext?.order?.orderReference || null,
    destinationCountry: payload?.to?.country || null,
    destinationZip: payload?.to?.zip || null,
    preferredCarrier: providerConfig.defaultCarrier || null,
  })

  const response = await fetchImpl(endpoint, {
    method: "POST",
    headers: buildPacklinkHeaders(providerConfig),
    body: JSON.stringify(payload),
  })
  const data = await safeJson(response)

  logPacklink("quotes.real_response", {
    status: response.status,
    body: data,
  })

  if (!response.ok) {
    throw new Error(`Packlink quotes ha risposto con stato ${response.status}${data ? `: ${JSON.stringify(data)}` : ""}`)
  }

  const candidates = extractQuoteCandidates(data)
  const bestQuote = pickBestQuote(candidates, providerConfig)

  logPacklink("quotes.selected_service", {
    candidates: candidates.map((entry) => ({
      serviceId: entry.serviceId,
      carrier: entry.carrier,
      amount: entry.amount,
    })),
    selected: bestQuote
      ? {
          serviceId: bestQuote.serviceId,
          carrier: bestQuote.carrier,
          amount: bestQuote.amount,
        }
      : null,
  })

  if (!bestQuote) {
    throw new Error("Packlink non ha restituito nessun servizio valido per questa spedizione.")
  }

  return bestQuote
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

export function createPacklinkProvider(providerConfig) {
  return {
    key: "packlink",
    carrier: "packlink",
    method: "economy",
    async getRates({ orderContext, fetchImpl = fetch }) {
      const configValidation = buildPacklinkConfigValidation(providerConfig)
      logPacklink("quotes.mode", {
        useMockRequested: providerConfig.useMock,
        configured: configValidation.ok,
        missingConfig: configValidation.missing,
      })

      if (!configValidation.ok) {
        throw new Error(`Packlink configuration incomplete: ${configValidation.missing.join(", ")}`)
      }

      try {
        const bestQuote = await getBestQuote(orderContext, providerConfig, fetchImpl)
        return createNormalizedRateQuote({
          carrier: normalizeCarrierName(bestQuote.carrier) || "packlink",
          carrierLabel: bestQuote.carrier || "Packlink",
          method: "economy",
          methodLabel: "Spedizione economica",
          description: "Servizio selezionato automaticamente tramite Packlink.",
          serviceName: bestQuote.label,
          shippingCost: Math.round(bestQuote.amount * 100),
          currency: "EUR",
          rateSource: "packlink_quotes",
          rawProviderPayload: bestQuote.raw,
        })
      } catch (error) {
        throw new Error(error?.message || "Packlink quotes failed.")
      }
    },
    async createShipment({ orderContext, fetchImpl = fetch }) {
      const configValidation = buildPacklinkConfigValidation(providerConfig)
      logPacklink("createShipment.mode", {
        useMockRequested: providerConfig.useMock,
        configured: configValidation.ok,
        missingConfig: configValidation.missing,
      })

      if (!configValidation.ok) {
        return createNormalizedShipment({
          carrier: "packlink",
          carrierLabel: "Packlink",
          method: "economy",
          methodLabel: "Spedizione economica",
          handoffMode: "dropoff",
          status: "failed",
          errorMessage: `Packlink configuration incomplete: ${configValidation.missing.join(", ")}`,
        })
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
          errorMessage: `Packlink shipment creation failed: dati spedizione incompleti (${recipientValidation.missing.join(", ")})`,
        })
      }

      try {
        const bestQuote = await getBestQuote(orderContext, providerConfig, fetchImpl)
        const payload = buildPacklinkShipmentPayload(orderContext, providerConfig, bestQuote.serviceId)
        const endpoint = buildApiUrl(providerConfig, "/shipments")

        logPacklink("shipments.final_url", {
          finalUrl: endpoint,
          method: "POST",
        })

        logPacklink("createShipment.real_request", {
          endpoint,
          payload,
          serviceId: bestQuote.serviceId,
          selectedCarrier: bestQuote.carrier || null,
          selectedAmount: bestQuote.amount,
          orderReference: orderContext?.orderReference || orderContext?.order?.orderReference || null,
          destinationCountry: payload?.to?.country || null,
          destinationZip: payload?.to?.zip || null,
        })
        const response = await fetchImpl(endpoint, {
          method: "POST",
          headers: buildPacklinkHeaders(providerConfig),
          body: JSON.stringify(payload),
        })
        const data = await safeJson(response)
        logPacklink("createShipment.real_response", {
          status: response.status,
          body: data,
        })
        if (!response.ok) {
          console.error("Packlink createShipment failed", redactPacklinkLogDetails({ status: response.status, data }))
          return createNormalizedShipment({
            carrier: "packlink",
            carrierLabel: "Packlink",
            method: "economy",
            methodLabel: "Spedizione economica",
            handoffMode: "dropoff",
            status: "failed",
            rawProviderPayload: data,
            errorMessage: `Packlink shipment creation failed: ${response.status}${data ? ` ${JSON.stringify(data)}` : ""}`,
          })
        }
        return parsePacklinkShipmentResponse(data, orderContext)
      } catch (error) {
        console.error("Packlink createShipment error", error?.message || error)
        return createNormalizedShipment({
          carrier: "packlink",
          carrierLabel: "Packlink",
          method: "economy",
          methodLabel: "Spedizione economica",
          handoffMode: "dropoff",
          status: "failed",
          errorMessage: error?.message || "Packlink shipment creation failed.",
        })
      }
    },
    async getTracking({ trackingNumber, shipmentReference, currentStatus, fetchImpl = fetch }) {
      const configValidation = buildPacklinkConfigValidation(providerConfig)
      logPacklink("getTracking.mode", {
        useMockRequested: providerConfig.useMock,
        configured: configValidation.ok,
        shipmentReference: shipmentReference || null,
        trackingNumber: trackingNumber || null,
        missingConfig: configValidation.missing,
      })

      if (!providerConfig.apiKey) {
        return createNormalizedShipment({
          carrier: "packlink",
          carrierLabel: "Packlink",
          method: "economy",
          methodLabel: "Spedizione economica",
          trackingNumber,
          shipmentReference,
          handoffMode: "dropoff",
          status: currentStatus || "pending",
          errorMessage: "Packlink configuration incomplete: PACKLINK_API_KEY",
        })
      }

      if (!configValidation.ok) {
        return createNormalizedShipment({
          carrier: "packlink",
          carrierLabel: "Packlink",
          method: "economy",
          methodLabel: "Spedizione economica",
          trackingNumber,
          shipmentReference,
          handoffMode: "dropoff",
          status: currentStatus || "pending",
          errorMessage: `Packlink configuration incomplete: ${configValidation.missing.join(", ")}`,
        })
      }

      try {
        const lookupId = shipmentReference || trackingNumber
        if (!lookupId) {
          return createNormalizedShipment({
            carrier: "packlink",
            carrierLabel: "Packlink",
            method: "economy",
            methodLabel: "Spedizione economica",
            trackingNumber,
            shipmentReference,
            handoffMode: "dropoff",
            status: currentStatus || "pending",
            errorMessage: "Tracking Packlink non disponibile: shipmentReference o trackingNumber mancanti.",
          })
        }
        logPacklink("getTracking.real_request", {
          lookupId,
          trackingNumber,
          currentStatus,
        })
        const endpoint = buildApiUrl(providerConfig, `/shipments/${encodeURIComponent(lookupId || "")}`)
        logPacklink("tracking.final_url", {
          finalUrl: endpoint,
          method: "GET",
        })
        const response = await fetchImpl(endpoint, {
          headers: buildPacklinkHeaders(providerConfig),
        })
        const data = await safeJson(response)
        if (!response.ok) {
          console.error("Packlink getTracking failed", redactPacklinkLogDetails({ status: response.status, data, trackingNumber }))
          return createNormalizedShipment({
            carrier: "packlink",
            carrierLabel: "Packlink",
            method: "economy",
            methodLabel: "Spedizione economica",
            trackingNumber,
            shipmentReference,
            handoffMode: "dropoff",
            status: currentStatus || "pending",
            rawProviderPayload: data,
            errorMessage: `Packlink tracking failed: ${response.status}${data ? ` ${JSON.stringify(data)}` : ""}`,
          })
        }
        return parsePacklinkTrackingResponse(data, trackingNumber, shipmentReference)
      } catch (error) {
        console.error("Packlink getTracking error", error?.message || error)
        return createNormalizedShipment({
          carrier: "packlink",
          carrierLabel: "Packlink",
          method: "economy",
          methodLabel: "Spedizione economica",
          trackingNumber,
          shipmentReference,
          handoffMode: "dropoff",
          status: currentStatus || "pending",
          errorMessage: error?.message || "Packlink tracking failed.",
        })
      }
    },
    async getLabel({ shipmentReference }) {
      return {
        labelUrl: shipmentReference ? buildApiUrl(providerConfig, `/shipments/${encodeURIComponent(shipmentReference)}/label`) : null,
        labelFormat: "pdf",
      }
    },
    async createPickup(context) {
      return {
        ok: false,
        status: "pending",
        message: "Pickup Packlink non ancora attivo.",
      }
    },
    async validateAddress(context) {
      return {
        ok: true,
        valid: true,
        warnings: [],
      }
    },
  }
}
