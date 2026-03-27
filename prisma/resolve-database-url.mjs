import fs from "node:fs"
import path from "node:path"

const RENDER_PERSISTENT_ROOT = "/var/data"

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

  if (process.env.RENDER || process.env.RENDER_SERVICE_ID || process.env.RENDER_EXTERNAL_URL) {
    const targetPath = path.join(RENDER_PERSISTENT_ROOT, "shop", "dev.db")
    migrateLegacyDatabase(targetPath, [
      path.resolve("/opt/render/project/src/data/shop/dev.db"),
      path.resolve("/opt/render/project/src/data/dev.db"),
      path.resolve(process.cwd(), "prisma", "dev.db"),
      path.resolve(process.cwd(), "dev.db"),
    ])
    return `file:${targetPath}`
  }

  const targetPath = path.resolve(process.cwd(), "data", "shop", "dev.db")
  migrateLegacyDatabase(targetPath, [
    path.resolve(process.cwd(), "prisma", "dev.db"),
    path.resolve(process.cwd(), "dev.db"),
  ])
  return `file:${targetPath}`
}
