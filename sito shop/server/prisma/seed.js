import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const productSeeds = [
  {
    title: "Quiet Form",
    slug: "quiet-form",
    description: "Minimal geometric poster with soft neutral tones and gallery-inspired balance.",
    price: 4200,
    category: "Abstract",
    imageUrls: JSON.stringify([
      "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=900&q=80"
    ]),
    featured: true,
    stock: 25
  },
  {
    title: "Studio Light",
    slug: "studio-light",
    description: "Architectural poster with clean structure, light grain, and muted monochrome contrast.",
    price: 5600,
    category: "Architecture",
    imageUrls: JSON.stringify([
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80"
    ]),
    featured: true,
    stock: 18
  },
  {
    title: "Still Horizon",
    slug: "still-horizon",
    description: "Atmospheric landscape print with a restrained palette for calm, modern interiors.",
    price: 4800,
    category: "Landscape",
    imageUrls: JSON.stringify([
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=80"
    ]),
    featured: false,
    stock: 32
  },
  {
    title: "Raw Texture",
    slug: "raw-texture",
    description: "Artistic poster built around tactile material studies and editorial composition.",
    price: 3900,
    category: "Editorial",
    imageUrls: JSON.stringify([
      "https://images.unsplash.com/photo-1511452885600-a3d2c9148a31?auto=format&fit=crop&w=900&q=80"
    ]),
    featured: true,
    stock: 40
  }
];

async function main() {
  const adminPassword = await bcrypt.hash("admin1234", 10);

  await prisma.user.upsert({
    where: { email: "bnsstudio26@gmail.com" },
    update: {},
    create: {
      email: "bnsstudio26@gmail.com",
      passwordHash: adminPassword,
      firstName: "Admin",
      lastName: "Studio",
      role: "admin"
    }
  });

  for (const product of productSeeds) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: product,
      create: product
    });
  }

  await prisma.discountRule.upsert({
    where: { id: 1 },
    update: {
      name: "3 poster = 30% di sconto",
      description: "Sconto percentuale automatico al raggiungimento di 3 poster nel carrello.",
      ruleType: "quantity_percentage",
      threshold: 3,
      discountType: "percentage",
      amount: 30,
      priority: 10,
      active: true
    },
    create: {
      id: 1,
      name: "3 poster = 30% di sconto",
      description: "Sconto percentuale automatico al raggiungimento di 3 poster nel carrello.",
      ruleType: "quantity_percentage",
      threshold: 3,
      discountType: "percentage",
      amount: 30,
      priority: 10,
      active: true
    }
  });

  await prisma.discountRule.upsert({
    where: { id: 2 },
    update: {
      name: "2 poster = spedizione gratuita",
      description: "Azzera la spedizione quando il carrello contiene almeno 2 poster.",
      ruleType: "free_shipping_quantity",
      threshold: 2,
      discountType: "shipping",
      amount: 100,
      priority: 20,
      active: true
    },
    create: {
      id: 2,
      name: "2 poster = spedizione gratuita",
      description: "Azzera la spedizione quando il carrello contiene almeno 2 poster.",
      ruleType: "free_shipping_quantity",
      threshold: 2,
      discountType: "shipping",
      amount: 100,
      priority: 20,
      active: true
    }
  });

  await prisma.coupon.upsert({
    where: { code: "BNS10" },
    update: {
      type: "percentage",
      amount: 10,
      active: true
    },
    create: {
      code: "BNS10",
      type: "percentage",
      amount: 10,
      usageLimit: 50,
      active: true
    }
  });

  const settings = [
    ["storeName", "bns studio"],
    ["logoUrl", ""],
    ["primaryColor", "#e3f503"],
    ["paypalMeLink", process.env.PAYPAL_ME_LINK || "https://paypal.me/yourbrand"],
    ["paypalBusinessEmail", process.env.PAYPAL_BUSINESS_EMAIL || ""],
    ["currencyCode", "EUR"],
    ["shippingCost", "900"],
    ["heroHeadline", "Poster minimali per interni essenziali."]
  ];

  for (const [key, value] of settings) {
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
