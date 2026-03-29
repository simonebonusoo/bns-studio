import { ProductVisibleBadge, ShopProduct, ShopProductVariant } from "../types"

export const PRODUCT_STATUSES = ["draft", "active", "hidden", "out_of_stock"] as const

function normalizeLegacyFormat(value?: string | null) {
  const normalized = String(value || "").trim().toUpperCase()
  return normalized === "A3" || normalized === "A4" ? normalized : null
}

function inferLegacyVariantOptions(title?: string | null) {
  const legacyFormat = normalizeLegacyFormat(title)
  return legacyFormat ? [{ name: "Format", value: legacyFormat }] : []
}

function withVariantMetadata(variant: ShopProductVariant) {
  const options = variant.options?.length ? variant.options : inferLegacyVariantOptions(variant.title)
  return {
    ...variant,
    options,
    optionSummary: options.map((option) => `${option.name}: ${option.value}`).join(" · ") || null,
  }
}

function getValidDiscountPrice(price?: number | null, discountPrice?: number | null) {
  if (typeof price !== "number" || !Number.isFinite(price) || price < 0) return null
  if (typeof discountPrice !== "number" || !Number.isFinite(discountPrice) || discountPrice < 0) return null
  return discountPrice < price ? discountPrice : null
}

export function getProductVariants(product: ShopProduct) {
  const variants = Array.isArray(product.variants) ? [...product.variants] : []
  const activeVariants = variants
    .filter((variant) => variant.isActive !== false)
    .sort((left, right) => {
      if ((left.position ?? 0) !== (right.position ?? 0)) return (left.position ?? 0) - (right.position ?? 0)
      return Number(Boolean(right.isDefault)) - Number(Boolean(left.isDefault))
    })

  if (activeVariants.length) {
    return activeVariants.map(withVariantMetadata)
  }

  const legacyVariants: ShopProductVariant[] = []
  const shouldHaveA4 = product.hasA4 !== false || (!product.hasA3 && !product.hasA4)

  if (shouldHaveA4) {
    legacyVariants.push({
      id: null,
      title: "A4",
      key: "a4",
      sku: product.sku || null,
      options: [{ name: "Format", value: "A4" }],
      price: product.priceA4 ?? product.price,
      discountPrice: getValidDiscountPrice(product.priceA4 ?? product.price, product.discountPriceA4 ?? product.discountPrice ?? null),
      costPrice: product.costPrice ?? 0,
      stock: product.stock,
      lowStockThreshold: product.lowStockThreshold ?? 5,
      position: 0,
      isDefault: true,
      isActive: true,
      legacyFormat: "A4",
      stockStatus: product.stockStatus,
    })
  }

  if (product.hasA3) {
    legacyVariants.push({
      id: null,
      title: "A3",
      key: "a3",
      sku: null,
      options: [{ name: "Format", value: "A3" }],
      price: product.priceA3 ?? product.priceA4 ?? product.price,
      discountPrice: getValidDiscountPrice(product.priceA3 ?? product.priceA4 ?? product.price, product.discountPriceA3 ?? product.discountPrice ?? null),
      costPrice: product.costPrice ?? 0,
      stock: product.stock,
      lowStockThreshold: product.lowStockThreshold ?? 5,
      position: legacyVariants.length,
      isDefault: !legacyVariants.length,
      isActive: true,
      legacyFormat: "A3",
      stockStatus: product.stockStatus,
    })
  }

  if (!legacyVariants.length) {
    legacyVariants.push({
      id: null,
      title: "Standard",
      key: "standard",
      sku: product.sku || null,
      options: [],
      price: product.price,
      discountPrice: getValidDiscountPrice(product.price, product.discountPrice ?? null),
      costPrice: product.costPrice ?? 0,
      stock: product.stock,
      lowStockThreshold: product.lowStockThreshold ?? 5,
      position: 0,
      isDefault: true,
      isActive: true,
      legacyFormat: null,
      stockStatus: product.stockStatus,
    })
  }

  return legacyVariants.map(withVariantMetadata)
}

export function getDefaultVariant(product: ShopProduct) {
  const variants = getProductVariants(product)
  return (
    variants.find((variant) => variant.isDefault && variant.stock > 0) ||
    variants.find((variant) => variant.stock > 0) ||
    variants.find((variant) => variant.isDefault) ||
    variants[0]
  )
}

export function getVariantById(product: ShopProduct, variantId?: number | null) {
  if (!variantId) return null
  return getProductVariants(product).find((variant) => Number(variant.id) === Number(variantId)) || null
}

export function getVariantByLabel(product: ShopProduct, value?: string | null) {
  if (!value) return null
  const normalized = String(value).trim().toUpperCase()
  return (
    getProductVariants(product).find(
      (variant) =>
        variant.title.toUpperCase() === normalized ||
        variant.key.toUpperCase() === normalized ||
        normalizeLegacyFormat(variant.legacyFormat) === normalized,
    ) || null
  )
}

export function resolveSelectedVariant(product: ShopProduct, selection?: { variantId?: number | null; format?: string | null }) {
  return getVariantById(product, selection?.variantId) || getVariantByLabel(product, selection?.format) || getDefaultVariant(product)
}

export function getAvailableFormats(product: ShopProduct) {
  return getProductVariants(product).map((variant) => variant.title)
}

export function getDefaultFormat(product: ShopProduct) {
  return getDefaultVariant(product)?.title || "A4"
}

export function getPriceForFormat(product: ShopProduct, format?: string | null) {
  const variant = resolveSelectedVariant(product, { format })
  if (variant) {
    return getValidDiscountPrice(variant.price, variant.discountPrice) ?? variant.price
  }
  return getValidDiscountPrice(product.price, product.discountPrice) ?? product.price
}

export function getPriceForVariant(product: ShopProduct, variantId?: number | null) {
  const variant = resolveSelectedVariant(product, { variantId }) ?? getDefaultVariant(product)
  if (variant) {
    return getValidDiscountPrice(variant.price, variant.discountPrice) ?? variant.price
  }
  return getValidDiscountPrice(product.price, product.discountPrice) ?? product.price
}

export function getOriginalPriceForVariant(product: ShopProduct, variantId?: number | null) {
  return resolveSelectedVariant(product, { variantId })?.price ?? getDefaultVariant(product)?.price ?? product.price
}

export function getDiscountPriceForVariant(product: ShopProduct, variantId?: number | null) {
  const variant = resolveSelectedVariant(product, { variantId }) ?? getDefaultVariant(product)
  if (variant) {
    return getValidDiscountPrice(variant.price, variant.discountPrice)
  }
  return getValidDiscountPrice(product.price, product.discountPrice ?? null)
}

export function getVariantPricing(product: ShopProduct, variantId?: number | null) {
  const originalPrice = getOriginalPriceForVariant(product, variantId)
  const discountPrice = getDiscountPriceForVariant(product, variantId)

  return {
    originalPrice,
    discountPrice,
    currentPrice: discountPrice ?? originalPrice,
    hasDiscount: typeof discountPrice === "number" && discountPrice < originalPrice,
  }
}

export function hasProductDiscount(product: ShopProduct) {
  return getProductVariants(product).some((variant) => typeof getValidDiscountPrice(variant.price, variant.discountPrice) === "number")
}

export function isProductPurchasable(product: ShopProduct, variantId?: number | null) {
  if (product.status !== "active" || product.isPurchasable === false) {
    return false
  }

  if (typeof variantId === "number") {
    const variant = resolveSelectedVariant(product, { variantId })
    return Boolean(variant) && variant.stock > 0 && variant.isActive !== false
  }

  return getProductVariants(product).some((variant) => variant.isActive !== false && variant.stock > 0)
}

function getAggregateVariantInventory(product: ShopProduct) {
  const activeVariants = getProductVariants(product).filter((variant) => variant.isActive !== false)
  const sellableVariants = activeVariants.filter((variant) => variant.stock > 0)
  const totalAvailableStock = sellableVariants.reduce((sum, variant) => sum + Number(variant.stock || 0), 0)
  const threshold = sellableVariants.reduce((sum, variant) => sum + Number(variant.lowStockThreshold ?? 5), 0)

  return {
    activeVariants,
    totalAvailableStock,
    threshold,
  }
}

export function getProductStockStatus(product: ShopProduct, variantId?: number | null) {
  if (typeof variantId !== "number") {
    if (product.status === "out_of_stock") {
      return "out_of_stock"
    }

    const inventory = getAggregateVariantInventory(product)
    if (!inventory.activeVariants.length || inventory.totalAvailableStock <= 0) {
      return "out_of_stock"
    }

    if (inventory.totalAvailableStock <= Math.max(inventory.threshold, 1)) {
      return "low_stock"
    }

    return "in_stock"
  }

  const variant = resolveSelectedVariant(product, { variantId })
  if (!variant) {
    return product.stockStatus || "out_of_stock"
  }

  if (variant.stockStatus) {
    return variant.stockStatus
  }

  if (variant.stock <= 0) {
    return "out_of_stock"
  }

  if (variant.stock <= (variant.lowStockThreshold ?? 5)) {
    return "low_stock"
  }

  return "in_stock"
}

export function getProductStockLabel(product: ShopProduct, variantId?: number | null) {
  if (typeof variantId !== "number") {
    const inventory = getAggregateVariantInventory(product)
    const status = getProductStockStatus(product)

    if (status === "out_of_stock") {
      return "Esaurito"
    }

    if (status === "low_stock") {
      return `Ultimi ${inventory.totalAvailableStock}`
    }

    return `${inventory.totalAvailableStock} disponibili`
  }

  const variant = resolveSelectedVariant(product, { variantId })
  if (!variant) {
    return product.stockLabel || "Esaurito"
  }

  const status = getProductStockStatus(product, variant.id)
  if (status === "out_of_stock") {
    return "Esaurito"
  }

  if (status === "low_stock") {
    return `Ultimi ${variant.stock}`
  }

  return `${variant.stock} disponibili`
}

export function getProductPrimaryImage(product: ShopProduct) {
  return product.coverImageUrl || product.imageUrls[0] || ""
}

export function getProductGalleryImages(product: ShopProduct) {
  const primary = getProductPrimaryImage(product)
  const others = product.imageUrls.filter((image) => image && image !== primary)
  return primary ? [primary, ...others] : others
}

export function getProductBadges(product: ShopProduct) {
  if (product.badges?.length) {
    return product.badges
  }

  return [] as ProductVisibleBadge[]
}
