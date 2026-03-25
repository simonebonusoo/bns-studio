import path from "node:path"
import { PrismaClient } from "@prisma/client"

const dbPath = path.resolve(process.cwd(), "prisma", "dev.db")

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${dbPath}`,
    },
  },
})
