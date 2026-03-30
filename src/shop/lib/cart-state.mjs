function getProductVariants(product) {
  const variants = Array.isArray(product?.variants) ? [...product.variants] : []
  const activeVariants = variants
    .filter((variant) => variant.isActive !== false)
    .sort((left, right) => {
      if ((left.position ?? 0) !== (right.position ?? 0)) return (left.position ?? 0) - (right.position ?? 0)
      return Number(Boolean(right.isDefault)) - Number(Boolean(left.isDefault))
    })

  return activeVariants.length ? activeVariants : variants
}

function getDefaultVariant(product) {
  const variants = getProductVariants(product)
  return (
    variants.find((variant) => variant.isDefault && Number(variant.stock || 0) > 0) ||
    variants.find((variant) => Number(variant.stock || 0) > 0) ||
    variants.find((variant) => variant.isDefault) ||
    variants[0] ||
    null
  )
}

function resolveSelectedVariant(product, selection = {}) {
  const variants = getProductVariants(product)

  if (selection.variantId) {
    const byId = variants.find((variant) => Number(variant.id) === Number(selection.variantId))
    if (byId) return byId
  }

  if (selection.format) {
    const normalized = String(selection.format).trim().toUpperCase()
    const byFormat = variants.find(
      (variant) =>
        String(variant.title || "").trim().toUpperCase() === normalized ||
        String(variant.key || "").trim().toUpperCase() === normalized
    )
    if (byFormat) return byFormat
  }

  return getDefaultVariant(product)
}

export function normalizeCartSelection(product, selection = {}) {
  const variant =
    resolveSelectedVariant(product, {
      variantId: selection?.variantId,
      format: selection?.format,
    }) || getDefaultVariant(product)

  return {
    variantId: variant?.id ?? selection?.variantId ?? null,
    format: selection?.format || variant?.title || null,
    variantLabel: selection?.variantLabel || variant?.title || null,
    variantSku: selection?.variantSku || variant?.sku || null,
  }
}

export function selectionMatches(item, selection = {}) {
  if (selection.variantId && item.variantId) {
    return Number(item.variantId) === Number(selection.variantId)
  }

  return String(item.format || "") === String(selection.format || "")
}

export function normalizeStoredCartItems(items = []) {
  return items.map((item) => {
    const normalizedSelection = normalizeCartSelection(item.product, {
      variantId: item.variantId,
      format: item.format,
      variantLabel: item.variantLabel,
      variantSku: item.variantSku,
    })

    return {
      ...item,
      ...normalizedSelection,
    }
  })
}

export function addCartItem(currentItems, product, quantity = 1, selection = {}) {
  const normalizedSelection = normalizeCartSelection(product, selection)
  const existing = currentItems.find((item) => item.productId === product.id && selectionMatches(item, normalizedSelection))

  if (existing) {
    return currentItems.map((item) =>
      item.productId === product.id && selectionMatches(item, normalizedSelection)
        ? { ...item, quantity: item.quantity + quantity, product, ...normalizedSelection }
        : item
    )
  }

  return [...currentItems, { productId: product.id, quantity, product, ...normalizedSelection }]
}

export function updateCartItem(currentItems, productId, quantity, selection) {
  return currentItems
    .map((item) =>
      item.productId === productId && selectionMatches(item, selection || item)
        ? { ...item, quantity }
        : item
    )
    .filter((item) => item.quantity > 0)
}

export function removeCartItem(currentItems, productId, selection) {
  return currentItems
    .map((item) => {
      if (!(item.productId === productId && selectionMatches(item, selection || item))) {
        return item
      }

      return {
        ...item,
        quantity: item.quantity - 1,
      }
    })
    .filter((item) => item.quantity > 0)
}

export function beginCheckoutCart(product, quantity = 1, selection = {}) {
  const normalizedSelection = normalizeCartSelection(product, selection)

  return [{ productId: product.id, quantity, product, ...normalizedSelection }]
}
