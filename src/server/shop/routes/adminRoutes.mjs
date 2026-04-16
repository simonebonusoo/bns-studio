import { Router } from "express"
import fs from "node:fs"
import path from "node:path"
import multer from "multer"
import { z } from "zod"

import { env } from "../config/env.mjs"
import { asyncHandler, HttpError } from "../lib/http.mjs"
import { getAssetStorageMode, storeUploadedProductImages } from "../lib/asset-storage.mjs"
import { ensureUniqueSlug, normalizeSku, normalizeTagNames, productRelationInclude, serializeTaxonomyRelations, slugifyCatalogText, syncProductCollections, syncProductTags } from "../lib/catalog-taxonomy.mjs"
import { getPersistenceStatus } from "../lib/persistence-status.mjs"
import { buildVisibleProductBadges, parseManualBadges, sanitizeManualBadges } from "../lib/product-badges.mjs"
import { prisma } from "../lib/prisma.mjs"
import { normalizeProductStatus, PRODUCT_STATUSES } from "../lib/product-status.mjs"
import { getProductStockLabel, getProductStockStatus } from "../lib/product-stock.mjs"
import { requireAdmin, requireAuth } from "../middleware/auth.mjs"
import { logInfo } from "../lib/monitoring.mjs"
import { getAvailableProductFormats, getBaseProductPrice, getProductCostForFormat, getProductPriceForFormat, normalizeProductFormat } from "../lib/product-formats.mjs"
import { getStoredProductOrderSetting, loadProductsWithStoredOrder, parseStoredProductOrder, saveProductOrder } from "../lib/product-order.mjs"
import { assertFeaturedProductLimit } from "../lib/product-featured.mjs"
import { resolveProductUploadsDir } from "../lib/uploads-storage.mjs"
import { buildLegacyProductFieldsFromVariants, deriveLegacyVariantsFromProduct, serializeProductVariants, syncProductVariants } from "../lib/product-variants.mjs"
import { serializeShopOrder } from "../lib/order-serialization.mjs"

const router = Router()
const uploadsDir = resolveProductUploadsDir()

fs.mkdirSync(uploadsDir, { recursive: true })
const CUSTOMER_ORDER_WHERE = { user: { role: "customer" } }
const ACTIVE_CUSTOMER_ORDER_WHERE = { ...CUSTOMER_ORDER_WHERE, archivedAt: null }
const ARCHIVED_CUSTOMER_ORDER_WHERE = { ...CUSTOMER_ORDER_WHERE, archivedAt: { not: null } }

const localDiskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    const safeBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, "-").toLowerCase()
    cb(null, `${Date.now()}-${safeBase}${ext}`)
  },
})

const upload = multer({
  storage: getAssetStorageMode() === "cloudinary" ? multer.memoryStorage() : localDiskStorage,
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new HttpError(400, "Sono consentite solo immagini"))
      return
    }
    cb(null, true)
  },
  limits: { fileSize: 5 * 1024 * 1024 },
})

router.use(requireAuth, requireAdmin)
router.use((req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    next()
    return
  }

  res.on("finish", () => {
    if (res.statusCode >= 200 && res.statusCode < 400) {
      logInfo("admin_mutation", {
        method: req.method,
        path: req.originalUrl || req.url,
        userId: req.user?.id || null,
        role: req.user?.role || null,
      })
    }
  })

  next()
})

function parseCategories(value) {
  try {
    const parsed = JSON.parse(value || "[]")
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function normalizeCategoryName(value) {
  return value.trim()
}

function normalizeCouponCode(value) {
  return value.trim().toUpperCase()
}

function slugifyProductTitle(value) {
  return slugifyCatalogText(value)
}

function serializeAdminProduct(product) {
  const parsedImages = JSON.parse(product.imageUrls)
  const variants = serializeProductVariants(product)
  const defaultVariant = variants.find((variant) => variant.isDefault) || variants[0] || null
  return {
    ...product,
    price: getBaseProductPrice(product),
    discountPrice: typeof product.discountPrice === "number" && product.discountPrice < getBaseProductPrice(product) ? product.discountPrice : null,
    availableFormats: getAvailableProductFormats(product),
    imageUrls: parsedImages,
    coverImageUrl: parsedImages[0] || "",
    variants,
    defaultVariantId: defaultVariant?.id ?? null,
    manualBadges: parseManualBadges(product.manualBadges),
    badges: buildVisibleProductBadges(product),
    ...serializeTaxonomyRelations(product),
    stockStatus: getProductStockStatus(product),
    stockLabel: getProductStockLabel(product),
  }
}

function getOrderItemCost(item) {
  const fallbackFormat = item.format || "A4"
  const unitCost = typeof item.unitCost === "number" && item.unitCost > 0 ? item.unitCost : getProductCostForFormat(item.product || {}, fallbackFormat)
  const costTotal = typeof item.costTotal === "number" && item.costTotal > 0 ? item.costTotal : unitCost * item.quantity
  return {
    unitCost,
    costTotal,
  }
}

function getOperationalShippingCost(order) {
  const method = String(order.shippingMethod || "").trim().toLowerCase()
  return method === "premium" ? 850 : 650
}

function buildOrderProfitSummary(order) {
  const items = order.items.map((item) => {
    const { unitCost, costTotal } = getOrderItemCost(item)
    return {
      id: item.id,
      productId: item.productId,
      title: item.title,
      format: item.format || "Formato non specificato",
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      unitCost,
      revenueTotal: item.lineTotal,
      costTotal,
      netTotal: item.lineTotal - costTotal,
    }
  })

  const productCostsTotal = items.reduce((sum, item) => sum + item.costTotal, 0)
  const shippingOperationalCost = getOperationalShippingCost(order)
  const totalExpenses = productCostsTotal + shippingOperationalCost
  const grossTotal = order.total
  const netTotal = grossTotal - totalExpenses

  return {
    orderId: order.id,
    orderReference: order.orderReference,
    status: order.status,
    createdAt: order.createdAt,
    grossTotal,
    subtotal: order.subtotal,
    discountTotal: order.discountTotal,
    shippingTotal: order.shippingTotal,
    productCostsTotal,
    shippingOperationalCost,
    totalExpenses,
    netTotal,
    shippingCostsTracked: true,
    items,
  }
}

function averageFromTotals(total, count) {
  if (!count) return 0
  return Math.round(total / count)
}

function buildAnalyticsChartSeries({ orders, pageViews }) {
  const revenueByDay = new Map()
  const viewsByDay = new Map()
  const expensesByDay = new Map()
  const netByDay = new Map()
  const formatter = new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "2-digit" })

  orders.forEach((order) => {
    const profitRow = buildOrderProfitSummary(order)
    const key = order.createdAt.toISOString().slice(0, 10)
    revenueByDay.set(key, (revenueByDay.get(key) || 0) + profitRow.grossTotal)
    expensesByDay.set(key, (expensesByDay.get(key) || 0) + profitRow.totalExpenses)
    netByDay.set(key, (netByDay.get(key) || 0) + profitRow.netTotal)
  })

  pageViews.forEach((entry) => {
    const key = entry.createdAt.toISOString().slice(0, 10)
    viewsByDay.set(key, (viewsByDay.get(key) || 0) + 1)
  })

  return Array.from({ length: 7 }, (_, offset) => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - (6 - offset))
    const key = date.toISOString().slice(0, 10)
    return {
      key,
      label: formatter.format(date),
      siteViews: viewsByDay.get(key) || 0,
      revenue: revenueByDay.get(key) || 0,
      expenses: expensesByDay.get(key) || 0,
      net: netByDay.get(key) || 0,
    }
  })
}

function buildAnalyticsSnapshot({ orders, pageViews }) {
  const completedOrders = orders.filter((order) => order.status === "paid" || order.status === "shipped")
  const profitRows = completedOrders.map(buildOrderProfitSummary)
  const totalRevenue = profitRows.reduce((sum, row) => sum + row.grossTotal, 0)
  const totalExpenses = profitRows.reduce((sum, row) => sum + row.totalExpenses, 0)
  const totalNet = profitRows.reduce((sum, row) => sum + row.netTotal, 0)
  const totalOrders = orders.length
  const salesCount = completedOrders.length
  const averageOrderValue = averageFromTotals(totalRevenue, salesCount)

  const dayBuckets = new Set(completedOrders.map((order) => new Date(order.createdAt).toISOString().slice(0, 10)))
  const monthBuckets = new Set(completedOrders.map((order) => new Date(order.createdAt).toISOString().slice(0, 7)))

  const bestSellingMap = new Map()
  completedOrders.forEach((order) => {
    order.items.forEach((item) => {
      const current = bestSellingMap.get(item.productId) || {
        productId: item.productId,
        title: item.title,
        quantity: 0,
      }
      current.quantity += item.quantity
      bestSellingMap.set(item.productId, current)
    })
  })

  const bestSellingProduct = Array.from(bestSellingMap.values()).sort((a, b) => b.quantity - a.quantity)[0] || null
  const todayKey = new Date().toISOString().slice(0, 10)
  const monthKey = new Date().toISOString().slice(0, 7)

  return {
    siteViewsTotal: pageViews.length,
    siteViewsToday: pageViews.filter((entry) => entry.createdAt.toISOString().slice(0, 10) === todayKey).length,
    siteViewsThisMonth: pageViews.filter((entry) => entry.createdAt.toISOString().slice(0, 7) === monthKey).length,
    totalOrders,
    salesCount,
    totalRevenue,
    totalExpenses,
    totalNet,
    averageOrderValue,
    averageDailyNet: averageFromTotals(totalNet, dayBuckets.size),
    averageMonthlyNet: averageFromTotals(totalNet, monthBuckets.size),
    averageDailyExpenses: averageFromTotals(totalExpenses, dayBuckets.size),
    averageMonthlyExpenses: averageFromTotals(totalExpenses, monthBuckets.size),
    bestSellingProduct,
    shippingCostsTracked: true,
    chartSeries: buildAnalyticsChartSeries({ orders: completedOrders, pageViews }),
  }
}

async function ensureUniqueProductSlug(baseValue, excludeId) {
  return ensureUniqueSlug("product", baseValue, excludeId)
}

async function ensureUniqueCollectionSlug(baseValue, excludeId) {
  return ensureUniqueSlug("collection", baseValue, excludeId)
}

async function ensureUniqueSku(value, excludeId) {
  const normalized = normalizeSku(value)
  if (!normalized) return null
  const existing = await prisma.product.findUnique({ where: { sku: normalized } })
  if (existing && existing.id !== excludeId) {
    throw new HttpError(409, "Esiste gia un prodotto con questo SKU")
  }
  return normalized
}

async function ensureCategoriesSetting() {
  const existingCategories = await prisma.product.findMany({
    distinct: ["category"],
    select: { category: true },
    orderBy: { category: "asc" },
  })

  return prisma.setting.upsert({
    where: { key: "shopCategories" },
    update: {},
    create: {
      key: "shopCategories",
      value: JSON.stringify(existingCategories.map((item) => item.category)),
    },
  })
}

async function ensureFeaturedProductSlotAvailable(nextFeatured, excludeId = null, currentlyFeatured = false) {
  const currentFeaturedCount = await prisma.product.count({
    where: {
      featured: true,
      id: excludeId ? { not: excludeId } : undefined,
    },
  })

  assertFeaturedProductLimit({
    currentFeaturedCount,
    nextFeatured,
    currentlyFeatured,
  })
}

async function getCategories() {
  const setting = await ensureCategoriesSetting()
  return parseCategories(setting.value)
}

function resolveProductPayload(body, fallbackPrice = 0, fallbackDiscounts = {}) {
  if (Array.isArray(body.variants) && body.variants.length) {
    const { summary } = buildLegacyProductFieldsFromVariants(body.variants)

    return {
      title: body.title.trim(),
      description: body.description.trim(),
      costPrice: summary.costPrice ?? 0,
      category: body.category.trim(),
      manualBadges: JSON.stringify(sanitizeManualBadges(body.manualBadges)),
      featured: Boolean(body.featured),
      stock: summary.stock,
      lowStockThreshold: summary.lowStockThreshold,
      hasA3: summary.hasA3,
      hasA4: summary.hasA4,
      priceA3: summary.priceA3,
      discountPriceA3: summary.discountPriceA3,
      priceA4: summary.priceA4,
      discountPriceA4: summary.discountPriceA4,
      discountPrice: summary.discountPrice,
      price: summary.price ?? fallbackPrice ?? 0,
    }
  }

  const hasA3 = Boolean(body.hasA3)
  const hasA4 = body.hasA4 ?? true
  const fallbackDiscountPriceA4 = typeof fallbackDiscounts.discountPriceA4 === "number" ? fallbackDiscounts.discountPriceA4 : null
  const fallbackDiscountPriceA3 = typeof fallbackDiscounts.discountPriceA3 === "number" ? fallbackDiscounts.discountPriceA3 : null
  const fallbackDiscountPrice = typeof fallbackDiscounts.discountPrice === "number" ? fallbackDiscounts.discountPrice : null

  if (!hasA3 && !hasA4) {
    throw new HttpError(400, "Seleziona almeno un formato disponibile")
  }

  if (hasA3 && (body.priceA3 === null || body.priceA3 === undefined)) {
    throw new HttpError(400, "Inserisci il prezzo A3")
  }

  if (hasA4 && (body.priceA4 === null || body.priceA4 === undefined)) {
    throw new HttpError(400, "Inserisci il prezzo A4")
  }

  if (body.discountPriceA4 !== null && body.discountPriceA4 !== undefined && body.priceA4 !== null && body.priceA4 !== undefined && body.discountPriceA4 > body.priceA4) {
    throw new HttpError(400, "Il prezzo scontato A4 non puo superare il prezzo pieno")
  }

  if (body.discountPriceA3 !== null && body.discountPriceA3 !== undefined && body.priceA3 !== null && body.priceA3 !== undefined && body.discountPriceA3 > body.priceA3) {
    throw new HttpError(400, "Il prezzo scontato A3 non puo superare il prezzo pieno")
  }

  const prices = [
    hasA4 ? body.priceA4 : null,
    hasA3 ? body.priceA3 : null,
    fallbackPrice || null,
  ].filter((value) => typeof value === "number")

  const price = prices.length ? Math.min(...prices) : 0

  return {
    title: body.title.trim(),
    description: body.description.trim(),
    costPrice: body.costPrice ?? 0,
    category: body.category.trim(),
    manualBadges: JSON.stringify(sanitizeManualBadges(body.manualBadges)),
    featured: Boolean(body.featured),
    stock: Number(body.stock),
    lowStockThreshold: Number(body.lowStockThreshold ?? 5),
    hasA3,
    hasA4,
    discountPrice:
      hasA4
        ? (body.discountPriceA4 ?? fallbackDiscountPriceA4 ?? fallbackDiscountPrice ?? null)
        : hasA3
          ? (body.discountPriceA3 ?? fallbackDiscountPriceA3 ?? fallbackDiscountPrice ?? null)
          : (body.discountPrice ?? fallbackDiscountPrice ?? null),
    discountPriceA3: hasA3 ? (body.discountPriceA3 ?? fallbackDiscountPriceA3 ?? null) : null,
    discountPriceA4: hasA4 ? (body.discountPriceA4 ?? fallbackDiscountPriceA4 ?? fallbackDiscountPrice ?? null) : null,
    priceA3: hasA3 ? body.priceA3 : null,
    priceA4: hasA4 ? body.priceA4 : null,
    price,
  }
}

const productSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1).optional(),
  description: z.string().min(1),
  status: z.enum(PRODUCT_STATUSES).default("active"),
  isCustomizable: z.boolean().default(false),
  sku: z.string().optional().nullable(),
  price: z.number().min(0).optional(),
  discountPrice: z.number().min(0).optional().nullable(),
  costPrice: z.number().min(0).default(0),
  hasA3: z.boolean().default(false),
  hasA4: z.boolean().default(true),
  priceA3: z.number().min(0).optional().nullable(),
  discountPriceA3: z.number().min(0).optional().nullable(),
  priceA4: z.number().min(0).optional().nullable(),
  discountPriceA4: z.number().min(0).optional().nullable(),
  category: z.string().min(1),
  imageUrls: z.array(z.string().min(1)).min(1),
  variants: z
    .array(
      z.object({
        id: z.number().int().positive().optional().nullable(),
        title: z.string().min(1),
        key: z.string().optional().nullable(),
        editionName: z.string().optional().nullable(),
        size: z.string().optional().nullable(),
        sku: z.string().optional().nullable(),
        options: z
          .array(
            z.object({
              name: z.string().min(1),
              value: z.string().min(1),
            }),
          )
          .optional()
          .default([]),
        price: z.number().min(0),
        discountPrice: z.number().min(0).optional().nullable(),
        costPrice: z.number().min(0).default(0),
        stock: z.number().int().min(0).default(0),
        lowStockThreshold: z.number().int().min(0).default(5),
        position: z.number().int().min(0).optional(),
        isDefault: z.boolean().default(false),
        isActive: z.boolean().default(true),
      }),
    )
    .default([]),
  tags: z.array(z.string().min(1)).default([]),
  collectionIds: z.array(z.number().int().positive()).default([]),
  manualBadges: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().trim().min(1),
        enabled: z.boolean().default(true),
      }),
    )
    .default([]),
  featured: z.boolean().default(false),
  stock: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(5),
})

const collectionSchema = z.object({
  title: z.string().min(1),
  slug: z.string().optional(),
  description: z.string().optional().nullable(),
  active: z.boolean().default(true),
})

const reviewAdminSchema = z.object({
  showOnHomepage: z.boolean(),
})

const couponSchema = z.object({
  code: z.string().min(2),
  type: z.enum(["percentage", "fixed", "first_registration"]),
  amount: z.number().min(1),
  expiresAt: z.string().optional().nullable(),
  usageLimit: z.number().int().min(1).optional().nullable(),
  active: z.boolean(),
})

const ruleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  ruleType: z.enum(["quantity_percentage", "free_shipping_quantity", "subtotal_fixed", "first_registration"]),
  threshold: z.number().int().min(1),
  discountType: z.enum(["percentage", "shipping", "fixed"]),
  amount: z.number().min(0),
  priority: z.number().int().min(0).default(100),
  startsAt: z.string().optional().nullable(),
  endsAt: z.string().optional().nullable(),
  active: z.boolean(),
})

const settingsSchema = z.array(
  z.object({
    key: z.string().min(1),
    value: z.string(),
  })
)

router.post(
  "/uploads",
  upload.array("images", 8),
  asyncHandler(async (req, res) => {
    const files = Array.isArray(req.files) ? req.files : []
    const storedFiles = await storeUploadedProductImages(files)
    res.status(201).json({
      files: storedFiles,
    })
  })
)

router.get(
  "/runtime-status",
  asyncHandler(async (_req, res) => {
    res.json({
      ...getPersistenceStatus(),
      shippingManual: {
        packlinkProNewShipmentUrl: env.packlinkProNewShipmentUrl,
        defaultParcel: {
          weightKg: env.packlinkParcelWeightKg,
          lengthCm: env.packlinkParcelLengthCm,
          widthCm: env.packlinkParcelWidthCm,
          heightCm: env.packlinkParcelHeightCm,
        },
      },
    })
  })
)

router.get(
  "/dashboard",
  asyncHandler(async (_req, res) => {
    const orders = await prisma.order.findMany({
      where: ACTIVE_CUSTOMER_ORDER_WHERE,
      include: { items: true },
      orderBy: { createdAt: "desc" },
    })
    const revenue = orders
      .filter((order) => order.status === "paid" || order.status === "shipped")
      .reduce((sum, order) => sum + order.total, 0)

    res.json({
      revenue,
      orderCount: orders.length,
      recentOrders: orders.slice(0, 5),
    })
  })
)

router.get(
  "/users",
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
      where: { role: { not: "deleted" } },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    })

    res.json({
      total: users.length,
      users,
    })
  })
)

router.patch(
  "/users/:id/role",
  asyncHandler(async (req, res) => {
    const userId = Number(req.params.id)
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new HttpError(400, "Utente non valido")
    }

    const body = z
      .object({
        role: z.enum(["admin", "customer"]),
      })
      .parse(req.body)

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
      },
    })

    if (!existingUser) {
      throw new HttpError(404, "Utente non trovato")
    }

    if (existingUser.role === body.role) {
      return res.json(existingUser)
    }

    if (existingUser.role === "admin" && body.role === "customer") {
      const adminCount = await prisma.user.count({ where: { role: "admin" } })
      if (adminCount <= 1) {
        throw new HttpError(400, "Impossibile rimuovere l'ultimo admin")
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: body.role },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
      },
    })

    res.json(updatedUser)
  })
)

router.get(
  "/analytics",
  asyncHandler(async (_req, res) => {
    const [orders, pageViews] = await Promise.all([
      prisma.order.findMany({
        where: ACTIVE_CUSTOMER_ORDER_WHERE,
        include: {
          items: {
            include: {
              product: {
                select: { costPrice: true },
              },
            },
          },
        },
      }),
      prisma.pageView.findMany({
        select: {
          createdAt: true,
          path: true,
        },
      }),
    ])

    res.json(buildAnalyticsSnapshot({ orders, pageViews }))
  })
)

router.get(
  "/products",
  asyncHandler(async (_req, res) => {
    const querySchema = z.object({
      search: z.string().optional(),
      category: z.string().optional(),
      status: z.enum(["all", ...PRODUCT_STATUSES]).optional(),
      tag: z.string().optional(),
      collectionId: z.coerce.number().int().positive().optional(),
      sort: z.enum(["title", "createdAt", "updatedAt", "price"]).optional(),
      direction: z.enum(["asc", "desc"]).optional(),
    })

    const query = querySchema.parse(_req.query)
    const search = String(query.search || "").trim()
    const category = String(query.category || "").trim()
    const status = query.status || "all"
    const tag = String(query.tag || "").trim()
    const collectionId = query.collectionId
    const sort = query.sort || "createdAt"
    const direction = query.direction || "desc"

    const orderBy = sort === "price" ? { price: direction } : { [sort]: direction }

    const products = await prisma.product.findMany({
      where: {
        category: category || undefined,
        status: status === "all" ? undefined : status,
        productTags: tag
          ? {
              some: {
                tag: {
                  OR: [{ name: { contains: tag } }, { slug: { contains: slugifyCatalogText(tag) } }],
                },
              },
            }
          : undefined,
        productCollections: collectionId
          ? {
              some: {
                collectionId,
              },
            }
          : undefined,
        OR: search
          ? [
              { title: { contains: search } },
              { slug: { contains: search } },
              { sku: { contains: search } },
            ]
          : undefined,
      },
      orderBy,
      include: productRelationInclude(),
    })
    res.json(products.map(serializeAdminProduct))
  })
)

router.get(
  "/tags",
  asyncHandler(async (_req, res) => {
    const tags = await prisma.tag.findMany({
      orderBy: { name: "asc" },
    })
    res.json(tags)
  })
)

router.get(
  "/collections",
  asyncHandler(async (_req, res) => {
    const collections = await prisma.collection.findMany({
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
  "/collections",
  asyncHandler(async (req, res) => {
    const body = collectionSchema.parse(req.body)
    const slug = await ensureUniqueCollectionSlug(body.slug || body.title)
    const collection = await prisma.collection.create({
      data: {
        title: body.title.trim(),
        slug,
        description: body.description?.trim() || null,
        active: body.active,
      },
    })
    res.status(201).json(collection)
  })
)

router.put(
  "/collections/:id",
  asyncHandler(async (req, res) => {
    const body = collectionSchema.parse(req.body)
    const collectionId = Number(req.params.id)
    const existing = await prisma.collection.findUnique({ where: { id: collectionId } })
    if (!existing) {
      throw new HttpError(404, "Collezione non trovata")
    }

    const slug = body.slug
      ? await ensureUniqueCollectionSlug(body.slug, collectionId)
      : await ensureUniqueCollectionSlug(body.title, collectionId)

    const collection = await prisma.collection.update({
      where: { id: collectionId },
      data: {
        title: body.title.trim(),
        slug,
        description: body.description?.trim() || null,
        active: body.active,
      },
    })
    res.json(collection)
  })
)

router.delete(
  "/collections/:id",
  asyncHandler(async (req, res) => {
    const collectionId = Number(req.params.id)
    await prisma.collection.delete({ where: { id: collectionId } })
    res.status(204).send()
  })
)

router.put(
  "/products/order",
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        productIds: z.array(z.number().int().positive()).min(1),
      })
      .parse(req.body)

    const existingProducts = await prisma.product.findMany({
      select: { id: true },
      orderBy: { createdAt: "desc" },
    })

    const existingIds = existingProducts.map((product) => product.id)
    const normalizedIds = Array.from(new Set(body.productIds))

    if (
      normalizedIds.length !== existingIds.length ||
      normalizedIds.some((id) => !existingIds.includes(id))
    ) {
      throw new HttpError(400, "Ordine prodotti non valido")
    }

    await saveProductOrder(normalizedIds)
    const orderedProducts = await loadProductsWithStoredOrder({ orderBy: { createdAt: "desc" } })
    res.json(orderedProducts.map(serializeAdminProduct))
  })
)

router.post(
  "/products",
  asyncHandler(async (req, res) => {
    const body = productSchema.parse(req.body)
    const categories = await getCategories()
    if (!categories.includes(body.category)) {
      throw new HttpError(400, "Categoria non valida")
    }
    const payload = resolveProductPayload(body)
    const slug = await ensureUniqueProductSlug(body.slug || body.title)
    const sku = await ensureUniqueSku(body.sku)
    await ensureFeaturedProductSlotAvailable(Boolean(body.featured))
    const product = await prisma.product.create({
      data: {
        ...payload,
        sku,
        lowStockThreshold: body.lowStockThreshold,
        status: normalizeProductStatus(body.status),
        isCustomizable: Boolean(body.isCustomizable),
        slug,
        imageUrls: JSON.stringify(body.imageUrls),
      },
      include: productRelationInclude(),
    })
    await syncProductVariants(prisma, product.id, body.variants.length ? body.variants : deriveLegacyVariantsFromProduct({ ...product, ...payload, sku }))
    await syncProductTags(product.id, body.tags)
    await syncProductCollections(product.id, body.collectionIds)
    const existingOrderSetting = await getStoredProductOrderSetting()
    if (existingOrderSetting) {
      const nextOrder = [...parseStoredProductOrder(existingOrderSetting.value), product.id]
      await saveProductOrder(nextOrder)
    }
    const hydrated = await prisma.product.findUnique({
      where: { id: product.id },
      include: productRelationInclude(),
    })
    res.status(201).json(serializeAdminProduct(hydrated))
  })
)

router.put(
  "/products/:id",
  asyncHandler(async (req, res) => {
    const body = productSchema.parse(req.body)
    const productId = Number(req.params.id)
    const existingProduct = await prisma.product.findUnique({ where: { id: productId } })
    if (!existingProduct) {
      throw new HttpError(404, "Prodotto non trovato")
    }
    const categories = await getCategories()
    if (!categories.includes(body.category)) {
      throw new HttpError(400, "Categoria non valida")
    }
    const payload = resolveProductPayload(body, existingProduct.price, {
      discountPrice: existingProduct.discountPrice,
      discountPriceA3: existingProduct.discountPriceA3,
      discountPriceA4: existingProduct.discountPriceA4,
    })
    await ensureFeaturedProductSlotAvailable(Boolean(body.featured), productId, Boolean(existingProduct.featured))
    const sku = await ensureUniqueSku(body.sku, productId)
    const slug = body.slug
      ? await ensureUniqueProductSlug(body.slug, productId)
      : existingProduct.slug
    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        ...payload,
        sku,
        lowStockThreshold: body.lowStockThreshold,
        status: normalizeProductStatus(body.status),
        isCustomizable: Boolean(body.isCustomizable),
        slug,
        imageUrls: JSON.stringify(body.imageUrls),
      },
      include: productRelationInclude(),
    })
    await syncProductVariants(prisma, product.id, body.variants.length ? body.variants : deriveLegacyVariantsFromProduct({ ...existingProduct, ...payload, sku }))
    await syncProductTags(product.id, body.tags)
    await syncProductCollections(product.id, body.collectionIds)
    const hydrated = await prisma.product.findUnique({
      where: { id: product.id },
      include: productRelationInclude(),
    })
    res.json(serializeAdminProduct(hydrated))
  })
)

router.patch(
  "/products/:id/home-visibility",
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        featured: z.boolean(),
      })
      .parse(req.body)

    const productId = Number(req.params.id)
    const existingProduct = await prisma.product.findUnique({ where: { id: productId } })
    if (!existingProduct) {
      throw new HttpError(404, "Prodotto non trovato")
    }

    await ensureFeaturedProductSlotAvailable(Boolean(body.featured), productId, Boolean(existingProduct.featured))

    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        featured: body.featured,
      },
      include: productRelationInclude(),
    })

    res.json(serializeAdminProduct(product))
  }),
)

router.post(
  "/products/:id/duplicate",
  asyncHandler(async (req, res) => {
    const productId = Number(req.params.id)
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: productRelationInclude(),
    })

    if (!product) {
      throw new HttpError(404, "Prodotto non trovato")
    }

    const slug = await ensureUniqueProductSlug(`${product.title} copia`)
    const duplicated = await prisma.product.create({
      data: {
        title: `${product.title} copia`,
        slug,
        sku: null,
        description: product.description,
        status: "draft",
        price: product.price,
        discountPrice: product.discountPrice,
        priceA3: product.priceA3,
        discountPriceA3: product.discountPriceA3,
        priceA4: product.priceA4,
        discountPriceA4: product.discountPriceA4,
        costPrice: product.costPrice,
        hasA3: product.hasA3,
        hasA4: product.hasA4,
        category: product.category,
        imageUrls: product.imageUrls,
        manualBadges: product.manualBadges,
        isCustomizable: Boolean(product.isCustomizable),
        featured: false,
        stock: product.stock,
        lowStockThreshold: product.lowStockThreshold,
      },
      include: productRelationInclude(),
    })

    await syncProductVariants(prisma, duplicated.id, serializeProductVariants(product).map((variant) => ({
      title: variant.title,
      key: variant.key,
      sku: null,
      price: variant.price,
      discountPrice: variant.discountPrice,
      costPrice: variant.costPrice || 0,
      stock: variant.stock,
      lowStockThreshold: variant.lowStockThreshold,
      position: variant.position,
      isDefault: variant.isDefault,
      isActive: variant.isActive,
    })))
    await syncProductTags(duplicated.id, (product.productTags || []).map((entry) => entry.tag.name))
    await syncProductCollections(duplicated.id, (product.productCollections || []).map((entry) => entry.collection.id))

    const existingOrderSetting = await getStoredProductOrderSetting()
    if (existingOrderSetting) {
      const nextOrder = [...parseStoredProductOrder(existingOrderSetting.value), duplicated.id]
      await saveProductOrder(nextOrder)
    }

    const hydrated = await prisma.product.findUnique({
      where: { id: duplicated.id },
      include: productRelationInclude(),
    })
    res.status(201).json(serializeAdminProduct(hydrated))
  })
)

router.post(
  "/products/bulk",
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        productIds: z.array(z.number().int().positive()).min(1),
        action: z.enum(["set_status", "set_category", "delete", "add_tags", "remove_tags"]),
        status: z.enum(PRODUCT_STATUSES).optional(),
        category: z.string().optional(),
        tags: z.array(z.string()).optional(),
      })
      .parse(req.body)

    const productIds = Array.from(new Set(body.productIds))

    if (body.action === "set_status") {
      if (!body.status) throw new HttpError(400, "Stato non valido")
      await prisma.product.updateMany({
        where: { id: { in: productIds } },
        data: { status: normalizeProductStatus(body.status) },
      })
    }

    if (body.action === "set_category") {
      const category = String(body.category || "").trim()
      const categories = await getCategories()
      if (!category || !categories.includes(category)) {
        throw new HttpError(400, "Categoria non valida")
      }
      await prisma.product.updateMany({
        where: { id: { in: productIds } },
        data: { category },
      })
    }

    if (body.action === "delete") {
      await prisma.product.deleteMany({
        where: { id: { in: productIds } },
      })
      const existingOrderSetting = await getStoredProductOrderSetting()
      if (existingOrderSetting) {
        const nextOrder = parseStoredProductOrder(existingOrderSetting.value).filter((id) => !productIds.includes(id))
        await saveProductOrder(nextOrder)
      }
    }

    if (body.action === "add_tags" || body.action === "remove_tags") {
      const targetTags = normalizeTagNames(body.tags || [])
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        include: productRelationInclude(),
      })

      for (const product of products) {
        const currentTags = (product.productTags || []).map((entry) => entry.tag.name)
        const nextTags =
          body.action === "add_tags"
            ? normalizeTagNames([...currentTags, ...targetTags])
            : currentTags.filter((tag) => !targetTags.some((target) => target.toLowerCase() === tag.toLowerCase()))
        await syncProductTags(product.id, nextTags)
      }
    }

    const products = await prisma.product.findMany({
      include: productRelationInclude(),
      orderBy: { updatedAt: "desc" },
    })
    res.json(products.map(serializeAdminProduct))
  })
)

router.delete(
  "/products/:id",
  asyncHandler(async (req, res) => {
    const productId = Number(req.params.id)
    const product = await prisma.product.findUnique({ where: { id: productId } })
    await prisma.product.delete({ where: { id: productId } })
    const existingOrderSetting = await getStoredProductOrderSetting()
    if (existingOrderSetting) {
      const nextOrder = parseStoredProductOrder(existingOrderSetting.value).filter((id) => id !== productId)
      await saveProductOrder(nextOrder)
    }
    if (product) {
      JSON.parse(product.imageUrls).forEach((url) => {
        if (typeof url === "string" && url.startsWith("/uploads/products/")) {
          const filePath = path.resolve(uploadsDir, path.basename(url))
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
        }
      })
    }
    res.status(204).send()
  })
)

router.get(
  "/categories",
  asyncHandler(async (_req, res) => {
    res.json(await getCategories())
  })
)

router.post(
  "/categories",
  asyncHandler(async (req, res) => {
    const body = z.object({ name: z.string().min(1) }).parse(req.body)
    const normalizedName = normalizeCategoryName(body.name)
    const categories = await getCategories()
    if (!normalizedName) {
      throw new HttpError(400, "Impossibile creare la categoria")
    }
    if (categories.includes(normalizedName)) {
      throw new HttpError(409, "Esiste già una categoria con questo nome")
    }
    const next = [...categories, normalizedName]
    await prisma.setting.update({
      where: { key: "shopCategories" },
      data: { value: JSON.stringify(next) },
    })
    res.status(201).json(next)
  })
)

router.put(
  "/categories/:name",
  asyncHandler(async (req, res) => {
    const body = z.object({ name: z.string().min(1) }).parse(req.body)
    const currentName = decodeURIComponent(req.params.name)
    const normalizedName = normalizeCategoryName(body.name)
    const categories = await getCategories()
    if (!categories.includes(currentName)) {
      throw new HttpError(404, "Categoria non trovata")
    }
    if (!normalizedName) {
      throw new HttpError(400, "Impossibile rinominare la categoria")
    }
    if (currentName !== normalizedName && categories.includes(normalizedName)) {
      throw new HttpError(409, "Esiste già una categoria con questo nome")
    }
    const next = categories.map((category) => (category === currentName ? normalizedName : category))
    await prisma.setting.update({
      where: { key: "shopCategories" },
      data: { value: JSON.stringify(next) },
    })
    await prisma.product.updateMany({
      where: { category: currentName },
      data: { category: normalizedName },
    })
    res.json(next)
  })
)

router.delete(
  "/categories/:name",
  asyncHandler(async (req, res) => {
    const categoryName = decodeURIComponent(req.params.name)
    const categories = await getCategories()
    if (!categories.includes(categoryName)) {
      throw new HttpError(404, "Categoria non trovata")
    }
    const productsCount = await prisma.product.count({ where: { category: categoryName } })
    if (productsCount > 0) {
      throw new HttpError(400, "Impossibile eliminare una categoria assegnata a prodotti esistenti")
    }
    const next = categories.filter((category) => category !== categoryName)
    await prisma.setting.update({
      where: { key: "shopCategories" },
      data: { value: JSON.stringify(next) },
    })
    res.json(next)
  })
)

router.get(
  "/reviews",
  asyncHandler(async (_req, res) => {
    const reviews = await prisma.review.findMany({
      where: { archivedAt: null },
      include: {
        user: {
          select: {
            email: true,
            username: true,
            firstName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    res.json(
      reviews.map((review) => ({
        id: review.publicId,
        rating: review.rating,
        title: review.title,
        body: review.body,
        tag: review.tag,
        status: review.status,
        showOnHomepage: review.showOnHomepage,
        createdAt: review.createdAt,
        authorName: review.user.username || review.user.firstName || review.user.email.split("@")[0],
      }))
    )
  })
)

router.patch(
  "/reviews/:id",
  asyncHandler(async (req, res) => {
    const body = reviewAdminSchema.parse(req.body)

    if (body.showOnHomepage) {
      const selectedCount = await prisma.review.count({
        where: { showOnHomepage: true, publicId: { not: req.params.id }, status: "approved", archivedAt: null },
      })

      if (selectedCount >= 10) {
        throw new HttpError(400, "Puoi mostrare in homepage al massimo 10 recensioni")
      }
    }

    const review = await prisma.review.update({
      where: { publicId: req.params.id },
      data: {
        showOnHomepage: body.showOnHomepage,
      },
      include: {
        user: {
          select: {
            email: true,
            username: true,
            firstName: true,
          },
        },
      },
    })

    res.json({
      id: review.publicId,
      rating: review.rating,
      title: review.title,
      body: review.body,
      tag: review.tag,
      status: review.status,
      showOnHomepage: review.showOnHomepage,
      createdAt: review.createdAt,
      authorName: review.user.username || review.user.firstName || review.user.email.split("@")[0],
    })
  })
)

router.delete(
  "/reviews/:id",
  asyncHandler(async (req, res) => {
    await prisma.review.update({
      where: { publicId: req.params.id },
      data: {
        archivedAt: new Date(),
        showOnHomepage: false,
      },
    })

    res.status(204).send()
  })
)

router.get(
  "/archive/reviews",
  asyncHandler(async (_req, res) => {
    const reviews = await prisma.review.findMany({
      where: { archivedAt: { not: null } },
      include: {
        user: {
          select: {
            email: true,
            username: true,
            firstName: true,
          },
        },
      },
      orderBy: { archivedAt: "desc" },
    })

    res.json(
      reviews.map((review) => ({
        id: review.publicId,
        rating: review.rating,
        title: review.title,
        body: review.body,
        tag: review.tag,
        status: review.status,
        showOnHomepage: review.showOnHomepage,
        createdAt: review.createdAt,
        authorName: review.user.username || review.user.firstName || review.user.email.split("@")[0],
      }))
    )
  })
)

router.post(
  "/archive/reviews/:id/restore",
  asyncHandler(async (req, res) => {
    const review = await prisma.review.update({
      where: { publicId: req.params.id },
      data: { archivedAt: null },
      include: {
        user: {
          select: {
            email: true,
            username: true,
            firstName: true,
          },
        },
      },
    })

    res.json({
      id: review.publicId,
      rating: review.rating,
      title: review.title,
      body: review.body,
      tag: review.tag,
      status: review.status,
      showOnHomepage: review.showOnHomepage,
      createdAt: review.createdAt,
      authorName: review.user.username || review.user.firstName || review.user.email.split("@")[0],
    })
  })
)

router.delete(
  "/archive/reviews/:id",
  asyncHandler(async (req, res) => {
    await prisma.review.delete({
      where: { publicId: req.params.id },
    })

    res.status(204).send()
  })
)

router.get(
  "/orders",
  asyncHandler(async (_req, res) => {
    const orders = await prisma.order.findMany({
      where: ACTIVE_CUSTOMER_ORDER_WHERE,
      include: { items: true, user: { select: { email: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: "desc" },
    })

    res.json(
      orders.map((order) => serializeShopOrder(order)),
    )
  })
)

router.get(
  "/orders/:id/profit",
  asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        user: {
          select: { role: true },
        },
        items: {
          include: {
            product: {
              select: { costPrice: true },
            },
          },
        },
      },
    })

    if (!order) {
      throw new HttpError(404, "Ordine non trovato")
    }

    if (order.user.role !== "customer") {
      throw new HttpError(404, "Ordine cliente non trovato")
    }

    res.json(buildOrderProfitSummary(order))
  })
)

router.get(
  "/settings",
  asyncHandler(async (_req, res) => {
    const settings = await prisma.setting.findMany({ orderBy: { key: "asc" } })
    res.json(settings)
  })
)

router.put(
  "/settings",
  asyncHandler(async (req, res) => {
    const body = settingsSchema.parse(req.body)

    for (const item of body) {
      await prisma.setting.upsert({
        where: { key: item.key },
        update: { value: item.value },
        create: item,
      })
    }

    const settings = await prisma.setting.findMany({ orderBy: { key: "asc" } })
    res.json(settings)
  })
)

router.patch(
  "/orders/:id",
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        status: z.enum(["pending", "paid", "shipped"]).optional(),
        fulfillmentStatus: z.enum(["processing", "accepted", "in_progress", "shipped", "completed"]).optional(),
        shippingStatus: z.enum(["pending", "accepted", "created", "in_transit", "out_for_delivery", "shipped", "delivered", "failed", "not_created"]).optional(),
        shippingHandoffMode: z.enum(["dropoff", "pickup"]).nullable().optional(),
        trackingNumber: z.string().trim().nullable().optional(),
        shipmentUrl: z.string().trim().nullable().optional(),
        trackingUrl: z.string().trim().nullable().optional(),
        labelUrl: z.string().trim().nullable().optional(),
      })
      .parse(req.body)
    const existingOrder = await prisma.order.findUnique({
      where: { id: Number(req.params.id) },
      include: { user: { select: { role: true } } },
    })

    if (!existingOrder) {
      throw new HttpError(404, "Ordine non trovato")
    }

    if (existingOrder.user.role !== "customer") {
      throw new HttpError(404, "Ordine cliente non trovato")
    }

    res.json(
      await prisma.order.update({
        where: { id: Number(req.params.id) },
        data: {
          ...(body.status ? { status: body.status } : {}),
          ...(body.fulfillmentStatus ? { fulfillmentStatus: body.fulfillmentStatus } : {}),
          ...(body.shippingStatus ? { shippingStatus: body.shippingStatus } : {}),
          shippingHandoffMode: body.shippingHandoffMode ? body.shippingHandoffMode : null,
          trackingNumber: body.trackingNumber ? body.trackingNumber : null,
          shipmentUrl: body.shipmentUrl ? body.shipmentUrl : null,
          trackingUrl: body.trackingUrl ? body.trackingUrl : null,
          labelUrl: body.labelUrl ? body.labelUrl : null,
        },
      })
    )
  })
)

router.delete(
  "/orders/:id",
  asyncHandler(async (req, res) => {
    const orderId = Number(req.params.id)
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: { select: { role: true } } },
    })

    if (!existingOrder) {
      throw new HttpError(404, "Ordine non trovato")
    }

    if (existingOrder.user.role !== "customer") {
      throw new HttpError(404, "Ordine cliente non trovato")
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { archivedAt: new Date() },
    })

    res.status(204).send()
  })
)

router.get(
  "/archive/orders",
  asyncHandler(async (_req, res) => {
    const orders = await prisma.order.findMany({
      where: ARCHIVED_CUSTOMER_ORDER_WHERE,
      include: { items: true, user: { select: { email: true, firstName: true, lastName: true } } },
      orderBy: { archivedAt: "desc" },
    })

    res.json(orders.map((order) => serializeShopOrder(order)))
  })
)

router.post(
  "/archive/orders/:id/restore",
  asyncHandler(async (req, res) => {
    const orderId = Number(req.params.id)
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: { select: { role: true } } },
    })

    if (!existingOrder) {
      throw new HttpError(404, "Ordine non trovato")
    }

    if (existingOrder.user.role !== "customer") {
      throw new HttpError(404, "Ordine cliente non trovato")
    }

    const restored = await prisma.order.update({
      where: { id: orderId },
      data: { archivedAt: null },
      include: { items: true },
    })

    res.json(serializeShopOrder(restored))
  })
)

router.delete(
  "/archive/orders/:id",
  asyncHandler(async (req, res) => {
    const orderId = Number(req.params.id)
    await prisma.$transaction([
      prisma.orderItem.deleteMany({ where: { orderId } }),
      prisma.order.delete({ where: { id: orderId } }),
    ])

    res.status(204).send()
  })
)

router.post(
  "/orders/:id/shipping/create",
  asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({
      where: { id: Number(req.params.id) },
      include: { items: true, user: { select: { role: true } } },
    })

    if (!order) {
      throw new HttpError(404, "Ordine non trovato")
    }

    if (order.user.role !== "customer") {
      throw new HttpError(404, "Ordine cliente non trovato")
    }

    res.json({
      ok: false,
      code: "manual_shipping_only",
      order: serializeShopOrder(order),
    })
  })
)

router.post(
  "/orders/:id/shipping/refresh",
  asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({
      where: { id: Number(req.params.id) },
      include: { items: true, user: { select: { role: true } } },
    })

    if (!order) {
      throw new HttpError(404, "Ordine non trovato")
    }

    if (order.user.role !== "customer") {
      throw new HttpError(404, "Ordine cliente non trovato")
    }

    res.json({
      ok: false,
      code: "manual_shipping_only",
      order: serializeShopOrder(order),
    })
  })
)

router.get(
  "/coupons",
  asyncHandler(async (_req, res) => {
    res.json(await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } }))
  })
)

router.post(
  "/coupons",
  asyncHandler(async (req, res) => {
    const body = couponSchema.parse(req.body)
    const code = normalizeCouponCode(body.code)
    const existing = await prisma.coupon.findUnique({ where: { code } })
    if (existing) {
      throw new HttpError(409, "Esiste già un coupon con questo codice")
    }
    res.status(201).json(
      await prisma.coupon.create({
        data: {
          ...body,
          code,
          expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        },
      })
    )
  })
)

router.put(
  "/coupons/:id",
  asyncHandler(async (req, res) => {
    const body = couponSchema.parse(req.body)
    const code = normalizeCouponCode(body.code)
    const existing = await prisma.coupon.findUnique({ where: { code } })
    if (existing && existing.id !== Number(req.params.id)) {
      throw new HttpError(409, "Esiste già un coupon con questo codice")
    }
    res.json(
      await prisma.coupon.update({
        where: { id: Number(req.params.id) },
        data: {
          ...body,
          code,
          expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        },
      })
    )
  })
)

router.delete(
  "/coupons/:id",
  asyncHandler(async (req, res) => {
    await prisma.coupon.delete({ where: { id: Number(req.params.id) } })
    res.status(204).send()
  })
)

router.get(
  "/discount-rules",
  asyncHandler(async (_req, res) => {
    res.json(await prisma.discountRule.findMany({ orderBy: [{ priority: "asc" }, { createdAt: "asc" }] }))
  })
)

router.post(
  "/discount-rules",
  asyncHandler(async (req, res) => {
    const body = ruleSchema.parse(req.body)
    res.status(201).json(
      await prisma.discountRule.create({
        data: {
          ...body,
          startsAt: body.startsAt ? new Date(body.startsAt) : null,
          endsAt: body.endsAt ? new Date(body.endsAt) : null,
        },
      })
    )
  })
)

router.put(
  "/discount-rules/:id",
  asyncHandler(async (req, res) => {
    const body = ruleSchema.parse(req.body)
    res.json(
      await prisma.discountRule.update({
        where: { id: Number(req.params.id) },
        data: {
          ...body,
          startsAt: body.startsAt ? new Date(body.startsAt) : null,
          endsAt: body.endsAt ? new Date(body.endsAt) : null,
        },
      })
    )
  })
)

router.delete(
  "/discount-rules/:id",
  asyncHandler(async (req, res) => {
    await prisma.discountRule.delete({ where: { id: Number(req.params.id) } })
    res.status(204).send()
  })
)

export default router
