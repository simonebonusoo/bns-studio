import { prisma } from "../src/server/shop/lib/prisma.mjs"
import { logInfo, reportError } from "../src/server/shop/lib/monitoring.mjs"

function resolveVariantCost(title, key) {
  const normalizedTitle = String(title || "").trim().toUpperCase()
  const normalizedKey = String(key || "").trim().toLowerCase()

  if (normalizedTitle === "A4" || normalizedKey === "a4") return 800
  if (normalizedTitle === "A3" || normalizedKey === "a3") return 1000
  return null
}

async function main() {
  const variants = await prisma.productVariant.findMany({
    select: {
      id: true,
      productId: true,
      title: true,
      key: true,
      costPrice: true,
      isDefault: true,
      isActive: true,
    },
  })

  const productCosts = new Map()
  let updatedVariants = 0

  for (const variant of variants) {
    const nextCost = resolveVariantCost(variant.title, variant.key)
    if (nextCost === null) continue

    if (variant.costPrice !== nextCost) {
      await prisma.productVariant.update({
        where: { id: variant.id },
        data: { costPrice: nextCost },
      })
      updatedVariants += 1
    }

    const existing = productCosts.get(variant.productId)
    if (!existing || variant.isDefault || (!existing.isDefault && variant.isActive)) {
      productCosts.set(variant.productId, {
        costPrice: nextCost,
        isDefault: variant.isDefault,
        isActive: variant.isActive,
      })
    }
  }

  let updatedProducts = 0
  for (const [productId, summary] of productCosts.entries()) {
    await prisma.product.update({
      where: { id: productId },
      data: { costPrice: summary.costPrice },
    })
    updatedProducts += 1
  }

  logInfo("shop_variant_production_costs_backfilled", {
    updatedVariants,
    updatedProducts,
  })
  console.log(`[shop:variant-costs] Varianti aggiornate: ${updatedVariants}`)
  console.log(`[shop:variant-costs] Prodotti riallineati: ${updatedProducts}`)
}

main()
  .catch((error) => {
    reportError(error, { event: "shop_variant_production_costs_backfill_failed" })
    console.error("[shop:variant-costs] Backfill fallito")
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
