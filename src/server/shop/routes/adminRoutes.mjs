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

const router = Router()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const uploadsRootDir = env.uploadsDir
  ? path.resolve(env.uploadsDir)
  : path.resolve(__dirname, "../../uploads")
const uploadsDir = path.join(uploadsRootDir, "products")

fs.mkdirSync(uploadsDir, { recursive: true })

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

const productSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().min(1),
  price: z.number().min(0),
  category: z.string().min(1),
  imageUrls: z.array(z.string().min(1)).min(1),
  featured: z.boolean().default(false),
  stock: z.number().int().min(0).default(0),
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
    const orders = await prisma.order.findMany({ include: { items: true }, orderBy: { createdAt: "desc" } })
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
  "/products",
  asyncHandler(async (_req, res) => {
    const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } })
    res.json(products.map((product) => ({ ...product, imageUrls: JSON.parse(product.imageUrls) })))
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
    const product = await prisma.product.create({
      data: { ...body, imageUrls: JSON.stringify(body.imageUrls) },
    })
    res.status(201).json({ ...product, imageUrls: body.imageUrls })
  })
)

router.put(
  "/products/:id",
  asyncHandler(async (req, res) => {
    const body = productSchema.parse(req.body)
    const categories = await getCategories()
    if (!categories.includes(body.category)) {
      throw new HttpError(400, "Categoria non valida")
    }
    const product = await prisma.product.update({
      where: { id: Number(req.params.id) },
      data: { ...body, imageUrls: JSON.stringify(body.imageUrls) },
    })
    res.json({ ...product, imageUrls: body.imageUrls })
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
  "/orders",
  asyncHandler(async (_req, res) => {
    const orders = await prisma.order.findMany({
      include: { items: true, user: { select: { email: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: "desc" },
    })

    res.json(orders.map((order) => ({ ...order, pricingBreakdown: JSON.parse(order.pricingBreakdown) })))
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
