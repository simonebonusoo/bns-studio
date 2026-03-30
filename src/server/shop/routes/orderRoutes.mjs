import { Router } from "express"
import { z } from "zod"

import { asyncHandler, HttpError } from "../lib/http.mjs"
import { env } from "../config/env.mjs"
import { createCheckoutReference, parseCheckoutSessionItems, serializeCheckoutSessionAsPendingOrder } from "../lib/checkout-sessions.mjs"
import { prisma } from "../lib/prisma.mjs"
import { requireAuth } from "../middleware/auth.mjs"
import { calculatePricing } from "../services/pricing.mjs"
import { buildPaypalRedirect } from "../services/paypal.mjs"
import { notifyAdminOrderCompleted } from "../services/order-notifications.mjs"
import { syncProductVariants } from "../lib/product-variants.mjs"
import { normalizeShippingDetails } from "../../../shop/lib/shipping-details.mjs"
import { serializeShopOrder } from "../lib/order-serialization.mjs"
import { normalizeShippingMethodSelection } from "../services/shipping-rates.mjs"
import { maybeCreateShipmentForPaidOrder } from "../shipping/index.mjs"

const router = Router()
const ADMIN_CHECKOUT_BLOCK_MESSAGE = "Gli account admin non possono effettuare ordini cliente."

async function applyOrderCompletionSideEffects(db, order) {
  if (order.status === "paid" || order.status === "shipped") {
    return
  }

  const pricingBreakdown =
    typeof order.pricingBreakdown === "string"
      ? JSON.parse(order.pricingBreakdown)
      : order.pricingBreakdown

  for (const item of order.items) {
    if (item.variantId) {
      await db.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { decrement: item.quantity } },
      })

      const productWithVariants = await db.product.findUnique({
        where: { id: item.productId },
        include: {
          variants: {
            orderBy: [{ position: "asc" }, { id: "asc" }],
          },
        },
      })

      if (productWithVariants) {
        await syncProductVariants(db, productWithVariants.id, productWithVariants.variants)
      }
      continue
    }

    await db.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } },
    })
  }

  if (pricingBreakdown?.appliedCoupon) {
    await db.coupon.update({
      where: { code: pricingBreakdown.appliedCoupon },
      data: { usageCount: { increment: 1 } },
    })
  }
}

function buildOrderRecordFromCheckoutSession(session) {
  const items = parseCheckoutSessionItems(session)

  return {
    ...normalizeShippingDetails(session),
    orderReference: session.orderReference,
    userId: session.userId,
    status: "paid",
    fulfillmentStatus: "processing",
    shippingMethod: session.shippingMethod || null,
    shippingCarrier: session.shippingCarrier || null,
    shippingLabel: session.shippingLabel || null,
    shippingHandoffMode: session.shippingHandoffMode || null,
    shippingStatus: "pending",
    subtotal: session.subtotal,
    discountTotal: session.discountTotal,
    shippingCost: typeof session.shippingCost === "number" ? session.shippingCost : null,
    shippingTotal: session.shippingTotal,
    total: session.total,
    couponCode: session.couponCode,
    shipmentReference: session.shipmentReference || null,
    trackingNumber: session.trackingNumber || null,
    trackingUrl: null,
    shippingProviderPayload: session.shippingProviderPayload || null,
    pricingBreakdown: session.pricingBreakdown,
    items: {
      create: items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId || null,
        title: item.title,
        imageUrl: item.imageUrl,
        format: item.format || null,
        variantLabel: item.variantLabel || null,
        variantSku: item.variantSku || null,
        unitPrice: item.unitPrice,
        unitCost: item.unitCost || 0,
        quantity: item.quantity,
        lineTotal: item.lineTotal,
        costTotal: item.costTotal || 0,
      })),
    },
  }
}

const checkoutSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().trim().min(5),
  region: z.string().trim().min(1),
  addressLine1: z.string().min(1),
  streetNumber: z.string().trim().min(1),
  addressLine2: z.string().optional().nullable(),
  staircase: z.string().trim().optional().nullable(),
  apartment: z.string().trim().optional().nullable(),
  floor: z.string().trim().optional().nullable(),
  intercom: z.string().trim().optional().nullable(),
  deliveryNotes: z.string().trim().optional().nullable(),
  city: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().min(1),
  couponCode: z.string().optional().nullable(),
  shippingMethod: z.enum(["economy", "premium"]).optional().nullable(),
  items: z.array(
    z.object({
      productId: z.number(),
      quantity: z.number().int().min(1),
      format: z.string().optional(),
      variantId: z.number().int().positive().optional().nullable(),
    })
  ),
})

router.get(
  "/my-orders",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (req.user.role !== "customer") {
      res.json([])
      return
    }

    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    })

    res.json(
      orders.map((order) => serializeShopOrder(order)),
    )
  })
)

router.get(
  "/receipt/:orderReference",
  requireAuth,
  asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({
      where: { orderReference: req.params.orderReference },
      include: { items: true, user: { select: { role: true } } },
    })

    if (order) {
      if (order.user.role !== "customer") {
        throw new HttpError(404, "Ordine cliente non trovato")
      }

      if (req.user.role !== "admin" && order.userId !== req.user.id) {
        throw new HttpError(403, "Operazione non consentita")
      }

      res.json(serializeShopOrder(order))
      return
    }

    const checkoutSession = await prisma.checkoutSession.findUnique({
      where: { orderReference: req.params.orderReference },
    })

    if (!checkoutSession) {
      throw new HttpError(404, "Ordine non trovato")
    }

    if (req.user.role !== "admin" && checkoutSession.userId !== req.user.id) {
      throw new HttpError(403, "Operazione non consentita")
    }

    res.json(serializeCheckoutSessionAsPendingOrder(checkoutSession))
  })
)

router.get(
  "/payment/:orderReference",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (req.user.role !== "customer") {
      throw new HttpError(403, ADMIN_CHECKOUT_BLOCK_MESSAGE)
    }

    console.log(`[shop] GET /api/orders/payment/${req.params.orderReference}`)

    const order = await prisma.order.findUnique({
      where: { orderReference: req.params.orderReference },
      include: { user: { select: { role: true } } },
    })

    const checkoutSession =
      order
        ? null
        : await prisma.checkoutSession.findUnique({
            where: { orderReference: req.params.orderReference },
          })

    if (!order && !checkoutSession) {
      throw new HttpError(404, "Ordine non trovato")
    }

    if (order) {
      if (order.user.role !== "customer") {
        throw new HttpError(404, "Ordine cliente non trovato")
      }

      if (order.userId !== req.user.id) {
        throw new HttpError(403, "Operazione non consentita")
      }
      if (order.status === "paid" || order.status === "shipped") {
        throw new HttpError(400, "Pagamento già completato per questo ordine")
      }
    } else if (checkoutSession.userId !== req.user.id) {
      throw new HttpError(403, "Operazione non consentita")
    } else if (checkoutSession.status !== "pending") {
      throw new HttpError(400, "Pagamento già completato per questo checkout")
    }

    const paymentTarget = order || checkoutSession

    console.log(`[shop] ordine trovato: ${paymentTarget.orderReference} totale=${paymentTarget.total} stato=${paymentTarget.status}`)
    console.log(
      `[shop] totali ordine: subtotal=${paymentTarget.subtotal} shipping=${paymentTarget.shippingTotal} discount=${paymentTarget.discountTotal} total=${paymentTarget.total}`
    )

    let payment
    try {
      payment = await buildPaypalRedirect({
        orderReference: paymentTarget.orderReference,
        total: paymentTarget.total,
        clientUrl: env.clientUrl,
      })
    } catch (error) {
      console.error("[shop] errore generazione link paypal:", error?.message || error)
      throw error
    }

    console.log(`[shop] paypal url generato: ${payment.redirectUrl}`)

    res.json({
      orderReference: paymentTarget.orderReference,
      status: paymentTarget.status,
      total: paymentTarget.total,
      url: payment.redirectUrl,
      payment: {
        ...payment,
        orderReference: paymentTarget.orderReference,
        amount: paymentTarget.total,
        subtotal: paymentTarget.subtotal,
        discountTotal: paymentTarget.discountTotal,
        shippingTotal: paymentTarget.shippingTotal,
      },
    })
  })
)

router.post(
  "/payment-complete/:orderReference",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (req.user.role !== "customer") {
      throw new HttpError(403, ADMIN_CHECKOUT_BLOCK_MESSAGE)
    }

    const order = await prisma.order.findUnique({
      where: { orderReference: req.params.orderReference },
      include: { items: true, user: { select: { role: true } } },
    })

    if (order) {
      if (order.user.role !== "customer") {
        throw new HttpError(404, "Ordine cliente non trovato")
      }

      if (order.userId !== req.user.id) {
        throw new HttpError(403, "Operazione non consentita")
      }

      const wasAlreadyCompleted = order.status === "paid" || order.status === "shipped"
      const updated =
        order.status === "paid" || order.status === "shipped"
          ? order
          : await prisma.$transaction(async (tx) => {
              await applyOrderCompletionSideEffects(tx, order)
              return tx.order.update({
                where: { id: order.id },
                data: { status: "paid" },
                include: { items: true },
              })
            })

      if (!wasAlreadyCompleted) {
        await notifyAdminOrderCompleted({ order: updated, user: req.user })
      }

      const shipmentResult = await maybeCreateShipmentForPaidOrder({ db: prisma, order: updated })
      const hydratedOrder = shipmentResult.order || updated

      res.json({
        order: serializeShopOrder(hydratedOrder),
      })
      return
    }

    const checkoutSession = await prisma.checkoutSession.findUnique({
      where: { orderReference: req.params.orderReference },
    })

    if (!checkoutSession) {
      throw new HttpError(404, "Ordine non trovato")
    }

    if (checkoutSession.userId !== req.user.id) {
      throw new HttpError(403, "Operazione non consentita")
    }

    const createdOrder = await prisma.$transaction(async (tx) => {
      const existingOrder = await tx.order.findUnique({
        where: { orderReference: checkoutSession.orderReference },
        include: { items: true },
      })
      if (existingOrder) {
        return existingOrder
      }

      const orderRecord = await tx.order.create({
        data: buildOrderRecordFromCheckoutSession(checkoutSession),
        include: { items: true },
      })

      await applyOrderCompletionSideEffects(tx, orderRecord)

      await tx.checkoutSession.update({
        where: { id: checkoutSession.id },
        data: {
          status: "completed",
          completedAt: new Date(),
        },
      })

      return orderRecord
    })

    await notifyAdminOrderCompleted({ order: createdOrder, user: req.user })

    const shipmentResult = await maybeCreateShipmentForPaidOrder({ db: prisma, order: createdOrder })
    const hydratedOrder = shipmentResult.order || createdOrder

    res.json({
      order: serializeShopOrder(hydratedOrder),
    })
  })
)

router.post(
  "/checkout",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (req.user.role !== "customer") {
      throw new HttpError(403, ADMIN_CHECKOUT_BLOCK_MESSAGE)
    }

    const body = checkoutSchema.parse(req.body)
    const shipping = normalizeShippingDetails(body)
    const shippingMethod = normalizeShippingMethodSelection(body.shippingMethod)

    if (!shippingMethod) {
      throw new HttpError(400, "Seleziona un metodo di spedizione prima di proseguire.")
    }

    if (shipping.email !== req.user.email) {
      throw new HttpError(400, "L'email del checkout deve corrispondere all'utente autenticato")
    }

    const pricing = await calculatePricing(body.items, body.couponCode, { shippingMethod })

    const orderReference = createCheckoutReference()

    const checkoutSession = await prisma.checkoutSession.create({
      data: {
        orderReference,
        userId: req.user.id,
        ...shipping,
        shippingMethod: pricing.shippingMethod,
        shippingCarrier: pricing.shippingCarrier,
        shippingLabel: pricing.shippingLabel,
        shippingHandoffMode: pricing.shippingCarrier === "inpost" ? "dropoff" : pricing.shippingCarrier === "dhl" ? "pickup" : null,
        status: "pending",
        subtotal: pricing.subtotal,
        discountTotal: pricing.discountTotal,
        shippingCost: pricing.shippingCost,
        shippingTotal: pricing.shippingTotal,
        total: pricing.total,
        couponCode: pricing.appliedCoupon,
        shipmentReference: null,
        trackingNumber: null,
        shippingProviderPayload: null,
        pricingBreakdown: JSON.stringify(pricing),
        itemsSnapshot: JSON.stringify(pricing.items),
      },
    })

    let payment = null
    let paymentError = null

    try {
      payment = await buildPaypalRedirect({
        orderReference: checkoutSession.orderReference,
        total: checkoutSession.total,
        clientUrl: env.clientUrl,
      })
      payment = {
        ...payment,
        orderReference: checkoutSession.orderReference,
        amount: checkoutSession.total,
        subtotal: checkoutSession.subtotal,
        discountTotal: checkoutSession.discountTotal,
        shippingTotal: checkoutSession.shippingTotal,
      }
    } catch (error) {
      paymentError = error?.message || "Impossibile generare il link PayPal"
      console.error("[shop] errore generazione link paypal durante checkout:", paymentError)
    }

    res.status(201).json({
      order: serializeCheckoutSessionAsPendingOrder(checkoutSession),
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

    if (req.user.role !== "admin") {
      throw new HttpError(403, "Operazione non consentita")
    }

    if (body.status === "paid" || body.status === "shipped") {
      await applyOrderCompletionSideEffects(prisma, {
        ...order,
        pricingBreakdown: order.pricingBreakdown,
        items: await prisma.orderItem.findMany({ where: { orderId: order.id } }),
      })
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
