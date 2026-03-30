import { env } from "../config/env.mjs"

const DHL_API_BASE_URL = {
  sandbox: "https://express.api.dhl.com/mydhlapi/test",
  production: "https://express.api.dhl.com/mydhlapi",
}

function normalizeOptionalString(value) {
  const normalized = String(value || "").trim()
  return normalized || null
}

function normalizeCountryCode(value, fallback = "IT") {
  const normalized = String(value || fallback).trim().toUpperCase()
  return normalized || fallback
}

function buildDhlAuthHeader(currentEnv = env) {
  const credentials = `${currentEnv.dhlApiKey || ""}:${currentEnv.dhlApiSecret || ""}`
  return `Basic ${Buffer.from(credentials).toString("base64")}`
}

function isHttpUrl(value) {
  return typeof value === "string" && /^https?:\/\//i.test(value.trim())
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

export function getDhlApiBaseUrl(currentEnv = env) {
  return currentEnv.dhlEnv === "production" ? DHL_API_BASE_URL.production : DHL_API_BASE_URL.sandbox
}

export function buildDhlTrackingUrl(trackingNumber, currentEnv = env) {
  const normalized = normalizeOptionalString(trackingNumber)
  if (!normalized) return null

  const baseUrl = normalizeOptionalString(currentEnv.dhlTrackingBaseUrl) || env.dhlTrackingBaseUrl

  try {
    const url = new URL(baseUrl)
    url.searchParams.set("tracking-id", normalized)
    url.searchParams.set("submit", "1")
    return url.toString()
  } catch {
    return `${baseUrl.replace(/\/$/, "")}?tracking-id=${encodeURIComponent(normalized)}&submit=1`
  }
}

export function isDhlConfigured(currentEnv = env) {
  return Boolean(
    currentEnv.dhlApiKey &&
      currentEnv.dhlApiSecret &&
      currentEnv.dhlAccountNumber &&
      currentEnv.dhlShipperName &&
      currentEnv.dhlShipperEmail &&
      currentEnv.dhlShipperPhone &&
      currentEnv.dhlShipperAddressLine1 &&
      currentEnv.dhlShipperCity &&
      currentEnv.dhlShipperPostalCode &&
      currentEnv.dhlShipperCountryCode,
  )
}

export function shouldCreateDhlShipment(order) {
  if (!order) return false
  if (!(order.status === "paid" || order.status === "shipped")) return false
  if (normalizeOptionalString(order.trackingNumber)) return false
  if (normalizeOptionalString(order.shippingCarrier) === "DHL" && normalizeOptionalString(order.dhlShipmentReference)) return false
  return true
}

export function buildDhlShipmentPayload(order, currentEnv = env) {
  const orderDate = new Date(Date.now() + 60 * 60 * 1000)
  const recipientName = [order.firstName, order.lastName].filter(Boolean).join(" ").trim() || order.email
  const recipientAddressLine1 = [order.addressLine1, order.streetNumber].filter(Boolean).join(" ").trim()
  const recipientAddressLine2 = [order.addressLine2, order.staircase && `Scala ${order.staircase}`, order.apartment && `Int. ${order.apartment}`]
    .filter(Boolean)
    .join(" · ")

  const totalWeight = Math.max(
    Number(currentEnv.dhlPackageWeightKg || 1),
    Number(order?.items?.reduce?.((sum, item) => sum + (Number(item.quantity) || 0), 0) || 1),
  )

  const packages = [
    {
      weight: totalWeight,
      dimensions: {
        length: Math.max(Number(currentEnv.dhlPackageLengthCm || 40), 1),
        width: Math.max(Number(currentEnv.dhlPackageWidthCm || 30), 1),
        height: Math.max(Number(currentEnv.dhlPackageHeightCm || 5), 1),
      },
    },
  ]

  return {
    plannedShippingDateAndTime: orderDate.toISOString(),
    pickup: {
      isRequested: false,
    },
    productCode: currentEnv.dhlShipmentProductCode || "N",
    accounts: [
      {
        typeCode: "shipper",
        number: currentEnv.dhlAccountNumber,
      },
    ],
    customerDetails: {
      shipperDetails: {
        postalAddress: {
          postalCode: currentEnv.dhlShipperPostalCode,
          cityName: currentEnv.dhlShipperCity,
          countryCode: normalizeCountryCode(currentEnv.dhlShipperCountryCode),
          provinceCode: normalizeOptionalString(currentEnv.dhlShipperStateCode) || undefined,
          addressLine1: [currentEnv.dhlShipperAddressLine1],
          addressLine2: normalizeOptionalString(currentEnv.dhlShipperAddressLine2) ? [currentEnv.dhlShipperAddressLine2] : undefined,
        },
        contactInformation: {
          fullName: currentEnv.dhlShipperName,
          companyName: normalizeOptionalString(currentEnv.dhlShipperCompany) || currentEnv.dhlShipperName,
          email: currentEnv.dhlShipperEmail,
          phone: currentEnv.dhlShipperPhone,
        },
      },
      receiverDetails: {
        postalAddress: {
          postalCode: order.postalCode,
          cityName: order.city,
          countryCode: normalizeCountryCode(order.country, currentEnv.dhlShipperCountryCode || "IT"),
          provinceCode: normalizeOptionalString(order.region) || undefined,
          addressLine1: [recipientAddressLine1 || order.addressLine1],
          addressLine2: recipientAddressLine2 ? [recipientAddressLine2] : undefined,
        },
        contactInformation: {
          fullName: recipientName,
          companyName: recipientName,
          email: order.email,
          phone: normalizeOptionalString(order.phone) || currentEnv.dhlShipperPhone,
        },
      },
    },
    references: [
      {
        typeCode: "CU",
        value: order.orderReference,
      },
    ],
    content: {
      packages,
      isCustomsDeclarable: false,
      unitOfMeasurement: "metric",
      description: `Ordine ${order.orderReference}`,
      incoterm: "DAP",
    },
    outputImageProperties: {
      encodingFormat: "pdf",
      imageOptions: [
        {
          typeCode: "label",
          templateName: "ECOM26_84_A4_001",
        },
      ],
    },
  }
}

export async function createDhlShipment({ order, currentEnv = env, fetchImpl = fetch }) {
  if (!isDhlConfigured(currentEnv)) {
    return {
      ok: false,
      code: "not_configured",
      message: "Configurazione DHL incompleta.",
    }
  }

  const payload = buildDhlShipmentPayload(order, currentEnv)
  const response = await fetchImpl(`${getDhlApiBaseUrl(currentEnv)}/shipments`, {
    method: "POST",
    headers: {
      Authorization: buildDhlAuthHeader(currentEnv),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  })

  const text = await response.text()
  let data = null

  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = null
  }

  if (!response.ok) {
    const message =
      findFirstString(data, [["detail"], ["message"], ["errors", 0, "message"]]) ||
      `DHL ha risposto con stato ${response.status}.`

    return {
      ok: false,
      code: "api_error",
      message,
      status: response.status,
      payload: data,
    }
  }

  const trackingNumber =
    findFirstString(data, [
      ["shipmentTrackingNumber"],
      ["trackingNumber"],
      ["packages", 0, "trackingNumber"],
      ["shipmentDetails", 0, "shipmentTrackingNumber"],
      ["documents", 0, "trackingNumber"],
    ]) || null

  if (!trackingNumber) {
    return {
      ok: false,
      code: "missing_tracking_number",
      message: "Risposta DHL senza tracking number.",
      payload: data,
    }
  }

  const labelUrl =
    findFirstString(data, [
      ["documents", 0, "url"],
      ["documents", 0, "href"],
      ["shipmentDocuments", 0, "url"],
      ["label", "url"],
    ]) || null

  const trackingUrl =
    findFirstString(data, [["trackingUrl"], ["shipmentTrackingUrl"]]) ||
    buildDhlTrackingUrl(trackingNumber, currentEnv)

  return {
    ok: true,
    trackingNumber,
    trackingUrl,
    shippingCarrier: "DHL",
    shippingStatus: "accepted",
    shipmentReference:
      findFirstString(data, [["shipmentReference"], ["shipmentReferenceNumber"], ["referenceNumber"]]) || order.orderReference,
    labelUrl: isHttpUrl(labelUrl) ? labelUrl : null,
    payload: data,
  }
}

function buildPendingShipmentUpdate(message, currentEnv = env) {
  return {
    shippingCarrier: isDhlConfigured(currentEnv) ? "DHL" : null,
    shippingStatus: "pending",
    shippingError: message,
  }
}

export async function syncDhlShipmentForPaidOrder({ db, order, currentEnv = env, fetchImpl = fetch }) {
  if (!shouldCreateDhlShipment(order)) {
    return order
  }

  try {
    const result = await createDhlShipment({ order, currentEnv, fetchImpl })

    if (!result.ok) {
      return db.order.update({
        where: { id: order.id },
        data: buildPendingShipmentUpdate(result.message, currentEnv),
        include: { items: true, user: { select: { role: true } } },
      })
    }

    return db.order.update({
      where: { id: order.id },
      data: {
        shippingCarrier: result.shippingCarrier,
        shippingStatus: result.shippingStatus,
        shippingHandoffMode: "pickup",
        shipmentReference: result.shipmentReference,
        trackingNumber: result.trackingNumber,
        trackingUrl: result.trackingUrl,
        shippingCreatedAt: new Date(),
        dhlShipmentReference: result.shipmentReference,
        labelUrl: result.labelUrl,
        shippingError: null,
        fulfillmentStatus: order.fulfillmentStatus === "processing" ? "accepted" : order.fulfillmentStatus,
      },
      include: { items: true, user: { select: { role: true } } },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Errore DHL non previsto."
    return db.order.update({
      where: { id: order.id },
      data: buildPendingShipmentUpdate(message, currentEnv),
      include: { items: true, user: { select: { role: true } } },
    })
  }
}
