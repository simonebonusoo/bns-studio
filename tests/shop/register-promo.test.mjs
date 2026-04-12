import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"

const root = process.cwd()

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8")
}

test("guest registration promo is mounted safely and uses the existing auth registration flow", () => {
  const app = read("src/App.tsx")
  const popup = read("src/components/RegisterPromoPopup.tsx")
  const authProvider = read("src/shop/context/ShopAuthProvider.tsx")

  assert.match(app, /RegisterPromoPopup/)
  assert.match(authProvider, /registerFromPromo/)
  assert.match(authProvider, /source: "promo_popup"/)
  assert.match(popup, /useShopAuth/)
  assert.match(popup, /DISMISSED_UNTIL_KEY/)
  assert.match(popup, /SESSION_SEEN_KEY/)
  assert.match(popup, /COMPLETED_KEY/)
  assert.match(popup, /username/)
  assert.match(popup, /Sblocca il 10% di sconto/)
  assert.match(popup, /Ottieni codice/)
  assert.match(popup, /Ecco il tuo sconto/)
  assert.doesNotMatch(popup, /Dati spedizione/)
  assert.doesNotMatch(popup, /shippingAddressLine1/)
  assert.doesNotMatch(popup, /confirmPassword/)
  assert.doesNotMatch(popup, /newsletter/i)
})

test("auth registration accepts the minimal popup payload and keeps optional profile fields non-blocking", () => {
  const authRoutes = read("src/server/shop/routes/authRoutes.mjs")

  assert.match(authRoutes, /firstName: z\.string\(\)\.trim\(\)\.optional\(\)/)
  assert.match(authRoutes, /lastName: z\.string\(\)\.trim\(\)\.optional\(\)/)
  assert.match(authRoutes, /shippingCountry: z\.string\(\)\.trim\(\)\.optional\(\)/)
  assert.match(authRoutes, /firstName: sanitizePlainText\(body\.firstName \|\| normalizedUsername\)/)
  assert.match(authRoutes, /shippingAddressLine1: body\.shippingAddressLine1 \? sanitizePlainText\(body\.shippingAddressLine1\) : null/)
})

test("first registration discount rule generates a unique owner-bound coupon", () => {
  const adminPage = read("src/shop/pages/ShopAdminPage.tsx")
  const adminDiscounts = read("src/shop/components/admin/AdminDiscountsSection.tsx")
  const adminRoutes = read("src/server/shop/routes/adminRoutes.mjs")
  const authRoutes = read("src/server/shop/routes/authRoutes.mjs")
  const pricing = read("src/server/shop/services/pricing.mjs")
  const storeRoutes = read("src/server/shop/routes/storeRoutes.mjs")
  const orderRoutes = read("src/server/shop/routes/orderRoutes.mjs")

  assert.match(adminDiscounts, /<option value="first_registration">Prima registrazione<\/option>/)
  assert.match(adminDiscounts, /Genera un codice casuale, univoco e monouso/)
  assert.match(adminPage, /ruleForm\.ruleType === "first_registration"/)
  assert.match(adminRoutes, /"first_registration"/)
  assert.match(authRoutes, /createUniqueRegistrationCoupon/)
  assert.match(authRoutes, /crypto\.randomBytes/)
  assert.match(authRoutes, /usageLimit: 1/)
  assert.match(authRoutes, /registrationCoupon:/)
  assert.match(authRoutes, /ownerUserId: userId/)
  assert.match(pricing, /validateFirstRegistrationCoupon/)
  assert.match(pricing, /ownerUserId/)
  assert.match(pricing, /Questo coupon è riservato a un altro account/)
  assert.match(pricing, /coupon\.type === "percentage" \|\| coupon\.type === "first_registration"/)
  assert.match(storeRoutes, /optionalAuth/)
  assert.match(orderRoutes, /userId: req\.user\.id/)
})
