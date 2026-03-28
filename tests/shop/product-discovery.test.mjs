import test from "node:test"
import assert from "node:assert/strict"

import { scoreCatalogSearchProduct, scoreRelatedProduct, sortCatalogSearchProducts } from "../../src/server/shop/lib/product-discovery.mjs"

function buildProduct(overrides = {}) {
  return {
    id: 1,
    title: "Adele Print",
    slug: "adele-print",
    sku: "ADELE-PRINT",
    description: "Poster artistico in edizione studio",
    category: "Print",
    featured: false,
    status: "active",
    stock: 5,
    lowStockThreshold: 1,
    createdAt: "2026-03-20T10:00:00.000Z",
    productTags: [],
    productCollections: [],
    variants: [],
    ...overrides,
  }
}

test("search ranking favors exact title matches and stock availability", () => {
  const exact = buildProduct()
  const partial = buildProduct({ id: 2, title: "Poster di Adele", slug: "poster-adele", stock: 0, status: "out_of_stock" })

  assert.ok(scoreCatalogSearchProduct(exact, "Adele Print") > scoreCatalogSearchProduct(partial, "Adele Print"))
})

test("sortCatalogSearchProducts orders featured and in-stock items higher for suggestions", () => {
  const products = [
    buildProduct({ id: 2, title: "Print B", featured: false, stock: 0, status: "out_of_stock", createdAt: "2026-03-18T10:00:00.000Z" }),
    buildProduct({ id: 3, title: "Print A", featured: true, stock: 4, createdAt: "2026-03-22T10:00:00.000Z" }),
  ]

  const sorted = sortCatalogSearchProducts(products, "")
  assert.equal(sorted[0].id, 3)
})

test("related product scoring favors shared category and collections", () => {
  const baseProduct = buildProduct({
    id: 10,
    productTags: [{ tagId: 1 }],
    productCollections: [{ collectionId: 4 }],
  })
  const strongMatch = buildProduct({
    id: 11,
    productTags: [{ tagId: 1 }],
    productCollections: [{ collectionId: 4 }],
    featured: true,
  })
  const weakMatch = buildProduct({
    id: 12,
    category: "Other",
    productTags: [],
    productCollections: [],
  })

  assert.ok(scoreRelatedProduct(baseProduct, strongMatch) > scoreRelatedProduct(baseProduct, weakMatch))
})
