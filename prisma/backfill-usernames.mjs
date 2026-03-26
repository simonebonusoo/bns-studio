import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { resolveDatabaseUrl } from "./resolve-database-url.mjs"

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: resolveDatabaseUrl(),
    },
  },
})

function slugifyUsernameSeed(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 32)
}

async function ensureUniqueUsername(baseValue, excludeUserId) {
  const base = slugifyUsernameSeed(baseValue) || `user-${excludeUserId}`

  for (let suffix = 0; suffix < 1000; suffix += 1) {
    const candidate = suffix === 0 ? base : `${base.slice(0, Math.max(1, 32 - String(suffix).length - 1))}-${suffix}`
    const existing = await prisma.user.findUnique({ where: { username: candidate } })
    if (!existing || existing.id === excludeUserId) {
      return candidate
    }
  }

  throw new Error(`Unable to generate unique username for user ${excludeUserId}`)
}

async function main() {
  const users = await prisma.user.findMany({
    where: { OR: [{ username: null }, { username: "" }] },
    orderBy: { id: "asc" },
  })

  for (const user of users) {
    const username = await ensureUniqueUsername(user.email.split("@")[0], user.id)
    await prisma.user.update({
      where: { id: user.id },
      data: { username },
    })
    console.log(`[backfill-usernames] ${user.email} -> ${username}`)
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
