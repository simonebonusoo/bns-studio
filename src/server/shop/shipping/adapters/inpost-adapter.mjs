import { createNormalizedRateQuote, createNormalizedShipment } from "../normalizers/shipment-normalizer.mjs"

function normalizeOptionalString(value) {
  const normalized = String(value || "").trim()
  return normalized || null
}

function normalizeFormatLabel(item) {
  return String(item?.variantLabel || item?.format || "").trim().toUpperCase()
}

function getOrderItems(context = {}) {
  return Array.isArray(context.items) ? context.items : Array.isArray(context.order?.items) ? context.order.items : []
}

function buildUrl(baseUrl, path) {
  const base = normalizeOptionalString(baseUrl)
  if (!base) return null
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`
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

export function deriveInpostPackageProfile(items = [], providerConfig) {
  const quantity = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
  const hasA3 = items.some((item) => normalizeFormatLabel(item).includes("A3"))
  const hasOversize = quantity >= 4

  if (hasA3 || hasOversize) {
    return {
      profile: "tube-medium",
      rate: Math.round(Number(providerConfig?.economyRateA3 || 690)),
    }
  }

  return {
    profile: "tube-small",
    rate: Math.round(Number(providerConfig?.economyRateA4 || 590)),
  }
}

export function buildInpostAuthHeaders(providerConfig) {
  return {
    Authorization: `Bearer ${providerConfig.apiKey || ""}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  }
}

export function isInpostConfigured(providerConfig) {
  return Boolean(providerConfig.apiBaseUrl && providerConfig.apiKey)
}

export function buildInpostTrackingUrl(trackingNumber, providerConfig) {
  const normalized = normalizeOptionalString(trackingNumber)
  const baseUrl = normalizeOptionalString(providerConfig?.trackingBaseUrl)
  if (!normalized || !baseUrl) return null

  try {
    const url = new URL(baseUrl)
    url.searchParams.set("number", normalized)
    return url.toString()
  } catch {
    return `${baseUrl.replace(/\/$/, "")}?number=${encodeURIComponent(normalized)}`
  }
}

export function buildInpostRateQuote(orderContext = {}, providerConfig) {
  const items = getOrderItems(orderContext)
  const profile = deriveInpostPackageProfile(items, providerConfig)

  return createNormalizedRateQuote({
    carrier: "inpost",
    method: "economy",
    methodLabel: "Spedizione economica",
    description: "Più conveniente, perfetta per risparmiare.",
    serviceName: "InPost Standard",
    shippingCost: profile.rate,
    currency: "EUR",
    rateSource: "inpost_dimension_profile",
    rawProviderPayload: {
      packageProfile: profile.profile,
      items: items.length,
    },
  })
}

export function buildInpostShipmentPayload(orderContext = {}, providerConfig) {
  const order = orderContext.order || orderContext
  const profile = deriveInpostPackageProfile(getOrderItems(orderContext), providerConfig)
  const receiverName = [order.firstName, order.lastName].filter(Boolean).join(" ").trim() || order.email

  return {
    receiver: {
      email: order.email,
      phone: order.phone,
      first_name: order.firstName,
      last_name: order.lastName,
      address: {
        line1: [order.addressLine1, order.streetNumber].filter(Boolean).join(" ").trim(),
        line2: [order.addressLine2, order.staircase && `Scala ${order.staircase}`, order.apartment && `Int. ${order.apartment}`]
          .filter(Boolean)
          .join(" · "),
        city: order.city,
        post_code: order.postalCode,
        country_code: String(order.country || "IT").trim().toUpperCase(),
      },
    },
    service: "inpost_locker_standard",
    reference: order.orderReference,
    package: {
      template: profile.profile,
    },
    comments: order.deliveryNotes || `Ordine ${receiverName}`,
  }
}

export function parseInpostShipmentResponse(data, providerConfig, orderContext = {}) {
  const trackingNumber =
    findFirstString(data, [["tracking_number"], ["trackingNumber"], ["parcels", 0, "tracking_number"], ["id"]]) || null
  const shipmentReference = findFirstString(data, [["id"], ["reference"], ["shipment_reference"]]) || null
  const labelUrl =
    findFirstString(data, [["label_url"], ["labelUrl"], ["label", "href"], ["href"]]) ||
    buildUrl(providerConfig.apiBaseUrl, `/shipments/${encodeURIComponent(shipmentReference || trackingNumber || "shipment")}/label`)

  return createNormalizedShipment({
    carrier: "inpost",
    method: "economy",
    methodLabel: "Spedizione economica",
    serviceName:
      findFirstString(data, [["service"], ["offer", "name"], ["custom_attributes", "service"]]) || "InPost Standard",
    shippingCost: orderContext.shippingCost ?? null,
    currency: "EUR",
    trackingNumber,
    trackingUrl:
      findFirstString(data, [["tracking_url"], ["trackingUrl"]]) || buildInpostTrackingUrl(trackingNumber, providerConfig),
    labelUrl,
    labelFormat: "pdf",
    shipmentReference,
    handoffMode: "dropoff",
    status: trackingNumber ? "created" : "failed",
    rawProviderPayload: data,
    errorMessage: trackingNumber ? null : "Risposta InPost senza tracking number.",
  })
}

export function parseInpostTrackingResponse(data, providerConfig) {
  const trackingNumber =
    findFirstString(data, [["tracking_number"], ["trackingNumber"], ["parcels", 0, "tracking_number"]]) || null
  const statusCode = String(
    findFirstString(data, [["status"], ["parcels", 0, "tracking_details", 0, "status"], ["tracking_details", 0, "status"]]) || "",
  )
    .trim()
    .toLowerCase()

  const mappedStatus =
    statusCode.includes("delivered")
      ? "delivered"
      : statusCode.includes("transit") || statusCode.includes("dispatch")
        ? "in_transit"
        : trackingNumber
          ? "accepted"
          : "pending"

  return createNormalizedShipment({
    carrier: "inpost",
    method: "economy",
    methodLabel: "Spedizione economica",
    trackingNumber,
    trackingUrl: buildInpostTrackingUrl(trackingNumber, providerConfig),
    shipmentReference: trackingNumber,
    handoffMode: "dropoff",
    status: mappedStatus,
    rawProviderPayload: data,
  })
}
