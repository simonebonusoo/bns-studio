import { ProductVisibleBadge, ShopProduct } from "../types"

export const PRODUCT_STATUSES = ["draft", "active", "hidden", "out_of_stock"] as const

export function getAvailableFormats(product: ShopProduct) {
  if (product.availableFormats?.length) {
    return product.availableFormats
  }

  const formats: Array<"A3" | "A4"> = []
  if (product.hasA4 !== false) formats.push("A4")
  if (product.hasA3) formats.push("A3")
  return formats.length ? formats : ["A4"]
}

export function getDefaultFormat(product: ShopProduct) {
  return product.defaultFormat || getAvailableFormats(product)[0] || "A4"
}

export function getPriceForFormat(product: ShopProduct, format?: string | null) {
  const normalized = format === "A3" ? "A3" : format === "A4" ? "A4" : getDefaultFormat(product)

  if (normalized === "A3") {
    return product.priceA3 ?? product.priceA4 ?? product.price
  }

  return product.priceA4 ?? product.priceA3 ?? product.price
}

export function isProductPurchasable(product: ShopProduct) {
  return product.status === "active" && product.stock > 0 && product.isPurchasable !== false
}

export function getProductStockStatus(product: ShopProduct) {
  if (product.stockStatus) {
    return product.stockStatus
  }

  if (product.status === "out_of_stock" || product.stock <= 0) {
    return "out_of_stock"
  }

  if (product.stock <= (product.lowStockThreshold ?? 5)) {
    return "low_stock"
  }

  return "in_stock"
}

export function getProductStockLabel(product: ShopProduct) {
  if (product.stockLabel) {
    return product.stockLabel
  }

  const status = getProductStockStatus(product)
  if (status === "out_of_stock") {
    return "Esaurito"
  }

  if (status === "low_stock") {
    return `Ultimi ${product.stock}`
  }

  return `${product.stock} disponibili`
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

export function getProductPriceLabel(product: ShopProduct) {
  const formats = getAvailableFormats(product)
  const prices = formats.map((format) => getPriceForFormat(product, format))
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)

  if (minPrice === maxPrice) {
    return `${minPrice}`
  }

  return `${minPrice}-${maxPrice}`
}
