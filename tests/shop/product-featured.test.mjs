import test from "node:test"
import assert from "node:assert/strict"

import { assertFeaturedProductLimit, MAX_FEATURED_PRODUCTS } from "../../src/server/shop/lib/product-featured.mjs"

test("featured product limit is capped at 16 items", () => {
  assert.equal(MAX_FEATURED_PRODUCTS, 16)
})

test("assertFeaturedProductLimit allows up to 16 homepage products and blocks the seventeenth", () => {
  assert.doesNotThrow(() => {
    assertFeaturedProductLimit({
      currentFeaturedCount: 15,
      nextFeatured: true,
      currentlyFeatured: false,
    })
  })

  assert.throws(
    () =>
      assertFeaturedProductLimit({
        currentFeaturedCount: 16,
        nextFeatured: true,
        currentlyFeatured: false,
      }),
    /al massimo 16 prodotti/i,
  )
})
