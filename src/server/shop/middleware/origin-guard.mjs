import { HttpError } from "../lib/http.mjs"

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"])

export function createOriginGuard(allowedOrigins) {
  const allowed = new Set(allowedOrigins)

  return function originGuard(req, _res, next) {
    if (SAFE_METHODS.has(req.method)) {
      next()
      return
    }

    const origin = req.headers.origin
    const referer = req.headers.referer
    let refererOrigin = ""
    if (typeof referer === "string") {
      try {
        refererOrigin = new URL(referer).origin
      } catch {
        refererOrigin = ""
      }
    }
    const candidate = origin || refererOrigin

    if (!candidate || allowed.has(candidate)) {
      next()
      return
    }

    next(new HttpError(403, "Origine richiesta non consentita"))
  }
}
