import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"

const root = process.cwd()

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8")
}

test("mobile navbar, search and product cards keep the simplified mobile UX", () => {
  const navbar = read("src/components/Navbar.tsx")
  const productCard = read("src/shop/components/ProductCard.tsx")
  const homeShop = read("src/sections/HomeShop.tsx")

  assert.match(navbar, /label: "Home"/)
  assert.match(navbar, /label: "Categorie"/)
  assert.match(navbar, /label: "Ordini"/)
  assert.doesNotMatch(navbar, /Privacy \/ info/)
  assert.match(navbar, /data-testid="mobile-search-suggestions"/)
  assert.match(navbar, /data-testid="mobile-search-live-results"/)
  assert.match(navbar, /touch-pan-x/)
  assert.match(navbar, /overscroll-y-contain/)
  assert.match(navbar, /\[-webkit-overflow-scrolling:touch\]/)
  assert.doesNotMatch(productCard, /secondaryImage/)
  assert.doesNotMatch(productCard, /group-hover:opacity-100/)
  assert.match(homeShop, /id="shop-categories"/)
})
