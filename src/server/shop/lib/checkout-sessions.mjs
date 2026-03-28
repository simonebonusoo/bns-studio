function randomRefSegment() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

export function createCheckoutReference() {
  return `BNS-${Date.now().toString(36).toUpperCase()}-${randomRefSegment()}`
}

export function parseCheckoutSessionItems(session) {
  if (!session?.itemsSnapshot) return []

  try {
    const parsed = JSON.parse(session.itemsSnapshot)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function parseCheckoutSessionPricing(session) {
  if (!session?.pricingBreakdown) return null

  try {
    return typeof session.pricingBreakdown === "string" ? JSON.parse(session.pricingBreakdown) : session.pricingBreakdown
  } catch {
    return null
  }
}

export function serializeCheckoutSessionAsPendingOrder(session) {
  const pricingBreakdown = parseCheckoutSessionPricing(session)
  const items = parseCheckoutSessionItems(session).map((item, index) => ({
    id: index + 1,
    productId: item.productId,
    variantId: item.variantId ?? null,
    title: item.title,
    imageUrl: item.imageUrl,
    format: item.format || null,
    variantLabel: item.variantLabel || null,
    variantSku: item.variantSku || null,
    unitPrice: item.unitPrice,
    unitCost: item.unitCost || 0,
    quantity: item.quantity,
    lineTotal: item.lineTotal,
    costTotal: item.costTotal || 0,
  }))

  return {
    id: 0,
    orderReference: session.orderReference,
    email: session.email,
    firstName: session.firstName,
    lastName: session.lastName,
    addressLine1: session.addressLine1,
    addressLine2: session.addressLine2 || null,
    city: session.city,
    postalCode: session.postalCode,
    country: session.country,
    status: session.status || "pending",
    subtotal: session.subtotal,
    discountTotal: session.discountTotal,
    shippingTotal: session.shippingTotal,
    total: session.total,
    couponCode: session.couponCode || null,
    createdAt: session.createdAt,
    pricingBreakdown,
    items,
  }
}
