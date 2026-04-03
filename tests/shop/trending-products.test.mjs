import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"

import {
  buildDefaultTrendingProductIds,
  moveTrendingProductId,
  orderTrendingProducts,
  parseTrendingProductIdsSetting,
  resolveTrendingProductIds,
} from "../../src/shop/lib/trending-products.mjs"

const root = process.cwd()

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8")
}

function buildProduct(id, featured = false) {
  return { id, featured, title: `Product ${id}` }
}

test("trending settings parse unique numeric ids and ignore invalid entries", () => {
  assert.deepEqual(parseTrendingProductIdsSetting(JSON.stringify([4, "5", 4, null, "abc"])), [4, 5])
  assert.equal(parseTrendingProductIdsSetting(""), null)
})

test("default trending ids keep featured products first and cap the list", () => {
  const ids = buildDefaultTrendingProductIds([buildProduct(1, false), buildProduct(2, true), buildProduct(3, false), buildProduct(4, true)])
  assert.deepEqual(ids.slice(0, 4), [2, 4, 1, 3])
})

test("resolve trending ids falls back to current homepage behavior when setting is missing", () => {
  const ids = resolveTrendingProductIds(undefined, [buildProduct(1, true), buildProduct(2, false), buildProduct(3, false)])
  assert.deepEqual(ids, [1, 2, 3])
})

test("order trending products follows the saved manual order", () => {
  const ordered = orderTrendingProducts(
    [buildProduct(11), buildProduct(22), buildProduct(33)],
    [33, 11],
  )

  assert.deepEqual(ordered.map((product) => product.id), [33, 11])
})

test("moveTrendingProductId reorders selected ids for drag and drop", () => {
  assert.deepEqual(moveTrendingProductId([1, 2, 3], 3, 1), [3, 1, 2])
})

test("homepage and admin expose the dedicated trending controls", () => {
  const homeShop = read("src/sections/HomeShop.tsx")
  const adminPage = read("src/shop/pages/ShopAdminPage.tsx")
  const adminTrendingSection = read("src/shop/components/admin/AdminTrendingSection.tsx")

  assert.match(homeShop, /Poster di tendenza/)
  assert.match(homeShop, /navigate\("\/shop\/admin\?tab=tendenza"\)/)
  assert.match(adminPage, /\["tendenza", "Tendenza"\]/)
  assert.match(adminTrendingSection, /Salva tendenza/)
  assert.match(adminTrendingSection, /draggable/)
  assert.match(adminTrendingSection, /Tick/)
  assert.match(adminTrendingSection, /Cerca poster/)
  assert.match(adminTrendingSection, /Ultimo aggiunto/)
  assert.match(adminTrendingSection, /Primo aggiunto/)
  assert.match(adminTrendingSection, /Ordine alfabetico/)
})
