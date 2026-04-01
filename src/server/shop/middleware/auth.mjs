import { env } from "../config/env.mjs"
import { hashSessionFingerprint, parseRequestCookies, verifyToken } from "../lib/auth.mjs"
import { HttpError } from "../lib/http.mjs"
import { logWarning } from "../lib/monitoring.mjs"
import { prisma } from "../lib/prisma.mjs"

export async function requireAuth(req, _res, next) {
  const header = req.headers.authorization
  const cookies = parseRequestCookies(req.headers.cookie)
  const cookieToken = cookies[env.authCookieName]
  const bearerToken = header?.startsWith("Bearer ") ? header.slice(7) : ""
  const token = cookieToken || bearerToken

  if (!token) {
    logWarning("auth_missing_credentials", {
      method: req.method,
      path: req.originalUrl || req.url,
      hasCookie: Boolean(cookieToken),
      hasBearer: Boolean(bearerToken),
    })
    return next(new HttpError(401, "Autenticazione richiesta"))
  }

  try {
    const payload = verifyToken(token)
    const user = await prisma.user.findUnique({ where: { id: Number(payload.sub) } })
    if (!user) {
      logWarning("auth_user_not_found", {
        method: req.method,
        path: req.originalUrl || req.url,
        userId: Number(payload.sub) || null,
        hasCookie: Boolean(cookieToken),
      })
      return next(new HttpError(401, "Utente non trovato"))
    }
    if (!payload.sid || !user.sessionNonce || payload.sid !== user.sessionNonce) {
      logWarning("auth_session_nonce_mismatch", {
        method: req.method,
        path: req.originalUrl || req.url,
        userId: user.id,
        hasCookie: Boolean(cookieToken),
      })
      return next(new HttpError(401, "Sessione non valida"))
    }
    if (!user.sessionFingerprintHash || user.sessionFingerprintHash !== hashSessionFingerprint(req)) {
      logWarning("auth_session_fingerprint_mismatch", {
        method: req.method,
        path: req.originalUrl || req.url,
        userId: user.id,
        hasCookie: Boolean(cookieToken),
      })
      return next(new HttpError(401, "Sessione non valida"))
    }
    req.user = user
    next()
  } catch (error) {
    logWarning("auth_invalid_token", {
      method: req.method,
      path: req.originalUrl || req.url,
      hasCookie: Boolean(cookieToken),
      hasBearer: Boolean(bearerToken),
    })
    next(error instanceof HttpError ? error : new HttpError(401, "Token non valido"))
  }
}

export function requireAdmin(req, _res, next) {
  if (!req.user || req.user.role !== "admin") {
    logWarning("admin_access_denied", {
      method: req.method,
      path: req.originalUrl || req.url,
      userId: req.user?.id || null,
      role: req.user?.role || null,
    })
    return next(new HttpError(403, "Accesso admin richiesto"))
  }
  next()
}
