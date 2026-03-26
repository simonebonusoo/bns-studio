import { prisma } from "../lib/prisma.mjs"
import { HttpError } from "../lib/http.mjs"

function getSetting(settings, key, fallback) {
  return settings.find((entry) => entry.key === key)?.value ?? fallback
}

export async function calculatePricing(cartItems, couponCode) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    throw new HttpError(400, "Il carrello è vuoto")
  }

  const products = await prisma.product.findMany({
    where: {
      id: { in: cartItems.map((item) => item.productId) },
    },
  })

  if (products.length !== cartItems.length) {
    throw new HttpError(400, "Uno o più prodotti non sono validi")
  }

  const settings = await prisma.setting.findMany()
  const rules = await prisma.discountRule.findMany({
    where: { active: true },
    orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
  })

  const shippingBase = Number(getSetting(settings, "shippingCost", "900"))

  const items = cartItems.map((item) => {
    const product = products.find((entry) => entry.id === item.productId)
    const quantity = Number(item.quantity)

    if (!product || !Number.isInteger(quantity) || quantity < 1) {
      throw new HttpError(400, "Elemento del carrello non valido")
    }

    if (quantity > product.stock) {
      throw new HttpError(400, `${product.title} supera la disponibilita di magazzino`)
    }

    const imageUrls = JSON.parse(product.imageUrls)

    return {
      productId: product.id,
      slug: product.slug,
      title: product.title,
      imageUrl: imageUrls[0] || "",
      unitPrice: product.price,
      unitCost: product.costPrice || 0,
      quantity,
      lineTotal: product.price * quantity,
      costTotal: (product.costPrice || 0) * quantity,
    }
  })

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0)

  let automaticDiscount = 0
  let shippingTotal = shippingBase
  const appliedRules = []
  const now = new Date()

  for (const rule of rules) {
    const withinStart = !rule.startsAt || rule.startsAt <= now
    const withinEnd = !rule.endsAt || rule.endsAt >= now

    if (!withinStart || !withinEnd) continue

    if (rule.ruleType === "quantity_percentage" && itemCount >= rule.threshold && rule.discountType === "percentage") {
      const amount = Math.round(subtotal * (rule.amount / 100))
      automaticDiscount += amount
      appliedRules.push({ type: "automatic", label: rule.name, amount })
    }

    if (rule.ruleType === "subtotal_fixed" && subtotal >= rule.threshold && rule.discountType === "fixed") {
      const amount = Math.min(subtotal, rule.amount)
      automaticDiscount += amount
      appliedRules.push({ type: "automatic", label: rule.name, amount })
    }

    if (rule.ruleType === "free_shipping_quantity" && itemCount >= rule.threshold) {
      shippingTotal = 0
      appliedRules.push({ type: "shipping", label: rule.name, amount: shippingBase })
    }
  }

  let couponDiscount = 0
  let appliedCoupon = null

  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: couponCode.toUpperCase() },
    })

    if (!coupon || !coupon.active) {
      throw new HttpError(400, "Coupon non valido")
    }

    if (coupon.expiresAt && coupon.expiresAt < now) {
      throw new HttpError(400, "Coupon scaduto")
    }

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      throw new HttpError(400, "Limite di utilizzo del coupon raggiunto")
    }

    couponDiscount =
      coupon.type === "percentage"
        ? Math.round(subtotal * (coupon.amount / 100))
        : Math.min(subtotal, coupon.amount)

    appliedCoupon = coupon.code
    appliedRules.push({ type: "coupon", label: coupon.code, amount: couponDiscount })
  }

  const discountTotal = Math.min(subtotal, automaticDiscount + couponDiscount)
  const total = Math.max(0, subtotal - discountTotal + shippingTotal)

  return {
    items,
    subtotal,
    shippingBase,
    shippingTotal,
    automaticDiscount,
    couponDiscount,
    discountTotal,
    total,
    appliedCoupon,
    appliedRules,
  }
}
