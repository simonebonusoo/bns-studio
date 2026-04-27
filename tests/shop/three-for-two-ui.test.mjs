import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"

const root = process.cwd()

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8")
}

test("checkout, cart and receipt consume the 3x2 breakdown detail", () => {
  const cartPage = read("src/shop/pages/ShopCartPage.tsx")
  const checkoutPage = read("src/shop/pages/ShopCheckoutPage.tsx")
  const receiptPage = read("src/shop/pages/ShopReceiptPage.tsx")
  const pricingTypes = read("src/shop/types.ts")
  const pricingSummary = read("src/shop/lib/pricing-summary.ts")

  assert.match(pricingTypes, /threeForTwoDiscounts: ThreeForTwoDiscountDetail\[\]/)
  assert.match(pricingSummary, /getThreeForTwoDiscountSummaryRows/)
  assert.match(pricingSummary, /Gratis con 3x2/)
  assert.match(cartPage, /getThreeForTwoDiscountForLine/)
  assert.match(cartPage, /formatThreeForTwoLineMessage/)
  assert.match(checkoutPage, /getThreeForTwoDiscountForLine/)
  assert.match(checkoutPage, /getThreeForTwoDiscountSummaryRows/)
  assert.match(receiptPage, /getThreeForTwoDiscountForLine/)
})
