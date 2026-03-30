import test from "node:test"
import assert from "node:assert/strict"

import {
  calculateShippingCharge,
  DEFAULT_SHIPPING_METHOD,
  formatShippingMethodSummary,
  getShippingMethodConfig,
  normalizeShippingMethod,
} from "../../src/shop/lib/shipping-methods.mjs"

test("normalizeShippingMethod falls back safely and resolves both checkout options", () => {
  assert.equal(normalizeShippingMethod("economy"), "economy")
  assert.equal(normalizeShippingMethod("premium"), "premium")
  assert.equal(normalizeShippingMethod(""), DEFAULT_SHIPPING_METHOD)
  assert.equal(normalizeShippingMethod("legacy"), DEFAULT_SHIPPING_METHOD)
})

test("getShippingMethodConfig returns centralized pricing and carrier data", () => {
  const economy = getShippingMethodConfig("economy")
  const premium = getShippingMethodConfig("premium")

  assert.equal(economy.cost, 590)
  assert.equal(economy.carrier, "inpost")
  assert.equal(premium.cost, 990)
  assert.equal(premium.carrier, "dhl")
  assert.equal(formatShippingMethodSummary("premium"), "Spedizione premium (DHL)")
})

test("calculateShippingCharge uses method cost and supports free shipping rules without duplicating logic", () => {
  const rule = {
    name: "Free shipping",
    ruleType: "free_shipping_quantity",
    threshold: 3,
    startsAt: null,
    endsAt: null,
  }

  const premium = calculateShippingCharge({ shippingMethod: "premium", itemCount: 1, rules: [] })
  const discounted = calculateShippingCharge({ shippingMethod: "premium", itemCount: 3, rules: [rule] })

  assert.equal(premium.shippingCost, 990)
  assert.equal(premium.shippingTotal, 990)
  assert.equal(discounted.shippingCost, 990)
  assert.equal(discounted.shippingTotal, 0)
  assert.equal(discounted.appliedRules.length, 1)
})
