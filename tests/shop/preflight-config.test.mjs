import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"

const root = process.cwd()

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8")
}

test("production env config requires JWT_SECRET and CLIENT_URL without localhost fallbacks", () => {
  const envSource = read("src/server/shop/config/env.mjs")

  assert.match(envSource, /const isProduction = nodeEnv === "production"/)
  assert.match(envSource, /const clientUrl = isProduction \? requireEnv\("CLIENT_URL"\) : requireEnv\("CLIENT_URL", "http:\/\/localhost:5173"\)/)
  assert.match(envSource, /jwtSecret: isProduction \? requireEnv\("JWT_SECRET"\) : requireEnv\("JWT_SECRET", "bns-shop-local-secret"\)/)
})

test("frontend api client no longer falls back to a hardcoded onrender production host", () => {
  const apiSource = read("src/shop/lib/api.ts")

  assert.doesNotMatch(apiSource, /bns-studio\.onrender\.com/)
  assert.match(apiSource, /const API_URL = RESOLVED_API_BASE_URL \? `\$\{RESOLVED_API_BASE_URL\}\/api` : "\/api"/)
})

test("seed and legacy docs do not print demo passwords in clear text", () => {
  const seedSource = read("prisma/seed.mjs")
  const legacyReadme = read("sito shop/README.md")

  assert.doesNotMatch(seedSource, /\[seed\] Admin ready: .*admin1234/)
  assert.doesNotMatch(legacyReadme, /admin1234/)
})
