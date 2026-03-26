import { spawn } from "node:child_process"

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      env: process.env,
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
  const databaseUrl = process.env.DATABASE_URL || "file:./dev.db"
  const uploadsDir = process.env.UPLOADS_DIR || "./src/uploads"
  console.log("[bootstrap] Starting BNS Studio shop backend")
  console.log(`[bootstrap] DATABASE_URL=${databaseUrl}`)
  console.log(`[bootstrap] UPLOADS_DIR=${uploadsDir}`)
}

async function main() {
  logConfiguration()
  await run("npx", ["prisma", "db", "push", "--skip-generate", "--accept-data-loss"])
  await run("node", ["prisma/backfill-usernames.mjs"])
  await run("node", ["prisma/seed.mjs"])
  await run("node", ["src/server/shop/server.mjs"])
}

main().catch((error) => {
  console.error("[bootstrap] Startup failed")
  console.error(error)
  process.exit(1)
})
