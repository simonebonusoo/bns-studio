import { PrismaClient } from "@prisma/client"
import { resolveDatabaseUrl } from "../../../../prisma/resolve-database-url.mjs"

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: resolveDatabaseUrl(),
    },
  },
})
