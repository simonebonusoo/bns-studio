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

test("bootstrap blocks schema mutations in production and only allows schema push outside production", () => {
  const bootstrapSource = read("scripts/bootstrap-shop-server.mjs")

  assert.match(bootstrapSource, /function isProductionRuntime/)
  assert.match(bootstrapSource, /function allowSchemaPush/)
  assert.match(bootstrapSource, /ALLOW_SCHEMA_PUSH/)
  assert.match(bootstrapSource, /Schema push disabled in production; checking schema compatibility/)
  assert.match(bootstrapSource, /prisma", "migrate", "diff"/)
  assert.doesNotMatch(bootstrapSource, /accept-data-loss/)
})

test("demo seed is opt-in and stays disabled unless ALLOW_DEMO_SEED is set", () => {
  const seedSource = read("prisma/seed.mjs")

  assert.match(seedSource, /ALLOW_DEMO_SEED/)
  assert.match(seedSource, /Demo seed disabled in production/)
  assert.match(seedSource, /Demo seed disabled\. Set ALLOW_DEMO_SEED=true to create demo data locally\./)
  assert.match(seedSource, /if \(!allowDemoSeed\) \{/)
})
