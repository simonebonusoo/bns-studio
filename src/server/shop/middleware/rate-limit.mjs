import { HttpError } from "../lib/http.mjs"
import { logWarning } from "../lib/monitoring.mjs"

const buckets = new Map()

function getClientKey(req, suffix = "") {
  const forwardedFor = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim()
  const ip = forwardedFor || req.ip || req.socket?.remoteAddress || "unknown"
  return `${suffix}:${ip}`
}

export function createRateLimiter({
  windowMs,
  max,
  keyPrefix,
  message,
}) {
  return function rateLimiter(req, _res, next) {
    const key = getClientKey(req, keyPrefix)
    const now = Date.now()
    const bucket = buckets.get(key)

    if (!bucket || bucket.expiresAt <= now) {
      buckets.set(key, { count: 1, expiresAt: now + windowMs })
      next()
      return
    }

    if (bucket.count >= max) {
      logWarning("rate_limit_exceeded", {
        route: req.originalUrl || req.url,
        method: req.method,
        ip: key.replace(`${keyPrefix}:`, ""),
        keyPrefix,
      })
      next(new HttpError(429, message))
      return
    }

    bucket.count += 1
    next()
  }
}
