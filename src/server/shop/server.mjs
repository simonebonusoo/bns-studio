import app from "./app.mjs"
import { env } from "./config/env.mjs"
import { reportError } from "./lib/monitoring.mjs"
import { logPersistenceStatus } from "./lib/persistence-status.mjs"
import { prisma } from "./lib/prisma.mjs"

const host = "0.0.0.0"

app.listen(env.port, host, () => {
  console.log(`Shop API running on http://localhost:${env.port}`)
  logPersistenceStatus()
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
