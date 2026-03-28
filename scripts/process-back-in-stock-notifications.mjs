import { prisma } from "../src/server/shop/lib/prisma.mjs"
import {
  buildBackInStockNotificationPayloads,
  getReadyBackInStockSubscriptions,
  markBackInStockSubscriptionsNotified,
} from "../src/server/shop/services/back-in-stock.mjs"

async function main() {
  const commit = process.argv.includes("--commit")
  const limitArg = process.argv.find((argument) => argument.startsWith("--limit="))
  const limit = Number(limitArg?.split("=")[1] || 50)

  const subscriptions = await getReadyBackInStockSubscriptions(prisma, Number.isFinite(limit) && limit > 0 ? limit : 50)
  const payloads = buildBackInStockNotificationPayloads(subscriptions)

  if (!payloads.length) {
    console.log("[shop:back-in-stock] Nessuna notifica pronta.")
    return
  }

  console.log(`[shop:back-in-stock] Notifiche pronte: ${payloads.length}`)
  payloads.forEach((payload) => {
    console.log(`- #${payload.subscriptionId} ${payload.email} :: ${payload.productTitle}${payload.variantLabel ? ` / ${payload.variantLabel}` : ""}`)
  })

  if (!commit) {
    console.log("[shop:back-in-stock] Dry run completato. Usa --commit per marcare le notifiche come inviate.")
    return
  }

  const result = await markBackInStockSubscriptionsNotified(
    prisma,
    payloads.map((payload) => payload.subscriptionId)
  )
  console.log(`[shop:back-in-stock] Notifiche marcate come inviate: ${result.count}`)
}

main()
  .catch((error) => {
    console.error("[shop:back-in-stock] Errore durante l'elaborazione delle notifiche.")
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
