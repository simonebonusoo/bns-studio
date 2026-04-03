import test from "node:test"
import assert from "node:assert/strict"

import { buildPricingBreakdown } from "../../src/server/shop/services/pricing.mjs"

test("pricing breakdown keeps non-discounted products unchanged", () => {
  const pricing = buildPricingBreakdown(
    [
      {
        lineSubtotal: 2000,
        lineTotal: 2000,
      },
    ],
    0,
    0,
    0,
  )

  assert.equal(pricing.subtotal, 2000)
  assert.equal(pricing.productDiscountTotal, 0)
  assert.equal(pricing.discountTotal, 0)
  assert.equal(pricing.total, 2000)
})

test("pricing breakdown exposes direct product discounts in subtotal, discount total and final total", () => {
  const pricing = buildPricingBreakdown(
    [
      {
        lineSubtotal: 2000,
        lineTotal: 1500,
      },
    ],
    0,
    0,
    0,
  )

  assert.equal(pricing.subtotal, 2000)
  assert.equal(pricing.productDiscountTotal, 500)
  assert.equal(pricing.discountTotal, 500)
  assert.equal(pricing.total, 1500)
})

test("pricing breakdown scales direct discounts with quantity and preserves coupon math on discounted merchandise", () => {
  const pricing = buildPricingBreakdown(
    [
      {
        lineSubtotal: 4000,
        lineTotal: 3000,
      },
    ],
    0,
    300,
    0,
  )

  assert.equal(pricing.subtotal, 4000)
  assert.equal(pricing.productDiscountTotal, 1000)
  assert.equal(pricing.couponDiscount, 300)
  assert.equal(pricing.discountTotal, 1300)
  assert.equal(pricing.total, 2700)
})

