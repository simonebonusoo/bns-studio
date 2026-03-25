import { prisma } from "../lib/prisma.js";
import { verifyToken } from "../lib/auth.js";
import { HttpError } from "../lib/http.js";

export async function requireAuth(req, _res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new HttpError(401, "Autenticazione richiesta"));
  }

  try {
    const payload = verifyToken(header.slice(7));
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      throw new HttpError(401, "Utente non trovato");
    }
    req.user = user;
    next();
  } catch (error) {
    next(error instanceof HttpError ? error : new HttpError(401, "Token non valido"));
  }
}

export function requireAdmin(req, _res, next) {
  if (!req.user || req.user.role !== "admin") {
    return next(new HttpError(403, "Accesso admin richiesto"));
  }
  next();
}
