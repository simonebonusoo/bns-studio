import cors from "cors"
import express from "express"
import morgan from "morgan"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import authRoutes from "./routes/authRoutes.mjs"
import storeRoutes from "./routes/storeRoutes.mjs"
import orderRoutes from "./routes/orderRoutes.mjs"
import adminRoutes from "./routes/adminRoutes.mjs"
import reviewRoutes from "./routes/reviewRoutes.mjs"
import metricsRoutes from "./routes/metricsRoutes.mjs"
import { env } from "./config/env.mjs"
import { createOriginGuard } from "./middleware/origin-guard.mjs"
import { createRateLimiter } from "./middleware/rate-limit.mjs"
import { errorHandler } from "./middleware/error.mjs"
import { resolveUploadsRootDir } from "./lib/uploads-storage.mjs"

const app = express()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const uploadsDir = resolveUploadsRootDir(env.uploadsDir)
const allowedOrigins = new Set(env.clientOrigins)
const adminLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 180,
  keyPrefix: "admin",
  message: "Troppe richieste admin. Riprova tra poco.",
})

fs.mkdirSync(path.join(uploadsDir, "products"), { recursive: true })

app.disable("x-powered-by")
app.set("trust proxy", 1)
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true)
        return
      }

      callback(null, false)
    },
    credentials: true,
  })
)
app.use(express.json({ limit: "1mb" }))
app.use(morgan("dev"))
app.use(createOriginGuard(allowedOrigins))
app.use("/uploads", express.static(uploadsDir))

app.use((req, res, next) => {
  res.type("application/json")
  next()
})

app.get("/api/health", (_req, res) => {
  res.json({ ok: true })
})

if (process.env.SHOP_ENABLE_SECURITY_TEST_ROUTES === "true") {
  app.get("/api/__security/boom", () => {
    throw new Error("security_test_boom")
  })
}

app.use("/api/auth", authRoutes)
app.use("/api/store", storeRoutes)
app.use("/api/orders", orderRoutes)
app.use("/api/admin", adminLimiter, adminRoutes)
app.use("/api/reviews", reviewRoutes)
app.use("/api/metrics", metricsRoutes)

app.use("/api", (_req, res) => {
  res.status(404).json({
    message: "Endpoint API non trovato",
  })
})

app.use(errorHandler)

export default app
