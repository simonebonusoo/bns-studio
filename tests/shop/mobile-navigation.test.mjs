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
  const mobileSheet = read("src/components/mobile/MobileSheet.tsx")
  const bodyScrollLock = read("src/hooks/useBodyScrollLock.ts")
  const productCard = read("src/shop/components/ProductCard.tsx")
  const homeShop = read("src/sections/HomeShop.tsx")
  const canHoverHook = read("src/hooks/useCanHover.ts")

  assert.match(navbar, /label: "Home"/)
  assert.match(navbar, /label: "Categorie"/)
  assert.match(navbar, /label: "Ordini"/)
  assert.doesNotMatch(navbar, /Privacy \/ info/)
  assert.match(navbar, /if \(isMobileViewport\) \{/)
  assert.match(navbar, /navigate\("\/shop\/cart"\)/)
  assert.match(navbar, /registerMobileStep/)
  assert.match(navbar, /Dati personali/)
  assert.match(navbar, /Sicurezza account/)
  assert.match(navbar, /mobileScrollablePanelClass/)
  assert.match(navbar, /mobileSheetFooterClass/)
  assert.match(navbar, /useIsMobileViewport/)
  assert.match(navbar, /isMobileViewport \?/)
  assert.match(navbar, /shouldUseGlobalOverlayLock/)
  assert.match(navbar, /<MobileSheet/)
  assert.match(navbar, /onWheelCapture=\{containWheel\}/)
  assert.match(navbar, /id="mobile-register-form"/)
  assert.match(navbar, /form="mobile-register-form"/)
  assert.match(navbar, /min-h-0 flex-1 overflow-hidden rounded-\[28px\]/)
  assert.match(mobileSheet, /useBodyScrollLock/)
  assert.match(mobileSheet, /h-\[calc\(100svh-0.75rem\)\]/)
  assert.match(mobileSheet, /overflow-y-auto/)
  assert.match(mobileSheet, /shrink-0 border-t/)
  assert.match(bodyScrollLock, /position = "fixed"/)
  assert.match(navbar, /data-testid="mobile-search-suggestions"/)
  assert.match(navbar, /data-testid="mobile-search-live-results"/)
  assert.match(navbar, /touch-pan-x/)
  assert.match(navbar, /useCanHover/)
  assert.match(productCard, /useCanHover/)
  assert.match(productCard, /secondaryImage/)
  assert.match(productCard, /group-hover:opacity-100/)
  assert.match(canHoverHook, /hover: hover/)
  assert.match(homeShop, /id="shop-categories"/)
  const cartPage = read("src/shop/pages/ShopCartPage.tsx")
  assert.match(cartPage, /title=\{isMobileViewport \? "Carrello" : "Riepilogo ordine"\}/)
})
