export const PRODUCT_STATUSES = ["draft", "active", "hidden", "out_of_stock"]

export function normalizeProductStatus(value, fallback = "active") {
  const normalized = String(value || "").trim().toLowerCase()
  return PRODUCT_STATUSES.includes(normalized) ? normalized : fallback
}

export function isPublicProductStatus(status) {
  return status === "active" || status === "out_of_stock"
}

export function isProductPurchasable(product) {
  return normalizeProductStatus(product?.status) === "active" && Number(product?.stock || 0) > 0
}
