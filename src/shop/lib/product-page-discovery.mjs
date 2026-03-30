const RECENTLY_VIEWED_LIMIT = 12

function toSafeSnapshot(product) {
  if (!product || typeof product !== "object") return null
  if (!product.slug || !product.title) return null
  return product
}

export function getRelatedProductsPageState(products = [], visibleCount = 8, step = 8) {
  const safeProducts = Array.isArray(products) ? products : []
  const safeVisibleCount = Math.max(step, visibleCount)
  const visibleItems = safeProducts.slice(0, safeVisibleCount)

  return {
    visibleItems,
    canLoadMore: safeProducts.length > safeVisibleCount,
    nextVisibleCount: Math.min(safeProducts.length, safeVisibleCount + step),
  }
}

export function upsertRecentlyViewedProduct(history = [], product, limit = RECENTLY_VIEWED_LIMIT) {
  const snapshot = toSafeSnapshot(product)
  if (!snapshot) return Array.isArray(history) ? history.filter(Boolean) : []

  const normalizedHistory = Array.isArray(history) ? history.map(toSafeSnapshot).filter(Boolean) : []
  const withoutCurrent = normalizedHistory.filter((entry) => entry.slug !== snapshot.slug)

  return [snapshot, ...withoutCurrent].slice(0, limit)
}

export function getRecentlyViewedProducts(history = [], currentSlug = "", limit = 8) {
  const normalizedHistory = Array.isArray(history) ? history.map(toSafeSnapshot).filter(Boolean) : []
  return normalizedHistory.filter((entry) => entry.slug !== currentSlug).slice(0, limit)
}
