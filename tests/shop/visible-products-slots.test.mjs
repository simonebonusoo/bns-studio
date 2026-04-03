import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"

import {
  assignProductToVisibleSlot,
  buildDefaultVisibleProductSlots,
  buildNormalizedSlots,
  clearVisibleSlot,
  moveVisibleSlot,
  orderVisibleProducts,
  parseVisibleProductSlotsSetting,
  VISIBLE_PRODUCT_SLOTS_COUNT,
} from "../../src/shop/lib/visible-products-slots.mjs"

const root = process.cwd()

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8")
}

function buildProduct(id, featured = false) {
  return { id, featured, title: `Product ${id}` }
}

test("visible product slots keep a fixed size of 8", () => {
  assert.equal(VISIBLE_PRODUCT_SLOTS_COUNT, 8)
  assert.equal(buildNormalizedSlots([1, 2]).length, 8)
})

test("visible product slots parse ids, preserve empties and remove duplicates", () => {
  assert.deepEqual(parseVisibleProductSlotsSetting(JSON.stringify([1, null, 2, 1])), [1, null, 2, null, null, null, null, null])
})

test("default visible slots follow current homepage product fallback order", () => {
  assert.deepEqual(buildDefaultVisibleProductSlots([buildProduct(2, true), buildProduct(1, false)]).slice(0, 2), [2, 1])
})

test("assigning a product to a slot removes it from any previous slot", () => {
  assert.deepEqual(assignProductToVisibleSlot([11, null, 22, null, null, null, null, null], 1, 22), [11, 22, null, null, null, null, null, null])
})

test("clear and move helpers keep slot structure stable", () => {
  const cleared = clearVisibleSlot([1, 2, null, null, null, null, null, null], 0)
  assert.deepEqual(cleared, [null, 2, null, null, null, null, null, null])

  const moved = moveVisibleSlot([1, 2, null, null, null, null, null, null], 0, 1)
  assert.deepEqual(moved, [2, 1, null, null, null, null, null, null])
})

test("public visible products follow the explicit slot order", () => {
  const ordered = orderVisibleProducts([buildProduct(10), buildProduct(20), buildProduct(30)], [30, null, 10, null, null, null, null, null])
  assert.deepEqual(ordered.map((product) => product.id), [30, 10])
})

test("admin products section exposes the dedicated visible products slot manager", () => {
  const adminProductsSection = read("src/shop/components/admin/AdminProductsSection.tsx")
  const adminVisibleProductsSection = read("src/shop/components/admin/AdminVisibleProductsSection.tsx")
  const productListSection = read("src/shop/components/admin/ProductListSection.tsx")
  const productFormCard = read("src/shop/components/admin/ProductFormCard.tsx")
  const homeShop = read("src/sections/HomeShop.tsx")

  assert.match(adminVisibleProductsSection, /Prodotti visibili/)
  assert.match(adminVisibleProductsSection, /Aggiungi poster/)
  assert.match(adminVisibleProductsSection, /Seleziona prodotto per slot/)
  assert.match(adminVisibleProductsSection, /Cerca poster/)
  assert.match(adminVisibleProductsSection, /Ultimo aggiunto/)
  assert.match(adminVisibleProductsSection, /Primo aggiunto/)
  assert.match(adminVisibleProductsSection, /Ordine alfabetico/)
  assert.match(adminVisibleProductsSection, /overflow-y-auto/)
  assert.match(adminVisibleProductsSection, /maxHeight: "70vh"/)
  assert.match(adminVisibleProductsSection, /Selezionato nello slot corrente/)
  assert.match(adminVisibleProductsSection, /Già nello slot/)
  assert.match(adminProductsSection, /AdminVisibleProductsSection/)
  assert.match(homeShop, /homepageVisibleProductSlots/)
  assert.doesNotMatch(productListSection, /Mostra nella home/)
  assert.doesNotMatch(productListSection, /Homepage/)
  assert.doesNotMatch(productFormCard, /Mostra nella home/)
})
