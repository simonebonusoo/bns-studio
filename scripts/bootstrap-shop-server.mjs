import { spawn } from "node:child_process"
import { resolveDatabaseUrl } from "../prisma/resolve-database-url.mjs"
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

function logConfiguration() {
  const databaseUrl = resolveDatabaseUrl()
  const uploadsDir = process.env.UPLOADS_DIR || resolveUploadsRootDir()
  console.log("[bootstrap] Starting BNS Studio shop backend")
  console.log(`[bootstrap] DATABASE_URL=${databaseUrl}`)
  console.log(`[bootstrap] UPLOADS_DIR=${uploadsDir}`)
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
  await run("npx", ["prisma", "db", "push", "--skip-generate"], { env: runtimeEnv })
  await run("node", ["prisma/backfill-usernames.mjs"], { env: runtimeEnv })
  await run("node", ["prisma/seed.mjs"], { env: runtimeEnv })
  await run("node", ["src/server/shop/server.mjs"], { env: runtimeEnv })
}

main().catch((error) => {
  console.error("[bootstrap] Startup failed")
  console.error(error)
  process.exit(1)
})
