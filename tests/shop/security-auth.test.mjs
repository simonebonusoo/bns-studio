import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"

const root = process.cwd()

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8")
}

test("auth and admin security use cookies, server-side guards and rate limiting", () => {
  const api = read("src/shop/lib/api.ts")
  const authProvider = read("src/shop/context/ShopAuthProvider.tsx")
  const authLib = read("src/server/shop/lib/auth.mjs")
  const authMiddleware = read("src/server/shop/middleware/auth.mjs")
  const authRoutes = read("src/server/shop/routes/authRoutes.mjs")
  const app = read("src/server/shop/app.mjs")
  const adminRoutes = read("src/server/shop/routes/adminRoutes.mjs")
  const orderRoutes = read("src/server/shop/routes/orderRoutes.mjs")
  const seed = read("prisma/seed.mjs")
  const envConfig = read("src/server/shop/config/env.mjs")

  assert.match(api, /credentials: "include"/)
  assert.doesNotMatch(api, /Authorization: `Bearer/)
  assert.doesNotMatch(api, /bns_shop_token/)

  assert.doesNotMatch(authProvider, /bns_shop_token/)
  assert.match(authProvider, /\/auth\/logout/)
  assert.match(authProvider, /apiFetch<\{ user: ShopUser \}>\("\/auth\/me"\)/)

  assert.match(authLib, /httpOnly: true/)
  assert.match(authLib, /sameSite:/)
  assert.match(authLib, /res\.cookie\(env\.authCookieName/)
  assert.match(authLib, /res\.clearCookie\(env\.authCookieName/)
  assert.match(authLib, /sessionNonce|sid/)
  assert.match(authLib, /hashSessionFingerprint/)

  assert.match(authMiddleware, /parseRequestCookies/)
  assert.match(authMiddleware, /cookieToken \|\| bearerToken/)
  assert.match(authMiddleware, /admin_access_denied/)
  assert.match(authMiddleware, /auth_session_fingerprint_mismatch/)
  assert.match(authMiddleware, /auth_session_nonce_mismatch/)

  assert.match(authRoutes, /authLimiter/)
  assert.match(authRoutes, /profileLimiter/)
  assert.match(authRoutes, /setAuthCookie\(res, token\)/)
  assert.doesNotMatch(authRoutes, /token: signToken/)
  assert.match(authRoutes, /router\.post\(\s*"\/logout"/)
  assert.match(authRoutes, /auth_login_failed/)
  assert.match(authRoutes, /auth_login_success/)
  assert.match(authRoutes, /createSessionState/)

  assert.match(app, /createOriginGuard/)
  assert.match(app, /credentials: true/)
  assert.match(app, /app\.disable\("x-powered-by"\)/)
  assert.match(app, /adminLimiter/)
  assert.match(app, /callback\(null, false\)/)
  assert.match(app, /X-Frame-Options/)
  assert.match(app, /X-Content-Type-Options/)
  assert.match(app, /Referrer-Policy/)
  assert.match(app, /Permissions-Policy/)

  assert.match(adminRoutes, /router\.use\(requireAuth, requireAdmin\)/)
  assert.match(adminRoutes, /admin_mutation/)
  assert.match(orderRoutes, /order\.userId !== req\.user\.id/)
  assert.doesNotMatch(orderRoutes, /paypal url generato/)

  assert.doesNotMatch(seed, /Admin ready: admin@bnsstudio\.com \/ admin1234/)
  assert.match(seed, /SHOP_ADMIN_SEED_PASSWORD/)
  assert.match(seed, /SHOP_CUSTOMER_SEED_PASSWORD/)
  assert.match(seed, /if \(!isProduction\)/)
  assert.match(envConfig, /const clientUrl = isProductionNodeEnv \? requireEnv\("CLIENT_URL"\)/)
  assert.match(envConfig, /mockDebugRoutesEnabled/)
  assert.match(envConfig, /securityTestRoutesEnabled/)
})
