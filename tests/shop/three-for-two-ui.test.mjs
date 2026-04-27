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
  const pricingService = read("src/server/shop/services/pricing.mjs")

  assert.match(pricingTypes, /threeForTwoDiscounts: ThreeForTwoDiscountDetail\[\]/)
  assert.match(pricingTypes, /savingsTotal: number/)
  assert.match(pricingTypes, /threeForTwoDiscount: number/)
  assert.match(pricingTypes, /threeForTwoItems: ThreeForTwoDiscountDetail\[\]/)
  assert.match(pricingSummary, /getThreeForTwoDiscountSummaryRows/)
  assert.match(pricingSummary, /getThreeForTwoItems/)
  assert.match(pricingSummary, /getThreeForTwoDiscountAmount/)
  assert.match(pricingSummary, /Gratis con 3x2/)
  assert.match(pricingService, /cartItems\.map\(\(item, index\) =>/)
  assert.match(pricingService, /threeForTwoDiscounts: Array\.isArray\(threeForTwoDiscounts\) \? threeForTwoDiscounts : \[\]/)
  assert.match(pricingService, /threeForTwoDiscount: threeForTwoDiscounts\.reduce/)
  assert.match(pricingService, /savingsTotal: breakdown\.savingsTotal/)
  assert.match(cartPage, /getThreeForTwoDiscountForLine/)
  assert.match(cartPage, /formatThreeForTwoLineMessage/)
  assert.match(checkoutPage, /getThreeForTwoDiscountForLine/)
  assert.match(checkoutPage, /<span>Subtotale<\/span>/)
  assert.match(checkoutPage, /formatPrice\(pricing\.discountedSubtotal\)/)
  assert.match(checkoutPage, /Hai risparmiato .* con il 3x2/)
  assert.match(checkoutPage, /Subtotale scontato/)
  assert.match(checkoutPage, /Prodotto gratis/)
  assert.doesNotMatch(checkoutPage, /Totale prodotti/)
  assert.doesNotMatch(checkoutPage, /Hai già risparmiato .* sui prodotti/)
  assert.doesNotMatch(checkoutPage, /<span>Sconti<\/span>/)
  assert.match(checkoutPage, /Impossibile calcolare il riepilogo/)
  assert.match(checkoutPage, /Calcolo del riepilogo in corso/)
  assert.match(receiptPage, /getThreeForTwoDiscountForLine/)
})
