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
  assert.match(popup, /DISMISSED_AT_KEY/)
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

test("guest registration promo reappears for guests after the controlled cooldown", () => {
  const popup = read("src/components/RegisterPromoPopup.tsx")

  assert.match(popup, /const DISMISSED_AT_KEY = "signupDiscountPopupDismissedAt"/)
  assert.match(popup, /const REAPPEAR_DELAY_MS = 90_000/)
  assert.match(popup, /Date\.now\(\) - dismissedAt < REAPPEAR_DELAY_MS/)
  assert.match(popup, /const POPUP_CHECK_INTERVAL_MS = 1_000/)
  assert.match(popup, /window\.setInterval\(showIfEligible, POPUP_CHECK_INTERVAL_MS\)/)
  assert.match(popup, /if \(loading \|\| user\)/)
  assert.match(popup, /if \(open \|\| successOpen\) return/)
  assert.match(popup, /localStorage\.setItem\(DISMISSED_AT_KEY, String\(Date\.now\(\)\)\)/)
  assert.match(popup, /localStorage\.setItem\(COMPLETED_KEY, "true"\)/)
  assert.doesNotMatch(popup, /sessionStorage\.setItem\(SESSION_SEEN_KEY/)
  assert.doesNotMatch(popup, /DISMISS_DAYS/)
})

test("auth registration accepts the minimal popup payload and keeps optional profile fields non-blocking", () => {
  const authRoutes = read("src/server/shop/routes/authRoutes.mjs")

  assert.match(authRoutes, /firstName: z\.string\(\)\.trim\(\)\.optional\(\)/)
  assert.match(authRoutes, /lastName: z\.string\(\)\.trim\(\)\.optional\(\)/)
  assert.match(authRoutes, /shippingCountry: z\.string\(\)\.trim\(\)\.optional\(\)/)
  assert.match(authRoutes, /firstName: sanitizePlainText\(body\.firstName \|\| normalizedUsername\)/)
  assert.match(authRoutes, /shippingAddressLine1: body\.shippingAddressLine1 \? sanitizePlainText\(body\.shippingAddressLine1\) : null/)
})

test("promo registration blocks existing emails before user and coupon creation", () => {
  const authRoutes = read("src/server/shop/routes/authRoutes.mjs")
  const popup = read("src/components/RegisterPromoPopup.tsx")

  assert.match(authRoutes, /const normalizedEmail = body\.email\.trim\(\)\.toLowerCase\(\)/)
  assert.match(authRoutes, /prisma\.user\.findUnique\(\{ where: \{ email: normalizedEmail \} \}\)/)
  assert.match(authRoutes, /body\.source === "promo_popup"[\s\S]*Questa email risulta già registrata\. Accedi al tuo account per continuare\./)
  assert.ok(authRoutes.indexOf("if (existingEmail)") < authRoutes.indexOf("prisma.user.create"))
  assert.ok(authRoutes.indexOf("prisma.user.create") < authRoutes.indexOf("createUniqueRegistrationCoupon(user.id)"))
  assert.match(popup, /REGISTERED_EMAIL_MESSAGE/)
  assert.match(popup, /bns:open-profile/)
  assert.match(popup, /step: "login"/)
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
