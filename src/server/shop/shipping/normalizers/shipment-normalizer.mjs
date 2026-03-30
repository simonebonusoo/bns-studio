const CARRIER_LABELS = {
  dhl: "DHL",
  inpost: "InPost",
}

const METHOD_LABELS = {
  economy: "Spedizione economica",
  premium: "Spedizione premium",
}

const METHOD_TO_CARRIER = {
  economy: "inpost",
  premium: "dhl",
}

const SUPPORTED_STATUSES = ["pending", "accepted", "created", "in_transit", "shipped", "delivered", "failed", "not_created"]
const SUPPORTED_HANDOFF_MODES = ["dropoff", "pickup"]

function normalizeOptionalString(value) {
  const normalized = String(value || "").trim()
  return normalized || null
}

function normalizeMoney(value) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) return null
  return Math.round(parsed)
}

function normalizePayload(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value
  }
  return null
}

export function normalizeCarrier(value) {
  const normalized = String(value || "").trim().toLowerCase()
  return normalized === "dhl" || normalized === "inpost" ? normalized : null
}

export function normalizeMethod(value) {
  const normalized = String(value || "").trim().toLowerCase()
  return normalized === "economy" || normalized === "premium" ? normalized : null
}

export function normalizeCarrierLabel(carrier, carrierLabel = null) {
  return normalizeOptionalString(carrierLabel) || (carrier ? CARRIER_LABELS[carrier] || carrier.toUpperCase() : null)
}

export function normalizeMethodLabel(method, methodLabel = null) {
  return normalizeOptionalString(methodLabel) || (method ? METHOD_LABELS[method] || method : null)
}

export function normalizeShipmentStatus(value) {
  const normalized = String(value || "").trim().toLowerCase()
  return SUPPORTED_STATUSES.includes(normalized) ? normalized : "pending"
}

export function normalizeHandoffMode(value) {
  const normalized = String(value || "").trim().toLowerCase()
  return SUPPORTED_HANDOFF_MODES.includes(normalized) ? normalized : null
}

export function getCarrierForMethod(method) {
  return METHOD_TO_CARRIER[normalizeMethod(method) || ""] || null
}

export function createNormalizedShipment(partial = {}) {
  const method = normalizeMethod(partial.method)
  const carrier = normalizeCarrier(partial.carrier) || getCarrierForMethod(method)

  return {
    carrier,
    carrierLabel: normalizeCarrierLabel(carrier, partial.carrierLabel),
    method,
    methodLabel: normalizeMethodLabel(method, partial.methodLabel),
    serviceName: normalizeOptionalString(partial.serviceName),
    shippingCost: normalizeMoney(partial.shippingCost),
    currency: normalizeOptionalString(partial.currency) || "EUR",
    trackingNumber: normalizeOptionalString(partial.trackingNumber),
    trackingUrl: normalizeOptionalString(partial.trackingUrl),
    labelUrl: normalizeOptionalString(partial.labelUrl),
    labelFormat: normalizeOptionalString(partial.labelFormat),
    shipmentReference: normalizeOptionalString(partial.shipmentReference),
    handoffMode: normalizeHandoffMode(partial.handoffMode),
    status: normalizeShipmentStatus(partial.status),
    rateSource: normalizeOptionalString(partial.rateSource),
    description: normalizeOptionalString(partial.description),
    errorMessage: normalizeOptionalString(partial.errorMessage),
    rawProviderPayload: normalizePayload(partial.rawProviderPayload),
  }
}

export function createNormalizedRateQuote(partial = {}) {
  const shipment = createNormalizedShipment(partial)

  return {
    key: shipment.method,
    carrier: shipment.carrier,
    carrierLabel: shipment.carrierLabel,
    label: shipment.methodLabel,
    description: shipment.description,
    cost: shipment.shippingCost,
    currency: shipment.currency,
    serviceName: shipment.serviceName,
    source: shipment.rateSource,
    meta: shipment.rawProviderPayload,
  }
}

export function stringifyProviderPayload(value) {
  try {
    const payload = normalizePayload(value)
    return payload ? JSON.stringify(payload) : null
  } catch {
    return null
  }
}

export function buildOrderShipmentUpdateData(shipment) {
  const normalized = createNormalizedShipment(shipment)

  return {
    shippingMethod: normalized.method,
    shippingCarrier: normalized.carrierLabel,
    shippingLabel: normalized.methodLabel,
    shippingCost: normalized.shippingCost,
    shippingStatus: normalized.status,
    trackingNumber: normalized.trackingNumber,
    trackingUrl: normalized.trackingUrl,
    labelUrl: normalized.labelUrl,
    shipmentReference: normalized.shipmentReference,
    shippingHandoffMode: normalized.handoffMode,
    shippingProviderPayload: stringifyProviderPayload(normalized.rawProviderPayload),
    shippingCreatedAt:
      normalized.status === "pending" || normalized.status === "failed" || normalized.status === "not_created"
        ? null
        : new Date(),
    shippingError: normalized.errorMessage,
  }
}
