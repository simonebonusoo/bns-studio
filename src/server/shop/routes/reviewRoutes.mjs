import { Router } from "express"
import { z } from "zod"

import { asyncHandler } from "../lib/http.mjs"
import { prisma } from "../lib/prisma.mjs"
import { requireAuth } from "../middleware/auth.mjs"

const router = Router()

const reviewTagSchema = z.enum([
  "Poster arrivato",
  "Collezione completata",
  "Regalo riuscito",
  "Supporto attivo",
])

const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().min(3).max(80),
  body: z.string().trim().min(20).max(600),
  tag: reviewTagSchema.optional(),
})

function serializeReview(review) {
  return {
    id: review.publicId,
    rating: review.rating,
    title: review.title,
    body: review.body,
    tag: review.tag,
    createdAt: review.createdAt,
    authorName: review.user.username || review.user.firstName || review.user.email.split("@")[0],
  }
}

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const reviews = await prisma.review.findMany({
      where: { status: "approved" },
      include: {
        user: {
          select: {
            email: true,
            username: true,
            firstName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const count = reviews.length
    const averageRating = count
      ? Number((reviews.reduce((sum, review) => sum + review.rating, 0) / count).toFixed(1))
      : 0

    res.json({
      reviews: reviews.map(serializeReview),
      summary: {
        averageRating,
        count,
      },
    })
  })
)

router.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = createReviewSchema.parse(req.body)

    const review = await prisma.review.create({
      data: {
        userId: req.user.id,
        rating: body.rating,
        title: body.title,
        body: body.body,
        tag: body.tag || "Cliente verificato",
        status: "approved",
      },
      include: {
        user: {
          select: {
            email: true,
            username: true,
            firstName: true,
          },
        },
      },
    })

    res.status(201).json({
      message: "Recensione pubblicata correttamente.",
      review: serializeReview(review),
    })
  })
)

export default router
