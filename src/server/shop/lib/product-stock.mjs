export function getProductStockStatus(product) {
  if (!product) return "out_of_stock"

  const variants = Array.isArray(product.variants) ? product.variants.filter((variant) => variant?.isActive !== false) : []
  const inStockVariants = variants.filter((variant) => Number(variant?.stock || 0) > 0)
  const stock = variants.length
    ? inStockVariants.reduce((sum, variant) => sum + Number(variant.stock || 0), 0)
    : Number(product.stock || 0)
  const threshold = variants.length
    ? inStockVariants.reduce((sum, variant) => sum + Number(variant.lowStockThreshold ?? 5), 0)
    : Number(product.lowStockThreshold ?? 5)

  if (product.status === "out_of_stock" || stock <= 0) {
    return "out_of_stock"
  }

  if (stock <= threshold) {
    return "low_stock"
  }

  return "in_stock"
}

export function getProductStockLabel(product) {
  const status = getProductStockStatus(product)
  const variants = Array.isArray(product?.variants) ? product.variants.filter((variant) => variant?.isActive !== false && Number(variant?.stock || 0) > 0) : []
  const stock = variants.length
    ? variants.reduce((sum, variant) => sum + Number(variant.stock || 0), 0)
    : Number(product?.stock || 0)

  if (status === "out_of_stock") {
    return "Esaurito"
  }

  if (status === "low_stock") {
    return `Ultimi ${stock}`
  }

  return `${stock} disponibili`
}
