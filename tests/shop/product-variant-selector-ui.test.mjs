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
  const purchasePanel = read("src/shop/components/product/ProductPurchasePanel.tsx")

  assert.match(selector, /function getValidDiscountPrice/)
  assert.match(selector, /const validDiscountPrice = getValidDiscountPrice\(variant\.price, variant\.discountPrice\)/)
  assert.match(selector, /<span className="shrink-0 line-through">\{formatPrice\(variant\.price\)\}<\/span>/)
  assert.match(selector, /className="shrink-0 font-medium text-\[#e3f503\]">\{formatPrice\(validDiscountPrice\)\}<\/span>/)
  assert.match(selector, /: \(\s*<span className="shrink-0">\{formatPrice\(variant\.price\)\}<\/span>\s*\)/)
  assert.match(selector, /className="relative min-w-0 w-full max-w-full rounded-2xl border border-white\/10 px-4 py-3"/)
  assert.match(selector, /className="mt-2 flex min-h-\[46px\] w-full max-w-full min-w-0 items-center justify-between gap-3 overflow-hidden/)
  assert.match(selector, /className="flex min-w-0 max-w-full items-center gap-x-1\.5 overflow-hidden whitespace-nowrap"/)
  assert.match(purchasePanel, /className="flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-white\/10 px-4 py-3"/)
  assert.match(purchasePanel, /className="min-w-0 max-w-full truncate text-right text-sm text-white\/80 transition hover:text-\[#e3f503\]"/)
  assert.match(purchasePanel, /className="min-w-0 max-w-full truncate text-right">\{sku\}<\/span>/)
})
