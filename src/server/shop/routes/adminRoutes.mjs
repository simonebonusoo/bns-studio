import { Router } from "express"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import multer from "multer"
import { z } from "zod"

import { env } from "../config/env.mjs"
import { asyncHandler, HttpError } from "../lib/http.mjs"
import { prisma } from "../lib/prisma.mjs"
import { requireAdmin, requireAuth } from "../middleware/auth.mjs"
import { getAvailableProductFormats, getBaseProductPrice, getProductCostForFormat, getProductPriceForFormat, normalizeProductFormat } from "../lib/product-formats.mjs"

const router = Router()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const uploadsRootDir = env.uploadsDir
  ? path.resolve(env.uploadsDir)
  : path.resolve(__dirname, "../../uploads")
const uploadsDir = path.join(uploadsRootDir, "products")

fs.mkdirSync(uploadsDir, { recursive: true })
const CUSTOMER_ORDER_WHERE = { user: { role: "customer" } }

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    const safeBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, "-").toLowerCase()
    cb(null, `${Date.now()}-${safeBase}${ext}`)
  },
})

const upload = multer({
  storage,
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
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 80)
}

function serializeAdminProduct(product) {
  return {
    ...product,
    price: getBaseProductPrice(product),
    availableFormats: getAvailableProductFormats(product),
    imageUrls: JSON.parse(product.imageUrls),
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
  const grossTotal = order.total
  const netTotal = grossTotal - productCostsTotal

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
    netTotal,
    shippingCostsTracked: false,
    items,
  }
}

function averageFromTotals(total, count) {
  if (!count) return 0
  return Math.round(total / count)
}

function buildAnalyticsSnapshot({ orders, pageViews }) {
  const completedOrders = orders.filter((order) => order.status === "paid" || order.status === "shipped")
  const profitRows = completedOrders.map(buildOrderProfitSummary)
  const totalRevenue = profitRows.reduce((sum, row) => sum + row.grossTotal, 0)
  const totalExpenses = profitRows.reduce((sum, row) => sum + row.productCostsTotal, 0)
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
    shippingCostsTracked: false,
  }
}

async function ensureUniqueProductSlug(baseValue, excludeId) {
  const base = slugifyProductTitle(baseValue) || `product-${Date.now()}`

  for (let suffix = 0; suffix < 1000; suffix += 1) {
    const candidate =
      suffix === 0 ? base : `${base.slice(0, Math.max(1, 80 - String(suffix).length - 1))}-${suffix}`
    const existing = await prisma.product.findUnique({ where: { slug: candidate } })
    if (!existing || existing.id === excludeId) {
      return candidate
    }
  }

  throw new HttpError(500, "Impossibile generare uno slug univoco")
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

async function getCategories() {
  const setting = await ensureCategoriesSetting()
  return parseCategories(setting.value)
}

function resolveProductPayload(body, fallbackPrice = 0) {
  const hasA3 = Boolean(body.hasA3)
  const hasA4 = body.hasA4 ?? true

  if (!hasA3 && !hasA4) {
    throw new HttpError(400, "Seleziona almeno un formato disponibile")
  }

  if (hasA3 && (body.priceA3 === null || body.priceA3 === undefined)) {
    throw new HttpError(400, "Inserisci il prezzo A3")
  }

  if (hasA4 && (body.priceA4 === null || body.priceA4 === undefined)) {
    throw new HttpError(400, "Inserisci il prezzo A4")
  }

  const prices = [
    hasA4 ? body.priceA4 : null,
    hasA3 ? body.priceA3 : null,
    fallbackPrice || null,
  ].filter((value) => typeof value === "number")

  const price = prices.length ? Math.min(...prices) : 0

  return {
    ...body,
    hasA3,
    hasA4,
    priceA3: hasA3 ? body.priceA3 : null,
    priceA4: hasA4 ? body.priceA4 : null,
    price,
  }
}

const productSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1).optional(),
  description: z.string().min(1),
  price: z.number().min(0).optional(),
  costPrice: z.number().min(0).default(0),
  hasA3: z.boolean().default(false),
  hasA4: z.boolean().default(true),
  priceA3: z.number().min(0).optional().nullable(),
  priceA4: z.number().min(0).optional().nullable(),
  category: z.string().min(1),
  imageUrls: z.array(z.string().min(1)).min(1),
  featured: z.boolean().default(false),
  stock: z.number().int().min(0).default(0),
})

const reviewAdminSchema = z.object({
  showOnHomepage: z.boolean(),
})

const couponSchema = z.object({
  code: z.string().min(2),
  type: z.enum(["percentage", "fixed"]),
  amount: z.number().min(1),
  expiresAt: z.string().optional().nullable(),
  usageLimit: z.number().int().min(1).optional().nullable(),
  active: z.boolean(),
})

const ruleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  ruleType: z.enum(["quantity_percentage", "free_shipping_quantity", "subtotal_fixed"]),
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
    res.status(201).json({
      files: files.map((file) => ({
        name: file.originalname,
        url: `/uploads/products/${file.filename}`,
      })),
    })
  })
)

router.get(
  "/dashboard",
  asyncHandler(async (_req, res) => {
    const orders = await prisma.order.findMany({
      where: CUSTOMER_ORDER_WHERE,
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

router.get(
  "/analytics",
  asyncHandler(async (_req, res) => {
    const [orders, pageViews] = await Promise.all([
      prisma.order.findMany({
        where: CUSTOMER_ORDER_WHERE,
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
    const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } })
    res.json(products.map(serializeAdminProduct))
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
    const product = await prisma.product.create({
      data: { ...payload, slug, imageUrls: JSON.stringify(body.imageUrls) },
    })
    res.status(201).json(serializeAdminProduct({ ...product, imageUrls: JSON.stringify(body.imageUrls) }))
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
    const payload = resolveProductPayload(body, existingProduct.price)
    const slug = body.slug
      ? await ensureUniqueProductSlug(body.slug, productId)
      : existingProduct.slug
    const product = await prisma.product.update({
      where: { id: productId },
      data: { ...payload, slug, imageUrls: JSON.stringify(body.imageUrls) },
    })
    res.json(serializeAdminProduct({ ...product, imageUrls: JSON.stringify(body.imageUrls) }))
  })
)

router.delete(
  "/products/:id",
  asyncHandler(async (req, res) => {
    const product = await prisma.product.findUnique({ where: { id: Number(req.params.id) } })
    await prisma.product.delete({ where: { id: Number(req.params.id) } })
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
        where: { showOnHomepage: true, publicId: { not: req.params.id }, status: "approved" },
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

router.get(
  "/orders",
  asyncHandler(async (_req, res) => {
    const orders = await prisma.order.findMany({
      where: CUSTOMER_ORDER_WHERE,
      include: { items: true, user: { select: { email: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: "desc" },
    })

    res.json(orders.map((order) => ({ ...order, pricingBreakdown: JSON.parse(order.pricingBreakdown) })))
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
    const body = z.object({ status: z.enum(["pending", "paid", "shipped"]) }).parse(req.body)
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
        data: { status: body.status },
      })
    )
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
