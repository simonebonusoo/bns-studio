import path from "node:path"
import { PrismaClient } from "@prisma/client"

function resolveDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL
  }

  const dbPath = path.resolve(process.cwd(), "prisma", "dev.db")
  return `file:${dbPath}`
}

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: resolveDatabaseUrl(),
    },
  },
})
