import bcrypt from "bcryptjs"
import crypto from "node:crypto"
import { Router } from "express"
import { z } from "zod"

import { env } from "../config/env.mjs"
import { clearAuthCookie, createSessionState, parseRequestCookies, setAuthCookie, signToken, verifyToken } from "../lib/auth.mjs"
import { asyncHandler, HttpError } from "../lib/http.mjs"
import { logInfo, logWarning } from "../lib/monitoring.mjs"
import { prisma } from "../lib/prisma.mjs"
import { requireAuth } from "../middleware/auth.mjs"
import { createRateLimiter } from "../middleware/rate-limit.mjs"
import { sanitizePlainText } from "../lib/sanitize-text.mjs"

const router = Router()
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 8,
  keyPrefix: "auth",
  message: "Troppi tentativi. Riprova tra qualche minuto.",
})
const profileLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 20,
  keyPrefix: "profile",
  message: "Troppe modifiche profilo ravvicinate. Riprova tra poco.",
})

const passwordSchema = z.string().min(8)

const usernameSchema = z
  .string()
  .trim()
  .min(3)
  .max(32)
  .regex(/^[a-zA-Z0-9._-]+$/, "Username non valido")

const credentialsSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
})

const loginSchema = z.object({
  identifier: z.string().trim().min(1),
  password: passwordSchema,
})

function normalizeUsername(value) {
  return value.trim().toLowerCase()
}

function slugifyUsernameSeed(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 32)
}

async function ensureUniqueUsername(baseValue, excludeUserId) {
  const base = slugifyUsernameSeed(baseValue) || `user-${Date.now()}`

  for (let suffix = 0; suffix < 1000; suffix += 1) {
    const candidate = suffix === 0 ? base : `${base.slice(0, Math.max(1, 32 - String(suffix).length - 1))}-${suffix}`
    const existing = await prisma.user.findUnique({ where: { username: candidate } })
    if (!existing || existing.id === excludeUserId) {
      return candidate
    }
  }

  throw new HttpError(500, "Impossibile generare uno username univoco")
}

async function serializeUser(user) {
  const username = user.username || (await ensureUniqueUsername(user.email.split("@")[0], user.id))

  if (user.username !== username) {
    await prisma.user.update({
      where: { id: user.id },
      data: { username },
    })
  }

  return {
    id: user.id,
    email: user.email,
    username,
    firstName: user.firstName,
    lastName: user.lastName,
    shippingCountry: user.shippingCountry || null,
    shippingRegion: user.shippingRegion || null,
    shippingCity: user.shippingCity || null,
    shippingAddressLine1: user.shippingAddressLine1 || null,
    shippingStreetNumber: user.shippingStreetNumber || null,
    shippingPostalCode: user.shippingPostalCode || null,
    role: user.role,
  }
}

router.post(
  "/register",
  authLimiter,
  asyncHandler(async (req, res) => {
    const body = credentialsSchema
      .extend({
        username: usernameSchema,
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        shippingCountry: z.string().trim().min(1),
        shippingRegion: z.string().trim().min(1),
        shippingCity: z.string().trim().min(1),
        shippingAddressLine1: z.string().trim().min(1),
        shippingStreetNumber: z.string().trim().min(1),
        shippingPostalCode: z.string().trim().min(1),
      })
      .parse(req.body)

    const normalizedUsername = normalizeUsername(body.username)
    const [existingEmail, existingUsername] = await Promise.all([
      prisma.user.findUnique({ where: { email: body.email } }),
      prisma.user.findUnique({ where: { username: normalizedUsername } }),
    ])

    if (existingEmail) {
      logWarning("auth_register_conflict_email", { email: body.email.trim().toLowerCase() })
      throw new HttpError(409, "Email gia registrata")
    }

    if (existingUsername) {
      logWarning("auth_register_conflict_username", { username: normalizedUsername })
      throw new HttpError(409, "Username gia registrato")
    }

    const sessionState = createSessionState(req)
    const user = await prisma.user.create({
      data: {
        email: body.email.trim().toLowerCase(),
        username: normalizedUsername,
        passwordHash: await bcrypt.hash(body.password, 10),
        firstName: sanitizePlainText(body.firstName),
        lastName: sanitizePlainText(body.lastName),
        shippingCountry: sanitizePlainText(body.shippingCountry),
        shippingRegion: sanitizePlainText(body.shippingRegion),
        shippingCity: sanitizePlainText(body.shippingCity),
        shippingAddressLine1: sanitizePlainText(body.shippingAddressLine1),
        shippingStreetNumber: sanitizePlainText(body.shippingStreetNumber),
        shippingPostalCode: sanitizePlainText(body.shippingPostalCode),
        sessionNonce: sessionState.sessionNonce,
        sessionFingerprintHash: sessionState.sessionFingerprintHash,
      },
    })

    const token = signToken(user, sessionState.sessionNonce)
    setAuthCookie(res, token)
    logInfo("auth_register_success", {
      userId: user.id,
      role: user.role,
    })
    return res.status(201).json({
      user: await serializeUser(user),
    })
  })
)

router.post(
  "/login",
  authLimiter,
  asyncHandler(async (req, res) => {
    const body = loginSchema.parse(req.body)
    const identifier = body.identifier.trim()
    const user = identifier.includes("@")
      ? await prisma.user.findUnique({ where: { email: identifier.toLowerCase() } })
      : await prisma.user.findUnique({ where: { username: normalizeUsername(identifier) } })

    if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
      logWarning("auth_login_failed", {
        identifierType: identifier.includes("@") ? "email" : "username",
      })
      throw new HttpError(401, "Credenziali non valide")
    }

    const sessionState = createSessionState(req)
    const authenticatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        sessionNonce: sessionState.sessionNonce,
        sessionFingerprintHash: sessionState.sessionFingerprintHash,
      },
    })

    const token = signToken(authenticatedUser, sessionState.sessionNonce)
    setAuthCookie(res, token)
    logInfo("auth_login_success", {
      userId: authenticatedUser.id,
      role: authenticatedUser.role,
      identifierType: identifier.includes("@") ? "email" : "username",
    })
    return res.status(200).json({
      user: await serializeUser(authenticatedUser),
    })
  })
)

router.post(
  "/logout",
  asyncHandler(async (req, res) => {
    const cookies = parseRequestCookies(req.headers.cookie)
    const token = cookies[env.authCookieName]

    if (token) {
      try {
        const payload = verifyToken(token)
        await prisma.user.update({
          where: { id: Number(payload.sub) },
          data: {
            sessionNonce: crypto.randomUUID(),
            sessionFingerprintHash: null,
          },
        })
      } catch {}
    }
    clearAuthCookie(res)
    return res.status(200).json({ ok: true })
  }),
)

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    return res.status(200).json({
      user: await serializeUser(req.user),
    })
  })
)

router.patch(
  "/profile",
  requireAuth,
  profileLimiter,
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        username: usernameSchema.optional(),
        firstName: z.string().trim().min(1).optional(),
        lastName: z.string().trim().min(1).optional(),
        email: z.string().trim().email().optional(),
        shippingCountry: z.string().trim().min(1).optional(),
        shippingRegion: z.string().trim().min(1).optional(),
        shippingCity: z.string().trim().min(1).optional(),
        shippingAddressLine1: z.string().trim().min(1).optional(),
        shippingStreetNumber: z.string().trim().min(1).optional(),
        shippingPostalCode: z.string().trim().min(1).optional(),
        currentPassword: passwordSchema.optional(),
        newPassword: passwordSchema.optional(),
      })
      .refine((value) => value.username || value.firstName || value.lastName || value.email || value.newPassword || value.shippingCountry || value.shippingRegion || value.shippingCity || value.shippingAddressLine1 || value.shippingStreetNumber || value.shippingPostalCode, {
        message: "Nessuna modifica richiesta",
      })
      .parse(req.body)

    const updates = {}
    const wantsSensitiveUpdate = Boolean(
      body.username ||
        body.email ||
        body.newPassword ||
        body.shippingCountry ||
        body.shippingRegion ||
        body.shippingCity ||
        body.shippingAddressLine1 ||
        body.shippingStreetNumber ||
        body.shippingPostalCode,
    )
    let currentPasswordMatches = false

    if (wantsSensitiveUpdate) {
      if (!body.currentPassword?.trim()) {
        throw new HttpError(400, "Inserisci la password per confermare la modifica")
      }

      currentPasswordMatches = await bcrypt.compare(body.currentPassword, req.user.passwordHash)
      if (!currentPasswordMatches) {
        throw new HttpError(401, "Password non corretta")
      }
    }

    if (body.username) {
      const username = normalizeUsername(body.username)
      const existingUsername = await prisma.user.findUnique({ where: { username } })
      if (existingUsername && existingUsername.id !== req.user.id) {
        throw new HttpError(409, "Username gia registrato")
      }
      updates.username = username
    }

    if (body.firstName) {
      updates.firstName = sanitizePlainText(body.firstName)
    }

    if (body.lastName) {
      updates.lastName = sanitizePlainText(body.lastName)
    }

    if (body.shippingCountry) {
      updates.shippingCountry = sanitizePlainText(body.shippingCountry)
    }

    if (body.shippingRegion) {
      updates.shippingRegion = sanitizePlainText(body.shippingRegion)
    }

    if (body.shippingCity) {
      updates.shippingCity = sanitizePlainText(body.shippingCity)
    }

    if (body.shippingAddressLine1) {
      updates.shippingAddressLine1 = sanitizePlainText(body.shippingAddressLine1)
    }

    if (body.shippingStreetNumber) {
      updates.shippingStreetNumber = sanitizePlainText(body.shippingStreetNumber)
    }

    if (body.shippingPostalCode) {
      updates.shippingPostalCode = sanitizePlainText(body.shippingPostalCode)
    }

    if (body.email) {
      const email = body.email.trim().toLowerCase()
      const existingEmail = await prisma.user.findUnique({ where: { email } })
      if (existingEmail && existingEmail.id !== req.user.id) {
        throw new HttpError(409, "Email gia registrata")
      }
      updates.email = email
      logInfo("profile_email_change_requested", {
        userId: req.user.id,
      })
    }

    if (body.newPassword) {
      updates.passwordHash = await bcrypt.hash(body.newPassword, 10)
      logInfo("profile_password_change_requested", {
        userId: req.user.id,
      })
    }

    const sessionState = createSessionState(req)
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...updates,
        sessionNonce: sessionState.sessionNonce,
        sessionFingerprintHash: sessionState.sessionFingerprintHash,
      },
    })
    setAuthCookie(res, signToken(user, sessionState.sessionNonce))

    logInfo("profile_updated", {
      userId: req.user.id,
      changedFields: Object.keys(updates)
        .filter((key) => key !== "passwordHash")
        .concat(body.newPassword ? ["password"] : []),
    })

    return res.status(200).json({
      user: await serializeUser(user),
    })
  })
)

export default router
