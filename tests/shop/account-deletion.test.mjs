import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"

const root = process.cwd()

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8")
}

test("profile edit page exposes a guarded delete account danger zone", () => {
  const registerPage = read("src/shop/pages/ShopRegisterPage.tsx")
  const authProvider = read("src/shop/context/ShopAuthProvider.tsx")

  assert.match(registerPage, /Elimina account/)
  assert.match(registerPage, /Danger zone/)
  assert.match(registerPage, /ConfirmActionModal/)
  assert.match(registerPage, /confirmDeleteAccount/)
  assert.match(registerPage, /navigate\("\/", \{ replace: true, state: \{ resetHomeTop: true \} \}\)/)
  assert.match(authProvider, /deleteAccount/)
  assert.match(authProvider, /method: "DELETE"/)
  assert.match(authProvider, /localStorage\.removeItem\("bns_shop_token"\)/)
})

test("backend account deletion anonymizes the current user and protects the last admin", () => {
  const authRoutes = read("src/server/shop/routes/authRoutes.mjs")
  const authMiddleware = read("src/server/shop/middleware/auth.mjs")
  const adminRoutes = read("src/server/shop/routes/adminRoutes.mjs")

  assert.match(authRoutes, /router\.delete\(\s*"\/me"/)
  assert.match(authRoutes, /adminCount <= 1/)
  assert.match(authRoutes, /Non puoi eliminare l'ultimo account admin/)
  assert.match(authRoutes, /email: `deleted-\$\{deletedSuffix\}@deleted\.local`/)
  assert.match(authRoutes, /username: `deleted-\$\{deletedSuffix\}`/)
  assert.match(authRoutes, /role: "deleted"/)
  assert.match(authRoutes, /sessionNonce: crypto\.randomUUID\(\)/)
  assert.match(authMiddleware, /user\.role === "deleted"/)
  assert.match(adminRoutes, /where: \{ role: \{ not: "deleted" \} \}/)
})
