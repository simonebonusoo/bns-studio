import test from "node:test"
import assert from "node:assert/strict"

import { normalizeProductFormStateForEdit } from "../../src/shop/lib/admin-product-edit.mjs"

test("normalizeProductFormStateForEdit apre in sicurezza un prodotto con immagini e varianti", () => {
  const form = normalizeProductFormStateForEdit({
    id: 12,
    title: "Poster test",
    sku: "POSTER-01",
    description: "Descrizione",
    price: 1500,
    priceA4: 1500,
    discountPrice: 1200,
    category: "Print",
    imageUrls: ["/uploads/1.png", "/uploads/2.png"],
    featured: true,
    stock: 8,
    lowStockThreshold: 3,
    status: "active",
    tags: [{ name: "pop" }, { name: "music" }],
    collections: [{ id: 4, title: "Cantanti" }],
    manualBadges: [{ id: "badge-1", label: "New", enabled: true }],
    variants: [
      {
        id: 1,
        title: "A4",
        key: "a4",
        sku: "A4-01",
        price: 1500,
        discountPrice: 1200,
        costPrice: 800,
        stock: 8,
        lowStockThreshold: 3,
        isDefault: true,
        isActive: true,
      },
    ],
  })

  assert.equal(form.title, "Poster test")
  assert.deepEqual(form.existingImageUrls, ["/uploads/1.png", "/uploads/2.png"])
  assert.deepEqual(form.collectionIds, [4])
  assert.equal(form.tags, "pop, music")
  assert.equal(form.variants.length, 1)
  assert.equal(form.variants[0].title, "A4")
  assert.equal(form.variants[0].discountPrice, "12")
  assert.equal(form.discountPriceA4, "12")
})

test("normalizeProductFormStateForEdit non crasha senza immagini", () => {
  const form = normalizeProductFormStateForEdit({
    title: "Senza immagini",
    description: "Test",
    price: 1000,
    category: "Print",
    featured: false,
    stock: 0,
    status: "draft",
  })

  assert.deepEqual(form.existingImageUrls, [])
  assert.equal(form.variants.length >= 1, true)
})

test("normalizeProductFormStateForEdit crea fallback per dati legacy o parziali", () => {
  const form = normalizeProductFormStateForEdit({
    title: "Legacy",
    description: null,
    price: 2000,
    priceA3: 2400,
    hasA4: false,
    hasA3: true,
    category: null,
    imageUrls: ["/uploads/legacy.png", null, ""],
    tags: [{ foo: "broken" }],
    collections: [{ slug: "cantanti" }],
    manualBadges: [{ label: "Promo" }, null],
    stock: null,
    status: null,
    variants: [],
  })

  assert.equal(form.description, "")
  assert.equal(form.category, "")
  assert.deepEqual(form.existingImageUrls, ["/uploads/legacy.png"])
  assert.deepEqual(form.collectionIds, [])
  assert.equal(form.manualBadges.length, 1)
  assert.equal(form.manualBadges[0].label, "Promo")
  assert.equal(form.status, "active")
  assert.equal(form.variants.length >= 1, true)
})
