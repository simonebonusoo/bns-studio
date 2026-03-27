import { ShopProduct } from "../types"

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

export function getProductPrimaryImage(product: ShopProduct) {
  return product.coverImageUrl || product.imageUrls[0] || ""
}
