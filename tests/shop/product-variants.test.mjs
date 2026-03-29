import test from "node:test"
import assert from "node:assert/strict"

import {
  buildLegacyProductFieldsFromVariants,
  deriveLegacyVariantsFromProduct,
  serializeProductVariants,
} from "../../src/server/shop/lib/product-variants.mjs"

test("deriveLegacyVariantsFromProduct keeps A3/A4 compatibility and infers format options", () => {
  const variants = deriveLegacyVariantsFromProduct({
    sku: "PRINT-001",
    price: 1500,
    priceA4: 1500,
    priceA3: 2200,
    costPrice: 500,
    stock: 8,
    lowStockThreshold: 2,
    hasA4: true,
    hasA3: true,
  })

  assert.equal(variants.length, 2)
  assert.deepEqual(variants[0].options, [{ name: "Format", value: "A4" }])
  assert.deepEqual(variants[1].options, [{ name: "Format", value: "A3" }])
})

test("buildLegacyProductFieldsFromVariants accepts generic option payloads and keeps summary fields", () => {
  const payload = buildLegacyProductFieldsFromVariants([
    {
      title: "Cornice nera",
      key: "frame-black",
      options: [{ name: "Frame", value: "Black" }],
      price: 2400,
      discountPrice: 1800,
      costPrice: 900,
      stock: 3,
      lowStockThreshold: 1,
      isDefault: true,
      isActive: true,
    },
  ])

  assert.equal(payload.variants[0].key, "frame-black")
  assert.deepEqual(payload.variants[0].options, [{ name: "Frame", value: "Black" }])
  assert.equal(payload.summary.price, 2400)
  assert.equal(payload.summary.discountPrice, 1800)
  assert.equal(payload.summary.stock, 3)
  assert.equal(payload.summary.hasA4, false)
  assert.equal(payload.summary.hasA3, false)
})

test("serializeProductVariants exposes options and option summary", () => {
  const product = {
    variants: [
      {
        id: 7,
        title: "A4",
        key: "a4",
        optionsJson: JSON.stringify([{ name: "Format", value: "A4" }]),
        sku: "PRINT-001-A4",
        price: 1500,
        discountPrice: 1200,
        costPrice: 500,
        stock: 5,
        lowStockThreshold: 2,
        position: 0,
        isDefault: true,
        isActive: true,
      },
    ],
  }

  const serialized = serializeProductVariants(product)
  assert.equal(serialized[0].optionSummary, "Format: A4")
  assert.deepEqual(serialized[0].options, [{ name: "Format", value: "A4" }])
  assert.equal(serialized[0].discountPrice, 1200)
})
