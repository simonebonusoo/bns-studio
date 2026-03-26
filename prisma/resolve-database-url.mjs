import path from "node:path"

export function resolveDatabaseUrl() {
  const rawValue = process.env.DATABASE_URL
  if (rawValue) {
    if (rawValue.startsWith("file:./") || rawValue.startsWith("file:../")) {
      const filePath = rawValue.slice("file:".length)
      return `file:${path.resolve(process.cwd(), filePath)}`
    }
    return rawValue
  }

  return `file:${path.resolve(process.cwd(), "prisma", "dev.db")}`
}
