import { Router } from "express"
import { z } from "zod"

import { asyncHandler, HttpError } from "../lib/http.mjs"
import { env } from "../config/env.mjs"
import { prisma } from "../lib/prisma.mjs"
import { requireAuth } from "../middleware/auth.mjs"
import { calculatePricing } from "../services/pricing.mjs"
import { buildPaypalRedirect } from "../services/paypal.mjs"

const router = Router()

function createOrderReference(orderId) {
  const stamp = Date.now().toString(36).toUpperCase()
  return `BNS-${stamp}-${orderId}`
}

const checkoutSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional().nullable(),
  city: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().min(1),
  couponCode: z.string().optional().nullable(),
  items: z.array(
    z.object({
      productId: z.number(),
      quantity: z.number().int().min(1),
    })
  ),
})

router.get(
  "/my-orders",
  requireAuth,
  asyncHandler(async (req, res) => {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    })

    res.json(orders.map((order) => ({ ...order, pricingBreakdown: JSON.parse(order.pricingBreakdown) })))
  })
)

router.get(
  "/receipt/:orderReference",
  requireAuth,
  asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({
      where: { orderReference: req.params.orderReference },
      include: { items: true },
    })

    if (!order) {
      throw new HttpError(404, "Ordine non trovato")
    }

    if (req.user.role !== "admin" && order.userId !== req.user.id) {
      throw new HttpError(403, "Operazione non consentita")
    }

    res.json({ ...order, pricingBreakdown: JSON.parse(order.pricingBreakdown) })
  })
)

router.get(
  "/payment/:orderReference",
  requireAuth,
  asyncHandler(async (req, res) => {
    console.log(`[shop] GET /api/orders/payment/${req.params.orderReference}`)

    const order = await prisma.order.findUnique({
      where: { orderReference: req.params.orderReference },
    })

    if (!order) {
      throw new HttpError(404, "Ordine non trovato")
    }

    if (req.user.role !== "admin" && order.userId !== req.user.id) {
      throw new HttpError(403, "Operazione non consentita")
    }

    console.log(`[shop] ordine trovato: ${order.orderReference} totale=${order.total} stato=${order.status}`)
    console.log(
      `[shop] totali ordine: subtotal=${order.subtotal} shipping=${order.shippingTotal} discount=${order.discountTotal} total=${order.total}`
    )

    let payment
    try {
      payment = await buildPaypalRedirect({
        orderReference: order.orderReference,
        total: order.total,
        clientUrl: env.clientUrl,
      })
    } catch (error) {
      console.error("[shop] errore generazione link paypal:", error?.message || error)
      throw error
    }

    console.log(`[shop] paypal url generato: ${payment.redirectUrl}`)

    res.json({
      orderReference: order.orderReference,
      status: order.status,
      total: order.total,
      url: payment.redirectUrl,
      payment: {
        ...payment,
        orderReference: order.orderReference,
        amount: order.total,
        subtotal: order.subtotal,
        discountTotal: order.discountTotal,
        shippingTotal: order.shippingTotal,
      },
    })
  })
)

router.post(
  "/payment-complete/:orderReference",
  requireAuth,
  asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({
      where: { orderReference: req.params.orderReference },
      include: { items: true },
    })

    if (!order) {
      throw new HttpError(404, "Ordine non trovato")
    }

    if (req.user.role !== "admin" && order.userId !== req.user.id) {
      throw new HttpError(403, "Operazione non consentita")
    }

    const updated =
      order.status === "paid" || order.status === "shipped"
        ? order
        : await prisma.order.update({
            where: { id: order.id },
            data: { status: "paid" },
            include: { items: true },
          })

    res.json({
      order: {
        ...updated,
        pricingBreakdown: JSON.parse(updated.pricingBreakdown),
      },
    })
  })
)

router.post(
  "/checkout",
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = checkoutSchema.parse(req.body)

    if (body.email !== req.user.email) {
      throw new HttpError(400, "L'email del checkout deve corrispondere all'utente autenticato")
    }

    const pricing = await calculatePricing(body.items, body.couponCode)

    const order = await prisma.order.create({
      data: {
        orderReference: `draft-${Date.now()}`,
        userId: req.user.id,
        email: body.email,
        firstName: body.firstName,
        lastName: body.lastName,
        addressLine1: body.addressLine1,
        addressLine2: body.addressLine2,
        city: body.city,
        postalCode: body.postalCode,
        country: body.country,
        status: "pending",
        subtotal: pricing.subtotal,
        discountTotal: pricing.discountTotal,
        shippingTotal: pricing.shippingTotal,
        total: pricing.total,
        couponCode: pricing.appliedCoupon,
        pricingBreakdown: JSON.stringify(pricing),
        items: {
          create: pricing.items.map((item) => ({
            productId: item.productId,
            title: item.title,
            imageUrl: item.imageUrl,
            unitPrice: item.unitPrice,
            unitCost: item.unitCost || 0,
            quantity: item.quantity,
            lineTotal: item.lineTotal,
            costTotal: item.costTotal || 0,
          })),
        },
      },
      include: { items: true },
    })

    const finalized = await prisma.order.update({
      where: { id: order.id },
      data: { orderReference: createOrderReference(order.id) },
      include: { items: true },
    })

    for (const item of pricing.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      })
    }

    if (pricing.appliedCoupon) {
      await prisma.coupon.update({
        where: { code: pricing.appliedCoupon },
        data: { usageCount: { increment: 1 } },
      })
    }

    let payment = null
    let paymentError = null

    try {
      payment = await buildPaypalRedirect({
        orderReference: finalized.orderReference,
        total: finalized.total,
        clientUrl: env.clientUrl,
      })
      payment = {
        ...payment,
        orderReference: finalized.orderReference,
        amount: finalized.total,
        subtotal: finalized.subtotal,
        discountTotal: finalized.discountTotal,
        shippingTotal: finalized.shippingTotal,
      }
    } catch (error) {
      paymentError = error?.message || "Impossibile generare il link PayPal"
      console.error("[shop] errore generazione link paypal durante checkout:", paymentError)
    }

    res.status(201).json({
      order: {
        ...finalized,
        pricingBreakdown: JSON.parse(finalized.pricingBreakdown),
      },
      payment,
      paymentError,
    })
  })
)

router.patch(
  "/:id/status",
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = z.object({ status: z.enum(["pending", "paid", "shipped"]) }).parse(req.body)
    const order = await prisma.order.findUnique({ where: { id: Number(req.params.id) } })

    if (!order) {
      throw new HttpError(404, "Ordine non trovato")
    }

    if (req.user.role !== "admin" && order.userId !== req.user.id) {
      throw new HttpError(403, "Operazione non consentita")
    }

    res.json(
      await prisma.order.update({
        where: { id: order.id },
        data: { status: body.status },
      })
    )
  })
)

export default router
