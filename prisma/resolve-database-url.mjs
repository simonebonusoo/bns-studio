import fs from "node:fs"
import path from "node:path"

function ensureDir(targetPath) {
  fs.mkdirSync(targetPath, { recursive: true })
}

function migrateLegacyDatabase(targetPath, legacyCandidates) {
  if (fs.existsSync(targetPath)) {
    return
  }

  ensureDir(path.dirname(targetPath))

  const legacyPath = legacyCandidates.find((candidate) => candidate && candidate !== targetPath && fs.existsSync(candidate))
  if (legacyPath) {
    fs.copyFileSync(legacyPath, targetPath)
  }
}

export function resolveDatabaseUrl() {
  const rawValue = process.env.DATABASE_URL
  if (rawValue) {
    if (rawValue.startsWith("file:/")) {
      return rawValue
    }
    if (rawValue.startsWith("file:./") || rawValue.startsWith("file:../")) {
      const fileName = path.basename(rawValue.slice("file:".length))
      const targetPath = path.resolve(process.cwd(), "data", "shop", fileName)
      migrateLegacyDatabase(targetPath, [
        path.resolve(process.cwd(), "prisma", fileName),
        path.resolve(process.cwd(), fileName),
      ])
      return `file:${targetPath}`
    }
    return rawValue
  }

  const targetPath = path.resolve(process.cwd(), "data", "shop", "dev.db")
  migrateLegacyDatabase(targetPath, [
    path.resolve(process.cwd(), "prisma", "dev.db"),
    path.resolve(process.cwd(), "dev.db"),
  ])
  return `file:${targetPath}`
}
