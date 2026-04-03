const VISIBLE_PRODUCT_SLOTS_COUNT = 8

function normalizeId(value) {
  const numeric = Number(value)
  return Number.isInteger(numeric) && numeric > 0 ? numeric : null
}

function buildEmptySlots() {
  return Array.from({ length: VISIBLE_PRODUCT_SLOTS_COUNT }, () => null)
}

export function parseVisibleProductSlotsSetting(rawValue) {
  if (typeof rawValue !== "string" || !rawValue.trim()) return null

  try {
    const parsed = JSON.parse(rawValue)
    if (!Array.isArray(parsed)) return null

    const used = new Set()
    const normalized = parsed.slice(0, VISIBLE_PRODUCT_SLOTS_COUNT).map((entry) => {
      const id = normalizeId(entry)
      if (!id || used.has(id)) return null
      used.add(id)
      return id
    })

    while (normalized.length < VISIBLE_PRODUCT_SLOTS_COUNT) {
      normalized.push(null)
    }

    return normalized
  } catch {
    return null
  }
}

export function buildDefaultVisibleProductSlots(products) {
  const safeProducts = Array.isArray(products) ? products.filter(Boolean) : []
  const featured = safeProducts.filter((product) => product?.featured)
  const others = safeProducts.filter((product) => !product?.featured)
  const ids = [...featured, ...others]
    .slice(0, VISIBLE_PRODUCT_SLOTS_COUNT)
    .map((product) => normalizeId(product.id))
    .filter((id) => id !== null)

  const slots = buildEmptySlots()
  ids.forEach((id, index) => {
    slots[index] = id
  })
  return slots
}

export function resolveVisibleProductSlots(rawValue, products) {
  const configured = parseVisibleProductSlotsSetting(rawValue)
  const availableIds = new Set((Array.isArray(products) ? products : []).map((product) => normalizeId(product?.id)).filter((id) => id !== null))

  if (configured === null) {
    return buildDefaultVisibleProductSlots(products)
  }

  return configured.map((id) => (id && availableIds.has(id) ? id : null))
}

export function orderVisibleProducts(products, slots) {
  const map = new Map((Array.isArray(products) ? products : []).map((product) => [product.id, product]))
  return (Array.isArray(slots) ? slots : [])
    .map((id) => (id ? map.get(id) : null))
    .filter(Boolean)
}

export function assignProductToVisibleSlot(slots, slotIndex, productId) {
  const next = buildNormalizedSlots(slots)
  if (slotIndex < 0 || slotIndex >= VISIBLE_PRODUCT_SLOTS_COUNT) return next

  for (let index = 0; index < next.length; index += 1) {
    if (next[index] === productId) {
      next[index] = null
    }
  }

  next[slotIndex] = normalizeId(productId)
  return next
}

export function clearVisibleSlot(slots, slotIndex) {
  const next = buildNormalizedSlots(slots)
  if (slotIndex < 0 || slotIndex >= VISIBLE_PRODUCT_SLOTS_COUNT) return next
  next[slotIndex] = null
  return next
}

export function moveVisibleSlot(slots, fromIndex, toIndex) {
  const next = buildNormalizedSlots(slots)
  if (
    fromIndex < 0 ||
    fromIndex >= VISIBLE_PRODUCT_SLOTS_COUNT ||
    toIndex < 0 ||
    toIndex >= VISIBLE_PRODUCT_SLOTS_COUNT ||
    fromIndex === toIndex
  ) {
    return next
  }

  const [moved] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, moved)
  return next.slice(0, VISIBLE_PRODUCT_SLOTS_COUNT)
}

export function buildNormalizedSlots(slots) {
  const parsed = Array.isArray(slots) ? slots : []
  const used = new Set()
  const normalized = parsed.slice(0, VISIBLE_PRODUCT_SLOTS_COUNT).map((entry) => {
    const id = normalizeId(entry)
    if (!id || used.has(id)) return null
    used.add(id)
    return id
  })

  while (normalized.length < VISIBLE_PRODUCT_SLOTS_COUNT) {
    normalized.push(null)
  }

  return normalized
}

export { VISIBLE_PRODUCT_SLOTS_COUNT }

