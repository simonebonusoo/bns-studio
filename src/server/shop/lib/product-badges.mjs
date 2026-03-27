const AUTOMATIC_BADGE_LABELS = {
  new: "Nuovo",
  featured: "In evidenza",
  low_stock: "Ultimi pezzi",
  out_of_stock: "Esaurito",
}

function normalizeBadgeLabel(value) {
  return String(value || "").trim()
}

function getBadgeDedupeKey(label) {
  return normalizeBadgeLabel(label).toLowerCase()
}

export function parseManualBadges(value) {
  try {
    const parsed = JSON.parse(value || "[]")
    if (!Array.isArray(parsed)) return []

    return parsed
      .map((badge, index) => ({
        id: String(badge?.id || `manual-${index + 1}`),
        label: normalizeBadgeLabel(badge?.label),
        enabled: badge?.enabled !== false,
      }))
      .filter((badge) => badge.label)
  } catch {
    return []
  }
}

export function sanitizeManualBadges(values = []) {
  return values
    .map((badge, index) => ({
      id: String(badge?.id || `manual-${Date.now()}-${index + 1}`),
      label: normalizeBadgeLabel(badge?.label),
      enabled: badge?.enabled !== false,
    }))
    .filter((badge) => badge.label)
}

export function buildAutomaticBadges(product) {
  return [
    product.featured ? { key: "featured", label: AUTOMATIC_BADGE_LABELS.featured, source: "automatic" } : null,
    product.status === "out_of_stock" || product.stock <= 0
      ? { key: "out_of_stock", label: AUTOMATIC_BADGE_LABELS.out_of_stock, source: "automatic" }
      : null,
    product.stock > 0 && product.stock <= product.lowStockThreshold
      ? { key: "low_stock", label: AUTOMATIC_BADGE_LABELS.low_stock, source: "automatic" }
      : null,
    new Date(product.createdAt).getTime() > Date.now() - 14 * 24 * 60 * 60 * 1000
      ? { key: "new", label: AUTOMATIC_BADGE_LABELS.new, source: "automatic" }
      : null,
  ].filter(Boolean)
}

export function buildVisibleProductBadges(product) {
  const manualBadges = parseManualBadges(product.manualBadges).filter((badge) => badge.enabled)
  const automaticBadges = buildAutomaticBadges(product)
  const usedKeys = new Set()
  const badges = []

  for (const badge of manualBadges) {
    const dedupeKey = getBadgeDedupeKey(badge.label)
    if (!dedupeKey || usedKeys.has(dedupeKey)) continue
    usedKeys.add(dedupeKey)
    badges.push({
      key: badge.id,
      label: badge.label,
      source: "manual",
    })
  }

  for (const badge of automaticBadges) {
    const dedupeKey = getBadgeDedupeKey(badge.label)
    if (!dedupeKey || usedKeys.has(dedupeKey)) continue
    usedKeys.add(dedupeKey)
    badges.push(badge)
  }

  return badges
}
