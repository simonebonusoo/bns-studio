import { prisma } from "../lib/prisma.js";
import { HttpError } from "../lib/http.js";

function parseSettingValue(settings, key, fallback) {
  const setting = settings.find((entry) => entry.key === key);
  return setting ? setting.value : fallback;
}

export async function calculatePricing(cartItems, couponCode) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    throw new HttpError(400, "Il carrello è vuoto");
  }

  const productIds = cartItems.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } }
  });

  if (products.length !== productIds.length) {
    throw new HttpError(400, "Uno o più prodotti non sono validi");
  }

  const settings = await prisma.setting.findMany();
  const shippingCost = Number(parseSettingValue(settings, "shippingCost", "900"));
  const now = new Date();
  const rules = await prisma.discountRule.findMany({
    where: { active: true },
    orderBy: [{ priority: "asc" }, { createdAt: "asc" }]
  });

  const normalizedItems = cartItems.map((item) => {
    const product = products.find((entry) => entry.id === item.productId);
    const quantity = Number(item.quantity);
    if (!product || Number.isNaN(quantity) || quantity < 1) {
      throw new HttpError(400, "Elemento del carrello non valido");
    }
    if (quantity > product.stock) {
      throw new HttpError(400, `${product.title} supera la disponibilità di magazzino`);
    }
    return {
      productId: product.id,
      slug: product.slug,
      title: product.title,
      imageUrl: JSON.parse(product.imageUrls)[0] || "",
      unitPrice: product.price,
      quantity,
      lineTotal: product.price * quantity
    };
  });

  const itemCount = normalizedItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = normalizedItems.reduce((sum, item) => sum + item.lineTotal, 0);

  let automaticDiscount = 0;
  let shippingTotal = shippingCost;
  const appliedAutomaticRules = [];

  for (const rule of rules) {
    const withinStart = !rule.startsAt || rule.startsAt <= now;
    const withinEnd = !rule.endsAt || rule.endsAt >= now;
    if (!withinStart || !withinEnd) {
      continue;
    }

    if (rule.ruleType === "quantity_percentage" && itemCount >= rule.threshold) {
      if (rule.discountType === "percentage") {
        const amount = Math.round(subtotal * (rule.amount / 100));
        automaticDiscount += amount;
        appliedAutomaticRules.push({
          type: "automatic",
          label: rule.name,
          description: rule.description,
          amount
        });
      }
    }

    if (rule.ruleType === "subtotal_fixed" && subtotal >= rule.threshold) {
      if (rule.discountType === "fixed") {
        const amount = Math.min(subtotal, rule.amount);
        automaticDiscount += amount;
        appliedAutomaticRules.push({
          type: "automatic",
          label: rule.name,
          description: rule.description,
          amount
        });
      }
    }

    if (rule.ruleType === "free_shipping_quantity" && itemCount >= rule.threshold) {
      shippingTotal = 0;
      appliedAutomaticRules.push({
        type: "shipping",
        label: rule.name,
        description: rule.description,
        amount: shippingCost
      });
    }

    if (rule.ruleType === "quantity" && itemCount >= rule.threshold && rule.discountType === "percentage") {
      const amount = Math.round(subtotal * (rule.amount / 100));
      automaticDiscount += amount;
      appliedAutomaticRules.push({
        type: "automatic",
        label: rule.name,
        description: rule.description,
        amount
      });
    }
  }

  let coupon = null;
  let couponDiscount = 0;
  if (couponCode) {
    coupon = await prisma.coupon.findUnique({
      where: { code: couponCode.toUpperCase() }
    });

    if (!coupon || !coupon.active) {
      throw new HttpError(400, "Coupon non valido");
    }
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      throw new HttpError(400, "Coupon scaduto");
    }
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      throw new HttpError(400, "Limite di utilizzo del coupon raggiunto");
    }

    couponDiscount =
      coupon.type === "percentage"
        ? Math.round(subtotal * (coupon.amount / 100))
        : coupon.amount;
  }

  const discountTotal = Math.min(subtotal, automaticDiscount + couponDiscount);
  const total = Math.max(0, subtotal - discountTotal + shippingTotal);

  return {
    items: normalizedItems,
    subtotal,
    shippingBase: shippingCost,
    shippingTotal,
    automaticDiscount,
    couponDiscount,
    discountTotal,
    total,
    appliedCoupon: coupon ? coupon.code : null,
    appliedRules: [
      ...appliedAutomaticRules,
      coupon ? { type: "coupon", label: coupon.code, amount: couponDiscount } : null
    ].filter(Boolean)
  };
}
