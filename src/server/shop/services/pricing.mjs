import { prisma } from "../lib/prisma.mjs"
import { HttpError } from "../lib/http.mjs"
import { getProductCostForFormat, getProductPriceForFormat, normalizeProductFormat } from "../lib/product-formats.mjs"
import { isProductPurchasable } from "../lib/product-status.mjs"
import { resolveSelectedVariant } from "../lib/product-variants.mjs"
import { resolveSelectedShippingRate } from "./shipping-rates.mjs"
import { getShippingMethodOptions } from "../../../shop/lib/shipping-methods.mjs"

function buildStaticShippingRatesFallback() {
  return getShippingMethodOptions()
    .filter((option) => typeof option.cost === "number")
    .map((option) => ({
      key: option.key,
      carrier: option.carrier,
      carrierLabel: option.carrierLabel,
      label: option.label,
      description: option.description,
      cost: option.cost,
      currency: "EUR",
      source: "static_checkout_fallback",
      meta: null,
    }))
}

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
  const requestedShippingMethod = options.shippingMethod || null

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
  let shippingPricing
  let shippingError = null

  try {
    shippingPricing = await resolveSelectedShippingRate({ items, shippingMethod: requestedShippingMethod })
  } catch (error) {
    if (!options.allowShippingQuoteFailure) {
      throw error
    }

    shippingError = error instanceof Error ? error.message : "Tariffe spedizione temporaneamente non disponibili."
    const rates = buildStaticShippingRatesFallback()

    shippingPricing = {
      selectedMethod: requestedShippingMethod,
      rates,
      selectedRate: requestedShippingMethod ? rates.find((entry) => entry.key === requestedShippingMethod) || null : null,
    }
  }

  let shippingTotal = shippingPricing.selectedRate ? shippingPricing.selectedRate.cost : null
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

  const freeShippingRule = rules.find((rule) => {
    const withinStart = !rule.startsAt || rule.startsAt <= now
    const withinEnd = !rule.endsAt || rule.endsAt >= now
    return withinStart && withinEnd && rule.ruleType === "free_shipping_quantity" && itemCount >= rule.threshold
  })

  if (freeShippingRule && shippingPricing.selectedRate) {
    shippingTotal = 0
    appliedRules.push({ type: "shipping", label: freeShippingRule.name, amount: shippingPricing.selectedRate.cost })
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
  const total = Math.max(0, subtotal - discountTotal + (shippingTotal ?? 0))

  return {
    items,
    shippingMethod: shippingPricing.selectedRate?.key || null,
    shippingCarrier: shippingPricing.selectedRate?.carrier || null,
    shippingLabel: shippingPricing.selectedRate?.label || null,
    shippingCost: typeof shippingPricing.selectedRate?.cost === "number" ? shippingPricing.selectedRate.cost : null,
    subtotal,
    shippingBase: typeof shippingPricing.selectedRate?.cost === "number" ? shippingPricing.selectedRate.cost : null,
    shippingTotal,
    automaticDiscount,
    couponDiscount,
    discountTotal,
    total,
    appliedCoupon,
    appliedRules,
    isShippingPending: !shippingPricing.selectedRate,
    availableShippingRates: shippingPricing.rates,
    shippingError,
  }
}
