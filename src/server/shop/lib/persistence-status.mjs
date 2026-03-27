import { resolveDatabaseUrl } from "../../../../prisma/resolve-database-url.mjs"
import { env } from "../config/env.mjs"
import { assetStorageWritesAreConfigured, getAssetStorageMode, isCloudinaryConfigured } from "./asset-storage.mjs"
import { resolveUploadsRootDir } from "./uploads-storage.mjs"

function normalizeFileUrlPath(fileUrl) {
  if (!fileUrl?.startsWith("file:")) return ""
  return fileUrl.slice("file:".length)
}

function isTruthy(value) {
  return ["1", "true", "yes", "on"].includes(String(value || "").trim().toLowerCase())
}

export function getPersistenceStatus() {
  const databaseUrl = resolveDatabaseUrl()
  const uploadsRootDir = resolveUploadsRootDir(env.uploadsDir)
  const assetStorageMode = getAssetStorageMode()
  const databasePath = normalizeFileUrlPath(databaseUrl)
  const nodeEnv = process.env.NODE_ENV || "development"
  const isProduction = nodeEnv === "production"
  const isRender = Boolean(process.env.RENDER || process.env.RENDER_SERVICE_ID || process.env.RENDER_EXTERNAL_URL)
  const renderDiskMountPath = process.env.RENDER_DISK_PATH || ""
  const persistentStorageEnabled = isTruthy(process.env.PERSISTENT_STORAGE_ENABLED)
  const renderDiskConfigured = Boolean(renderDiskMountPath)

  const databaseOnRenderEphemeralFs =
    isRender && databasePath.startsWith("/opt/render/project/src") && (!renderDiskMountPath || !databasePath.startsWith(renderDiskMountPath))
  const uploadsOnRenderEphemeralFs =
    isRender &&
    uploadsRootDir.startsWith("/opt/render/project/src") &&
    (!renderDiskMountPath || !uploadsRootDir.startsWith(renderDiskMountPath))

  const uploadsGuaranteed =
    assetStorageMode === "cloudinary"
      ? isCloudinaryConfigured()
      : !isProduction || persistentStorageEnabled || (renderDiskConfigured && !uploadsOnRenderEphemeralFs)

  const databaseGuaranteed =
    !isProduction ||
    persistentStorageEnabled ||
    (renderDiskConfigured && !databaseOnRenderEphemeralFs) ||
    (!databasePath.startsWith("/opt/render/project/src") && !databasePath.endsWith("/data/shop/dev.db"))

  const storageGuaranteed = databaseGuaranteed && uploadsGuaranteed && assetStorageWritesAreConfigured()

  const warnings = []

  if (isProduction && !storageGuaranteed) {
    warnings.push(
      "Storage runtime non garantito: il catalogo puo sembrare scrivibile, ma database e upload locali potrebbero perdersi dopo restart o redeploy."
    )
  }

  if (isRender && databaseOnRenderEphemeralFs) {
    warnings.push("Il database SQLite sta usando il filesystem locale di Render senza disk persistente.")
  }

  if (isRender && uploadsOnRenderEphemeralFs) {
    warnings.push("Gli upload immagini stanno usando il filesystem locale di Render senza disk persistente.")
  }

  if (assetStorageMode === "cloudinary" && !isCloudinaryConfigured()) {
    warnings.push("ASSET_STORAGE_MODE=cloudinary ma la configurazione Cloudinary e incompleta.")
  }

  return {
    environment: {
      nodeEnv,
      isProduction,
      isRender,
    },
    storage: {
      databaseUrl,
      databasePath,
      uploadsRootDir,
      assetStorageMode,
      renderDiskMountPath,
      persistentStorageEnabled,
      databaseGuaranteed,
      uploadsGuaranteed,
      storageGuaranteed,
    },
    warnings,
  }
}

export function logPersistenceStatus() {
  const status = getPersistenceStatus()

  console.log(`[persistence] DATABASE_URL=${status.storage.databaseUrl}`)
  console.log(`[persistence] UPLOADS_DIR=${status.storage.uploadsRootDir}`)

  if (status.storage.storageGuaranteed) {
    console.log("[persistence] Runtime storage status: OK")
  } else {
    console.warn("[persistence] Runtime storage status: NOT GUARANTEED")
    status.warnings.forEach((warning) => {
      console.warn(`[persistence] ${warning}`)
    })
  }

  return status
}
