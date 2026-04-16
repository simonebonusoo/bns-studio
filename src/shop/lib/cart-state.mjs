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

  if (selection.editionName || selection.size) {
    const normalizedEdition = String(selection.editionName || "").trim().toUpperCase()
    const normalizedSize = String(selection.size || selection.format || "").trim().toUpperCase()
    const byPair = variants.find((variant) => {
      const edition = getVariantOptionValue(variant, ["Variante", "Edition", "Edizione"]) || variant.editionName || "Standard"
      const size = getVariantOptionValue(variant, ["Misura", "Size", "Format", "Formato"]) || variant.size || variant.title
      return (
        (!normalizedEdition || String(edition).trim().toUpperCase() === normalizedEdition) &&
        (!normalizedSize || String(size).trim().toUpperCase() === normalizedSize)
      )
    })
    if (byPair) return byPair
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

function getVariantOptionValue(variant, names = []) {
  const normalizedNames = names.map((name) => String(name).trim().toLowerCase())
  const options = Array.isArray(variant?.options) ? variant.options : []
  return options.find((option) => normalizedNames.includes(String(option?.name || "").trim().toLowerCase()))?.value || null
}

function getVariantEditionName(variant) {
  const value = getVariantOptionValue(variant, ["Variante", "Edition", "Edizione"]) || variant?.editionName
  if (value) return value
  const title = String(variant?.title || "").trim()
  const size = getVariantSize(variant)
  return size && title.toUpperCase() === String(size).toUpperCase() ? "Standard" : title || "Standard"
}

function getVariantSize(variant) {
  return getVariantOptionValue(variant, ["Misura", "Size", "Format", "Formato"]) || variant?.size || variant?.title || null
}

export function normalizeCartSelection(product, selection = {}) {
  const personalizationText = String(selection?.personalizationText || "").trim()
  const variant =
    resolveSelectedVariant(product, {
      variantId: selection?.variantId,
      format: selection?.format,
    }) || getDefaultVariant(product)

  return {
    variantId: variant?.id ?? selection?.variantId ?? null,
    editionName: selection?.editionName || getVariantEditionName(variant) || null,
    size: selection?.size || getVariantSize(variant) || null,
    format: selection?.format || getVariantSize(variant) || variant?.title || null,
    variantLabel: selection?.variantLabel || variant?.title || null,
    variantSku: selection?.variantSku || variant?.sku || null,
    personalizationText: personalizationText || null,
  }
}

export function selectionMatches(item, selection = {}) {
  const samePersonalization = String(item.personalizationText || "") === String(selection.personalizationText || "")

  if (selection.variantId && item.variantId) {
    return Number(item.variantId) === Number(selection.variantId) && samePersonalization
  }

  return (
    String(item.format || "") === String(selection.format || "") &&
    String(item.editionName || "") === String(selection.editionName || "") &&
    String(item.size || "") === String(selection.size || "") &&
    samePersonalization
  )
}

export function normalizeStoredCartItems(items = []) {
  return items.map((item) => {
    const normalizedSelection = normalizeCartSelection(item.product, {
      variantId: item.variantId,
      format: item.format,
      editionName: item.editionName,
      size: item.size,
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
