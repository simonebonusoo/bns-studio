import { prisma } from "../lib/prisma.mjs"
import { HttpError } from "../lib/http.mjs"
import { getProductCostForFormat, getProductPriceForFormat, normalizeProductFormat } from "../lib/product-formats.mjs"
import { isProductPurchasable } from "../lib/product-status.mjs"
import { resolveSelectedVariant } from "../lib/product-variants.mjs"
import { calculateShippingCharge, normalizeShippingMethod } from "../../../shop/lib/shipping-methods.mjs"

export async function calculatePricing(cartItems, couponCode, options = {}) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    throw new HttpError(400, "Il carrello è vuoto")
  }

  const products = await prisma.product.findMany({
    where: {
      id: { in: cartItems.map((item) => item.productId) },
    },
    include: {
      variants: {
        orderBy: [{ position: "asc" }, { id: "asc" }],
      },
    },
  })

  const missingProduct = cartItems.some((item) => !products.find((entry) => entry.id === item.productId))
  if (missingProduct) {
    throw new HttpError(400, "Uno o più prodotti non sono validi")
  }

  const rules = await prisma.discountRule.findMany({
    where: { active: true },
    orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
  })
  const shippingMethod = normalizeShippingMethod(options.shippingMethod)

  const items = cartItems.map((item) => {
    const product = products.find((entry) => entry.id === item.productId)
    const quantity = Number(item.quantity)

    if (!product || !Number.isInteger(quantity) || quantity < 1) {
      throw new HttpError(400, "Elemento del carrello non valido")
    }

    if (!isProductPurchasable(product)) {
      throw new HttpError(400, `${product.title} non è acquistabile in questo momento`)
    }

    const imageUrls = JSON.parse(product.imageUrls)
    const selectedVariant = resolveSelectedVariant(product, {
      variantId: item.variantId,
      format: item.format,
    })

    if (!selectedVariant || !selectedVariant.isActive) {
      throw new HttpError(400, `${product.title} non ha una variante valida selezionata`)
    }

    if (quantity > selectedVariant.stock) {
      throw new HttpError(400, `${product.title} supera la disponibilita di magazzino`)
    }

    const format = selectedVariant.title || normalizeProductFormat(product, item.format)
    const unitPrice = selectedVariant.price ?? getProductPriceForFormat(product, format)
    const unitCost = selectedVariant.costPrice ?? getProductCostForFormat(product, format)

    return {
      productId: product.id,
      variantId: selectedVariant.id ?? null,
      variantLabel: selectedVariant.title,
      variantSku: selectedVariant.sku ?? null,
      slug: product.slug,
      title: product.title,
      imageUrl: imageUrls[0] || "",
      format,
      unitPrice,
      unitCost,
      quantity,
      lineTotal: unitPrice * quantity,
      costTotal: unitCost * quantity,
    }
  })

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0)

  let automaticDiscount = 0
  const shippingPricing = calculateShippingCharge({ shippingMethod, rules, itemCount })
  let shippingTotal = shippingPricing.shippingTotal
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

  }

  appliedRules.push(...shippingPricing.appliedRules)

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
    shippingMethod: shippingPricing.shippingMethod,
    shippingCarrier: shippingPricing.shippingCarrier,
    shippingLabel: shippingPricing.shippingLabel,
    shippingCost: shippingPricing.shippingCost,
    subtotal,
    shippingBase: shippingPricing.shippingBase,
    shippingTotal,
    automaticDiscount,
    couponDiscount,
    discountTotal,
    total,
    appliedCoupon,
    appliedRules,
  }
}
