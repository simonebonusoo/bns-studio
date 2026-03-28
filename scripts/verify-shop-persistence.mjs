import fs from "node:fs"

import { getPersistenceStatus } from "../src/server/shop/lib/persistence-status.mjs"
import { resolveDatabaseUrl } from "../prisma/resolve-database-url.mjs"
import { resolveSqliteRelatedFiles } from "../src/server/shop/lib/sqlite-files.mjs"

const status = getPersistenceStatus()

if (!status?.storage?.databaseUrl || !status?.storage?.uploadsRootDir) {
  console.error("[shop:persistence] Configurazione storage incompleta.")
  process.exit(1)
}

console.log("[shop:persistence] Database:", status.storage.databasePath || status.storage.databaseUrl)
console.log("[shop:persistence] Uploads:", status.storage.uploadsRootDir)
console.log("[shop:persistence] Asset mode:", status.storage.assetStorageMode)
console.log("[shop:persistence] Guaranteed:", status.storage.storageGuaranteed ? "yes" : "no")

if (!fs.existsSync(status.storage.uploadsRootDir)) {
  console.error("[shop:persistence] Directory upload runtime non trovata.")
  process.exit(1)
}

if (resolveDatabaseUrl().startsWith("file:")) {
  const sqliteFiles = resolveSqliteRelatedFiles(resolveDatabaseUrl().slice("file:".length))
  const existingFiles = sqliteFiles.filter((filePath) => fs.existsSync(filePath))
  if (!existingFiles.length) {
    console.error("[shop:persistence] Nessun file SQLite runtime trovato.")
    process.exit(1)
  }

  console.log("[shop:persistence] SQLite files:")
  existingFiles.forEach((filePath) => console.log(`- ${filePath}`))
}

if (status.warnings.length) {
  console.log("[shop:persistence] Warnings:")
  status.warnings.forEach((warning) => console.log(`- ${warning}`))
}
