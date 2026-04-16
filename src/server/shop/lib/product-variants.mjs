import { HttpError } from "./http.mjs"
import { markBackInStockSubscriptionsReady } from "../services/back-in-stock.mjs"

const VARIANT_PRODUCT_OPTION_NAMES = {
  id: "_variantProductId",
  title: "_variantProductTitle",
  slug: "_variantProductSlug",
  imageUrl: "_variantProductImageUrl",
}

function isVariantProductOption(option) {
  return Object.values(VARIANT_PRODUCT_OPTION_NAMES).includes(String(option?.name || ""))
}

function getOptionValue(options, name) {
  return options.find((option) => String(option?.name || "") === name)?.value || null
}

function getVariantProductMetadata(variant, parsedOptions = parseVariantOptions(variant)) {
  const rawId = variant?.variantProductId ?? getOptionValue(parsedOptions, VARIANT_PRODUCT_OPTION_NAMES.id)
  const variantProductId = Number(rawId)
  return {
    variantProductId: Number.isInteger(variantProductId) && variantProductId > 0 ? variantProductId : null,
    variantProductTitle: String(variant?.variantProductTitle || getOptionValue(parsedOptions, VARIANT_PRODUCT_OPTION_NAMES.title) || "").trim() || null,
    variantProductSlug: String(variant?.variantProductSlug || getOptionValue(parsedOptions, VARIANT_PRODUCT_OPTION_NAMES.slug) || "").trim() || null,
    variantProductImageUrl: String(variant?.variantProductImageUrl || getOptionValue(parsedOptions, VARIANT_PRODUCT_OPTION_NAMES.imageUrl) || "").trim() || null,
  }
}

function normalizeOptionEntry(option) {
  const name = String(option?.name || option?.label || "").trim()
  const value = String(option?.value || option?.title || "").trim()
  if (!name || !value) return null
  return { name, value }
}

function normalizeVariantKey(value, fallback = "") {
  return String(value || fallback || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
}

function normalizeLegacyFormatTitle(value) {
  const normalized = String(value || "").trim().toUpperCase()
  return normalized === "A3" || normalized === "A4" ? normalized : null
}

function normalizeVariantOptionValue(variant, names = []) {
  const options = parseVariantOptions(variant)
  const normalizedNames = names.map((name) => String(name).trim().toLowerCase())
  const match = options.find((option) => normalizedNames.includes(String(option.name || "").trim().toLowerCase()))
  return match?.value || null
}

function inferVariantSize(variant) {
  return normalizeVariantOptionValue(variant, ["Misura", "Size", "Format", "Formato"]) || normalizeLegacyFormatTitle(variant?.title) || String(variant?.size || "").trim() || null
}

function inferVariantEditionName(variant) {
  const explicit =
    String(variant?.editionName || variant?.variantName || "").trim() ||
    normalizeVariantOptionValue(variant, ["Variante", "Edition", "Edizione"])
  if (explicit) return explicit

  const size = inferVariantSize(variant)
  const title = String(variant?.title || "").trim()
  if (size && title.toUpperCase() === String(size).trim().toUpperCase()) return "Standard"
  return title || "Standard"
}

function buildVariantOptions(variant) {
  const parsedOptions = parseVariantOptions(variant)
  const editionName = inferVariantEditionName(variant)
  const size = inferVariantSize(variant)
  const variantProduct = getVariantProductMetadata(variant, parsedOptions)
  const withoutManagedOptions = parsedOptions.filter((option) => {
    const name = String(option.name || "").trim().toLowerCase()
    return !["variante", "edition", "edizione", "misura", "size", "format", "formato"].includes(name) && !isVariantProductOption(option)
  })

  return [
    editionName ? { name: "Variante", value: editionName } : null,
    size ? { name: "Misura", value: size } : null,
    variantProduct.variantProductId ? { name: VARIANT_PRODUCT_OPTION_NAMES.id, value: String(variantProduct.variantProductId) } : null,
    variantProduct.variantProductTitle ? { name: VARIANT_PRODUCT_OPTION_NAMES.title, value: variantProduct.variantProductTitle } : null,
    variantProduct.variantProductSlug ? { name: VARIANT_PRODUCT_OPTION_NAMES.slug, value: variantProduct.variantProductSlug } : null,
    variantProduct.variantProductImageUrl ? { name: VARIANT_PRODUCT_OPTION_NAMES.imageUrl, value: variantProduct.variantProductImageUrl } : null,
    ...withoutManagedOptions,
  ].filter(Boolean)
}

function inferLegacyVariantOptions(variantTitle) {
  const legacyFormat = normalizeLegacyFormatTitle(variantTitle)
  return legacyFormat ? [{ name: "Variante", value: "Standard" }, { name: "Misura", value: legacyFormat }] : []
}

function parseVariantOptions(variant) {
  if (Array.isArray(variant?.options)) {
    const explicitOptions = variant.options.map(normalizeOptionEntry).filter(Boolean)
    if (explicitOptions.length) return explicitOptions
  }

  if (typeof variant?.optionsJson === "string") {
    try {
      const parsedOptions = JSON.parse(variant.optionsJson || "[]").map(normalizeOptionEntry).filter(Boolean)
      if (parsedOptions.length) return parsedOptions
    } catch {
      // Ignore invalid legacy payloads and fall back to inferred options.
    }
  }

  return inferLegacyVariantOptions(variant?.title)
}

function buildVariantRecord(variant, index) {
  const title = String(variant?.title || variant?.name || "").trim()
  const key = normalizeVariantKey(variant?.key, title || `variant-${index + 1}`)

  if (!title || !key) {
    throw new HttpError(400, "Ogni variante deve avere almeno un nome valido")
  }

  const price = Number(variant?.price)
  if (!Number.isInteger(price) || price < 0) {
    throw new HttpError(400, `Prezzo non valido per la variante ${title}`)
  }

  const rawDiscountPrice = variant?.discountPrice
  const discountPrice =
    rawDiscountPrice === null || rawDiscountPrice === undefined || rawDiscountPrice === ""
      ? null
      : Number(rawDiscountPrice)

  if (discountPrice !== null && (!Number.isInteger(discountPrice) || discountPrice < 0)) {
    throw new HttpError(400, `Prezzo scontato non valido per la variante ${title}`)
  }

  if (discountPrice !== null && discountPrice > price) {
    throw new HttpError(400, `Il prezzo scontato non puo superare il prezzo pieno per la variante ${title}`)
  }

  const stock = Number(variant?.stock ?? 0)
  const lowStockThreshold = Number(variant?.lowStockThreshold ?? 5)
  const costPrice = Number(variant?.costPrice ?? 0)
  const parsedOptions = parseVariantOptions(variant)
  const variantProduct = getVariantProductMetadata(variant, parsedOptions)

  return {
    id: typeof variant?.id === "number" ? variant.id : null,
    title,
    key,
    sku: variant?.sku ? String(variant.sku).trim().toUpperCase() : null,
    editionName: inferVariantEditionName(variant),
    size: inferVariantSize(variant),
    ...variantProduct,
    options: buildVariantOptions(variant),
    price,
    discountPrice: discountPrice !== null && discountPrice < price ? discountPrice : null,
    costPrice: Number.isInteger(costPrice) && costPrice >= 0 ? costPrice : 0,
    stock: Number.isInteger(stock) && stock >= 0 ? stock : 0,
    lowStockThreshold: Number.isInteger(lowStockThreshold) && lowStockThreshold >= 0 ? lowStockThreshold : 5,
    position: Number.isInteger(Number(variant?.position)) ? Number(variant.position) : index,
    isDefault: Boolean(variant?.isDefault),
    isActive: variant?.isActive !== false,
    legacyFormat: normalizeLegacyFormatTitle(variant?.title),
  }
}

export function deriveLegacyVariantsFromProduct(product) {
  const variants = []
  const shouldHaveA4 = product.hasA4 || (!product.hasA3 && !product.hasA4)

  if (shouldHaveA4) {
    variants.push({
      title: "A4",
      key: "a4",
      sku: product.sku || null,
      price: product.priceA4 ?? product.price,
      discountPrice: product.discountPriceA4 ?? product.discountPrice ?? null,
      costPrice: product.costPrice ?? 0,
      stock: product.stock ?? 0,
      lowStockThreshold: product.lowStockThreshold ?? 5,
      position: 0,
      isDefault: true,
      isActive: true,
      legacyFormat: "A4",
      editionName: "Standard",
      size: "A4",
      options: [{ name: "Variante", value: "Standard" }, { name: "Misura", value: "A4" }],
    })
  }

  if (product.hasA3) {
    variants.push({
      title: "A3",
      key: "a3",
      sku: null,
      price: product.priceA3 ?? product.priceA4 ?? product.price,
      discountPrice: product.discountPriceA3 ?? product.discountPrice ?? null,
      costPrice: product.costPrice ?? 0,
      stock: product.stock ?? 0,
      lowStockThreshold: product.lowStockThreshold ?? 5,
      position: variants.length,
      isDefault: !variants.length,
      isActive: true,
      legacyFormat: "A3",
      editionName: "Standard",
      size: "A3",
      options: [{ name: "Variante", value: "Standard" }, { name: "Misura", value: "A3" }],
    })
  }

  if (!variants.length) {
    variants.push({
      title: "Standard",
      key: "standard",
      sku: product.sku || null,
      price: product.price,
      discountPrice: product.discountPrice ?? null,
      costPrice: product.costPrice ?? 0,
      stock: product.stock ?? 0,
      lowStockThreshold: product.lowStockThreshold ?? 5,
      position: 0,
      isDefault: true,
      isActive: true,
      legacyFormat: null,
      editionName: "Standard",
      size: "Standard",
      options: [],
    })
  }

  return variants
}

export function getNormalizedProductVariants(product) {
  const sourceVariants = Array.isArray(product?.variants) && product.variants.length ? product.variants : deriveLegacyVariantsFromProduct(product)
  const normalized = sourceVariants.map((variant, index) => buildVariantRecord(variant, index))

  if (!normalized.some((variant) => variant.isDefault && variant.isActive)) {
    const fallback = normalized.find((variant) => variant.isActive) || normalized[0]
    if (fallback) {
      fallback.isDefault = true
    }
  }

  return normalized
}

export function buildLegacyProductFieldsFromVariants(rawVariants = []) {
  const variants = rawVariants.map((variant, index) => buildVariantRecord(variant, index))
  if (!variants.length) {
    throw new HttpError(400, "Ogni prodotto deve avere almeno una variante")
  }

  const activeVariants = variants.filter((variant) => variant.isActive)
  const visibleVariants = activeVariants.length ? activeVariants : variants
  const defaultVariant = visibleVariants.find((variant) => variant.isDefault) || visibleVariants[0]
  const prices = visibleVariants.map((variant) => variant.price)
  const discountPrices = visibleVariants
    .map((variant) => (typeof variant.discountPrice === "number" && variant.discountPrice < variant.price ? variant.discountPrice : null))
    .filter((value) => typeof value === "number")
  const totalStock = visibleVariants.reduce((sum, variant) => sum + variant.stock, 0)
  const lowStockThreshold = defaultVariant?.lowStockThreshold ?? visibleVariants[0]?.lowStockThreshold ?? 5
  const a4Variant = visibleVariants.find((variant) => variant.legacyFormat === "A4")
  const a3Variant = visibleVariants.find((variant) => variant.legacyFormat === "A3")

  return {
    variants: variants.map((variant, index) => ({
      ...variant,
      position: index,
      isDefault: defaultVariant ? variant.key === defaultVariant.key : index === 0,
    })),
    summary: {
      price: Math.min(...prices),
      discountPrice: discountPrices.length ? Math.min(...discountPrices) : null,
      costPrice: defaultVariant?.costPrice ?? 0,
      hasA4: Boolean(a4Variant),
      hasA3: Boolean(a3Variant),
      priceA4: a4Variant?.price ?? null,
      discountPriceA4:
        typeof a4Variant?.discountPrice === "number" && a4Variant.discountPrice < a4Variant.price ? a4Variant.discountPrice : null,
      priceA3: a3Variant?.price ?? null,
      discountPriceA3:
        typeof a3Variant?.discountPrice === "number" && a3Variant.discountPrice < a3Variant.price ? a3Variant.discountPrice : null,
      stock: totalStock,
      lowStockThreshold,
      sku: defaultVariant?.sku ?? null,
    },
  }
}

export function serializeProductVariants(product) {
  return getNormalizedProductVariants(product).map((variant) => ({
    id: typeof variant.id === "number" ? variant.id : null,
    title: variant.title,
    key: variant.key,
    editionName: variant.editionName || inferVariantEditionName(variant),
    size: variant.size || inferVariantSize(variant),
    sku: variant.sku || null,
    options: variant.options || [],
    optionSummary: (variant.options || []).filter((option) => !isVariantProductOption(option)).map((option) => `${option.name}: ${option.value}`).join(" · ") || null,
    variantProductId: variant.variantProductId ?? null,
    variantProductTitle: variant.variantProductTitle ?? null,
    variantProductSlug: variant.variantProductSlug ?? null,
    variantProductImageUrl: variant.variantProductImageUrl ?? null,
    price: variant.price,
    discountPrice: typeof variant.discountPrice === "number" && variant.discountPrice < variant.price ? variant.discountPrice : null,
    costPrice: variant.costPrice,
    stock: variant.stock,
    lowStockThreshold: variant.lowStockThreshold,
    position: variant.position,
    isDefault: variant.isDefault,
    isActive: variant.isActive,
    legacyFormat: variant.legacyFormat,
    stockStatus:
      variant.stock <= 0 ? "out_of_stock" : variant.stock <= variant.lowStockThreshold ? "low_stock" : "in_stock",
  }))
}

function getLinkedVariantProductIdsFromVariants(variants = []) {
  return Array.from(
    new Set(
      variants
        .map((variant) => {
          const meta = getVariantProductMetadata(variant)
          return meta.variantProductId
        })
        .filter((value) => Number.isInteger(value) && value > 0),
    ),
  )
}

export async function refreshHiddenStandaloneProducts(db) {
  const allVariants = await db.productVariant.findMany({ select: { optionsJson: true } })
  const linkedIds = new Set()

  for (const variant of allVariants) {
    const meta = getVariantProductMetadata(variant)
    if (meta.variantProductId) linkedIds.add(meta.variantProductId)
  }

  await db.product.updateMany({
    where: {
      hiddenAsStandalone: true,
      id: linkedIds.size ? { notIn: Array.from(linkedIds) } : undefined,
    },
    data: { hiddenAsStandalone: false },
  })

  if (linkedIds.size) {
    await db.product.updateMany({
      where: { id: { in: Array.from(linkedIds) } },
      data: { hiddenAsStandalone: true },
    })
  }
}

export async function syncProductVariants(db, productId, rawVariants = []) {
  const { variants, summary } = buildLegacyProductFieldsFromVariants(rawVariants)
  const existingVariants = await db.productVariant.findMany({
    where: { productId },
    select: {
      id: true,
      title: true,
      key: true,
      stock: true,
      isActive: true,
    },
  })

  const existingIds = new Set(existingVariants.map((variant) => variant.id))
  const incomingIds = new Set(variants.map((variant) => variant.id).filter((value) => typeof value === "number"))

  const idsToDelete = existingVariants
    .map((variant) => variant.id)
    .filter((id) => !incomingIds.has(id))

  if (idsToDelete.length) {
    await db.productVariant.deleteMany({
      where: {
        productId,
        id: { in: idsToDelete },
      },
    })
  }

  for (const variant of variants) {
    const payload = {
      title: variant.title,
      key: variant.key,
      sku: variant.sku,
      optionsJson: JSON.stringify(variant.options || []),
      price: variant.price,
      discountPrice: typeof variant.discountPrice === "number" && variant.discountPrice < variant.price ? variant.discountPrice : null,
      costPrice: variant.costPrice,
      stock: variant.stock,
      lowStockThreshold: variant.lowStockThreshold,
      position: variant.position,
      isDefault: variant.isDefault,
      isActive: variant.isActive,
    }

    if (variant.id && existingIds.has(variant.id)) {
      await db.productVariant.update({
        where: { id: variant.id },
        data: payload,
      })
    } else {
      await db.productVariant.create({
        data: {
          productId,
          ...payload,
        },
      })
    }
  }

  await db.product.update({
    where: { id: productId },
    data: {
      price: summary.price,
      discountPrice: summary.discountPrice,
      costPrice: summary.costPrice,
      hasA4: summary.hasA4,
      hasA3: summary.hasA3,
      priceA4: summary.priceA4,
      discountPriceA4: summary.discountPriceA4,
      priceA3: summary.priceA3,
      discountPriceA3: summary.discountPriceA3,
      stock: summary.stock,
      lowStockThreshold: summary.lowStockThreshold,
    },
  })

  const nextVariants = await db.productVariant.findMany({
    where: { productId },
    select: {
      id: true,
      title: true,
      key: true,
      stock: true,
      isActive: true,
    },
  })

  await markBackInStockSubscriptionsReady(db, {
    productId,
    previousVariants: existingVariants,
    nextVariants,
  })

  await refreshHiddenStandaloneProducts(db)
}

export async function backfillLegacyProductVariants(db) {
  const products = await db.product.findMany({
    include: {
      variants: {
        orderBy: [{ position: "asc" }, { id: "asc" }],
      },
    },
  })

  for (const product of products) {
    if (product.variants.length) continue
    await syncProductVariants(db, product.id, deriveLegacyVariantsFromProduct(product))
  }
}

export function resolveSelectedVariant(product, { variantId = null, format = null } = {}) {
  const variants = getNormalizedProductVariants(product)

  if (variantId) {
    const byId = variants.find((variant) => variant.id === Number(variantId))
    if (byId) return byId
  }

  if (format) {
    const normalizedFormat = String(format).trim().toUpperCase()
    const byFormat = variants.find((variant) => {
      const size = String(variant.size || inferVariantSize(variant) || "").trim().toUpperCase()
      return variant.title.toUpperCase() === normalizedFormat || variant.key.toUpperCase() === normalizedFormat || size === normalizedFormat
    })
    if (byFormat) return byFormat
  }

  return variants.find((variant) => variant.isDefault && variant.isActive) || variants.find((variant) => variant.isActive) || variants[0]
}
