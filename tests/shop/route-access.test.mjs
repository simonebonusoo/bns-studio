import test from "node:test"
import assert from "node:assert/strict"

import { canAccessCustomerCheckout } from "../../src/shop/lib/route-access.mjs"

test("customer checkout is allowed for a real customer", () => {
  const result = canAccessCustomerCheckout({
    user: { id: 1, role: "customer" },
    effectiveRole: "customer",
  })

  assert.equal(result.allowed, true)
})

test("customer checkout is allowed for admin guest preview acting as customer", () => {
  const result = canAccessCustomerCheckout({
    user: { id: 1, role: "admin" },
    effectiveRole: "customer",
  })

  assert.equal(result.allowed, true)
})

test("customer checkout is blocked when the effective role is not customer", () => {
  const result = canAccessCustomerCheckout({
    user: { id: 1, role: "admin" },
    effectiveRole: "admin",
  })

  assert.equal(result.allowed, false)
  assert.equal(result.reason, "not_customer")
})
