import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { resolveDatabaseUrl } from "./resolve-database-url.mjs"
import { backfillLegacyProductVariants } from "../src/server/shop/lib/product-variants.mjs"

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: resolveDatabaseUrl(),
    },
  },
})

async function main() {
  console.log("[variants] Verifica varianti prodotto legacy")
  await backfillLegacyProductVariants(prisma)
  const [products, variants] = await prisma.$transaction([
    prisma.product.count(),
    prisma.productVariant.count(),
  ])
  console.log(`[variants] Products=${products} Variants=${variants}`)
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
