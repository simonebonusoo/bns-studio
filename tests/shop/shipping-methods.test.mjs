import test from "node:test"
import assert from "node:assert/strict"

import {
  DEFAULT_SHIPPING_METHOD,
  formatShippingMethodSummary,
  getShippingMethodConfig,
  normalizeShippingMethod,
} from "../../src/shop/lib/shipping-methods.mjs"
import { getAvailableShippingRates, normalizeShippingMethodSelection, resolveSelectedShippingRate } from "../../src/server/shop/services/shipping-rates.mjs"

test("normalizeShippingMethod falls back safely and resolves both checkout options", () => {
  assert.equal(normalizeShippingMethod("economy"), "economy")
  assert.equal(normalizeShippingMethod("premium"), "premium")
  assert.equal(normalizeShippingMethod(""), null)
  assert.equal(normalizeShippingMethod("legacy"), null)
  assert.equal(DEFAULT_SHIPPING_METHOD, "")
  assert.equal(normalizeShippingMethodSelection("economy"), "economy")
  assert.equal(normalizeShippingMethodSelection("legacy"), null)
})

test("getShippingMethodConfig returns centralized pricing and carrier data", () => {
  const economy = getShippingMethodConfig("economy")
  const premium = getShippingMethodConfig("premium")

  assert.equal(economy.carrier, "inpost")
  assert.equal(premium.carrier, "dhl")
  assert.equal(formatShippingMethodSummary("premium"), "Spedizione premium (DHL)")
})

test("shipping rates are centralized and selectable for InPost and DHL", async () => {
  const items = [{ format: "A4", quantity: 1 }]
  const rates = await getAvailableShippingRates({ items })
  const selected = await resolveSelectedShippingRate({ items, shippingMethod: "premium" })

  assert.equal(rates.length, 2)
  assert.equal(rates[0].carrier, "inpost")
  assert.equal(rates[1].carrier, "dhl")
  assert.equal(selected.selectedRate?.key, "premium")
  assert.equal(typeof selected.selectedRate?.cost, "number")
})
