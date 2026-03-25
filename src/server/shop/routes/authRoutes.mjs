import bcrypt from "bcryptjs"
import { Router } from "express"
import { z } from "zod"

import { signToken } from "../lib/auth.mjs"
import { asyncHandler, HttpError } from "../lib/http.mjs"
import { prisma } from "../lib/prisma.mjs"
import { requireAuth } from "../middleware/auth.mjs"

const router = Router()

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const body = credentialsSchema
      .extend({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
      })
      .parse(req.body)

    const existing = await prisma.user.findUnique({ where: { email: body.email } })
    if (existing) {
      throw new HttpError(409, "Email gia registrata")
    }

    const user = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash: await bcrypt.hash(body.password, 10),
        firstName: body.firstName,
        lastName: body.lastName,
      },
    })

    return res.status(201).json({
      token: signToken(user),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    })
  })
)

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const body = credentialsSchema.parse(req.body)
    const user = await prisma.user.findUnique({ where: { email: body.email } })

    if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
      throw new HttpError(401, "Credenziali non valide")
    }

    return res.status(200).json({
      token: signToken(user),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    })
  })
)

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    return res.status(200).json({
      user: {
        id: req.user.id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        role: req.user.role,
      },
    })
  })
)

export default router
