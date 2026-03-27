import fs from "node:fs"
import path from "node:path"

import { resolveDatabaseUrl } from "../prisma/resolve-database-url.mjs"
import { reportError, logInfo } from "../src/server/shop/lib/monitoring.mjs"
import { resolveProductsArchiveRoot } from "../src/server/shop/lib/product-mirror.mjs"
import { resolveBackupsRootDir } from "../src/server/shop/lib/storage-paths.mjs"
import { resolveUploadsRootDir } from "../src/server/shop/lib/uploads-storage.mjs"

function normalizeFileDatabasePath(databaseUrl) {
  if (!databaseUrl.startsWith("file:")) {
    throw new Error("Il backup automatico supporta solo DATABASE_URL file-based.")
  }

  return databaseUrl.slice("file:".length)
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-")
}

function copyPathIfExists(sourcePath, targetPath) {
  if (!fs.existsSync(sourcePath)) return false
  fs.mkdirSync(path.dirname(targetPath), { recursive: true })
  fs.cpSync(sourcePath, targetPath, { recursive: true })
  return true
}

async function main() {
  const databasePath = normalizeFileDatabasePath(resolveDatabaseUrl())
  const uploadsRoot = resolveUploadsRootDir()
  const productsMirrorRoot = resolveProductsArchiveRoot()
  const backupsRoot = resolveBackupsRootDir()
  const backupDir = path.join(backupsRoot, timestamp())

  fs.mkdirSync(backupDir, { recursive: true })

  const copied = {
    database: copyPathIfExists(databasePath, path.join(backupDir, "shop-db", path.basename(databasePath))),
    uploads: copyPathIfExists(uploadsRoot, path.join(backupDir, "uploads")),
    productsMirror: copyPathIfExists(productsMirrorRoot, path.join(backupDir, "Prodotti")),
  }

  const manifest = {
    createdAt: new Date().toISOString(),
    backupDir,
    databasePath,
    uploadsRoot,
    productsMirrorRoot,
    copied,
  }

  fs.writeFileSync(path.join(backupDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8")
  logInfo("shop_backup_created", manifest)
  console.log(`[shop-backup] Backup creato in ${backupDir}`)
}

main().catch((error) => {
  reportError(error, { event: "shop_backup_failed" })
  console.error("[shop-backup] Backup fallito")
  console.error(error)
  process.exit(1)
})
