import test from "node:test"
import assert from "node:assert/strict"

import { getRestockedVariantIds } from "../../src/server/shop/services/back-in-stock.mjs"

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
