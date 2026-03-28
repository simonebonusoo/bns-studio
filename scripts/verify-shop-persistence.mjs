import { getPersistenceStatus } from "../src/server/shop/lib/persistence-status.mjs"

const status = getPersistenceStatus()

if (!status?.storage?.databaseUrl || !status?.storage?.uploadsRootDir) {
  console.error("[shop:persistence] Configurazione storage incompleta.")
  process.exit(1)
}

console.log("[shop:persistence] Database:", status.storage.databasePath || status.storage.databaseUrl)
console.log("[shop:persistence] Uploads:", status.storage.uploadsRootDir)
console.log("[shop:persistence] Asset mode:", status.storage.assetStorageMode)
console.log("[shop:persistence] Guaranteed:", status.storage.storageGuaranteed ? "yes" : "no")

if (status.warnings.length) {
  console.log("[shop:persistence] Warnings:")
  status.warnings.forEach((warning) => console.log(`- ${warning}`))
}
