import { HttpError } from "./http.mjs"

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

  const stock = Number(variant?.stock ?? 0)
  const lowStockThreshold = Number(variant?.lowStockThreshold ?? 5)
  const costPrice = Number(variant?.costPrice ?? 0)

  return {
    id: typeof variant?.id === "number" ? variant.id : null,
    title,
    key,
    sku: variant?.sku ? String(variant.sku).trim().toUpperCase() : null,
    price,
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
      costPrice: product.costPrice ?? 0,
      stock: product.stock ?? 0,
      lowStockThreshold: product.lowStockThreshold ?? 5,
      position: 0,
      isDefault: true,
      isActive: true,
      legacyFormat: "A4",
    })
  }

  if (product.hasA3) {
    variants.push({
      title: "A3",
      key: "a3",
      sku: null,
      price: product.priceA3 ?? product.priceA4 ?? product.price,
      costPrice: product.costPrice ?? 0,
      stock: product.stock ?? 0,
      lowStockThreshold: product.lowStockThreshold ?? 5,
      position: variants.length,
      isDefault: !variants.length,
      isActive: true,
      legacyFormat: "A3",
    })
  }

  if (!variants.length) {
    variants.push({
      title: "Standard",
      key: "standard",
      sku: product.sku || null,
      price: product.price,
      costPrice: product.costPrice ?? 0,
      stock: product.stock ?? 0,
      lowStockThreshold: product.lowStockThreshold ?? 5,
      position: 0,
      isDefault: true,
      isActive: true,
      legacyFormat: null,
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
      costPrice: defaultVariant?.costPrice ?? 0,
      hasA4: Boolean(a4Variant),
      hasA3: Boolean(a3Variant),
      priceA4: a4Variant?.price ?? null,
      priceA3: a3Variant?.price ?? null,
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
    sku: variant.sku || null,
    price: variant.price,
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

export async function syncProductVariants(db, productId, rawVariants = []) {
  const { variants, summary } = buildLegacyProductFieldsFromVariants(rawVariants)
  const existingVariants = await db.productVariant.findMany({
    where: { productId },
    select: { id: true },
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
      price: variant.price,
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
      costPrice: summary.costPrice,
      hasA4: summary.hasA4,
      hasA3: summary.hasA3,
      priceA4: summary.priceA4,
      priceA3: summary.priceA3,
      stock: summary.stock,
      lowStockThreshold: summary.lowStockThreshold,
    },
  })
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
    const byFormat = variants.find((variant) => variant.title.toUpperCase() === normalizedFormat || variant.key.toUpperCase() === normalizedFormat)
    if (byFormat) return byFormat
  }

  return variants.find((variant) => variant.isDefault && variant.isActive) || variants.find((variant) => variant.isActive) || variants[0]
}
