import { spawn } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { PrismaClient } from "@prisma/client"
import { resolveDatabaseUrl } from "../prisma/resolve-database-url.mjs"
import { getPersistenceStatus } from "../src/server/shop/lib/persistence-status.mjs"
import { resolveUploadsRootDir } from "../src/server/shop/lib/uploads-storage.mjs"

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      env: options.env || process.env,
      ...options,
    })

    child.on("error", reject)
    child.on("close", (code) => {
      if (code === 0) {
        resolve()
        return
      }

      reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`))
    })
  })
}

function redactDatabaseUrl(value) {
  const databaseUrl = String(value || "")
  if (!databaseUrl) return "(unset)"
  if (databaseUrl.startsWith("file:")) return "file:[redacted]"

  try {
    const parsed = new URL(databaseUrl)
    if (parsed.username) parsed.username = "***"
    if (parsed.password) parsed.password = "***"
    parsed.pathname = parsed.pathname ? "/[redacted]" : parsed.pathname
    parsed.search = ""
    parsed.hash = ""
    return parsed.toString()
  } catch {
    return "[redacted]"
  }
}

function logConfiguration() {
  const databaseUrl = resolveDatabaseUrl()
  const uploadsDir = process.env.UPLOADS_DIR || resolveUploadsRootDir()
  const databasePath = databaseUrl.startsWith("file:") ? databaseUrl.slice("file:".length) : databaseUrl
  const databaseExists = databaseUrl.startsWith("file:") ? fs.existsSync(databasePath) : "external"
  const uploadsExists = fs.existsSync(path.join(uploadsDir, "products"))
  const persistence = getPersistenceStatus()

  console.log("[bootstrap] Starting BNS Studio shop backend")
  console.log(`[bootstrap] NODE_ENV=${process.env.NODE_ENV || "development"}`)
  console.log(`[bootstrap] DATABASE_URL=${redactDatabaseUrl(databaseUrl)}`)
  console.log(`[bootstrap] DATABASE_PATH=${databasePath}`)
  console.log(`[bootstrap] DATABASE_EXISTS_BEFORE_START=${databaseExists}`)
  console.log(`[bootstrap] UPLOADS_DIR=${uploadsDir}`)
  console.log(`[bootstrap] UPLOADS_PRODUCTS_DIR=${path.join(uploadsDir, "products")}`)
  console.log(`[bootstrap] UPLOADS_EXISTS_BEFORE_START=${uploadsExists}`)
  console.log(`[bootstrap] IS_RENDER=${persistence.environment.isRender}`)
  console.log(`[bootstrap] STORAGE_GUARANTEED=${persistence.storage.storageGuaranteed}`)
  console.log(`[bootstrap] RENDER_DISK_PATH=${persistence.storage.renderDiskMountPath || "(unset)"}`)
  console.log(`[bootstrap] FORCE_PERSISTENT_STORAGE=${process.env.FORCE_PERSISTENT_STORAGE === "true" ? "true" : "false"}`)
  console.log(`[bootstrap] LEGACY_STORAGE_MIGRATION=${process.env.SHOP_ALLOW_LEGACY_STORAGE_MIGRATION === "true" ? "enabled" : "disabled"}`)
}

async function main() {
  const resolvedDatabaseUrl = resolveDatabaseUrl()
  const resolvedUploadsDir = process.env.UPLOADS_DIR || resolveUploadsRootDir()
  const runtimeEnv = {
    ...process.env,
    DATABASE_URL: resolvedDatabaseUrl,
    UPLOADS_DIR: resolvedUploadsDir,
  }

  logConfiguration()
  console.log("[bootstrap] Seed mode=if-empty")
  await cleanupLegacyDropTable(resolvedDatabaseUrl)
  await run("npx", ["prisma", "db", "push", "--skip-generate", "--accept-data-loss"], { env: runtimeEnv })
  await run("node", ["prisma/sync-product-variants.mjs"], { env: runtimeEnv })
  await run("node", ["prisma/backfill-usernames.mjs"], { env: runtimeEnv })
  await run("node", ["prisma/seed.mjs"], { env: runtimeEnv })
  await run("node", ["src/server/shop/server.mjs"], { env: runtimeEnv })
}

async function cleanupLegacyDropTable(databaseUrl) {
  if (!String(databaseUrl || "").startsWith("file:")) return

  const databasePath = databaseUrl.slice("file:".length)
  if (!fs.existsSync(databasePath)) return

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  })

  try {
    await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS "Drop"')
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error("[bootstrap] Startup failed")
  console.error(error)
  process.exit(1)
})
