import { buildShippingConfig } from "./config.mjs"
import { createDhlProvider } from "./providers/dhl.mjs"
import { createInpostProvider } from "./providers/inpost.mjs"
import { createPacklinkProvider } from "./providers/packlink.mjs"
import {
  createNormalizedRateQuote,
  buildOrderShipmentUpdateData,
  createNormalizedShipment,
  getCarrierForMethod,
  normalizeCarrier,
  normalizeMethod,
} from "./normalizers/shipment-normalizer.mjs"
import { getShippingMethodOptions } from "../../../shop/lib/shipping-methods.mjs"

function normalizeOptionalString(value) {
  const normalized = String(value || "").trim()
  return normalized || null
}

function createProviderRegistry(currentEnv) {
  const config = buildShippingConfig(currentEnv)
  const dhl = createDhlProvider(config.dhl)
  const inpost = createInpostProvider(config.inpost)
  const packlink = createPacklinkProvider(config.packlink)

  return {
    config,
    providers: {
      dhl,
      inpost,
      packlink,
    },
  }
}

function getProviderByCarrier(carrier, currentEnv) {
  const registry = createProviderRegistry(currentEnv)
  return registry.providers[normalizeCarrier(carrier) || ""] || null
}

function getProviderByMethod(method, currentEnv) {
  const registry = createProviderRegistry(currentEnv)
  if (normalizeMethod(method) === "economy" && registry.providers.packlink) {
    return registry.providers.packlink
  }
  const carrier = getCarrierForMethod(method)
  return carrier ? getProviderByCarrier(carrier, currentEnv) : null
}

export function resolveShippingProvider(value, currentEnv) {
  return getProviderByMethod(value, currentEnv) || getProviderByCarrier(value, currentEnv)
}

export function normalizeShippingMethodSelection(value) {
  return normalizeMethod(value)
}

function getOrderItems(order) {
  return Array.isArray(order?.items) ? order.items : []
}

function buildOrderContext(order) {
  return {
    order,
    orderReference: order?.orderReference || null,
    shippingMethod: normalizeMethod(order?.shippingMethod),
    shippingCarrier: normalizeCarrier(order?.shippingCarrier),
    shippingCost: typeof order?.shippingCost === "number" ? order.shippingCost : null,
    items: getOrderItems(order),
    shippingAddress: {
      firstName: order?.firstName || null,
      lastName: order?.lastName || null,
      email: order?.email || null,
      phone: order?.phone || null,
      addressLine1: order?.addressLine1 || null,
      addressLine2: order?.addressLine2 || null,
      streetNumber: order?.streetNumber || null,
      staircase: order?.staircase || null,
      apartment: order?.apartment || null,
      city: order?.city || null,
      region: order?.region || null,
      postalCode: order?.postalCode || null,
      country: order?.country || null,
      deliveryNotes: order?.deliveryNotes || null,
    },
  }
}

export async function getAvailableShippingOptions({ items, shippingAddress = null, currentEnv, fetchImpl = fetch }) {
  return getShippingMethodOptions()
    .filter((option) => typeof option.cost === "number")
    .map((option) =>
      createNormalizedRateQuote({
        carrier: option.carrier,
        carrierLabel: option.carrierLabel,
        method: option.key,
        methodLabel: option.label,
        description: option.description,
        shippingCost: option.cost,
        currency: "EUR",
        rateSource: "internal_manual_shipping",
      }),
    )
}

export async function resolveSelectedShippingOption({ items, shippingMethod, shippingAddress = null, currentEnv, fetchImpl = fetch }) {
  const selectedMethod = normalizeShippingMethodSelection(shippingMethod)
  const rates = await getAvailableShippingOptions({ items, shippingAddress, currentEnv, fetchImpl })

  return {
    selectedMethod,
    rates,
    selectedRate: selectedMethod ? rates.find((entry) => entry.key === selectedMethod) || null : null,
  }
}

export function shouldCreateShipmentForOrder(order) {
  if (!order) return false
  const method = normalizeMethod(order.shippingMethod)
  if (!method) return false
  if (!(order.status === "paid" || order.status === "shipped")) return false
  if (normalizeOptionalString(order.trackingNumber) && normalizeOptionalString(order.shipmentReference || order.dhlShipmentReference)) return false
  return true
}

async function loadOrderForShipping(db, orderId) {
  return db.order.findUnique({
    where: { id: Number(orderId) },
    include: { items: true },
  })
}

export async function createCarrierShipmentForOrder({ db, orderId = null, order = null, currentEnv, fetchImpl = fetch }) {
  const dbOrder = order || (orderId != null ? await loadOrderForShipping(db, orderId) : null)
  if (!dbOrder) {
    return {
      ok: false,
      code: "order_not_found",
      shipment: createNormalizedShipment({ status: "failed", errorMessage: "Ordine non trovato." }),
      order: null,
    }
  }

  if (!shouldCreateShipmentForOrder(dbOrder)) {
    return {
      ok: false,
      code: "shipment_not_required",
      shipment: createNormalizedShipment({
        carrier: normalizeCarrier(dbOrder.shippingCarrier) || getCarrierForMethod(dbOrder.shippingMethod),
        method: normalizeMethod(dbOrder.shippingMethod),
        status: dbOrder.trackingNumber ? "created" : "not_created",
      }),
      order: dbOrder,
    }
  }

  const provider = resolveShippingProvider(dbOrder.shippingMethod || dbOrder.shippingCarrier, currentEnv)

  if (!provider) {
    const failedShipment = createNormalizedShipment({
      carrier: getCarrierForMethod(dbOrder.shippingMethod),
      method: normalizeMethod(dbOrder.shippingMethod),
      status: "failed",
      errorMessage: "Provider spedizione non supportato.",
    })

    const updated = await db.order.update({
      where: { id: dbOrder.id },
      data: buildOrderShipmentUpdateData(failedShipment),
      include: { items: true },
    })

    return {
      ok: false,
      code: "provider_not_supported",
      shipment: failedShipment,
      order: updated,
    }
  }

  const shipment = await provider.createShipment({
    orderContext: buildOrderContext(dbOrder),
    fetchImpl,
  })

  const updated = await db.order.update({
    where: { id: dbOrder.id },
    data: buildOrderShipmentUpdateData(shipment),
    include: { items: true },
  })

  return {
    ok: shipment.status !== "failed",
    code: shipment.status === "failed" ? "shipment_failed" : "shipment_created",
    shipment,
    order: updated,
  }
}

export async function refreshCarrierTrackingForOrder({ db, orderId = null, order = null, currentEnv, fetchImpl = fetch }) {
  const dbOrder = order || (orderId != null ? await loadOrderForShipping(db, orderId) : null)
  if (!dbOrder) {
    return {
      ok: false,
      code: "order_not_found",
      shipment: createNormalizedShipment({ status: "failed", errorMessage: "Ordine non trovato." }),
      order: null,
    }
  }

  const provider = resolveShippingProvider(dbOrder.shippingMethod || dbOrder.shippingCarrier, currentEnv)
  if (!provider || !normalizeOptionalString(dbOrder.trackingNumber)) {
    return {
      ok: false,
      code: "tracking_not_available",
      shipment: createNormalizedShipment({
        carrier: normalizeCarrier(dbOrder.shippingCarrier) || getCarrierForMethod(dbOrder.shippingMethod),
        method: normalizeMethod(dbOrder.shippingMethod),
        trackingNumber: dbOrder.trackingNumber,
        status: "pending",
      }),
      order: dbOrder,
    }
  }

  const shipment = await provider.getTracking({
    trackingNumber: dbOrder.trackingNumber,
    shipmentReference: dbOrder.shipmentReference || dbOrder.dhlShipmentReference,
    currentStatus: dbOrder.shippingStatus,
    orderContext: buildOrderContext(dbOrder),
    fetchImpl,
  })

  const updated = await db.order.update({
    where: { id: dbOrder.id },
    data: buildOrderShipmentUpdateData({
      ...shipment,
      labelUrl: shipment.labelUrl || dbOrder.labelUrl || null,
      shipmentReference: shipment.shipmentReference || dbOrder.shipmentReference || dbOrder.dhlShipmentReference || null,
      shippingCost: shipment.shippingCost ?? dbOrder.shippingCost ?? null,
    }),
    include: { items: true },
  })

  return {
    ok: shipment.status !== "failed",
    code: shipment.status === "failed" ? "tracking_refresh_failed" : "tracking_refreshed",
    shipment,
    order: updated,
  }
}

export async function maybeCreateShipmentForPaidOrder({ db, order, currentEnv, fetchImpl = fetch }) {
  return {
    ok: false,
    code: "manual_shipping_only",
    shipment: createNormalizedShipment({
      carrier: getCarrierForMethod(order?.shippingMethod),
      method: normalizeMethod(order?.shippingMethod),
      status: "not_created",
      errorMessage: "Creazione spedizione manuale richiesta in Packlink Pro.",
    }),
    order,
  }
}
