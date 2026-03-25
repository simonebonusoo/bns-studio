import "dotenv/config"
import bcrypt from "bcryptjs"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const products = [
  {
    title: "Brand Starter Kit",
    slug: "brand-starter-kit",
    description:
      "Kit iniziale per freelance e microbrand con logo pack, palette e linee guida essenziali in un formato subito utilizzabile.",
    price: 8900,
    category: "Brand",
    imageUrls: JSON.stringify([
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80",
    ]),
    featured: true,
    stock: 18,
  },
  {
    title: "Social Launch Pack",
    slug: "social-launch-pack",
    description:
      "Template set per lancio social con cover, storie e visual coordinati pensati per attivazioni rapide ma curate.",
    price: 4900,
    category: "Social",
    imageUrls: JSON.stringify([
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80",
    ]),
    featured: true,
    stock: 32,
  },
  {
    title: "Landing Wireframe System",
    slug: "landing-wireframe-system",
    description:
      "Sistema di wireframe ad alta conversione per landing page con sezioni modulari gia pensate per una presentazione pulita.",
    price: 7200,
    category: "Web",
    imageUrls: JSON.stringify([
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1522542550221-31fd19575a2d?auto=format&fit=crop&w=1200&q=80",
    ]),
    featured: false,
    stock: 14,
  },
  {
    title: "Print Identity Pack",
    slug: "print-identity-pack",
    description:
      "Pacchetto coordinato per stampa con biglietti, flyer e mini guida esecutiva per mantenere coerenza tra digitale e materiali fisici.",
    price: 6500,
    category: "Print",
    imageUrls: JSON.stringify([
      "https://images.unsplash.com/photo-1511108690759-009324a90311?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80",
    ]),
    featured: true,
    stock: 21,
  },
]

async function main() {
  await prisma.user.upsert({
    where: { email: "admin@bnsstudio.com" },
    update: {},
    create: {
      email: "admin@bnsstudio.com",
      passwordHash: await bcrypt.hash("admin1234", 10),
      firstName: "Admin",
      lastName: "BNS",
      role: "admin",
    },
  })

  await prisma.user.upsert({
    where: { email: "customer@bnsstudio.com" },
    update: {},
    create: {
      email: "customer@bnsstudio.com",
      passwordHash: await bcrypt.hash("customer1234", 10),
      firstName: "Sample",
      lastName: "Customer",
      role: "customer",
    },
  })

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: product,
      create: product,
    })
  }

  await prisma.coupon.upsert({
    where: { code: "BNS10" },
    update: { type: "percentage", amount: 10, active: true },
    create: {
      code: "BNS10",
      type: "percentage",
      amount: 10,
      usageLimit: 50,
      active: true,
    },
  })

  await prisma.discountRule.upsert({
    where: { id: 1 },
    update: {
      name: "Bundle 3 prodotti",
      description: "Sconto automatico del 15% quando il carrello raggiunge 3 prodotti.",
      ruleType: "quantity_percentage",
      threshold: 3,
      discountType: "percentage",
      amount: 15,
      priority: 10,
      active: true,
    },
    create: {
      id: 1,
      name: "Bundle 3 prodotti",
      description: "Sconto automatico del 15% quando il carrello raggiunge 3 prodotti.",
      ruleType: "quantity_percentage",
      threshold: 3,
      discountType: "percentage",
      amount: 15,
      priority: 10,
      active: true,
    },
  })

  await prisma.discountRule.upsert({
    where: { id: 2 },
    update: {
      name: "Spedizione gratuita",
      description: "Azzeramento spedizione con almeno 2 prodotti nel carrello.",
      ruleType: "free_shipping_quantity",
      threshold: 2,
      discountType: "shipping",
      amount: 100,
      priority: 20,
      active: true,
    },
    create: {
      id: 2,
      name: "Spedizione gratuita",
      description: "Azzeramento spedizione con almeno 2 prodotti nel carrello.",
      ruleType: "free_shipping_quantity",
      threshold: 2,
      discountType: "shipping",
      amount: 100,
      priority: 20,
      active: true,
    },
  })

  const settings = [
    ["storeName", "BNS Studio Shop"],
    ["currencyCode", "EUR"],
    ["shippingCost", "900"],
    ["heroHeadline", "Asset e kit pronti per brand, web e stampa."],
    ["paypalMeLink", ""],
    ["paypalBusinessEmail", ""],
    ["shopCategories", JSON.stringify(["Brand", "Social", "Web", "Print"])],
  ]

  for (const [key, value] of settings) {
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
