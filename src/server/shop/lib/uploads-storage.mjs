import fs from "node:fs"
import path from "node:path"

const RENDER_PERSISTENT_ROOT = "/var/data"
const defaultUploadsRootDir = path.resolve(process.cwd(), "data", "uploads")
const legacyUploadsRootDir = path.resolve(process.cwd(), "src", "server", "uploads")

function ensureDir(targetPath) {
  fs.mkdirSync(targetPath, { recursive: true })
}

function legacyMigrationEnabled() {
  return String(process.env.SHOP_ALLOW_LEGACY_STORAGE_MIGRATION || "")
    .trim()
    .toLowerCase() === "true"
}

function isRenderRuntime() {
  return Boolean(process.env.RENDER || process.env.RENDER_SERVICE_ID || process.env.RENDER_EXTERNAL_URL)
}

function getRenderPersistentRoot() {
  return process.env.RENDER_DISK_PATH || RENDER_PERSISTENT_ROOT
}

function migrateLegacyProductUploads(targetRootDir) {
  if (!legacyMigrationEnabled()) {
    ensureDir(path.join(targetRootDir, "products"))
    return
  }

  const targetProductsDir = path.join(targetRootDir, "products")
  const legacyProductsDir = path.join(legacyUploadsRootDir, "products")

  ensureDir(targetProductsDir)

  if (!fs.existsSync(legacyProductsDir)) {
    return
  }

  for (const entry of fs.readdirSync(legacyProductsDir, { withFileTypes: true })) {
    if (!entry.isFile()) continue
    const legacyFilePath = path.join(legacyProductsDir, entry.name)
    const targetFilePath = path.join(targetProductsDir, entry.name)

    if (!fs.existsSync(targetFilePath)) {
      fs.copyFileSync(legacyFilePath, targetFilePath)
    }
  }
}

export function resolveUploadsRootDir(rawValue = process.env.UPLOADS_DIR || "") {
  const isRender = isRenderRuntime()
  const renderRoot = getRenderPersistentRoot()
  let uploadsRootDir = defaultUploadsRootDir

  if (isRender) {
    const expectedPath = path.join(renderRoot, "uploads")
    const candidate = rawValue ? path.resolve(rawValue) : expectedPath
    if (candidate.startsWith(renderRoot)) {
      uploadsRootDir = candidate
    } else {
      console.warn(
        `[persistence] Ignoring non-persistent UPLOADS_DIR on Render: ${candidate}. Falling back to ${expectedPath}`,
      )
      uploadsRootDir = expectedPath
    }
  } else if (rawValue) {
    uploadsRootDir = path.resolve(rawValue)
  }

  ensureDir(uploadsRootDir)
  migrateLegacyProductUploads(uploadsRootDir)
  return uploadsRootDir
}

export function resolveProductUploadsDir(rawValue = process.env.UPLOADS_DIR || "") {
  const uploadsRootDir = resolveUploadsRootDir(rawValue)
  const uploadsDir = path.join(uploadsRootDir, "products")
  ensureDir(uploadsDir)
  return uploadsDir
}
