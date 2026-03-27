import fs from "node:fs"
import path from "node:path"

import { env } from "../config/env.mjs"
import { resolveMonitoringRootDir } from "./storage-paths.mjs"

function ensureDir(targetPath) {
  fs.mkdirSync(targetPath, { recursive: true })
}

function serializeError(error) {
  if (!error) return null

  return {
    name: error.name || "Error",
    message: error.message || String(error),
    stack: error.stack || null,
    code: error.code || null,
    status: error.status || null,
  }
}

function writeLog(level, event, payload = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    environment: env.nodeEnv,
    ...payload,
  }

  const monitoringRoot = resolveMonitoringRootDir()
  ensureDir(monitoringRoot)
  const filePath = path.join(monitoringRoot, `shop-${new Date().toISOString().slice(0, 10)}.jsonl`)
  fs.appendFileSync(filePath, `${JSON.stringify(entry)}\n`, "utf8")

  if (level === "error") {
    console.error(`[monitoring] ${event}`, payload.error?.message || "")
  } else if (level === "warn") {
    console.warn(`[monitoring] ${event}`)
  } else {
    console.log(`[monitoring] ${event}`)
  }

  return entry
}

export function logInfo(event, payload = {}) {
  return writeLog("info", event, payload)
}

export function logWarning(event, payload = {}) {
  return writeLog("warn", event, payload)
}

export function reportError(error, context = {}) {
  return writeLog("error", context.event || "unhandled_error", {
    ...context,
    error: serializeError(error),
  })
}
