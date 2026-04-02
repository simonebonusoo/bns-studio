import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"

const root = process.cwd()

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8")
}

test("frontend auth surface is limited to the current bearer flow modules and avoids broader token leaks", () => {
  const api = read("src/shop/lib/api.ts")
  const authProvider = read("src/shop/context/ShopAuthProvider.tsx")
  const appSource = read("src/App.tsx")
  const navbar = read("src/components/Navbar.tsx")

  assert.match(api, /localStorage\.getItem\("bns_shop_token"\)/)
  assert.match(api, /Authorization: `Bearer \$\{token\}`/)
  assert.match(authProvider, /localStorage\.setItem\("bns_shop_token", data\.token\)/)
  assert.match(authProvider, /localStorage\.removeItem\("bns_shop_token"\)/)

  assert.doesNotMatch(api, /sessionStorage\./)
  assert.doesNotMatch(authProvider, /sessionStorage\./)
  assert.doesNotMatch(api, /window\.[A-Za-z0-9_$]*token/i)
  assert.doesNotMatch(authProvider, /window\.[A-Za-z0-9_$]*token/i)
  assert.doesNotMatch(appSource, /window\.[A-Za-z0-9_$]*token/i)
  assert.doesNotMatch(navbar, /window\.[A-Za-z0-9_$]*token/i)
})

test("server auth/profile responses are serialized without password hashes or internal session fields", () => {
  const authRoutes = read("src/server/shop/routes/authRoutes.mjs")

  assert.match(authRoutes, /return \{\s*id: user\.id,/)
  assert.match(authRoutes, /email: user\.email,/)
  assert.match(authRoutes, /username,/)
  assert.match(authRoutes, /return res\.status\(201\)\.json\(\{\s*token: signToken\(user\),\s*user: await serializeUser\(user\),/s)
  assert.match(authRoutes, /return res\.status\(200\)\.json\(\{\s*token: signToken\(user\),\s*user: await serializeUser\(user\),/s)
  assert.match(authRoutes, /return res\.status\(200\)\.json\(\{\s*user: await serializeUser\(req\.user\),/s)
  assert.doesNotMatch(authRoutes, /user:\s*\{[^}]*passwordHash/s)
  assert.doesNotMatch(authRoutes, /user:\s*\{[^}]*currentPassword/s)
  assert.doesNotMatch(authRoutes, /user:\s*\{[^}]*sessionNonce/s)
  assert.doesNotMatch(authRoutes, /user:\s*\{[^}]*sessionFingerprintHash/s)
})

test("client API error mapping does not expose raw html, stack traces or authorization details to the UI", () => {
  const api = read("src/shop/lib/api.ts")

  assert.match(api, /if \(response\.status >= 500\) \{\s*return new Error\("Stiamo aggiornando i contenuti\. Riprova tra qualche istante\."\)/)
  assert.doesNotMatch(api, /new Error\(\s*rawText\s*\)/)
  assert.doesNotMatch(api, /new Error\(\s*`[^`]*\$\{rawText\}/)
  assert.doesNotMatch(api, /new Error\(\s*`[^`]*\$\{token\}/)
  assert.doesNotMatch(api, /new Error\(\s*`[^`]*Authorization/i)
})
