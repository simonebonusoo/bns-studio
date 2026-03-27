export function getProductStockStatus(product) {
  if (!product) return "out_of_stock"

  const stock = Number(product.stock || 0)
  const threshold = Number(product.lowStockThreshold ?? 5)

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
  const stock = Number(product?.stock || 0)

  if (status === "out_of_stock") {
    return "Esaurito"
  }

  if (status === "low_stock") {
    return `Ultimi ${stock}`
  }

  return `${stock} disponibili`
}
