import bcrypt from "bcryptjs"
import { Router } from "express"
import { z } from "zod"

import { signToken } from "../lib/auth.mjs"
import { asyncHandler, HttpError } from "../lib/http.mjs"
import { prisma } from "../lib/prisma.mjs"
import { sanitizePlainText } from "../lib/sanitize-text.mjs"
import { requireAuth } from "../middleware/auth.mjs"

const router = Router()

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

async function findFirstRegistrationCoupon() {
  const now = new Date()
  const candidates = await prisma.coupon.findMany({
    where: {
      type: "first_registration",
      active: true,
      OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  })

  return candidates.find((coupon) => !coupon.usageLimit || coupon.usageCount < coupon.usageLimit) || null
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
        source: z.enum(["promo_popup"]).optional(),
      })
      .parse(req.body)

    const normalizedUsername = normalizeUsername(body.username)
    const [existingEmail, existingUsername] = await Promise.all([
      prisma.user.findUnique({ where: { email: body.email } }),
      prisma.user.findUnique({ where: { username: normalizedUsername } }),
    ])

    if (existingEmail) {
      throw new HttpError(409, "Email gia registrata")
    }

    if (existingUsername) {
      throw new HttpError(409, "Username gia registrato")
    }

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
      },
    })

    const firstRegistrationCoupon = body.source === "promo_popup" ? await findFirstRegistrationCoupon() : null

    return res.status(201).json({
      token: signToken(user),
      user: await serializeUser(user),
      firstRegistrationCoupon: firstRegistrationCoupon ? { code: firstRegistrationCoupon.code, amount: firstRegistrationCoupon.amount } : null,
    })
  })
)

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const body = loginSchema.parse(req.body)
    const identifier = body.identifier.trim()
    const user = identifier.includes("@")
      ? await prisma.user.findUnique({ where: { email: identifier.toLowerCase() } })
      : await prisma.user.findUnique({ where: { username: normalizeUsername(identifier) } })

    if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
      throw new HttpError(401, "Credenziali non valide")
    }

    return res.status(200).json({
      token: signToken(user),
      user: await serializeUser(user),
    })
  })
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

    if (wantsSensitiveUpdate) {
      if (!body.currentPassword?.trim()) {
        throw new HttpError(400, "Inserisci la password per confermare la modifica")
      }

      const matches = await bcrypt.compare(body.currentPassword, req.user.passwordHash)
      if (!matches) {
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
    }

    if (body.newPassword) {
      updates.passwordHash = await bcrypt.hash(body.newPassword, 10)
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updates,
    })

    return res.status(200).json({
      user: await serializeUser(user),
    })
  })
)

export default router
