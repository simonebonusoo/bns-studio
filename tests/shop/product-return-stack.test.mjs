import test from "node:test"
import assert from "node:assert/strict"

import { consumePreviousProductReturnEntry, pushProductReturnEntry } from "../../src/shop/lib/product-return-stack.mjs"

function createStorage() {
  const map = new Map()
  return {
    getItem(key) {
      return map.has(key) ? map.get(key) : null
    },
    setItem(key, value) {
      map.set(key, value)
    },
    removeItem(key) {
      map.delete(key)
    },
  }
}

test("product return stack walks back through nested related products one level at a time", () => {
  const storage = createStorage()

  pushProductReturnEntry({ pathname: "/shop/a" }, storage)
  pushProductReturnEntry({ pathname: "/shop/b" }, storage)

  assert.equal(consumePreviousProductReturnEntry("/shop/c", storage)?.pathname, "/shop/b")
  assert.equal(consumePreviousProductReturnEntry("/shop/b", storage)?.pathname, "/shop/a")
  assert.equal(consumePreviousProductReturnEntry("/shop/a", storage), null)
})

test("product return stack ignores stale duplicates of the current product before going back", () => {
  const storage = createStorage()

  pushProductReturnEntry({ pathname: "/shop/a" }, storage)
  pushProductReturnEntry({ pathname: "/shop/b" }, storage)
  pushProductReturnEntry({ pathname: "/shop/b" }, storage)

  assert.equal(consumePreviousProductReturnEntry("/shop/b", storage)?.pathname, "/shop/a")
  assert.equal(consumePreviousProductReturnEntry("/shop/a", storage), null)
})

