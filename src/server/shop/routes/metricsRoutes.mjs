import { Router } from "express"
import { z } from "zod"

import { asyncHandler } from "../lib/http.mjs"
import { prisma } from "../lib/prisma.mjs"

const router = Router()

router.post(
  "/page-view",
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        path: z.string().min(1).max(200),
      })
      .parse(req.body)

    await prisma.pageView.create({
      data: {
        path: body.path,
      },
    })

    res.status(204).send()
  })
)

export default router
