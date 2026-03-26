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
import { env } from "./config/env.mjs"
import { errorHandler } from "./middleware/error.mjs"

const app = express()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const uploadsDir = env.uploadsDir
  ? path.resolve(env.uploadsDir)
  : path.resolve(__dirname, "../../uploads")
const allowedOrigins = new Set(env.clientOrigins)

fs.mkdirSync(path.join(uploadsDir, "products"), { recursive: true })

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true)
        return
      }

      callback(new Error("Origin non consentita dal CORS"))
    },
    credentials: true,
  })
)
app.use(express.json())
app.use(morgan("dev"))
app.use("/uploads", express.static(uploadsDir))

app.use((req, res, next) => {
  res.type("application/json")
  next()
})

app.get("/api/health", (_req, res) => {
  res.json({ ok: true })
})

app.use("/api/auth", authRoutes)
app.use("/api/store", storeRoutes)
app.use("/api/orders", orderRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/reviews", reviewRoutes)

app.use("/api", (_req, res) => {
  res.status(404).json({
    message: "Endpoint API non trovato",
  })
})

app.use(errorHandler)

export default app
