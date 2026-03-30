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
    shippingError: null,
    pricingBreakdown: JSON.stringify({ total: 1000 }),
  })

  assert.equal(order.shippingMethod, null)
  assert.equal(order.shippingCarrier, null)
  assert.equal(order.shippingLabel, null)
  assert.equal(order.shippingStatus, "pending")
  assert.equal(order.trackingNumber, null)
  assert.equal(order.trackingUrl, null)
  assert.equal(order.pricingBreakdown.total, 1000)
})
