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

test("shipping rates are centralized and selectable for Packlink economy and DHL premium", async () => {
  const items = [{ format: "A4", quantity: 1 }]
  const currentEnv = {
    packlinkUseMock: false,
    packlinkApiBaseUrl: "https://api.packlink.test/v1",
    packlinkApiKey: "packlink-key",
    packlinkDefaultCarrier: "BRT",
    packlinkSenderName: "BNS Studio",
    packlinkSenderEmail: "hello@example.com",
    packlinkSenderPhone: "3900000000",
    packlinkSenderStreet1: "Via Roma 1",
    packlinkSenderCity: "Milano",
    packlinkSenderZip: "20100",
    packlinkSenderCountry: "IT",
    packlinkParcelWeightKg: 1,
    packlinkParcelLengthCm: 30,
    packlinkParcelWidthCm: 20,
    packlinkParcelHeightCm: 5,
  }
  const fetchImpl = async (input) => {
    if (String(input).endsWith("/quotes")) {
      return new Response(
        JSON.stringify({
          quotes: [
            { service_id: "service-brt", carrier_name: "BRT", amount: 4.9, service_name: "BRT Economy" },
            { service_id: "service-gls", carrier_name: "GLS", amount: 5.2, service_name: "GLS Standard" },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      )
    }

    throw new Error(`Unexpected fetch URL: ${String(input)}`)
  }

  const rates = await getAvailableShippingRates({ items, currentEnv, fetchImpl })
  const selected = await resolveSelectedShippingRate({ items, shippingMethod: "premium", currentEnv, fetchImpl })

  assert.equal(rates.length, 2)
  assert.equal(rates[0].carrier, "brt")
  assert.equal(rates[1].carrier, "dhl")
  assert.equal(selected.selectedRate?.key, "premium")
  assert.equal(typeof selected.selectedRate?.cost, "number")
})
