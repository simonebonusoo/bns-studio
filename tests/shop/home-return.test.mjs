import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"

import { buildHomeReturnState, resolveHomeReturnState } from "../../src/shop/lib/home-return.mjs"

const root = process.cwd()

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8")
}

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

test("buildHomeReturnState normalizes scroll position for reliable home restore", () => {
  const state = buildHomeReturnState("/", 412.9)

  assert.equal(state.fromHomeShop, true)
  assert.equal(state.homePathname, "/")
  assert.equal(state.homeScrollY, 412)
  assert.equal(typeof state.savedAt, "number")
})

test("resolveHomeReturnState persists and reloads the saved home return context", () => {
  const storage = createStorage()
  const resolved = resolveHomeReturnState({ fromHomeShop: true, homePathname: "/", homeScrollY: 640 }, storage)

  assert.equal(resolved.homePathname, "/")
  assert.equal(resolved.homeScrollY, 640)
  assert.equal(resolveHomeReturnState(null, storage).homeScrollY, 640)
})

test("App disables browser scroll restoration and resets home to top on reload", () => {
  const app = read("src/App.tsx")

  assert.match(app, /window\.history\.scrollRestoration = "manual"/)
  assert.match(app, /navigationEntry\.type === "reload"/)
  assert.match(app, /window\.scrollTo\(0, 0\)/)
  assert.match(app, /clearHomeReturnState\(\)/)
  assert.match(app, /resetHomeTop/)
  assert.match(app, /window\.dispatchEvent\(new Event\("scroll"\)\)/)
})

test("Navbar logo forces a home-top reset instead of using generic anchor restore", () => {
  const navbar = read("src/components/Navbar.tsx")

  assert.match(navbar, /function handleLogoClick/)
  assert.match(navbar, /navigate\("\/", \{ state: \{ resetHomeTop: true \} \}\)/)
  assert.match(navbar, /onClick=\{handleLogoClick\}/)
  assert.match(navbar, /function resetHeaderState/)
  assert.doesNotMatch(navbar, /setScrolled/)
  assert.doesNotMatch(navbar, /window\.addEventListener\("scroll"/)
})
