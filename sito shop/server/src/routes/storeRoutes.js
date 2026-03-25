import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/http.js";
import { calculatePricing } from "../services/pricing.js";

const router = Router();

router.get(
  "/settings",
  asyncHandler(async (_req, res) => {
    const settings = await prisma.setting.findMany();
    res.json(
      settings.reduce((acc, item) => {
        acc[item.key] = item.value;
        return acc;
      }, {})
    );
  })
);

router.get(
  "/products",
  asyncHandler(async (req, res) => {
    const { search = "", category = "", maxPrice } = req.query;
    const products = await prisma.product.findMany({
      where: {
        title: search ? { contains: String(search) } : undefined,
        category: category ? String(category) : undefined,
        price: maxPrice ? { lte: Number(maxPrice) } : undefined
      },
      orderBy: { createdAt: "desc" }
    });

    res.json(
      products.map((product) => ({
        ...product,
        imageUrls: JSON.parse(product.imageUrls)
      }))
    );
  })
);

router.get(
  "/products/featured",
  asyncHandler(async (_req, res) => {
    const products = await prisma.product.findMany({
      where: { featured: true },
      take: 3,
      orderBy: { createdAt: "desc" }
    });
    res.json(products.map((product) => ({ ...product, imageUrls: JSON.parse(product.imageUrls) })));
  })
);

router.get(
  "/products/:slug",
  asyncHandler(async (req, res) => {
    const product = await prisma.product.findUnique({
      where: { slug: req.params.slug }
    });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json({ ...product, imageUrls: JSON.parse(product.imageUrls) });
  })
);

router.get(
  "/categories",
  asyncHandler(async (_req, res) => {
    const categories = await prisma.product.findMany({
      distinct: ["category"],
      select: { category: true }
    });
    res.json(categories.map((item) => item.category));
  })
);

router.post(
  "/pricing/preview",
  asyncHandler(async (req, res) => {
    const body = z.object({
      items: z.array(
        z.object({
          productId: z.number(),
          quantity: z.number().min(1)
        })
      ),
      couponCode: z.string().optional().nullable()
    }).parse(req.body);

    res.json(await calculatePricing(body.items, body.couponCode));
  })
);

export default router;
