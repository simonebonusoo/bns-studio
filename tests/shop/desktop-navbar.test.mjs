import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"

const root = process.cwd()

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8")
}

test("desktop navbar exposes ecommerce editorial links and keeps mobile sheet untouched", () => {
  const navbar = read("src/components/Navbar.tsx")

  for (const label of ["Home", "Promo", "Categorie", "Collezioni", "Catalogo", "Chi siamo", "Contatti"]) {
    assert.match(navbar, new RegExp(`label: "${label}"`))
  }

  assert.match(navbar, /href: "\/#top"/)
  assert.match(navbar, /href: "\/shop\/offerte"/)
  assert.match(navbar, /href: "\/#shop-categories"/)
  assert.match(navbar, /href: "\/#shop-collections"/)
  assert.match(navbar, /href: "\/shop"/)
  assert.match(navbar, /href: "\/chi-siamo"/)
  assert.match(navbar, /href: "\/#contatti"/)
  assert.match(navbar, /<MobileSheet/)
})

test("desktop search replaces nav links with the existing suggestion overlay", () => {
  const navbar = read("src/components/Navbar.tsx")
  const button = read("src/components/Button.tsx")

  assert.match(navbar, /key="desktop-links"/)
  assert.match(navbar, /key="desktop-search"/)
  assert.match(navbar, /desktopNavTransition/)
  assert.match(navbar, /data-testid="desktop-search-suggestions"/)
  assert.match(navbar, /data-testid="desktop-search-live-results"/)
  assert.match(button, /onClick=\{\(event\) =>/)
})
