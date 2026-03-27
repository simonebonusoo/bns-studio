import fs from "node:fs"

function ensureUnique(values) {
  return Array.from(new Set(values.filter(Boolean)))
}

export function resolveSqliteRelatedFiles(databasePath) {
  return ensureUnique([databasePath, `${databasePath}-wal`, `${databasePath}-shm`])
}

export function removeSqliteRelatedFiles(databasePath) {
  for (const filePath of resolveSqliteRelatedFiles(databasePath)) {
    if (fs.existsSync(filePath)) {
      fs.rmSync(filePath, { force: true })
    }
  }
}
