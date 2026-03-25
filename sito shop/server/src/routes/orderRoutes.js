import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler, HttpError } from "../lib/http.js";
import { requireAuth } from "../middleware/auth.js";
import { calculatePricing } from "../services/pricing.js";
import { buildPaypalRedirect } from "../services/paypal.js";

function createOrderReference(orderId) {
  const stamp = Date.now().toString(36).toUpperCase();
  return `BNS-${stamp}-${orderId}`;
}

const router = Router();

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
      quantity: z.number().min(1)
    })
  )
});

router.get(
  "/my-orders",
  requireAuth,
  asyncHandler(async (req, res) => {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: { items: true },
      orderBy: { createdAt: "desc" }
    });
    res.json(orders.map((order) => ({ ...order, pricingBreakdown: JSON.parse(order.pricingBreakdown) })));
  })
);

router.post(
  "/checkout",
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = checkoutSchema.parse(req.body);
    if (body.email !== req.user.email) {
      throw new HttpError(400, "L'email del checkout deve corrispondere all'utente autenticato");
    }

    const pricing = await calculatePricing(body.items, body.couponCode);

    const order = await prisma.order.create({
      data: {
        orderReference: `draft-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
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
            quantity: item.quantity,
            lineTotal: item.lineTotal
          }))
        }
      },
      include: { items: true }
    });

    const orderReference = createOrderReference(order.id);
    const finalizedOrder = await prisma.order.update({
      where: { id: order.id },
      data: { orderReference },
      include: { items: true }
    });

    if (pricing.appliedCoupon) {
      await prisma.coupon.update({
        where: { code: pricing.appliedCoupon },
        data: { usageCount: { increment: 1 } }
      });
    }

    const paypal = await buildPaypalRedirect({
      orderReference,
      total: pricing.total
    });

    res.status(201).json({
      order: {
        ...finalizedOrder,
        pricingBreakdown: JSON.parse(finalizedOrder.pricingBreakdown)
      },
      payment: {
        ...paypal,
        orderReference,
        amount: pricing.total,
        subtotal: pricing.subtotal,
        discountTotal: pricing.discountTotal,
        shippingTotal: pricing.shippingTotal
      }
    });
  })
);

router.post(
  "/:id/status",
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = z.object({ status: z.enum(["pending", "paid", "shipped"]) }).parse(req.body);
    const order = await prisma.order.findUnique({ where: { id: Number(req.params.id) } });
    if (!order) {
      throw new HttpError(404, "Ordine non trovato");
    }
    if (req.user.role !== "admin" && order.userId !== req.user.id) {
      throw new HttpError(403, "Operazione non consentita");
    }
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status: body.status }
    });
    res.json(updated);
  })
);

export default router;
