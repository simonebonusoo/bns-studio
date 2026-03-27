import fs from "node:fs"
import path from "node:path"

import { resolveDatabaseUrl } from "../prisma/resolve-database-url.mjs"
import { reportError, logInfo, logWarning } from "../src/server/shop/lib/monitoring.mjs"
import { resolveProductsArchiveRoot } from "../src/server/shop/lib/product-mirror.mjs"
import { resolveBackupsRootDir } from "../src/server/shop/lib/storage-paths.mjs"
import { resolveUploadsRootDir } from "../src/server/shop/lib/uploads-storage.mjs"

function normalizeFileDatabasePath(databaseUrl) {
  if (!databaseUrl.startsWith("file:")) {
    throw new Error("Il restore automatico supporta solo DATABASE_URL file-based.")
  }

  return databaseUrl.slice("file:".length)
}

function listBackupDirectories(backupsRoot) {
  if (!fs.existsSync(backupsRoot)) return []
  return fs
    .readdirSync(backupsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(backupsRoot, entry.name))
    .sort()
}

function resolveRequestedBackupDir() {
  const explicitArg = process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : ""
  const backupsRoot = resolveBackupsRootDir()

  if (explicitArg) {
    return path.resolve(explicitArg)
  }

  const available = listBackupDirectories(backupsRoot)
  const latest = available.at(-1)
  if (!latest) {
    throw new Error("Nessun backup disponibile da ripristinare.")
  }
  return latest
}

function ensureForced() {
  if (!process.argv.includes("--force")) {
    throw new Error("Restore bloccato: usa --force per confermare la sovrascrittura dei dati attuali.")
  }
}

function resetTarget(targetPath) {
  fs.rmSync(targetPath, { recursive: true, force: true })
  fs.mkdirSync(path.dirname(targetPath), { recursive: true })
}

function restorePath(sourcePath, targetPath) {
  if (!fs.existsSync(sourcePath)) return false
  const sourceStats = fs.statSync(sourcePath)
  if (sourceStats.isDirectory()) {
    fs.rmSync(targetPath, { recursive: true, force: true })
    fs.mkdirSync(path.dirname(targetPath), { recursive: true })
    fs.cpSync(sourcePath, targetPath, { recursive: true })
    return true
  }

  resetTarget(targetPath)
  fs.copyFileSync(sourcePath, targetPath)
  return true
}

function createSafetyBackupName() {
  return `pre-restore-${new Date().toISOString().replace(/[:.]/g, "-")}`
}

async function main() {
  ensureForced()

  const backupDir = resolveRequestedBackupDir()
  const manifestPath = path.join(backupDir, "manifest.json")
  const databasePath = normalizeFileDatabasePath(resolveDatabaseUrl())
  const uploadsRoot = resolveUploadsRootDir()
  const productsMirrorRoot = resolveProductsArchiveRoot()
  const backupsRoot = resolveBackupsRootDir()

  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifest backup mancante: ${manifestPath}`)
  }

  const safetyBackupDir = path.join(backupsRoot, createSafetyBackupName())
  fs.mkdirSync(safetyBackupDir, { recursive: true })
  restorePath(databasePath, path.join(safetyBackupDir, "shop-db", path.basename(databasePath)))
  restorePath(uploadsRoot, path.join(safetyBackupDir, "uploads"))
  restorePath(productsMirrorRoot, path.join(safetyBackupDir, "Prodotti"))

  const restored = {
    database: restorePath(path.join(backupDir, "shop-db", path.basename(databasePath)), databasePath),
    uploads: restorePath(path.join(backupDir, "uploads"), uploadsRoot),
    productsMirror: restorePath(path.join(backupDir, "Prodotti"), productsMirrorRoot),
  }

  const payload = {
    restoredFrom: backupDir,
    safetyBackupDir,
    restored,
  }

  logWarning("shop_restore_executed", payload)
  logInfo("shop_restore_safety_backup_created", { safetyBackupDir })
  console.log(`[shop-restore] Restore completato da ${backupDir}`)
  console.log(`[shop-restore] Safety backup creato in ${safetyBackupDir}`)
}

main().catch((error) => {
  reportError(error, { event: "shop_restore_failed" })
  console.error("[shop-restore] Restore fallito")
  console.error(error)
  process.exit(1)
})
