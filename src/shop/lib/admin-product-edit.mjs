function formatEuroInput(value) {
  const numericValue = Number(value || 0)
  if (!Number.isFinite(numericValue) || numericValue <= 0) return ""
  return Number.isInteger(numericValue / 100) ? String(numericValue / 100) : (numericValue / 100).toFixed(2)
}

function getSuggestedVariantCostCents(title) {
  const normalized = String(title || "").trim().toUpperCase()
  if (normalized === "A4") return 800
  if (normalized === "A3") return 1000
  return 0
}

function getVariantCostInputValue(title, costPrice) {
  const resolvedCost = typeof costPrice === "number" && costPrice > 0 ? costPrice : getSuggestedVariantCostCents(title)
  return resolvedCost > 0 ? formatEuroInput(resolvedCost) : ""
}

function slugifyVariantKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
}

function mapProductVariantToForm(variant, index) {
  const safeTitle = String(variant?.title || "").trim() || `Variante ${index + 1}`
  const options = Array.isArray(variant?.options) ? variant.options : []
  const findOption = (names) => {
    const normalizedNames = names.map((name) => String(name).trim().toLowerCase())
    return options.find((option) => normalizedNames.includes(String(option?.name || "").trim().toLowerCase()))?.value || ""
  }
  const size = String(variant?.size || findOption(["Misura", "Size", "Format", "Formato"]) || variant?.legacyFormat || safeTitle).trim()
  const editionName = String(variant?.editionName || findOption(["Variante", "Edition", "Edizione"]) || (size.toUpperCase() === safeTitle.toUpperCase() ? "Standard" : safeTitle)).trim()

  return {
    id: typeof variant?.id === "number" ? variant.id : null,
    title: safeTitle,
    key: String(variant?.key || "").trim() || slugifyVariantKey(safeTitle) || `variant-${index + 1}`,
    editionName,
    size,
    sku: String(variant?.sku || ""),
    price: formatEuroInput(variant?.price),
    discountPrice: formatEuroInput(variant?.discountPrice),
    costPrice: getVariantCostInputValue(safeTitle, variant?.costPrice),
    stock: Number(variant?.stock || 0),
    lowStockThreshold: Number(variant?.lowStockThreshold || 5),
    isDefault: Boolean(variant?.isDefault),
    isActive: variant?.isActive !== false,
  }
}

function buildLegacyVariants(product) {
  const hasA4 = product?.hasA4 !== false
  const hasA3 = Boolean(product?.hasA3)
  const fallbackTitle = hasA4 ? "A4" : hasA3 ? "A3" : "Standard"

  return [
    {
      id: null,
      title: fallbackTitle,
      key: hasA4 ? "a4" : hasA3 ? "a3" : "standard",
      editionName: "Standard",
      size: fallbackTitle,
      sku: product?.sku || null,
      price: hasA4 ? (product?.priceA4 ?? product?.price ?? 0) : (product?.priceA3 ?? product?.price ?? 0),
      discountPrice: hasA4 ? (product?.discountPriceA4 ?? product?.discountPrice ?? null) : (product?.discountPriceA3 ?? product?.discountPrice ?? null),
      costPrice: getSuggestedVariantCostCents(fallbackTitle),
      stock: Number(product?.stock || 0),
      lowStockThreshold: Number(product?.lowStockThreshold || 5),
      position: 0,
      isDefault: true,
      isActive: true,
    },
    ...(hasA3
      ? [
          {
            id: null,
            title: "A3",
            key: "a3",
            editionName: "Standard",
            size: "A3",
            sku: null,
            price: product?.priceA3 ?? product?.price ?? 0,
            discountPrice: product?.discountPriceA3 ?? product?.discountPrice ?? null,
            costPrice: getSuggestedVariantCostCents("A3"),
            stock: Number(product?.stock || 0),
            lowStockThreshold: Number(product?.lowStockThreshold || 5),
            position: 1,
            isDefault: product?.hasA4 === false,
            isActive: true,
          },
        ]
      : []),
  ]
}

export function normalizeProductFormStateForEdit(product) {
  const safeProduct = product || {}
  const variants = Array.isArray(safeProduct.variants) && safeProduct.variants.length ? safeProduct.variants : buildLegacyVariants(safeProduct)

  return {
    title: String(safeProduct.title || ""),
    sku: String(safeProduct.sku || ""),
    description: String(safeProduct.description || ""),
    priceA4: formatEuroInput(safeProduct.priceA4 ?? safeProduct.price ?? 0),
    priceA3: safeProduct.priceA3 ? formatEuroInput(safeProduct.priceA3) : "",
    discountPriceA4: safeProduct.discountPriceA4 ? formatEuroInput(safeProduct.discountPriceA4) : safeProduct.discountPrice ? formatEuroInput(safeProduct.discountPrice) : "",
    discountPriceA3: safeProduct.discountPriceA3 ? formatEuroInput(safeProduct.discountPriceA3) : "",
    costPrice: safeProduct.costPrice ? formatEuroInput(safeProduct.costPrice) : "",
    hasA4: safeProduct.hasA4 !== false,
    hasA3: Boolean(safeProduct.hasA3),
    category: String(safeProduct.category || ""),
    tags: Array.isArray(safeProduct.tags) ? safeProduct.tags.map((tag) => String(tag?.name || "").trim()).filter(Boolean).join(", ") : "",
    collectionIds: Array.isArray(safeProduct.collections)
      ? safeProduct.collections.map((collection) => Number(collection?.id)).filter((id) => Number.isFinite(id))
      : [],
    manualBadges: Array.isArray(safeProduct.manualBadges)
      ? safeProduct.manualBadges.filter((badge) => badge && typeof badge === "object").map((badge, index) => ({
          id: String(badge.id || `manual-${index + 1}`),
          label: String(badge.label || ""),
          enabled: badge.enabled !== false,
        }))
      : [],
    isCustomizable: Boolean(safeProduct.isCustomizable),
    featured: Boolean(safeProduct.featured),
    stock: Number(safeProduct.stock || 0),
    lowStockThreshold: Number(safeProduct.lowStockThreshold || 5),
    status: safeProduct.status || "active",
    existingImageUrls: Array.isArray(safeProduct.imageUrls) ? safeProduct.imageUrls.filter((image) => typeof image === "string" && image.trim()) : [],
    variants: variants.map(mapProductVariantToForm),
  }
}
