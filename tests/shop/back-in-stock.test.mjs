import test from "node:test"
import assert from "node:assert/strict"

import {
  buildBackInStockNotificationPayloads,
  getRestockedVariantIds,
  markBackInStockSubscriptionsNotified,
} from "../../src/server/shop/services/back-in-stock.mjs"

test("getRestockedVariantIds detects a variant coming back in stock", () => {
  const previousVariants = [{ id: 4, key: "a4", stock: 0, isActive: true }]
  const nextVariants = [{ id: 4, key: "a4", stock: 6, isActive: true }]

  assert.deepEqual(getRestockedVariantIds(previousVariants, nextVariants), [4])
})

test("getRestockedVariantIds ignores variants still unavailable", () => {
  const previousVariants = [{ id: 4, key: "a4", stock: 0, isActive: true }]
  const nextVariants = [{ id: 4, key: "a4", stock: 0, isActive: true }]

  assert.deepEqual(getRestockedVariantIds(previousVariants, nextVariants), [])
})

test("buildBackInStockNotificationPayloads keeps product and variant context", () => {
  const payloads = buildBackInStockNotificationPayloads([
    {
      id: 8,
      email: "cliente@example.com",
      productId: 12,
      variantId: 4,
      product: { title: "Print Identity Pack", slug: "print-identity-pack" },
      variant: { title: "A3" },
      user: { email: "cliente@example.com" },
    },
  ])

  assert.equal(payloads.length, 1)
  assert.equal(payloads[0].subscriptionId, 8)
  assert.equal(payloads[0].productTitle, "Print Identity Pack")
  assert.equal(payloads[0].variantLabel, "A3")
  assert.match(payloads[0].subject, /Di nuovo disponibile/)
})

test("markBackInStockSubscriptionsNotified updates only ready subscriptions", async () => {
  let receivedWhere = null
  let receivedData = null
  const db = {
    backInStockSubscription: {
      async updateMany({ where, data }) {
        receivedWhere = where
        receivedData = data
        return { count: 2 }
      },
    },
  }

  const result = await markBackInStockSubscriptionsNotified(db, [3, 5])

  assert.equal(result.count, 2)
  assert.deepEqual(receivedWhere.id.in, [3, 5])
  assert.equal(receivedWhere.status, "ready")
  assert.equal(receivedData.status, "notified")
  assert.ok(receivedData.notifiedAt instanceof Date)
})
