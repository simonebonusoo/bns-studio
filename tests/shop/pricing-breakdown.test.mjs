import test from "node:test"
import assert from "node:assert/strict"

import { buildPricingBreakdown, calculateBuy3Pay2Discount } from "../../src/server/shop/services/pricing.mjs"

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

test("3x2 does not apply with fewer than 3 items", () => {
  const discount = calculateBuy3Pay2Discount([
    { unitPrice: 2000, quantity: 1 },
    { unitPrice: 1500, quantity: 1 },
  ])

  assert.equal(discount, 0)
})

test("3x2 makes the cheapest item free with 3 items", () => {
  const discount = calculateBuy3Pay2Discount([
    { unitPrice: 2000, quantity: 1 },
    { unitPrice: 1500, quantity: 1 },
    { unitPrice: 1200, quantity: 1 },
  ])

  assert.equal(discount, 1200)
})

test("3x2 makes the two cheapest items free with 6 items", () => {
  const discount = calculateBuy3Pay2Discount([
    { unitPrice: 2000, quantity: 1 },
    { unitPrice: 1800, quantity: 1 },
    { unitPrice: 1500, quantity: 1 },
    { unitPrice: 1200, quantity: 1 },
    { unitPrice: 1100, quantity: 1 },
    { unitPrice: 900, quantity: 1 },
  ])

  assert.equal(discount, 2000)
})

test("3x2 handles multiple quantities on the same cart row", () => {
  const discount = calculateBuy3Pay2Discount([
    { unitPrice: 2000, quantity: 3 },
  ])

  assert.equal(discount, 2000)
})

test("3x2 uses the effective final unit price for discounted variants and sizes", () => {
  const discount = calculateBuy3Pay2Discount([
    { unitPrice: 1399, quantity: 1 },
    { unitPrice: 1499, quantity: 1 },
    { unitPrice: 1999, quantity: 1 },
    { unitPrice: 2500, quantity: 1 },
    { unitPrice: 2599, quantity: 1 },
    { unitPrice: 2699, quantity: 1 },
  ])

  assert.equal(discount, 2898)
})
