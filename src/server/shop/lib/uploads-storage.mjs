import fs from "node:fs"
import path from "node:path"

const RENDER_PERSISTENT_ROOT = "/var/data"
const defaultUploadsRootDir = path.resolve(process.cwd(), "data", "uploads")
const legacyUploadsRootDir = path.resolve(process.cwd(), "src", "server", "uploads")

function ensureDir(targetPath) {
  fs.mkdirSync(targetPath, { recursive: true })
}

function migrateLegacyProductUploads(targetRootDir) {
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
  const uploadsRootDir =
    rawValue
      ? path.resolve(rawValue)
      : process.env.RENDER || process.env.RENDER_SERVICE_ID || process.env.RENDER_EXTERNAL_URL
        ? path.join(RENDER_PERSISTENT_ROOT, "uploads")
        : defaultUploadsRootDir
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
