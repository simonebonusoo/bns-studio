function isVariantPurchasable(variant) {
  return Boolean(variant) && variant.isActive !== false && Number(variant.stock || 0) > 0
}

function getVariantIdentity(variant) {
  return typeof variant?.id === "number" ? `id:${variant.id}` : `key:${variant?.key || variant?.title || ""}`
}

export function getRestockedVariantIds(previousVariants = [], nextVariants = []) {
  const previousByIdentity = new Map(previousVariants.map((variant) => [getVariantIdentity(variant), variant]))

  return nextVariants
    .filter((variant) => isVariantPurchasable(variant) && !isVariantPurchasable(previousByIdentity.get(getVariantIdentity(variant))))
    .map((variant) => variant.id)
    .filter((variantId) => typeof variantId === "number")
}

export async function createBackInStockSubscription(db, { userId, email, productId, variantId = null }) {
  const existing = await db.backInStockSubscription.findFirst({
    where: {
      userId,
      productId,
      variantId,
      status: { in: ["pending", "ready"] },
      cancelledAt: null,
    },
  })

  if (existing) {
    return { subscription: existing, created: false }
  }

  const subscription = await db.backInStockSubscription.create({
    data: {
      userId,
      productId,
      variantId,
      email,
      status: "pending",
    },
  })

  return { subscription, created: true }
}

export async function markBackInStockSubscriptionsReady(db, { productId, previousVariants = [], nextVariants = [] }) {
  const restockedVariantIds = getRestockedVariantIds(previousVariants, nextVariants)
  if (!restockedVariantIds.length) {
    return { markedSubscriptions: 0, restockedVariantIds: [] }
  }

  const restockedAt = new Date()
  const variantResult = await db.backInStockSubscription.updateMany({
    where: {
      productId,
      variantId: { in: restockedVariantIds },
      status: "pending",
      cancelledAt: null,
    },
    data: {
      status: "ready",
      restockedAt,
    },
  })

  const productResult = await db.backInStockSubscription.updateMany({
    where: {
      productId,
      variantId: null,
      status: "pending",
      cancelledAt: null,
    },
    data: {
      status: "ready",
      restockedAt,
    },
  })

  return {
    markedSubscriptions: variantResult.count + productResult.count,
    restockedVariantIds,
  }
}
