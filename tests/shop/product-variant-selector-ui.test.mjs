import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"

const root = process.cwd()

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8")
}

test("product variant selector shows original struck price only when a valid discount exists", () => {
  const selector = read("src/shop/components/product/ProductVariantSelector.tsx")

  assert.match(selector, /function getValidDiscountPrice/)
  assert.match(selector, /const validDiscountPrice = getValidDiscountPrice\(variant\.price, variant\.discountPrice\)/)
  assert.match(selector, /<span className="line-through">\{formatPrice\(variant\.price\)\}<\/span>/)
  assert.match(selector, /className="font-medium text-\[#e3f503\]">\{formatPrice\(validDiscountPrice\)\}<\/span>/)
  assert.match(selector, /: \(\s*<span>\{formatPrice\(variant\.price\)\}<\/span>\s*\)/)
})
