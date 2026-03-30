import { Router } from "express"
import { z } from "zod"

import { asyncHandler } from "../lib/http.mjs"
import { productRelationInclude, serializeTaxonomyRelations, slugifyCatalogText } from "../lib/catalog-taxonomy.mjs"
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
import { requireAuth } from "../middleware/auth.mjs"

const router = Router()
const FALLBACK_CONTACT_EMAIL = "bnsstudio@gmail.com"

function serializePublicProduct(product) {
  const { imageUrls, costPrice: _costPrice, ...rest } = product
  const parsedImages = JSON.parse(imageUrls)
  const variants = serializeProductVariants(product)
  const defaultVariant = variants.find((variant) => variant.isDefault) || variants[0] || null
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
    variants,
    defaultVariantId: defaultVariant?.id ?? null,
    manualBadges: parseManualBadges(product.manualBadges),
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
    const mailSubject = `[BNS Studio] ${body.subject}`
    const mailBody = [
      `Nome: ${body.name}`,
      `Email: ${body.email}`,
      "",
      body.message,
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
        ? JSON.parse(categoriesSetting.value || "[]")
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
    const sortedProducts = sortPublicProducts(products, sort, search)
    const total = sortedProducts.length
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const safePage = Math.min(page, totalPages)
    const start = (safePage - 1) * pageSize
    const items = sortedProducts.slice(start, start + pageSize)

    res.json({
      items: items.map(serializePublicProduct),
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
    const products = await loadProductsWithStoredOrder({
      where: { featured: true, status: { in: ["active", "out_of_stock"] } },
      orderBy: { createdAt: "desc" },
      include: productRelationInclude(),
    })

    res.json(products.slice(0, MAX_FEATURED_PRODUCTS).map(serializePublicProduct))
  })
)

router.get(
  "/products/:slug",
  asyncHandler(async (req, res) => {
    const product = await prisma.product.findUnique({
      where: { slug: req.params.slug },
      include: productRelationInclude(),
    })

    if (!product || !isPublicProductStatus(product.status)) {
      return res.status(404).json({ message: "Prodotto non trovato" })
    }

    res.json(serializePublicProduct(product))
  })
)

router.get(
  "/products/:slug/related",
  asyncHandler(async (req, res) => {
    const product = await prisma.product.findUnique({
      where: { slug: req.params.slug },
      include: productRelationInclude(),
    })

    if (!product || !isPublicProductStatus(product.status)) {
      return res.status(404).json({ message: "Prodotto non trovato" })
    }

    const tagIds = (product.productTags || []).map((entry) => entry.tagId)
    const collectionIds = (product.productCollections || []).map((entry) => entry.collectionId)

    const relatedCandidates = await prisma.product.findMany({
      where: {
        id: { not: product.id },
        status: { in: ["active", "out_of_stock"] },
        OR: [
          { category: product.category },
          tagIds.length ? { productTags: { some: { tagId: { in: tagIds } } } } : undefined,
          collectionIds.length ? { productCollections: { some: { collectionId: { in: collectionIds } } } } : undefined,
        ].filter(Boolean),
      },
      include: productRelationInclude(),
      take: 16,
      orderBy: { createdAt: "desc" },
    })

    const related = rankRelatedProducts(product, relatedCandidates, 4)

    res.json(related.map(serializePublicProduct))
  })
)

router.get(
  "/collections",
  asyncHandler(async (_req, res) => {
    const collections = await prisma.collection.findMany({
      where: { active: true },
      orderBy: { title: "asc" },
      include: {
        _count: {
          select: { products: true },
        },
      },
    })
    res.json(collections)
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
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        items: z.array(
          z.object({
            productId: z.number(),
            quantity: z.number().int().min(1),
            format: z.string().optional(),
            variantId: z.number().int().positive().optional().nullable(),
          })
        ),
        couponCode: z.string().optional().nullable(),
      })
      .parse(req.body)

    res.json(await calculatePricing(body.items, body.couponCode))
  })
)

export default router
