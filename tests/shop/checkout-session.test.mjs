import test from "node:test"
import assert from "node:assert/strict"

import { parseCheckoutSessionItems, serializeCheckoutSessionAsPendingOrder } from "../../src/server/shop/lib/checkout-sessions.mjs"

test("serializeCheckoutSessionAsPendingOrder returns a pending pseudo-order for pre-payment flows", () => {
  const session = {
    orderReference: "BNS-TEST-123",
    email: "cliente@example.com",
    firstName: "Mario",
    lastName: "Rossi",
    addressLine1: "Via Roma 1",
    addressLine2: "",
    city: "Milano",
    postalCode: "20100",
    country: "Italia",
    status: "pending",
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
  assert.equal(order.items.length, 1)
  assert.equal(order.items[0].variantId, 10)
  assert.equal(order.items[0].unitCost, 800)
})

test("parseCheckoutSessionItems tolerates invalid payloads safely", () => {
  assert.deepEqual(parseCheckoutSessionItems({ itemsSnapshot: "{" }), [])
})
