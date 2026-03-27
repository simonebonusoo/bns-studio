import app from "./app.mjs"
import { env } from "./config/env.mjs"
import { reportError } from "./lib/monitoring.mjs"
import { logPersistenceStatus } from "./lib/persistence-status.mjs"
import { syncAllProductMirrors } from "./lib/product-mirror.mjs"
import { prisma } from "./lib/prisma.mjs"

const host = "0.0.0.0"

app.listen(env.port, host, () => {
  console.log(`Shop API running on http://localhost:${env.port}`)
  logPersistenceStatus()
  syncAllProductMirrors().catch((error) => {
    console.error("[product-mirror] Sync iniziale fallita")
    console.error(error)
    reportError(error, { event: "product_mirror_initial_sync_failed" })
  })
})

process.on("SIGTERM", async () => {
  await prisma.$disconnect().catch(() => {})
  process.exit(0)
})

process.on("SIGINT", async () => {
  await prisma.$disconnect().catch(() => {})
  process.exit(0)
})

process.on("unhandledRejection", (reason) => {
  reportError(reason instanceof Error ? reason : new Error(String(reason)), {
    event: "process_unhandled_rejection",
  })
})

process.on("uncaughtException", (error) => {
  reportError(error, {
    event: "process_uncaught_exception",
  })
})
