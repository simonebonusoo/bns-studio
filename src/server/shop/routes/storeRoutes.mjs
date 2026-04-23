import { Router } from "express"
import { z } from "zod"

import { asyncHandler } from "../lib/http.mjs"
import { isCollectionPublic, productRelationInclude, resolveDueCollectionLaunches, serializeTaxonomyRelations, slugifyCatalogText } from "../lib/catalog-taxonomy.mjs"
import { buildVisibleProductBadges, parseManualBadges } from "../lib/product-badges.mjs"
import { prisma } from "../lib/prisma.mjs"
import { loadProductsWithStoredOrder } from "../lib/product-order.mjs"
import { MAX_FEATURED_PRODUCTS } from "../lib/product-featured.mjs"
import { calculatePricing } from "../services/pricing.mjs"
import { createBackInStockSubscription } from "../services/back-in-stock.mjs"
import { getAvailableProductFormats, getBaseProductPrice, getDefaultProductFormat } from "../lib/product-formats.mjs"
import { isProductPurchasable, isPublicProductStatus } from "../lib/product-status.mjs"
import { getProductStockLabel, getProductStockStatus } from "../lib/product-stock.mjs"
import { resolveSelectedVariant, serializeProductVariants } from "../lib/product-variants.mjs"
import { rankRelatedProducts, sortCatalogSearchProducts } from "../lib/product-discovery.mjs"
import { optionalAuth, requireAuth } from "../middleware/auth.mjs"
import { createMockLabelResponse, createMockTrackingResponse } from "../shipping/mocks/mock-tracking-route.mjs"
import { sanitizeMultilineText, sanitizePlainText } from "../lib/sanitize-text.mjs"

const router = Router()
const FALLBACK_CONTACT_EMAIL = "bnsstudio@gmail.com"

function parseJsonArray(value) {
  try {
    const parsed = JSON.parse(value || "[]")
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function parseCategoryNames(value) {
  return parseJsonArray(value)
    .map((entry) => (typeof entry === "string" ? entry : String(entry?.name || "")))
    .map((name) => name.trim())
    .filter(Boolean)
}

function findVariantProductIdInOptions(optionsJson) {
  const entry = parseJsonArray(optionsJson).find((option) => option?.name === "_variantProductId")
  const id = Number(entry?.value || 0)
  return Number.isInteger(id) && id > 0 ? id : null
}

async function findVariantGroupParentForProduct(product) {
  const candidateVariants = await prisma.productVariant.findMany({
    where: {
      optionsJson: { contains: "_variantProductId" },
    },
    include: {
      product: {
        include: productRelationInclude(),
      },
    },
  })

  return candidateVariants.find((variant) => findVariantProductIdInOptions(variant.optionsJson) === product.id)?.product || product
}

async function serializePublicProduct(product, options = {}) {
  const activeProduct = options.activeProduct || product
  const { imageUrls, costPrice: _costPrice, ...rest } = product
  const parsedImages = JSON.parse(imageUrls)
  const variants = serializeProductVariants(product)
  const linkedVariantProductIds = Array.from(
    new Set(variants.map((variant) => Number(variant.variantProductId || 0)).filter((id) => Number.isInteger(id) && id > 0)),
  )
  const linkedProducts = linkedVariantProductIds.length
    ? await prisma.product.findMany({
        where: { id: { in: linkedVariantProductIds } },
        select: { id: true, title: true, slug: true, imageUrls: true },
      })
    : []
  const linkedImagesByProductId = new Map(
    linkedProducts.map((linkedProduct) => {
      let linkedImages = []
      try {
        linkedImages = JSON.parse(linkedProduct.imageUrls || "[]")
      } catch {
        linkedImages = []
      }
      return [linkedProduct.id, Array.isArray(linkedImages) ? linkedImages.filter((image) => typeof image === "string" && image.trim()) : []]
    }),
  )
  const linkedProductById = new Map(linkedProducts.map((linkedProduct) => [linkedProduct.id, linkedProduct]))
  const activeVariantProductId = activeProduct?.id || product.id
  let activeDefaultAssigned = false
  const enrichedVariants = variants.map((variant) => {
    const isMainProductVariant = !variant.variantProductId
    const variantProductId = isMainProductVariant ? product.id : Number(variant.variantProductId || 0)
    const linkedProduct = linkedProductById.get(variantProductId)
    const variantImages = isMainProductVariant
      ? parsedImages
      : (linkedImagesByProductId.get(variantProductId) || variant.variantProductImageUrls || [])
    const linkedImages = linkedImagesByProductId.get(Number(variant.variantProductId || 0)) || variant.variantProductImageUrls || []
    const isActiveProductVariant = variantProductId === activeVariantProductId
    const isDefault = isActiveProductVariant && !activeDefaultAssigned
    const variantProductTitle = isMainProductVariant
      ? product.title
      : (linkedProduct?.title || variant.variantProductTitle || (variant.editionName && variant.editionName !== "Standard" ? variant.editionName : variant.title) || null)
    if (isDefault) activeDefaultAssigned = true
    return {
      ...variant,
      editionName: variantProductTitle || product.title,
      variantProductId,
      variantProductTitle,
      variantProductSlug: isMainProductVariant ? product.slug : (linkedProduct?.slug || variant.variantProductSlug || null),
      variantProductImageUrls: variantImages,
      variantProductImageUrl: variantImages[0] || linkedImages[0] || variant.variantProductImageUrl || null,
      isDefault,
    }
  })
  const defaultVariant = enrichedVariants.find((variant) => variant.isDefault) || enrichedVariants[0] || null
  const basePrice = getBaseProductPrice(product)
  const validDiscountPrice =
    typeof product.discountPrice === "number" && product.discountPrice >= 0 && product.discountPrice < basePrice ? product.discountPrice : null
  return {
    ...rest,
    price: basePrice,
    discountPrice: validDiscountPrice,
    priceA3: product.priceA3,
    discountPriceA3: product.discountPriceA3,
    priceA4: product.priceA4 ?? product.price,
    discountPriceA4: product.discountPriceA4,
    defaultFormat: getDefaultProductFormat(product),
    availableFormats: getAvailableProductFormats(product),
    imageUrls: parsedImages,
    coverImageUrl: parsedImages[0] || "",
    variants: enrichedVariants,
    defaultVariantId: defaultVariant?.id ?? null,
    activeVariantProductId,
    activeVariantEditionName: defaultVariant?.editionName || null,
    manualBadges: parseManualBadges(product.manualBadges),
    hiddenAsStandalone: Boolean(product.hiddenAsStandalone),
    isPurchasable: isProductPurchasable(product),
    lowStockThreshold: product.lowStockThreshold,
    stockStatus: getProductStockStatus(product),
    stockLabel: getProductStockLabel(product),
    badges: buildVisibleProductBadges(product),
    ...serializeTaxonomyRelations(product),
  }
}

function buildPublicProductsWhere(filters) {
  const search = String(filters.search || "").trim()
  const category = String(filters.category || "").trim()
  const maxPrice = Number(filters.maxPrice || 0)
  const format = String(filters.format || "").trim().toUpperCase()
  const availability = String(filters.availability || "").trim().toLowerCase()
  const featured = String(filters.featured || "").trim().toLowerCase() === "true"
  const discounted = String(filters.discounted || "").trim().toLowerCase() === "true"
  const tag = String(filters.tag || "").trim()
  const collection = String(filters.collection || filters.collectionSlug || "").trim()
  const conditions = []
  const now = new Date()

  if (search) {
    conditions.push({
      OR: [
        { title: { contains: search } },
        { slug: { contains: search } },
        { sku: { contains: search } },
        { description: { contains: search } },
        { category: { contains: search } },
        {
          productTags: {
            some: {
              tag: {
                OR: [{ name: { contains: search } }, { slug: { contains: slugifyCatalogText(search) } }],
              },
            },
          },
        },
      ],
    })
  }

  if (category) {
    conditions.push({ category })
  }

  if (maxPrice) {
    conditions.push({ price: { lte: maxPrice } })
  }

  if (featured) {
    conditions.push({ featured: true })
  }

  if (discounted) {
    conditions.push({
      OR: [
        { discountPrice: { not: null } },
        { discountPriceA4: { not: null } },
        { discountPriceA3: { not: null } },
        {
          variants: {
            some: {
              discountPrice: { not: null },
            },
          },
        },
      ],
    })
  }

  if (tag) {
    conditions.push({
      productTags: {
        some: {
          tag: {
            OR: [{ name: { contains: tag } }, { slug: { contains: slugifyCatalogText(tag) } }],
          },
        },
      },
    })
  }

  if (collection) {
    conditions.push({
      productCollections: {
        some: {
          collection: {
            slug: collection,
            active: true,
            OR: [
              { status: "live" },
              { status: "scheduled", launchAt: { lte: now } },
            ],
          },
        },
      },
    })
  }

  if (format === "A4") {
    conditions.push({ hasA4: true })
  }

  if (format === "A3") {
    conditions.push({ hasA3: true })
  }

  if (availability === "available") {
    conditions.push({ status: "active" })
    conditions.push({ stock: { gt: 0 } })
  } else if (availability === "out_of_stock") {
    conditions.push({
      OR: [
        { status: "out_of_stock" },
        {
          AND: [
            { status: { in: ["active", "out_of_stock"] } },
            { stock: { lte: 0 } },
          ],
        },
      ],
    })
  } else {
    conditions.push({ status: { in: ["active", "out_of_stock"] } })
  }

  conditions.push({ hiddenAsStandalone: false })

  return conditions.length ? { AND: conditions } : {}
}

function sortPublicProducts(products, sort, search = "") {
  if (search) {
    return sortCatalogSearchProducts(products, search)
  }

  switch (sort) {
    case "manual":
      return products
    case "price_asc":
      return [...products].sort((a, b) => getBaseProductPrice(a) - getBaseProductPrice(b))
    case "price_desc":
      return [...products].sort((a, b) => getBaseProductPrice(b) - getBaseProductPrice(a))
    case "title_asc":
      return [...products].sort((a, b) => a.title.localeCompare(b.title, "it"))
    case "newest":
    default:
      return [...products].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }
}

router.get(
  "/settings",
  asyncHandler(async (_req, res) => {
    const settings = await prisma.setting.findMany()
    res.json(
      settings.reduce((acc, setting) => {
        acc[setting.key] = setting.value
        return acc
      }, {})
    )
  })
)

router.post(
  "/contact",
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        name: z.string().trim().min(2),
        email: z.string().trim().email(),
        subject: z.string().trim().min(3),
        message: z.string().trim().min(10),
      })
      .parse(req.body)

    const contactSetting = await prisma.setting.findUnique({
      where: { key: "contactEmail" },
    })

    const contactEmail = (contactSetting?.value || FALLBACK_CONTACT_EMAIL).trim()
    const mailSubject = `[BNS Studio] ${sanitizePlainText(body.subject)}`
    const mailBody = [
      `Nome: ${sanitizePlainText(body.name)}`,
      `Email: ${body.email.trim().toLowerCase()}`,
      "",
      sanitizeMultilineText(body.message),
    ].join("\n")

    const mailtoUrl = `mailto:${encodeURIComponent(contactEmail)}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`

    res.json({
      message: "Apertura del client email in corso.",
      to: contactEmail,
      mailtoUrl,
    })
  })
)

router.get(
  "/categories",
  asyncHandler(async (_req, res) => {
    const categoriesSetting = await prisma.setting.findUnique({
      where: { key: "shopCategories" },
    })
    const categories =
      categoriesSetting
        ? parseCategoryNames(categoriesSetting.value)
        : (
            await prisma.product.findMany({
              distinct: ["category"],
              select: { category: true },
              orderBy: { category: "asc" },
            })
          ).map((item) => item.category)
    res.json(categories)
  })
)

router.get(
  "/products",
  asyncHandler(async (req, res) => {
    await resolveDueCollectionLaunches(prisma)
    const page = Math.max(1, Number(req.query.page || 1))
    const pageSize = Math.min(48, Math.max(1, Number(req.query.pageSize || 12)))
    const sort = String(req.query.sort || "manual")
    const search = String(req.query.search || "").trim()
    const where = buildPublicProductsWhere(req.query)

    const products = await loadProductsWithStoredOrder({
      where,
      orderBy: { createdAt: "desc" },
      include: productRelationInclude(),
    })
    const collectionSlug = String(req.query.collectionSlug || req.query.collection || "").trim()
    const sortedProducts =
      sort === "manual" && collectionSlug
        ? [...products].sort((left, right) => {
            const leftPosition =
              left.productCollections?.find((entry) => entry.collection?.slug === collectionSlug)?.position ?? Number.MAX_SAFE_INTEGER
            const rightPosition =
              right.productCollections?.find((entry) => entry.collection?.slug === collectionSlug)?.position ?? Number.MAX_SAFE_INTEGER
            if (leftPosition !== rightPosition) return leftPosition - rightPosition
            return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
          })
        : sortPublicProducts(products, sort, search)
    const total = sortedProducts.length
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const safePage = Math.min(page, totalPages)
    const start = (safePage - 1) * pageSize
    const items = sortedProducts.slice(start, start + pageSize)

    res.json({
      items: await Promise.all(items.map(serializePublicProduct)),
      pagination: {
        page: safePage,
        pageSize,
        total,
        totalPages,
      },
    })
  })
)

router.get(
  "/products/featured",
  asyncHandler(async (_req, res) => {
    await resolveDueCollectionLaunches(prisma)
    const products = await loadProductsWithStoredOrder({
      where: {
        featured: true,
        hiddenAsStandalone: false,
        status: { in: ["active", "out_of_stock"] },
      },
      orderBy: { createdAt: "desc" },
      include: productRelationInclude(),
    })

    res.json(await Promise.all(products.slice(0, MAX_FEATURED_PRODUCTS).map(serializePublicProduct)))
  })
)

router.get(
  "/products/:slug",
  asyncHandler(async (req, res) => {
    await resolveDueCollectionLaunches(prisma)
    const requestedProduct = await prisma.product.findUnique({
      where: { slug: req.params.slug },
      include: productRelationInclude(),
    })

    if (!requestedProduct || !isPublicProductStatus(requestedProduct.status)) {
      return res.status(404).json({ message: "Prodotto non trovato" })
    }

    const groupProduct = await findVariantGroupParentForProduct(requestedProduct)
    if (!groupProduct || !isPublicProductStatus(groupProduct.status)) {
      return res.status(404).json({ message: "Prodotto non trovato" })
    }

    if (requestedProduct.hiddenAsStandalone && groupProduct.id === requestedProduct.id) {
      return res.status(404).json({ message: "Prodotto non trovato" })
    }

    res.json(await serializePublicProduct(groupProduct, { activeProduct: requestedProduct }))
  })
)

router.get(
  "/products/:slug/related",
  asyncHandler(async (req, res) => {
    await resolveDueCollectionLaunches(prisma)
    const product = await prisma.product.findUnique({
      where: { slug: req.params.slug },
      include: productRelationInclude(),
    })

    if (!product || product.hiddenAsStandalone || !isPublicProductStatus(product.status)) {
      return res.status(404).json({ message: "Prodotto non trovato" })
    }

    const tagIds = (product.productTags || []).map((entry) => entry.tagId)
    const collectionIds = (product.productCollections || []).map((entry) => entry.collectionId)

    const relatedCandidates = await prisma.product.findMany({
      where: {
        id: { not: product.id },
        hiddenAsStandalone: false,
        status: { in: ["active", "out_of_stock"] },
        AND: [
          {
            OR: [
              { category: product.category },
              tagIds.length ? { productTags: { some: { tagId: { in: tagIds } } } } : undefined,
              collectionIds.length ? { productCollections: { some: { collectionId: { in: collectionIds } } } } : undefined,
            ].filter(Boolean),
          },
        ],
      },
      include: productRelationInclude(),
      take: 16,
      orderBy: { createdAt: "desc" },
    })

    const related = rankRelatedProducts(product, relatedCandidates, 4)

    res.json(await Promise.all(related.map(serializePublicProduct)))
  })
)

router.get(
  "/collections",
  asyncHandler(async (_req, res) => {
    await resolveDueCollectionLaunches(prisma)
    const collections = await prisma.collection.findMany({
      where: {
        active: true,
        OR: [
          { status: "live" },
          { status: "scheduled", launchAt: { lte: new Date() } },
        ],
      },
      orderBy: [{ position: "asc" }, { launchAt: "desc" }, { createdAt: "desc" }, { title: "asc" }],
      include: {
        products: {
          orderBy: [{ position: "asc" }],
          include: {
            product: {
              include: productRelationInclude(),
            },
          },
        },
        _count: {
          select: { products: true },
        },
      },
    })
    res.json(
      await Promise.all(
        collections.filter((collection) => isCollectionPublic(collection)).map(async (collection) => ({
          id: collection.id,
          title: collection.title,
          slug: collection.slug,
          description: collection.description || "",
          coverImageUrl: collection.coverImageUrl || "",
          promoText: collection.promoText || "",
          position: collection.position ?? 0,
          status: collection.status,
          launchAt: collection.launchAt,
          active: collection.active,
          createdAt: collection.createdAt,
          updatedAt: collection.updatedAt,
          _count: collection._count,
          products: await Promise.all(
            (collection.products || [])
              .map((entry) => entry.product)
              .filter((product) => product && product.hiddenAsStandalone === false && isPublicProductStatus(product.status))
              .map(serializePublicProduct),
          ),
        })),
      ),
    )
  })
)

router.post(
  "/back-in-stock-subscriptions",
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        productId: z.number().int().positive(),
        variantId: z.number().int().positive().optional().nullable(),
      })
      .parse(req.body)

    const product = await prisma.product.findUnique({
      where: { id: body.productId },
      include: productRelationInclude(),
    })

    if (!product || !isPublicProductStatus(product.status)) {
      return res.status(404).json({ message: "Prodotto non trovato" })
    }

    const selectedVariant = body.variantId ? resolveSelectedVariant(product, { variantId: body.variantId }) : null
    if (body.variantId && (!selectedVariant || Number(selectedVariant.id) !== Number(body.variantId))) {
      return res.status(404).json({ message: "Variante non trovata" })
    }

    const selectedStatus = getProductStockStatus(product, body.variantId ?? undefined)
    if (selectedStatus !== "out_of_stock") {
      return res.status(409).json({ message: "Questo prodotto e gia disponibile." })
    }

    const { subscription, created } = await createBackInStockSubscription(prisma, {
      userId: req.user.id,
      email: req.user.email,
      productId: product.id,
      variantId: selectedVariant?.id ?? null,
    })

    res.status(created ? 201 : 200).json({
      subscription,
      message: created
        ? "Ti avviseremo via email quando tornera disponibile."
        : "Hai gia una richiesta attiva per questa disponibilita.",
    })
  })
)

router.post(
  "/pricing/preview",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        items: z.array(
          z.object({
            productId: z.number(),
            quantity: z.number().int().min(1),
            format: z.string().optional(),
            variantId: z.number().int().positive().optional().nullable(),
            personalizationText: z.string().trim().max(50).optional().nullable(),
          })
        ),
        couponCode: z.string().optional().nullable(),
        shippingMethod: z.enum(["economy", "premium"]).optional().nullable(),
      })
      .parse(req.body)

    res.json(await calculatePricing(body.items, body.couponCode, {
      shippingMethod: body.shippingMethod,
      allowShippingQuoteFailure: true,
      userId: req.user?.id || null,
    }))
  })
)

router.get(
  "/mock-shipping/tracking/:trackingNumber",
  asyncHandler(async (req, res) => {
    if (!env.mockDebugRoutesEnabled) {
      return res.status(404).json({ message: "Endpoint API non trovato" })
    }

    const trackingNumber = String(req.params.trackingNumber || "").trim()

    if (!trackingNumber) {
      return res.status(404).json({ message: "Tracking non trovato" })
    }

    const order = await prisma.order.findFirst({
      where: {
        trackingNumber,
        OR: [{ shippingCarrier: "InPost" }, { shippingCarrier: "inpost" }],
      },
    })

    if (!order) {
      return res.status(404).json({ message: "Tracking non trovato" })
    }

    res.json(createMockTrackingResponse(order))
  })
)

router.get(
  "/mock-shipping/labels/:shipmentReference",
  asyncHandler(async (req, res) => {
    if (!env.mockDebugRoutesEnabled) {
      return res.status(404).json({ message: "Endpoint API non trovato" })
    }

    const shipmentReference = String(req.params.shipmentReference || "").trim()

    if (!shipmentReference) {
      return res.status(404).json({ message: "Etichetta non trovata" })
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ shipmentReference }, { dhlShipmentReference: shipmentReference }],
      },
    })

    if (!order) {
      return res.status(404).json({ message: "Etichetta non trovata" })
    }

    const { buffer, filename } = createMockLabelResponse(order)
    res.setHeader("Content-Type", "application/pdf")
    res.setHeader("Content-Disposition", `inline; filename=\"${filename}\"`)
    res.send(buffer)
  })
)

export default router
