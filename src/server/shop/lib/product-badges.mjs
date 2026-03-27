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

export function buildVisibleProductBadges(product) {
  const manualBadges = parseManualBadges(product.manualBadges).filter((badge) => badge.enabled)
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

  return badges
}
