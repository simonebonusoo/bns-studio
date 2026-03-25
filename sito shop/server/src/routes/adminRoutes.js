import { Router } from "express";
import fs from "fs";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler, HttpError } from "../lib/http.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, "../../uploads/products");

fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, "-").toLowerCase();
    cb(null, `${Date.now()}-${safeBase}${ext}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new HttpError(400, "Sono consentite solo immagini"));
      return;
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

router.use(requireAuth, requireAdmin);

router.post(
  "/uploads",
  upload.array("images", 8),
  asyncHandler(async (req, res) => {
    const files = req.files || [];
    res.status(201).json({
      files: files.map((file) => ({
        name: file.originalname,
        url: `/uploads/products/${file.filename}`
      }))
    });
  })
);

router.get(
  "/dashboard",
  asyncHandler(async (_req, res) => {
    const orders = await prisma.order.findMany({ include: { items: true }, orderBy: { createdAt: "desc" } });
    const paidOrders = orders.filter((order) => order.status === "paid" || order.status === "shipped");
    const revenue = paidOrders.reduce((sum, order) => sum + order.total, 0);
    const soldMap = new Map();

    for (const order of orders) {
      for (const item of order.items) {
        soldMap.set(item.title, (soldMap.get(item.title) || 0) + item.quantity);
      }
    }

    const topProducts = [...soldMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([title, quantity]) => ({ title, quantity }));

    res.json({
      revenue,
      orderCount: orders.length,
      topProducts,
      recentOrders: orders.slice(0, 5)
    });
  })
);

router.get(
  "/products",
  asyncHandler(async (_req, res) => {
    const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });
    res.json(products.map((product) => ({ ...product, imageUrls: JSON.parse(product.imageUrls) })));
  })
);

const productSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().min(1),
  price: z.number().min(0),
  category: z.string().min(1),
  imageUrls: z.array(z.string().min(1)).min(1),
  featured: z.boolean().default(false),
  stock: z.number().int().min(0).default(0)
});

router.post(
  "/products",
  asyncHandler(async (req, res) => {
    const body = productSchema.parse(req.body);
    const created = await prisma.product.create({
      data: {
        ...body,
        imageUrls: JSON.stringify(body.imageUrls)
      }
    });
    res.status(201).json({ ...created, imageUrls: body.imageUrls });
  })
);

router.put(
  "/products/:id",
  asyncHandler(async (req, res) => {
    const body = productSchema.parse(req.body);
    const updated = await prisma.product.update({
      where: { id: Number(req.params.id) },
      data: {
        ...body,
        imageUrls: JSON.stringify(body.imageUrls)
      }
    });
    res.json({ ...updated, imageUrls: body.imageUrls });
  })
);

router.delete(
  "/products/:id",
  asyncHandler(async (req, res) => {
    await prisma.product.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  })
);

router.get(
  "/orders",
  asyncHandler(async (_req, res) => {
    const orders = await prisma.order.findMany({
      include: { items: true, user: { select: { email: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: "desc" }
    });
    res.json(orders.map((order) => ({ ...order, pricingBreakdown: JSON.parse(order.pricingBreakdown) })));
  })
);

router.patch(
  "/orders/:id",
  asyncHandler(async (req, res) => {
    const body = z.object({ status: z.enum(["pending", "paid", "shipped"]) }).parse(req.body);
    const updated = await prisma.order.update({
      where: { id: Number(req.params.id) },
      data: { status: body.status }
    });
    res.json(updated);
  })
);

const couponSchema = z.object({
  code: z.string().min(2),
  type: z.enum(["percentage", "fixed"]),
  amount: z.number().min(1),
  expiresAt: z.string().optional().nullable(),
  usageLimit: z.number().int().min(1).optional().nullable(),
  active: z.boolean()
});

router.get(
  "/coupons",
  asyncHandler(async (_req, res) => {
    res.json(await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } }));
  })
);

router.post(
  "/coupons",
  asyncHandler(async (req, res) => {
    const body = couponSchema.parse(req.body);
    const created = await prisma.coupon.create({
      data: {
        ...body,
        code: body.code.toUpperCase(),
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null
      }
    });
    res.status(201).json(created);
  })
);

router.put(
  "/coupons/:id",
  asyncHandler(async (req, res) => {
    const body = couponSchema.parse(req.body);
    const updated = await prisma.coupon.update({
      where: { id: Number(req.params.id) },
      data: {
        ...body,
        code: body.code.toUpperCase(),
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null
      }
    });
    res.json(updated);
  })
);

const ruleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  ruleType: z.enum(["quantity_percentage", "free_shipping_quantity", "subtotal_fixed", "quantity"]),
  threshold: z.number().int().min(1),
  discountType: z.enum(["percentage", "shipping", "fixed"]),
  amount: z.number().min(0),
  priority: z.number().int().min(0).default(100),
  startsAt: z.string().optional().nullable(),
  endsAt: z.string().optional().nullable(),
  active: z.boolean()
});

router.get(
  "/discount-rules",
  asyncHandler(async (_req, res) => {
    res.json(await prisma.discountRule.findMany({ orderBy: { createdAt: "asc" } }));
  })
);

router.post(
  "/discount-rules",
  asyncHandler(async (req, res) => {
    const body = ruleSchema.parse(req.body);
    const created = await prisma.discountRule.create({
      data: {
        ...body,
        description: body.description || null,
        startsAt: body.startsAt ? new Date(body.startsAt) : null,
        endsAt: body.endsAt ? new Date(body.endsAt) : null
      }
    });
    res.status(201).json(created);
  })
);

router.put(
  "/discount-rules/:id",
  asyncHandler(async (req, res) => {
    const body = ruleSchema.parse(req.body);
    const updated = await prisma.discountRule.update({
      where: { id: Number(req.params.id) },
      data: {
        ...body,
        description: body.description || null,
        startsAt: body.startsAt ? new Date(body.startsAt) : null,
        endsAt: body.endsAt ? new Date(body.endsAt) : null
      }
    });
    res.json(updated);
  })
);

router.delete(
  "/discount-rules/:id",
  asyncHandler(async (req, res) => {
    await prisma.discountRule.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  })
);

router.get(
  "/settings",
  asyncHandler(async (_req, res) => {
    const settings = await prisma.setting.findMany({ orderBy: { key: "asc" } });
    res.json(settings);
  })
);

router.put(
  "/settings",
  asyncHandler(async (req, res) => {
    const body = z.array(
      z.object({
        key: z.string().min(1),
        value: z.string()
      })
    ).parse(req.body);

    for (const item of body) {
      await prisma.setting.upsert({
        where: { key: item.key },
        update: { value: item.value },
        create: item
      });
    }

    const settings = await prisma.setting.findMany({ orderBy: { key: "asc" } });
    res.json(settings);
  })
);

router.get(
  "/users/:id/orders",
  asyncHandler(async (req, res) => {
    const userId = Number(req.params.id);
    if (!Number.isInteger(userId)) {
      throw new HttpError(400, "Invalid user");
    }
    const orders = await prisma.order.findMany({ where: { userId }, include: { items: true } });
    res.json(orders);
  })
);

export default router;
