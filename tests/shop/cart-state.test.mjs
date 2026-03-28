import test from "node:test"
import assert from "node:assert/strict"

import { addCartItem, beginCheckoutCart, normalizeStoredCartItems, removeCartItem, updateCartItem } from "../../src/shop/lib/cart-state.mjs"

const product = {
  id: 14,
  title: "Poster test",
  slug: "poster-test",
  description: "Poster di prova",
  status: "active",
  price: 1500,
  category: "Print",
  imageUrls: ["https://example.com/poster.jpg"],
  featured: false,
  stock: 8,
  lowStockThreshold: 2,
  variants: [
    {
      id: 101,
      title: "A4",
      key: "a4",
      price: 1500,
      stock: 5,
      lowStockThreshold: 2,
      position: 0,
      isDefault: true,
      isActive: true,
      sku: "POSTER-A4",
    },
    {
      id: 102,
      title: "A3",
      key: "a3",
      price: 2200,
      stock: 3,
      lowStockThreshold: 1,
      position: 1,
      isDefault: false,
      isActive: true,
      sku: "POSTER-A3",
    },
  ],
}

test("addCartItem merges same variant instead of duplicating rows", () => {
  const first = addCartItem([], product, 1, { variantId: 101 })
  const second = addCartItem(first, product, 2, { variantId: 101 })

  assert.equal(second.length, 1)
  assert.equal(second[0].quantity, 3)
  assert.equal(second[0].variantId, 101)
  assert.equal(second[0].variantLabel, "A4")
})

test("addCartItem keeps different variants on separate rows", () => {
  const items = addCartItem(addCartItem([], product, 1, { variantId: 101 }), product, 1, { variantId: 102 })

  assert.equal(items.length, 2)
  assert.deepEqual(
    items.map((item) => item.variantId),
    [101, 102]
  )
})

test("updateCartItem removes the row when quantity reaches zero", () => {
  const items = addCartItem([], product, 2, { variantId: 101 })
  const updated = updateCartItem(items, product.id, 0, { variantId: 101 })

  assert.equal(updated.length, 0)
})

test("removeCartItem removes only the targeted variant row", () => {
  const items = addCartItem(addCartItem([], product, 1, { variantId: 101 }), product, 1, { variantId: 102 })
  const updated = removeCartItem(items, product.id, { variantId: 101 })

  assert.equal(updated.length, 1)
  assert.equal(updated[0].variantId, 102)
})

test("beginCheckoutCart replaces the cart with the selected product row", () => {
  const checkoutItems = beginCheckoutCart(product, 3, { variantId: 102 })

  assert.equal(checkoutItems.length, 1)
  assert.equal(checkoutItems[0].quantity, 3)
  assert.equal(checkoutItems[0].variantId, 102)
  assert.equal(checkoutItems[0].variantLabel, "A3")
})

test("normalizeStoredCartItems restores variant metadata from stored payload", () => {
  const normalized = normalizeStoredCartItems([
    {
      productId: product.id,
      quantity: 1,
      format: "A4",
      product,
    },
  ])

  assert.equal(normalized[0].variantId, 101)
  assert.equal(normalized[0].variantLabel, "A4")
  assert.equal(normalized[0].variantSku, "POSTER-A4")
})
