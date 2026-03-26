export const PRODUCT_FORMATS = ["A4", "A3"]

export const PRODUCT_FORMAT_COSTS = {
  A4: 900,
  A3: 1000,
}

export function getAvailableProductFormats(product) {
  const formats = []
  if (product.hasA4 || (!product.hasA3 && !product.hasA4)) formats.push("A4")
  if (product.hasA3) formats.push("A3")
  return formats
}

export function getDefaultProductFormat(product) {
  const formats = getAvailableProductFormats(product)
  return formats[0] || "A4"
}

export function normalizeProductFormat(product, value) {
  const normalized = typeof value === "string" ? value.toUpperCase() : ""
  const formats = getAvailableProductFormats(product)
  if (formats.includes(normalized)) return normalized
  return getDefaultProductFormat(product)
}

export function getProductPriceForFormat(product, format) {
  const normalizedFormat = normalizeProductFormat(product, format)

  if (normalizedFormat === "A3") {
    return product.priceA3 ?? product.priceA4 ?? product.price
  }

  return product.priceA4 ?? product.priceA3 ?? product.price
}

export function getBaseProductPrice(product) {
  const formats = getAvailableProductFormats(product)
  const prices = formats.map((format) => getProductPriceForFormat(product, format)).filter((value) => typeof value === "number")
  return prices.length ? Math.min(...prices) : product.price
}

export function getProductCostForFormat(product, format) {
  const normalizedFormat = normalizeProductFormat(product, format)
  return PRODUCT_FORMAT_COSTS[normalizedFormat] ?? product.costPrice ?? PRODUCT_FORMAT_COSTS.A4
}
