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
  assert.match(popup, /firstName/)
  assert.match(popup, /lastName/)
  assert.match(popup, /username/)
  assert.match(popup, /shippingAddressLine1/)
  assert.match(popup, /shippingPostalCode/)
  assert.doesNotMatch(popup, /newsletter/i)
})

test("first registration coupon type is exposed in admin and treated as a percentage coupon", () => {
  const adminPage = read("src/shop/pages/ShopAdminPage.tsx")
  const adminDiscounts = read("src/shop/components/admin/AdminDiscountsSection.tsx")
  const adminRoutes = read("src/server/shop/routes/adminRoutes.mjs")
  const authRoutes = read("src/server/shop/routes/authRoutes.mjs")
  const pricing = read("src/server/shop/services/pricing.mjs")

  assert.match(adminDiscounts, /<option value="first_registration">Prima registrazione<\/option>/)
  assert.match(adminPage, /Sconto prima registrazione \(%\)/)
  assert.match(adminRoutes, /"first_registration"/)
  assert.match(authRoutes, /findFirstRegistrationCoupon/)
  assert.match(authRoutes, /orderBy: \{ createdAt: "desc" \}/)
  assert.match(pricing, /coupon\.type === "percentage" \|\| coupon\.type === "first_registration"/)
})
