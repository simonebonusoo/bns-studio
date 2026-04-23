import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"

const root = process.cwd()

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8")
}

test("product customization is persisted from admin products to public product payloads", () => {
  const schema = read("prisma/schema.prisma")
  const adminRoutes = read("src/server/shop/routes/adminRoutes.mjs")
  const productForm = read("src/shop/components/admin/ProductFormCard.tsx")
  const adminPage = read("src/shop/pages/ShopAdminPage.tsx")
  const types = read("src/shop/types.ts")

  assert.match(schema, /isCustomizable Boolean\s+@default\(false\)/)
  assert.match(adminRoutes, /isCustomizable: z\.boolean\(\)\.default\(false\)/)
  assert.match(adminRoutes, /isCustomizable: Boolean\(body\.isCustomizable\)/)
  assert.match(adminRoutes, /personalizationTextEnabled: z\.boolean\(\)\.default\(false\)/)
  assert.match(adminRoutes, /personalizationImageEnabled: z\.boolean\(\)\.default\(false\)/)
  assert.match(productForm, /Personalizzazione/)
  assert.match(productForm, /Personalizzazione testo/)
  assert.match(productForm, /Personalizzazione immagine/)
  assert.match(productForm, /Sì/)
  assert.match(productForm, /No/)
  assert.match(adminPage, /isCustomizable: false/)
  assert.match(adminPage, /isCustomizable: productForm\.isCustomizable/)
  assert.match(adminPage, /personalizationTextEnabled: false/)
  assert.match(adminPage, /personalizationImageEnabled: false/)
  assert.match(types, /isCustomizable\?: boolean/)
  assert.match(types, /personalizationTextEnabled\?: boolean/)
  assert.match(types, /personalizationImageEnabled\?: boolean/)
})

test("customizable products carry text and image personalization through checkout and admin orders", () => {
  const schema = read("prisma/schema.prisma")
  const pricing = read("src/server/shop/services/pricing.mjs")
  const orderRoutes = read("src/server/shop/routes/orderRoutes.mjs")
  const storeRoutes = read("src/server/shop/routes/storeRoutes.mjs")
  const checkoutSessions = read("src/server/shop/lib/checkout-sessions.mjs")
  const productPage = read("src/shop/pages/ShopProductPage.tsx")
  const purchasePanel = read("src/shop/components/product/ProductPurchasePanel.tsx")
  const adminOrders = read("src/shop/components/admin/AdminOrdersSection.tsx")

  assert.match(schema, /personalizationText String\?/)
  assert.match(schema, /personalizationImageUrl String\?/)
  assert.match(pricing, /function normalizePersonalizationText/)
  assert.match(pricing, /function normalizePersonalizationImageUrl/)
  assert.match(pricing, /product\?\.isCustomizable/)
  assert.match(pricing, /richiede un testo per la personalizzazione/)
  assert.match(pricing, /personalizationText,/)
  assert.match(pricing, /personalizationImageUrl,/)
  assert.match(orderRoutes, /personalizationText: z\.string\(\)\.trim\(\)\.max\(200\)\.optional\(\)\.nullable\(\)/)
  assert.match(orderRoutes, /personalizationImageUrl: z\.string\(\)\.trim\(\)\.optional\(\)\.nullable\(\)/)
  assert.match(orderRoutes, /personalizationText: item\.personalizationText \|\| null/)
  assert.match(orderRoutes, /personalizationImageUrl: item\.personalizationImageUrl \|\| null/)
  assert.match(storeRoutes, /\/personalization\/uploads/)
  assert.match(checkoutSessions, /personalizationText: item\.personalizationText \|\| null/)
  assert.match(checkoutSessions, /personalizationImageUrl: item\.personalizationImageUrl \|\| null/)
  assert.match(productPage, /resolvePersonalizationSelection/)
  assert.match(productPage, /personalizationImageUrl: resolvedPersonalization\.personalizationImageUrl/)
  assert.match(purchasePanel, /Carica immagine/)
  assert.match(purchasePanel, /Massimo \{personalizationTextMaxChars\} caratteri/)
  assert.match(adminOrders, /Personalizzazione: \{item\.personalizationText\}/)
  assert.match(adminOrders, /item\.personalizationImageUrl/)
})
