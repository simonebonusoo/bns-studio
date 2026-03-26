import { Router } from "express"
import { z } from "zod"

import { asyncHandler } from "../lib/http.mjs"
import { prisma } from "../lib/prisma.mjs"
import { calculatePricing } from "../services/pricing.mjs"
import { getAvailableProductFormats, getBaseProductPrice, getDefaultProductFormat } from "../lib/product-formats.mjs"

const router = Router()
const FALLBACK_CONTACT_EMAIL = "bnsstudio@gmail.com"

function serializePublicProduct(product) {
  const { imageUrls, costPrice: _costPrice, ...rest } = product
  return {
    ...rest,
    price: getBaseProductPrice(product),
    priceA3: product.priceA3,
    priceA4: product.priceA4 ?? product.price,
    defaultFormat: getDefaultProductFormat(product),
    availableFormats: getAvailableProductFormats(product),
    imageUrls: JSON.parse(imageUrls),
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
    const search = String(req.query.search || "")
    const category = String(req.query.category || "")
    const maxPrice = Number(req.query.maxPrice || 0)

    const products = await prisma.product.findMany({
      where: {
        title: search ? { contains: search } : undefined,
        category: category || undefined,
        price: maxPrice ? { lte: maxPrice } : undefined,
      },
      orderBy: { createdAt: "desc" },
    })

    res.json(products.map(serializePublicProduct))
  })
)

router.get(
  "/products/featured",
  asyncHandler(async (_req, res) => {
    const products = await prisma.product.findMany({
      where: { featured: true },
      orderBy: { createdAt: "desc" },
      take: 3,
    })

    res.json(products.map(serializePublicProduct))
  })
)

router.get(
  "/products/:slug",
  asyncHandler(async (req, res) => {
    const product = await prisma.product.findUnique({ where: { slug: req.params.slug } })

    if (!product) {
      return res.status(404).json({ message: "Prodotto non trovato" })
    }

    res.json(serializePublicProduct(product))
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
          })
        ),
        couponCode: z.string().optional().nullable(),
      })
      .parse(req.body)

    res.json(await calculatePricing(body.items, body.couponCode))
  })
)

export default router
