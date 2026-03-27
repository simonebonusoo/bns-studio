import "dotenv/config"
import bcrypt from "bcryptjs"
import { PrismaClient } from "@prisma/client"
import { resolveDatabaseUrl } from "./resolve-database-url.mjs"

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: resolveDatabaseUrl(),
    },
  },
})

const products = [
  {
    title: "Brand Starter Kit",
    slug: "brand-starter-kit",
    description:
      "Kit iniziale per freelance e microbrand con logo pack, palette e linee guida essenziali in un formato subito utilizzabile.",
    price: 8900,
    priceA4: 8900,
    priceA3: null,
    costPrice: 2400,
    hasA4: true,
    hasA3: false,
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
    priceA4: 4900,
    priceA3: null,
    costPrice: 1200,
    hasA4: true,
    hasA3: false,
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
    priceA4: 7200,
    priceA3: null,
    costPrice: 1900,
    hasA4: true,
    hasA3: false,
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
    priceA4: 6500,
    priceA3: null,
    costPrice: 1700,
    hasA4: true,
    hasA3: false,
    category: "Print",
    imageUrls: JSON.stringify([
      "https://images.unsplash.com/photo-1511108690759-009324a90311?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80",
    ]),
    featured: true,
    stock: 21,
  },
]

const reviewUsers = [
  {
    email: "marco@bnsstudio.com",
    username: "marco.r",
    firstName: "Marco",
    lastName: "Rossi",
  },
  {
    email: "giulia@bnsstudio.com",
    username: "giulia.v",
    firstName: "Giulia",
    lastName: "Villa",
  },
  {
    email: "luca@bnsstudio.com",
    username: "luca.f",
    firstName: "Luca",
    lastName: "Ferri",
  },
  {
    email: "serena@bnsstudio.com",
    username: "serena.m",
    firstName: "Serena",
    lastName: "Marini",
  },
]

const seededReviews = [
  {
    publicId: "review-marco-poster",
    email: "marco@bnsstudio.com",
    rating: 5,
    title: "Poster curato e stampa molto pulita",
    body: "Il visual dal vivo rende ancora meglio che in foto. Packaging ordinato, spedizione veloce e qualità davvero solida per uno spazio studio minimal.",
    tag: "Poster arrivato",
    showOnHomepage: true,
  },
  {
    publicId: "review-giulia-collection",
    email: "giulia@bnsstudio.com",
    rating: 5,
    title: "Collezione coerente e facile da abbinare",
    body: "Ho preso più pezzi insieme e l'effetto finale è super coerente. Si vede che c'è una direzione estetica chiara dietro ogni prodotto.",
    tag: "Collezione completata",
    showOnHomepage: true,
  },
  {
    publicId: "review-luca-gift",
    email: "luca@bnsstudio.com",
    rating: 4,
    title: "Regalo riuscito, ottima presenza visiva",
    body: "L'ho scelto come regalo e ha fatto subito la sua scena. Molto forte la parte grafica, bene anche i tempi e l'assistenza nelle informazioni.",
    tag: "Regalo riuscito",
    showOnHomepage: true,
  },
  {
    publicId: "review-serena-support",
    email: "serena@bnsstudio.com",
    rating: 5,
    title: "Supporto rapido e prodotto coerente",
    body: "Mi serviva un chiarimento prima dell'acquisto e la risposta è arrivata in fretta. Prodotto curato, immagini fedeli e identità BNS molto chiara.",
    tag: "Supporto attivo",
    showOnHomepage: true,
  },
]

async function main() {
  console.log("[seed] Seeding shop data")

  const existingState = await prisma.$transaction([
    prisma.user.count(),
    prisma.product.count(),
    prisma.coupon.count(),
    prisma.discountRule.count(),
    prisma.setting.count(),
    prisma.review.count(),
  ])

  const [userCount, productCount, couponCount, ruleCount, settingCount, reviewCount] = existingState
  const databaseAlreadyInitialized = userCount > 0 || productCount > 0 || couponCount > 0 || ruleCount > 0 || settingCount > 0 || reviewCount > 0

  console.log(
    `[seed] Existing counts users=${userCount} products=${productCount} coupons=${couponCount} rules=${ruleCount} settings=${settingCount} reviews=${reviewCount}`
  )

  if (databaseAlreadyInitialized && process.env.FORCE_SHOP_SEED !== "true") {
    console.log("[seed] Database gia inizializzato: seed non distruttivo saltato")
    return
  }

  await prisma.user.upsert({
    where: { email: "admin@bnsstudio.com" },
    update: {},
    create: {
      email: "admin@bnsstudio.com",
      username: "admin.bns",
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
      username: "sample.customer",
      passwordHash: await bcrypt.hash("customer1234", 10),
      firstName: "Sample",
      lastName: "Customer",
      role: "customer",
    },
  })

  for (const demoUser of reviewUsers) {
    await prisma.user.upsert({
      where: { email: demoUser.email },
      update: {},
      create: {
        email: demoUser.email,
        username: demoUser.username,
        passwordHash: await bcrypt.hash("customer1234", 10),
        firstName: demoUser.firstName,
        lastName: demoUser.lastName,
        role: "customer",
      },
    })
  }

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: product,
    })
  }

  await prisma.coupon.upsert({
    where: { code: "BNS10" },
    update: {},
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
    update: {},
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
    update: {},
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
      update: {},
      create: { key, value },
    })
  }

  for (const review of seededReviews) {
    const reviewUser = await prisma.user.findUnique({
      where: { email: review.email },
    })

    if (!reviewUser) continue

    await prisma.review.upsert({
      where: { publicId: review.publicId },
      update: {},
      create: {
        publicId: review.publicId,
        userId: reviewUser.id,
        rating: review.rating,
        title: review.title,
        body: review.body,
        tag: review.tag,
        status: "approved",
        showOnHomepage: review.showOnHomepage,
      },
    })
  }

  const [seededUserCount, seededProductCount, seededReviewCount, categorySetting] = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
    prisma.review.count(),
    prisma.setting.findUnique({ where: { key: "shopCategories" } }),
  ])

  console.log(`[seed] Admin ready: admin@bnsstudio.com / admin1234`)
  console.log(`[seed] Users=${seededUserCount} Products=${seededProductCount} Reviews=${seededReviewCount}`)
  console.log(`[seed] Categories=${categorySetting?.value || "[]"}`)
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
