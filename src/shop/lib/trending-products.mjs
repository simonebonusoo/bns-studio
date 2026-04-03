const MAX_TRENDING_PRODUCTS = 20

function normalizeId(value) {
  const numeric = Number(value)
  return Number.isInteger(numeric) && numeric > 0 ? numeric : null
}

export function parseTrendingProductIdsSetting(rawValue) {
  if (typeof rawValue !== "string" || !rawValue.trim()) return null

  try {
    const parsed = JSON.parse(rawValue)
    if (!Array.isArray(parsed)) return null

    const ids = []
    const seen = new Set()
    for (const entry of parsed) {
      const id = normalizeId(entry)
      if (!id || seen.has(id)) continue
      seen.add(id)
      ids.push(id)
    }

    return ids
  } catch {
    return null
  }
}

export function buildDefaultTrendingProductIds(products, limit = MAX_TRENDING_PRODUCTS) {
  const safeProducts = Array.isArray(products) ? products.filter(Boolean) : []
  const featured = safeProducts.filter((product) => product?.featured)
  const others = safeProducts.filter((product) => !product?.featured)
  return [...featured, ...others]
    .slice(0, limit)
    .map((product) => product.id)
    .filter((id) => Number.isInteger(id))
}

export function resolveTrendingProductIds(rawValue, products, limit = MAX_TRENDING_PRODUCTS) {
  const configuredIds = parseTrendingProductIdsSetting(rawValue)
  const availableIds = new Set((Array.isArray(products) ? products : []).map((product) => product?.id).filter((id) => Number.isInteger(id)))

  if (configuredIds === null) {
    return buildDefaultTrendingProductIds(products, limit)
  }

  return configuredIds.filter((id) => availableIds.has(id)).slice(0, limit)
}

export function orderTrendingProducts(products, orderedIds, limit = MAX_TRENDING_PRODUCTS) {
  const safeProducts = Array.isArray(products) ? products.filter(Boolean) : []
  const idMap = new Map(safeProducts.map((product) => [product.id, product]))
  const selected = []

  for (const id of Array.isArray(orderedIds) ? orderedIds : []) {
    const product = idMap.get(id)
    if (product) selected.push(product)
  }

  return selected.slice(0, limit)
}

export function moveTrendingProductId(ids, fromId, toId) {
  const safeIds = Array.isArray(ids) ? ids.filter((id) => Number.isInteger(id)) : []
  const fromIndex = safeIds.findIndex((id) => id === fromId)
  const toIndex = safeIds.findIndex((id) => id === toId)

  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
    return safeIds
  }

  const next = [...safeIds]
  const [moved] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, moved)
  return next
}

