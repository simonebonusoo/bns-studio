import test from "node:test"
import assert from "node:assert/strict"

import { getProductPurchaseState } from "../../src/shop/lib/purchase-state.mjs"

test("purchase state shows notify action for unavailable variants", () => {
  const state = getProductPurchaseState({
    effectiveRole: "customer",
    purchasable: false,
    notifyInterest: true,
  })

  assert.equal(state.showPurchaseActions, false)
  assert.equal(state.showNotifyAction, true)
  assert.equal(state.showNotifyFeedback, true)
  assert.equal(state.showEditAction, false)
})

test("purchase state keeps admin edit action available", () => {
  const state = getProductPurchaseState({
    effectiveRole: "admin",
    purchasable: true,
    notifyInterest: false,
  })

  assert.equal(state.showPurchaseActions, true)
  assert.equal(state.showNotifyAction, false)
  assert.equal(state.showEditAction, true)
})
