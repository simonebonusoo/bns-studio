import fs from "node:fs"
import path from "node:path"

import { resolveDatabaseUrl } from "../prisma/resolve-database-url.mjs"
import { reportError, logInfo, logWarning } from "../src/server/shop/lib/monitoring.mjs"
import { resolveProductsArchiveRoot } from "../src/server/shop/lib/product-mirror.mjs"
import { removeSqliteRelatedFiles, resolveSqliteRelatedFiles } from "../src/server/shop/lib/sqlite-files.mjs"
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

function parseCliArgs(argv) {
  const options = {
    force: false,
    source: "",
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]

    if (arg === "--force") {
      options.force = true
      continue
    }

    if (arg === "--source" || arg === "--backup") {
      options.source = argv[index + 1] || ""
      index += 1
      continue
    }

    if (!arg.startsWith("--") && !options.source) {
      options.source = arg
    }
  }

  return options
}

function ensureForced(cliOptions) {
  if (!cliOptions.force) {
    throw new Error("Restore bloccato: usa --force per confermare la sovrascrittura dei dati attuali.")
  }
}

function validateBackupDir(backupDir) {
  const reasons = []
  const manifestPath = path.join(backupDir, "manifest.json")
  const shopDbDir = path.join(backupDir, "shop-db")
  const uploadsDir = path.join(backupDir, "uploads")
  const productsDir = path.join(backupDir, "Prodotti")

  if (!fs.existsSync(backupDir)) {
    return {
      valid: false,
      reasons: [`Backup non trovato: ${backupDir}`],
    }
  }

  if (!fs.existsSync(manifestPath)) {
    reasons.push("manifest.json mancante")
  } else {
    try {
      JSON.parse(fs.readFileSync(manifestPath, "utf8"))
    } catch {
      reasons.push("manifest.json non valido")
    }
  }

  if (!fs.existsSync(shopDbDir) || !fs.statSync(shopDbDir).isDirectory()) {
    reasons.push("cartella shop-db mancante")
  } else {
    const dbFiles = fs.readdirSync(shopDbDir).filter((entry) => entry.endsWith(".db") || entry.includes(".db-"))
    if (dbFiles.length === 0) {
      reasons.push("nessun file database trovato in shop-db")
    }
  }

  if (!fs.existsSync(uploadsDir) || !fs.statSync(uploadsDir).isDirectory()) {
    reasons.push("cartella uploads mancante")
  }

  if (!fs.existsSync(productsDir) || !fs.statSync(productsDir).isDirectory()) {
    reasons.push("cartella Prodotti mancante")
  }

  return {
    valid: reasons.length === 0,
    reasons,
  }
}

function formatInvalidCandidates(invalidCandidates) {
  if (!invalidCandidates.length) return ""
  return invalidCandidates
    .map((candidate) => `- ${candidate.path}: ${candidate.reasons.join(", ")}`)
    .join("\n")
}

function resolveRequestedBackupDir(cliOptions) {
  const backupsRoot = resolveBackupsRootDir()

  if (cliOptions.source) {
    const explicitPath = path.resolve(cliOptions.source)
    const validation = validateBackupDir(explicitPath)
    if (!validation.valid) {
      throw new Error(`Backup sorgente non valido:\n- ${validation.reasons.join("\n- ")}`)
    }
    return explicitPath
  }

  const candidates = listBackupDirectories(backupsRoot)
    .filter((backupDir) => !path.basename(backupDir).startsWith("pre-restore-"))
    .map((backupDir) => ({
      path: backupDir,
      ...validateBackupDir(backupDir),
    }))

  const validCandidates = candidates.filter((candidate) => candidate.valid)
  const latest = validCandidates.at(-1)

  if (latest) {
    return latest.path
  }

  const invalidDetails = formatInvalidCandidates(candidates.filter((candidate) => !candidate.valid))
  throw new Error(
    invalidDetails
      ? `Nessun backup valido disponibile per il restore automatico.\nBackup trovati ma non validi:\n${invalidDetails}`
      : "Nessun backup valido disponibile per il restore automatico."
  )
}

function resetTarget(targetPath) {
  fs.rmSync(targetPath, { recursive: true, force: true })
  fs.mkdirSync(path.dirname(targetPath), { recursive: true })
}

function copyPathIfExists(sourcePath, targetPath) {
  if (!fs.existsSync(sourcePath)) return false
  fs.mkdirSync(path.dirname(targetPath), { recursive: true })
  fs.cpSync(sourcePath, targetPath, { recursive: true })
  return true
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

function createStructuredBackupSnapshot({ backupDir, databasePath, sqliteFiles, uploadsRoot, productsMirrorRoot, label }) {
  fs.mkdirSync(backupDir, { recursive: true })

  const copied = {
    databaseFiles: sqliteFiles
      .map((filePath) => ({
        source: filePath,
        copied: copyPathIfExists(filePath, path.join(backupDir, "shop-db", path.basename(filePath))),
      }))
      .filter((entry) => entry.copied),
    uploads: copyPathIfExists(uploadsRoot, path.join(backupDir, "uploads")),
    productsMirror: copyPathIfExists(productsMirrorRoot, path.join(backupDir, "Prodotti")),
  }

  const manifest = {
    createdAt: new Date().toISOString(),
    backupDir,
    databasePath,
    sqliteFiles,
    uploadsRoot,
    productsMirrorRoot,
    copied,
    kind: label,
  }

  fs.writeFileSync(path.join(backupDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8")
  return manifest
}

async function main() {
  const cliOptions = parseCliArgs(process.argv.slice(2))
  ensureForced(cliOptions)

  const backupDir = resolveRequestedBackupDir(cliOptions)
  const databasePath = normalizeFileDatabasePath(resolveDatabaseUrl())
  const uploadsRoot = resolveUploadsRootDir()
  const productsMirrorRoot = resolveProductsArchiveRoot()
  const backupsRoot = resolveBackupsRootDir()
  const sqliteFiles = resolveSqliteRelatedFiles(databasePath)

  const safetyBackupDir = path.join(backupsRoot, createSafetyBackupName())
  const safetyManifest = createStructuredBackupSnapshot({
    backupDir: safetyBackupDir,
    databasePath,
    sqliteFiles,
    uploadsRoot,
    productsMirrorRoot,
    label: "pre-restore-safety-backup",
  })

  removeSqliteRelatedFiles(databasePath)

  const restored = {
    databaseFiles: sqliteFiles.map((filePath) => ({
      target: filePath,
      restored: restorePath(path.join(backupDir, "shop-db", path.basename(filePath)), filePath),
    })),
    uploads: restorePath(path.join(backupDir, "uploads"), uploadsRoot),
    productsMirror: restorePath(path.join(backupDir, "Prodotti"), productsMirrorRoot),
  }

  const payload = {
    restoredFrom: backupDir,
    databasePath,
    safetyBackupDir,
    safetyManifest: path.join(safetyBackupDir, "manifest.json"),
    restored,
  }

  logWarning("shop_restore_executed", payload)
  logInfo("shop_restore_safety_backup_created", { safetyBackupDir, kind: safetyManifest.kind })
  console.log(`[shop-restore] DATABASE_URL runtime ripristinato su ${databasePath}`)
  console.log(`[shop-restore] Restore completato da ${backupDir}`)
  console.log(`[shop-restore] Safety backup creato in ${safetyBackupDir}`)
  console.log("[shop-restore] Riavvia il server shop per rileggere il database ripristinato.")
}

main().catch((error) => {
  reportError(error, { event: "shop_restore_failed" })
  console.error("[shop-restore] Restore fallito")
  console.error(error.message || error)
  process.exit(1)
})
