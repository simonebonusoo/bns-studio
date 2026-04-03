import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"

const root = process.cwd()

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8")
}

test("admin products section uses simple homepage visibility controls instead of slot management", () => {
  const adminProductsSection = read("src/shop/components/admin/AdminProductsSection.tsx")
  const productListSection = read("src/shop/components/admin/ProductListSection.tsx")
  const homeShop = read("src/sections/HomeShop.tsx")

  assert.doesNotMatch(adminProductsSection, /AdminVisibleProductsSection/)
  assert.match(productListSection, /Visibile in home/)
  assert.match(homeShop, /shuffleProducts\(featuredProducts\)\.slice\(0, 8\)/)
  assert.doesNotMatch(homeShop, /homepageVisibleProductSlots/)
  assert.doesNotMatch(adminProductsSection, /Prodotti visibili/)
})
