import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"

const root = process.cwd()

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8")
}

test("checkout, receipt, profile and admin orders render the selected shipping method", () => {
  const checkout = read("src/shop/pages/ShopCheckoutPage.tsx")
  const receipt = read("src/shop/pages/ShopReceiptPage.tsx")
  const profile = read("src/shop/pages/ShopProfilePage.tsx")
  const adminOrders = read("src/shop/components/admin/AdminOrdersSection.tsx")
  const timeline = read("src/shop/components/orders/OrderTimeline.tsx")

  assert.match(checkout, /Scegli la spedizione/)
  assert.match(checkout, /availableShippingRates/)
  assert.match(checkout, /shippingMethod/)
  assert.match(receipt, /OrderTimeline/)
  assert.match(profile, /Informazioni ordine/)
  assert.match(profile, /Tracking ancora non disponibile/)
  assert.match(adminOrders, /buildAdminOrderShippingSummary/)
  assert.match(timeline, /Timeline ordine/)
  assert.match(timeline, /Traccia spedizione/)
})
