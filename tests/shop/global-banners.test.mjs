import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"

import { parseMidBannerSettings, parseTopBannerSettings } from "../../src/shop/lib/banner-settings.mjs"

const root = process.cwd()

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8")
}

test("banner settings parse defaults and custom values safely", () => {
  const defaultsTop = parseTopBannerSettings({})
  const defaultsMid = parseMidBannerSettings({})

  assert.equal(defaultsTop.enabled, true)
  assert.equal(defaultsTop.countdownEnabled, true)
  assert.equal(defaultsTop.backgroundColor, "#d32f2f")
  assert.equal(defaultsTop.textColor, "#ffffff")
  assert.equal(defaultsMid.enabled, true)
  assert.deepEqual(defaultsMid.messages, ["3-5 DAYS FREE SHIPPING WORLDWIDE"])
  assert.equal(defaultsMid.backgroundColor, "#000000")
  assert.equal(defaultsMid.textColor, "#ffffff")

  const top = parseTopBannerSettings({
    bannerTopEnabled: "false",
    bannerTopTitle: "FLASH SALE",
    bannerTopSubtitle: "Ends soon",
    bannerTopBackgroundColor: "#112233",
    bannerTopTextColor: "#eeeeee",
    bannerTopCountdownEnabled: "false",
    bannerTopCountdownTarget: "2026-04-10T12:00:00.000Z",
  })
  const mid = parseMidBannerSettings({
    bannerMidEnabled: "false",
    bannerMidText: "CUSTOM SHIPPING",
    bannerMidBackgroundColor: "#445566",
    bannerMidTextColor: "#fafafa",
    bannerMidMessages: JSON.stringify(["FIRST", "SECOND"]),
  })

  assert.equal(top.enabled, false)
  assert.equal(top.title, "FLASH SALE")
  assert.equal(top.backgroundColor, "#112233")
  assert.equal(top.textColor, "#eeeeee")
  assert.equal(top.countdownEnabled, false)
  assert.equal(mid.enabled, false)
  assert.equal(mid.text, "CUSTOM SHIPPING")
  assert.deepEqual(mid.messages, ["FIRST", "SECOND"])
  assert.equal(mid.backgroundColor, "#445566")
  assert.equal(mid.textColor, "#fafafa")
})

test("app, navbar and admin expose the new banner management flow", () => {
  const app = read("src/App.tsx")
  const navbar = read("src/components/Navbar.tsx")
  const adminPage = read("src/shop/pages/ShopAdminPage.tsx")
  const adminBannerSection = read("src/shop/components/admin/AdminBannerSection.tsx")

  assert.match(app, /TopPromoBar/)
  assert.match(app, /ShippingBar/)
  assert.match(app, /bns:settings-updated/)
  assert.match(navbar, /className="sticky top-0 z-50"/)
  assert.match(adminPage, /\["banner", "Banner"\]/)
  assert.match(adminBannerSection, /Banner top/)
  assert.match(adminBannerSection, /Banner mid/)
  assert.match(adminBannerSection, /Countdown attivo/)
  assert.match(adminBannerSection, /Aggiungi messaggio/)
  assert.match(adminBannerSection, /type="color"/)
  assert.match(app, /backgroundColor=\{topBanner\.backgroundColor\}/)
  assert.match(app, /textColor=\{topBanner\.textColor\}/)
  assert.match(app, /messages=\{midBanner\.messages\}/)
  assert.match(app, /textColor=\{midBanner\.textColor\}/)
  assert.match(read("src/components/TopPromoBar.tsx"), /G/)
  assert.match(read("src/components/ShippingBar.tsx"), /ChevronLeftIcon/)
  assert.match(read("src/components/ShippingBar.tsx"), /inline-flex h-7 w-7 items-center justify-center transition/)
  assert.match(navbar, /className="sticky top-0 z-50"/)
})
