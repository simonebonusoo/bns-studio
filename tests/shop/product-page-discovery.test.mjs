import test from "node:test"
import assert from "node:assert/strict"

import { getRelatedProductsPageState, getRecentlyViewedProducts, upsertRecentlyViewedProduct } from "../../src/shop/lib/product-page-discovery.mjs"

function buildProduct(id, slug = `product-${id}`) {
  return {
    id,
    slug,
    title: `Product ${id}`,
    imageUrls: [],
  }
}

test("related page state shows 8 products initially and exposes the next step", () => {
  const products = Array.from({ length: 18 }, (_, index) => buildProduct(index + 1))
  const state = getRelatedProductsPageState(products, 8, 8)

  assert.equal(state.visibleItems.length, 8)
  assert.equal(state.canLoadMore, true)
  assert.equal(state.nextVisibleCount, 16)
})

test("related page state adds 8 more items without duplicates and hides the button at the end", () => {
  const products = Array.from({ length: 14 }, (_, index) => buildProduct(index + 1))
  const expanded = getRelatedProductsPageState(products, 16, 8)

  assert.equal(expanded.visibleItems.length, 14)
  assert.equal(new Set(expanded.visibleItems.map((product) => product.id)).size, 14)
  assert.equal(expanded.canLoadMore, false)
})

test("upsertRecentlyViewedProduct stores products in recent-first order without duplicates", () => {
  const history = [buildProduct(1), buildProduct(2)]
  const next = upsertRecentlyViewedProduct(history, buildProduct(1))

  assert.deepEqual(next.map((product) => product.id), [1, 2])
})

test("getRecentlyViewedProducts excludes the current product and returns only previous visits", () => {
  const history = [buildProduct(4, "current"), buildProduct(3), buildProduct(2), buildProduct(1)]
  const recent = getRecentlyViewedProducts(history, "current", 8)

  assert.deepEqual(recent.map((product) => product.id), [3, 2, 1])
})

test("getRecentlyViewedProducts returns empty when there are no other products to show", () => {
  const history = [buildProduct(4, "current")]
  const recent = getRecentlyViewedProducts(history, "current", 8)

  assert.deepEqual(recent, [])
})
