import { verifyToken } from "../lib/auth.mjs"
import { HttpError } from "../lib/http.mjs"
import { prisma } from "../lib/prisma.mjs"

export async function requireAuth(req, _res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith("Bearer ")) {
    return next(new HttpError(401, "Autenticazione richiesta"))
  }

  try {
    const payload = verifyToken(header.slice(7))
    const user = await prisma.user.findUnique({ where: { id: Number(payload.sub) } })
    if (!user) {
      return next(new HttpError(401, "Utente non trovato"))
    }
    if (user.role === "deleted") {
      return next(new HttpError(401, "Account eliminato"))
    }
    req.user = user
    next()
  } catch (error) {
    next(error instanceof HttpError ? error : new HttpError(401, "Token non valido"))
  }
}

export async function optionalAuth(req, _res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith("Bearer ")) {
    next()
    return
  }

  try {
    const payload = verifyToken(header.slice(7))
    const user = await prisma.user.findUnique({ where: { id: Number(payload.sub) } })
    if (user && user.role !== "deleted") {
      req.user = user
    }
    next()
  } catch {
    next()
  }
}

export function requireAdmin(req, _res, next) {
  if (!req.user || req.user.role !== "admin") {
    return next(new HttpError(403, "Accesso admin richiesto"))
  }
  next()
}
