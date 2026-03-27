import fs from "node:fs"
import path from "node:path"

import { env } from "../config/env.mjs"
import { resolveUploadsRootDir } from "./uploads-storage.mjs"

function ensureDir(targetPath) {
  fs.mkdirSync(targetPath, { recursive: true })
}

function getPersistentRoot() {
  if (env.backupsDir) {
    return path.resolve(env.backupsDir, "..", "..")
  }

  return path.dirname(resolveUploadsRootDir(env.uploadsDir))
}

export function resolveBackupsRootDir() {
  const target = env.backupsDir ? path.resolve(env.backupsDir) : path.join(getPersistentRoot(), "backups", "shop")
  ensureDir(target)
  return target
}

export function resolveMonitoringRootDir() {
  const target = env.monitoringDir ? path.resolve(env.monitoringDir) : path.join(getPersistentRoot(), "logs")
  ensureDir(target)
  return target
}
