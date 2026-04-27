import test from "node:test"
import assert from "node:assert/strict"

import { buildPricingBreakdown, calculateAutomaticDiscountsFromRules, calculateBuy3Pay2Discount } from "../../src/server/shop/services/pricing.mjs"

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
  assert.equal(pricing.savingsTotal, 0)
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

  assert.equal(pricing.originalSubtotal, 2000)
  assert.equal(pricing.subtotal, 1500)
  assert.equal(pricing.savingsTotal, 500)
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

  assert.equal(pricing.originalSubtotal, 4000)
  assert.equal(pricing.subtotal, 3000)
  assert.equal(pricing.savingsTotal, 1000)
  assert.equal(pricing.productDiscountTotal, 1000)
  assert.equal(pricing.couponDiscount, 300)
  assert.equal(pricing.discountTotal, 1300)
  assert.equal(pricing.total, 2700)
})

test("pricing breakdown subtotal reflects automatic discounts before coupon rows", () => {
  const pricing = buildPricingBreakdown(
    [
      {
        lineSubtotal: 6000,
        lineTotal: 6000,
      },
    ],
    2000,
    500,
    0,
  )

  assert.equal(pricing.originalSubtotal, 6000)
  assert.equal(pricing.subtotal, 4000)
  assert.equal(pricing.savingsTotal, 2000)
  assert.equal(pricing.couponDiscount, 500)
  assert.equal(pricing.discountTotal, 2500)
  assert.equal(pricing.total, 3500)
})

test("3x2 does not apply with fewer than 3 items", () => {
  const pricing = calculateBuy3Pay2Discount([
    { unitPrice: 2000, quantity: 1 },
    { unitPrice: 1500, quantity: 1 },
  ])

  assert.equal(pricing.amount, 0)
  assert.deepEqual(pricing.discounts, [])
})

test("3x2 makes the cheapest item free with 3 items", () => {
  const pricing = calculateBuy3Pay2Discount([
    { lineIndex: 0, productId: 1, title: "A", unitPrice: 2000, quantity: 1 },
    { lineIndex: 1, productId: 2, title: "B", unitPrice: 1500, quantity: 1 },
    { lineIndex: 2, productId: 3, title: "C", unitPrice: 1200, quantity: 1 },
  ])

  assert.equal(pricing.amount, 1200)
  assert.equal(pricing.discounts.length, 1)
  assert.equal(pricing.discounts[0].lineIndex, 2)
  assert.equal(pricing.discounts[0].title, "C")
  assert.equal(pricing.discounts[0].discountedPrice, 0)
  assert.equal(pricing.discounts[0].discountAmount, 1200)
  assert.equal(pricing.discounts[0].quantityDiscounted, 1)
})

test("3x2 makes the two cheapest items free with 6 items", () => {
  const pricing = calculateBuy3Pay2Discount([
    { lineIndex: 0, productId: 1, title: "A", unitPrice: 2000, quantity: 1 },
    { lineIndex: 1, productId: 2, title: "B", unitPrice: 1800, quantity: 1 },
    { lineIndex: 2, productId: 3, title: "C", unitPrice: 1500, quantity: 1 },
    { lineIndex: 3, productId: 4, title: "D", unitPrice: 1200, quantity: 1 },
    { lineIndex: 4, productId: 5, title: "E", unitPrice: 1100, quantity: 1 },
    { lineIndex: 5, productId: 6, title: "F", unitPrice: 900, quantity: 1 },
  ])

  assert.equal(pricing.amount, 2000)
  assert.deepEqual(pricing.discounts.map((entry) => entry.title), ["E", "F"])
})

test("3x2 handles multiple quantities on the same cart row", () => {
  const pricing = calculateBuy3Pay2Discount([
    { lineIndex: 0, productId: 1, title: "Poster", unitPrice: 2000, quantity: 3 },
  ])

  assert.equal(pricing.amount, 2000)
  assert.equal(pricing.discounts[0].quantityDiscounted, 1)
  assert.equal(pricing.discounts[0].lineIndex, 0)
})

test("3x2 uses the effective final unit price for discounted variants and sizes", () => {
  const pricing = calculateBuy3Pay2Discount([
    { lineIndex: 0, productId: 1, title: "A4", unitPrice: 1399, quantity: 1 },
    { lineIndex: 1, productId: 2, title: "A3", unitPrice: 1499, quantity: 1 },
    { lineIndex: 2, productId: 3, title: "B", unitPrice: 1999, quantity: 1 },
    { lineIndex: 3, productId: 4, title: "C", unitPrice: 2500, quantity: 1 },
    { lineIndex: 4, productId: 5, title: "D", unitPrice: 2599, quantity: 1 },
    { lineIndex: 5, productId: 6, title: "E", unitPrice: 2699, quantity: 1 },
  ])

  assert.equal(pricing.amount, 2898)
  assert.deepEqual(pricing.discounts.map((entry) => entry.originalPrice), [1399, 1499])
})

test("automatic pricing skips 3x2 when no active rule exists", () => {
  const result = calculateAutomaticDiscountsFromRules(
    [
      { lineIndex: 0, productId: 1, title: "A", quantity: 1, unitPrice: 2000, lineTotal: 2000 },
      { lineIndex: 1, productId: 2, title: "B", quantity: 1, unitPrice: 1500, lineTotal: 1500 },
      { lineIndex: 2, productId: 3, title: "C", quantity: 1, unitPrice: 1200, lineTotal: 1200 },
    ],
    [
      { name: "3x2", ruleType: "buy_3_pay_2", threshold: 3, active: false, startsAt: null, endsAt: null },
    ],
  )

  assert.equal(result.automaticDiscount, 0)
  assert.deepEqual(result.threeForTwoDiscounts, [])
  assert.deepEqual(result.appliedRules, [])
})

test("automatic pricing applies 3x2 when an active rule exists", () => {
  const result = calculateAutomaticDiscountsFromRules(
    [
      { lineIndex: 0, productId: 1, title: "A", quantity: 1, unitPrice: 2000, lineTotal: 2000 },
      { lineIndex: 1, productId: 2, title: "B", quantity: 1, unitPrice: 1500, lineTotal: 1500 },
      { lineIndex: 2, productId: 3, title: "C", quantity: 1, unitPrice: 1200, lineTotal: 1200 },
    ],
    [
      { name: "3x2", ruleType: "buy_3_pay_2", threshold: 3, active: true, startsAt: null, endsAt: null },
    ],
  )

  assert.equal(result.automaticDiscount, 1200)
  assert.equal(result.threeForTwoDiscounts.length, 1)
  assert.equal(result.threeForTwoDiscounts[0].title, "C")
  assert.equal(result.appliedRules[0].type, "automatic_3x2")
})

test("automatic pricing removes 3x2 again when the rule is disabled", () => {
  const activeRule = { name: "3x2", ruleType: "buy_3_pay_2", threshold: 3, active: true, startsAt: null, endsAt: null }
  const disabledRule = { ...activeRule, active: false }
  const items = [
    { lineIndex: 0, productId: 1, title: "A", quantity: 1, unitPrice: 2000, lineTotal: 2000 },
    { lineIndex: 1, productId: 2, title: "B", quantity: 1, unitPrice: 1500, lineTotal: 1500 },
    { lineIndex: 2, productId: 3, title: "C", quantity: 1, unitPrice: 1200, lineTotal: 1200 },
  ]

  const activeResult = calculateAutomaticDiscountsFromRules(items, [activeRule])
  const disabledResult = calculateAutomaticDiscountsFromRules(items, [disabledRule])

  assert.equal(activeResult.automaticDiscount, 1200)
  assert.equal(disabledResult.automaticDiscount, 0)
  assert.deepEqual(disabledResult.threeForTwoDiscounts, [])
})
