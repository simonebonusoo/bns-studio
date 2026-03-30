import test from "node:test"
import assert from "node:assert/strict"

import { scrollCatalogSectionToTop } from "../../src/shop/lib/catalog-navigation.mjs"

test("scrollCatalogSectionToTop scrolls the catalog anchor when available", () => {
  let calledWith = null
  const target = {
    scrollIntoView(options) {
      calledWith = options
    },
  }

  const result = scrollCatalogSectionToTop(target)

  assert.equal(result, "element")
  assert.deepEqual(calledWith, { behavior: "smooth", block: "start" })
})

test("scrollCatalogSectionToTop falls back to window scroll when no anchor is available", () => {
  let calledWith = null
  globalThis.window = {
    scrollTo(options) {
      calledWith = options
    },
  }

  const result = scrollCatalogSectionToTop(null)

  assert.equal(result, "window")
  assert.deepEqual(calledWith, { top: 0, behavior: "smooth" })

  delete globalThis.window
})
