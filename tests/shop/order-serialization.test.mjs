import test from "node:test"
import assert from "node:assert/strict"

import { serializeShopOrder } from "../../src/server/shop/lib/order-serialization.mjs"

test("serializeShopOrder keeps legacy orders safe when new shipping fields are missing", () => {
  const order = serializeShopOrder({
    id: 1,
    orderReference: "BNS-LEGACY",
    fulfillmentStatus: "processing",
    shippingStatus: null,
    shippingMethod: null,
    shippingCarrier: null,
    shippingLabel: null,
    shippingCost: null,
    trackingNumber: null,
    trackingUrl: "",
    shippingCreatedAt: null,
    dhlShipmentReference: null,
    labelUrl: null,
    shippingProviderPayload: null,
    shippingError: null,
    pricingBreakdown: JSON.stringify({ total: 1000 }),
  })

  assert.equal(order.shippingMethod, null)
  assert.equal(order.shippingCarrier, null)
  assert.equal(order.shippingLabel, null)
  assert.equal(order.shippingStatus, "pending")
  assert.equal(order.trackingNumber, null)
  assert.equal(order.trackingUrl, null)
  assert.equal(order.shippingProviderPayload, null)
  assert.equal(order.pricingBreakdown.total, 1000)
})

test("serializeShopOrder parses provider payload when available", () => {
  const order = serializeShopOrder({
    id: 2,
    orderReference: "BNS-SHIPPING",
    fulfillmentStatus: "accepted",
    shippingStatus: "created",
    shippingMethod: "premium",
    shippingCarrier: "DHL",
    shippingLabel: "Spedizione premium",
    shippingCost: 990,
    trackingNumber: "DHL-TRK-1",
    trackingUrl: "https://example.com/track",
    shippingCreatedAt: "2026-03-30T10:00:00.000Z",
    dhlShipmentReference: "REF-1",
    labelUrl: "https://example.com/label.pdf",
    shippingProviderPayload: JSON.stringify({ provider: "dhl", mode: "mock" }),
    shippingError: null,
    pricingBreakdown: JSON.stringify({ total: 1990 }),
  })

  assert.deepEqual(order.shippingProviderPayload, { provider: "dhl", mode: "mock" })
})
