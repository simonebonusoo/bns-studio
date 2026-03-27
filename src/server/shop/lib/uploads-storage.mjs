import fs from "node:fs"
import path from "node:path"

const RENDER_PERSISTENT_ROOT = "/var/data"
const defaultUploadsRootDir = path.resolve(process.cwd(), "data", "uploads")
const legacyUploadsRootDir = path.resolve(process.cwd(), "src", "server", "uploads")

function ensureDir(targetPath) {
  fs.mkdirSync(targetPath, { recursive: true })
}

function tryEnsureDir(targetPath) {
  try {
    ensureDir(targetPath)
    return true
  } catch {
    return false
  }
}

function isTruthy(value) {
  return ["1", "true", "yes", "on"].includes(String(value || "").trim().toLowerCase())
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

function getRenderEphemeralRoot() {
  return path.resolve(process.cwd(), "data")
}

function persistentStorageForced() {
  return isTruthy(process.env.FORCE_PERSISTENT_STORAGE)
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
    const fallbackPath = path.join(getRenderEphemeralRoot(), "uploads")
    const candidate = rawValue ? path.resolve(rawValue) : expectedPath
    const strictPersistence = persistentStorageForced()

    if (candidate.startsWith(renderRoot)) {
      if (tryEnsureDir(candidate)) {
        uploadsRootDir = candidate
      } else if (strictPersistence) {
        throw new Error(
          `[persistence] FORCE_PERSISTENT_STORAGE=true but uploads path is not writable: ${candidate}`,
        )
      } else {
        console.warn(
          `[persistence] Persistent uploads path unavailable on Render (${candidate}). Falling back to ${fallbackPath}`,
        )
        tryEnsureDir(fallbackPath)
        uploadsRootDir = fallbackPath
      }
    } else if (strictPersistence) {
      throw new Error(
        `[persistence] FORCE_PERSISTENT_STORAGE=true but UPLOADS_DIR is outside the Render disk mount: ${candidate}`,
      )
    } else {
      console.warn(
        `[persistence] Non-persistent UPLOADS_DIR on Render detected: ${candidate}. Falling back to ${fallbackPath}`,
      )
      tryEnsureDir(fallbackPath)
      uploadsRootDir = fallbackPath
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
