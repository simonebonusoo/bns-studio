import test from "node:test"
import assert from "node:assert/strict"

import { parseCheckoutSessionItems, serializeCheckoutSessionAsPendingOrder } from "../../src/server/shop/lib/checkout-sessions.mjs"

test("serializeCheckoutSessionAsPendingOrder returns a pending pseudo-order for pre-payment flows", () => {
  const session = {
    orderReference: "BNS-TEST-123",
    email: "cliente@example.com",
    firstName: "Mario",
    lastName: "Rossi",
    phone: "3331234567",
    addressLine1: "Via Roma 1",
    addressLine2: "",
    streetNumber: "1",
    staircase: "A",
    apartment: "4",
    floor: "2",
    intercom: "Rossi",
    deliveryNotes: "Lasciare al portiere",
    city: "Milano",
    region: "Lombardia",
    postalCode: "20100",
    country: "Italia",
    status: "pending",
    shippingMethod: "premium",
    shippingCarrier: "dhl",
    shippingLabel: "Spedizione premium",
    shippingCost: 990,
    subtotal: 1500,
    discountTotal: 0,
    shippingTotal: 900,
    total: 2400,
    couponCode: null,
    createdAt: "2026-03-28T10:00:00.000Z",
    pricingBreakdown: JSON.stringify({ total: 2400 }),
    itemsSnapshot: JSON.stringify([
      {
        productId: 4,
        variantId: 10,
        title: "Poster",
        imageUrl: "/poster.jpg",
        format: "A4",
        variantLabel: "A4",
        variantSku: "POSTER-A4",
        unitPrice: 1500,
        unitCost: 800,
        quantity: 1,
        lineTotal: 1500,
        costTotal: 800,
      },
    ]),
  }

  const order = serializeCheckoutSessionAsPendingOrder(session)

  assert.equal(order.id, 0)
  assert.equal(order.orderReference, "BNS-TEST-123")
  assert.equal(order.status, "pending")
  assert.equal(order.fulfillmentStatus, "processing")
  assert.equal(order.shippingMethod, "premium")
  assert.equal(order.shippingCarrier, "dhl")
  assert.equal(order.shippingLabel, "Spedizione premium")
  assert.equal(order.shippingCost, 990)
  assert.equal(order.trackingUrl, null)
  assert.equal(order.phone, "3331234567")
  assert.equal(order.streetNumber, "1")
  assert.equal(order.region, "Lombardia")
  assert.equal(order.items.length, 1)
  assert.equal(order.items[0].variantId, 10)
  assert.equal(order.items[0].unitCost, 800)
})

test("parseCheckoutSessionItems tolerates invalid payloads safely", () => {
  assert.deepEqual(parseCheckoutSessionItems({ itemsSnapshot: "{" }), [])
})
