import {
  createNormalizedRateQuote,
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

export function resolveShippingProvider(value, currentEnv) {
  return null
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

  const shipment = createNormalizedShipment({
    carrier: normalizeCarrier(dbOrder.shippingCarrier) || getCarrierForMethod(dbOrder.shippingMethod),
    method: normalizeMethod(dbOrder.shippingMethod),
    trackingNumber: dbOrder.trackingNumber || null,
    trackingUrl: dbOrder.trackingUrl || null,
    labelUrl: dbOrder.labelUrl || null,
    shipmentReference: dbOrder.shipmentReference || dbOrder.dhlShipmentReference || null,
    handoffMode: dbOrder.shippingHandoffMode || null,
    shippingCost: typeof dbOrder.shippingCost === "number" ? dbOrder.shippingCost : null,
    status: dbOrder.trackingNumber ? normalizeMethod(dbOrder.shippingMethod) === "economy" ? "created" : dbOrder.shippingStatus || "created" : "not_created",
    errorMessage: "Creazione spedizione manuale richiesta in Packlink Pro.",
  })

  return {
    ok: false,
    code: shouldCreateShipmentForOrder(dbOrder) ? "manual_shipping_only" : "shipment_not_required",
    shipment,
    order: dbOrder,
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

  const shipment = createNormalizedShipment({
    carrier: normalizeCarrier(dbOrder.shippingCarrier) || getCarrierForMethod(dbOrder.shippingMethod),
    method: normalizeMethod(dbOrder.shippingMethod),
    trackingNumber: dbOrder.trackingNumber || null,
    trackingUrl: dbOrder.trackingUrl || null,
    labelUrl: dbOrder.labelUrl || null,
    shipmentReference: dbOrder.shipmentReference || dbOrder.dhlShipmentReference || null,
    handoffMode: dbOrder.shippingHandoffMode || null,
    shippingCost: typeof dbOrder.shippingCost === "number" ? dbOrder.shippingCost : null,
    status: dbOrder.shippingStatus || (dbOrder.trackingNumber ? "created" : "pending"),
    errorMessage: dbOrder.trackingNumber
      ? "Tracking gestito manualmente dall'admin."
      : "Tracking non disponibile finché non inserisci i dati manualmente.",
  })

  return {
    ok: false,
    code: normalizeOptionalString(dbOrder.trackingNumber) ? "manual_tracking_only" : "tracking_not_available",
    shipment,
    order: dbOrder,
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
