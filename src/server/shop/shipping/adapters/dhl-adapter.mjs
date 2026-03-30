import { createNormalizedRateQuote, createNormalizedShipment } from "../normalizers/shipment-normalizer.mjs"

function normalizeOptionalString(value) {
  const normalized = String(value || "").trim()
  return normalized || null
}

function normalizeCountryCode(value, fallback = "IT") {
  const normalized = String(value || fallback).trim().toUpperCase()
  return normalized || fallback
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

function getOrderItems(context = {}) {
  return Array.isArray(context.items) ? context.items : Array.isArray(context.order?.items) ? context.order.items : []
}

export function buildDhlAuthHeaders(providerConfig) {
  const credentials = `${providerConfig.apiKey || ""}:${providerConfig.apiSecret || ""}`
  return {
    Authorization: `Basic ${Buffer.from(credentials).toString("base64")}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  }
}

export function isDhlConfigured(providerConfig) {
  return Boolean(
    providerConfig.apiBaseUrl &&
      providerConfig.apiKey &&
      providerConfig.apiSecret &&
      providerConfig.accountNumber &&
      providerConfig.shipper.name &&
      providerConfig.shipper.email &&
      providerConfig.shipper.phone &&
      providerConfig.shipper.addressLine1 &&
      providerConfig.shipper.city &&
      providerConfig.shipper.postalCode &&
      providerConfig.shipper.countryCode,
  )
}

export function buildDhlTrackingUrl(trackingNumber, providerConfig) {
  const normalized = normalizeOptionalString(trackingNumber)
  const baseUrl = normalizeOptionalString(providerConfig?.trackingBaseUrl)
  if (!normalized || !baseUrl) return null

  try {
    const url = new URL(baseUrl)
    url.searchParams.set("tracking-id", normalized)
    url.searchParams.set("submit", "1")
    return url.toString()
  } catch {
    return `${baseUrl.replace(/\/$/, "")}?tracking-id=${encodeURIComponent(normalized)}&submit=1`
  }
}

export function buildDhlRatePayload(orderContext = {}, providerConfig) {
  const items = getOrderItems(orderContext)
  const quantity = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0) || 1
  const shipTo = orderContext.shippingAddress || orderContext.order || {}

  return {
    customerDetails: {
      shipperDetails: {
        postalAddress: {
          postalCode: providerConfig.shipper.postalCode,
          cityName: providerConfig.shipper.city,
          countryCode: normalizeCountryCode(providerConfig.shipper.countryCode),
        },
      },
      receiverDetails: {
        postalAddress: {
          postalCode: shipTo.postalCode,
          cityName: shipTo.city,
          countryCode: normalizeCountryCode(shipTo.country, providerConfig.shipper.countryCode || "IT"),
        },
      },
    },
    accounts: [
      {
        typeCode: "shipper",
        number: providerConfig.accountNumber,
      },
    ],
    plannedShippingDateAndTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    unitOfMeasurement: "metric",
    isCustomsDeclarable: false,
    packages: [
      {
        weight: Math.max(Number(providerConfig.packageDefaults.weightKg || 1), quantity),
        dimensions: {
          length: Math.max(Number(providerConfig.packageDefaults.lengthCm || 40), 1),
          width: Math.max(Number(providerConfig.packageDefaults.widthCm || 30), 1),
          height: Math.max(Number(providerConfig.packageDefaults.heightCm || 5), 1),
        },
      },
    ],
  }
}

export function buildDhlShipmentPayload(orderContext = {}, providerConfig) {
  const order = orderContext.order || orderContext
  const recipientName = [order.firstName, order.lastName].filter(Boolean).join(" ").trim() || order.email
  const recipientAddressLine1 = [order.addressLine1, order.streetNumber].filter(Boolean).join(" ").trim()
  const recipientAddressLine2 = [order.addressLine2, order.staircase && `Scala ${order.staircase}`, order.apartment && `Int. ${order.apartment}`]
    .filter(Boolean)
    .join(" · ")
  const ratePayload = buildDhlRatePayload(orderContext, providerConfig)

  return {
    plannedShippingDateAndTime: ratePayload.plannedShippingDateAndTime,
    pickup: {
      isRequested: false,
    },
    productCode: providerConfig.shipmentProductCode || "N",
    accounts: ratePayload.accounts,
    customerDetails: {
      shipperDetails: {
        postalAddress: {
          postalCode: providerConfig.shipper.postalCode,
          cityName: providerConfig.shipper.city,
          countryCode: normalizeCountryCode(providerConfig.shipper.countryCode),
          provinceCode: normalizeOptionalString(providerConfig.shipper.stateCode) || undefined,
          addressLine1: [providerConfig.shipper.addressLine1],
          addressLine2: providerConfig.shipper.addressLine2 ? [providerConfig.shipper.addressLine2] : undefined,
        },
        contactInformation: {
          fullName: providerConfig.shipper.name,
          companyName: providerConfig.shipper.company || providerConfig.shipper.name,
          email: providerConfig.shipper.email,
          phone: providerConfig.shipper.phone,
        },
      },
      receiverDetails: {
        postalAddress: {
          postalCode: order.postalCode,
          cityName: order.city,
          countryCode: normalizeCountryCode(order.country, providerConfig.shipper.countryCode || "IT"),
          provinceCode: normalizeOptionalString(order.region) || undefined,
          addressLine1: [recipientAddressLine1 || order.addressLine1],
          addressLine2: recipientAddressLine2 ? [recipientAddressLine2] : undefined,
        },
        contactInformation: {
          fullName: recipientName,
          companyName: recipientName,
          email: order.email,
          phone: normalizeOptionalString(order.phone) || providerConfig.shipper.phone,
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
      packages: ratePayload.packages,
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

export function parseDhlRateResponse(data) {
  const amountRaw =
    data?.products?.[0]?.totalPrice?.[0]?.price ??
    data?.products?.[0]?.totalPrice?.[0]?.value ??
    data?.products?.[0]?.price?.value ??
    data?.totalPrice?.[0]?.price
  const amount = Number(amountRaw)

  return createNormalizedRateQuote({
    carrier: "dhl",
    method: "premium",
    methodLabel: "Spedizione premium",
    description: "Più rapida e premium, con esperienza di consegna più completa.",
    serviceName:
      findFirstString(data, [["products", 0, "productName"], ["products", 0, "productCode"], ["productName"]]) ||
      "DHL Express",
    shippingCost: Number.isFinite(amount) ? Math.round(amount * 100) : null,
    currency:
      findFirstString(data, [["products", 0, "totalPrice", 0, "currencyType"], ["totalPrice", 0, "currencyType"]]) || "EUR",
    rateSource: "dhl_api_rate",
    rawProviderPayload: data,
  })
}

export function parseDhlShipmentResponse(data, providerConfig, orderContext = {}) {
  const trackingNumber =
    findFirstString(data, [
      ["shipmentTrackingNumber"],
      ["trackingNumber"],
      ["packages", 0, "trackingNumber"],
      ["shipmentDetails", 0, "shipmentTrackingNumber"],
      ["documents", 0, "trackingNumber"],
    ]) || null

  const labelUrl =
    findFirstString(data, [
      ["documents", 0, "url"],
      ["documents", 0, "href"],
      ["shipmentDocuments", 0, "url"],
      ["label", "url"],
    ]) || null

  const trackingUrl =
    findFirstString(data, [["trackingUrl"], ["shipmentTrackingUrl"]]) ||
    buildDhlTrackingUrl(trackingNumber, providerConfig)

  return createNormalizedShipment({
    carrier: "dhl",
    method: "premium",
    methodLabel: "Spedizione premium",
    serviceName:
      findFirstString(data, [["productName"], ["products", 0, "productName"], ["shipmentDetails", 0, "productName"]]) ||
      "DHL Express",
    shippingCost: orderContext.shippingCost ?? null,
    currency: "EUR",
    trackingNumber,
    trackingUrl,
    labelUrl: isHttpUrl(labelUrl) ? labelUrl : null,
    labelFormat: "pdf",
    shipmentReference:
      findFirstString(data, [["shipmentReference"], ["shipmentReferenceNumber"], ["referenceNumber"]]) ||
      orderContext.order?.orderReference ||
      orderContext.orderReference ||
      null,
    handoffMode: "pickup",
    status: trackingNumber ? "created" : "failed",
    rawProviderPayload: data,
    errorMessage: trackingNumber ? null : "Risposta DHL senza tracking number.",
  })
}

export function parseDhlTrackingResponse(data, providerConfig) {
  const trackingNumber =
    findFirstString(data, [["shipments", 0, "shipmentTrackingNumber"], ["shipments", 0, "trackingNumber"], ["trackingNumber"]]) || null
  const statusCode =
    findFirstString(data, [["shipments", 0, "status", "statusCode"], ["shipments", 0, "status", "status"]]) || ""
  const mappedStatus =
    statusCode === "delivered"
      ? "delivered"
      : statusCode === "transit" || statusCode === "in_transit"
        ? "in_transit"
        : trackingNumber
          ? "accepted"
          : "pending"

  return createNormalizedShipment({
    carrier: "dhl",
    method: "premium",
    methodLabel: "Spedizione premium",
    trackingNumber,
    trackingUrl: buildDhlTrackingUrl(trackingNumber, providerConfig),
    shipmentReference: trackingNumber,
    handoffMode: "pickup",
    status: mappedStatus,
    rawProviderPayload: data,
  })
}
