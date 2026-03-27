import fs from "node:fs"
import path from "node:path"

const RENDER_PERSISTENT_ROOT = "/var/data"

function isRenderRuntime() {
  return Boolean(process.env.RENDER || process.env.RENDER_SERVICE_ID || process.env.RENDER_EXTERNAL_URL)
}

function getRenderPersistentRoot() {
  return process.env.RENDER_DISK_PATH || RENDER_PERSISTENT_ROOT
}

function ensureDir(targetPath) {
  fs.mkdirSync(targetPath, { recursive: true })
}

function legacyMigrationEnabled() {
  return String(process.env.SHOP_ALLOW_LEGACY_STORAGE_MIGRATION || "")
    .trim()
    .toLowerCase() === "true"
}

function migrateLegacyDatabase(targetPath, legacyCandidates) {
  if (!legacyMigrationEnabled()) {
    ensureDir(path.dirname(targetPath))
    return
  }

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
  const isRender = isRenderRuntime()
  const renderRoot = getRenderPersistentRoot()

  if (isRender) {
    const expectedPath = path.join(renderRoot, "shop", "dev.db")

    if (!rawValue) {
      migrateLegacyDatabase(expectedPath, [])
      return `file:${expectedPath}`
    }

    if (!rawValue.startsWith("file:")) {
      return rawValue
    }

    const rawPath = rawValue.slice("file:".length)
    if (path.isAbsolute(rawPath) && rawPath.startsWith(renderRoot)) {
      ensureDir(path.dirname(rawPath))
      return rawValue
    }

    console.warn(
      `[persistence] Ignoring non-persistent DATABASE_URL on Render: ${rawValue}. Falling back to file:${expectedPath}`,
    )
    migrateLegacyDatabase(expectedPath, [])
    return `file:${expectedPath}`
  }

  if (rawValue) {
    if (rawValue.startsWith("file:/")) {
      ensureDir(path.dirname(rawValue.slice("file:".length)))
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
