import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"

import { getTopBarsOffset, parseMidBannerSettings, parseTopBannerSettings } from "../../src/shop/lib/banner-settings.mjs"

const root = process.cwd()

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8")
}

test("banner settings parse defaults and custom values safely", () => {
  const defaultsTop = parseTopBannerSettings({})
  const defaultsMid = parseMidBannerSettings({})

  assert.equal(defaultsTop.enabled, true)
  assert.equal(defaultsTop.countdownEnabled, true)
  assert.equal(defaultsMid.enabled, true)

  const top = parseTopBannerSettings({
    bannerTopEnabled: "false",
    bannerTopTitle: "FLASH SALE",
    bannerTopSubtitle: "Ends soon",
    bannerTopCountdownEnabled: "false",
    bannerTopCountdownTarget: "2026-04-10T12:00:00.000Z",
  })
  const mid = parseMidBannerSettings({
    bannerMidEnabled: "false",
    bannerMidText: "CUSTOM SHIPPING",
  })

  assert.equal(top.enabled, false)
  assert.equal(top.title, "FLASH SALE")
  assert.equal(top.countdownEnabled, false)
  assert.equal(mid.enabled, false)
  assert.equal(mid.text, "CUSTOM SHIPPING")
})

test("top bars offset reflects which banners are enabled", () => {
  assert.equal(getTopBarsOffset({ enabled: true }, { enabled: true }), "80px")
  assert.equal(getTopBarsOffset({ enabled: true }, { enabled: false }), "44px")
  assert.equal(getTopBarsOffset({ enabled: false }, { enabled: true }), "36px")
  assert.equal(getTopBarsOffset({ enabled: false }, { enabled: false }), "0px")
})

test("app, navbar and admin expose the new banner management flow", () => {
  const app = read("src/App.tsx")
  const navbar = read("src/components/Navbar.tsx")
  const adminPage = read("src/shop/pages/ShopAdminPage.tsx")
  const adminBannerSection = read("src/shop/components/admin/AdminBannerSection.tsx")

  assert.match(app, /TopPromoBar/)
  assert.match(app, /ShippingBar/)
  assert.match(app, /bns:settings-updated/)
  assert.match(navbar, /top: scrolled \? "0px" : "var\(--global-top-bars-h, 0px\)"/)
  assert.match(adminPage, /\["banner", "Banner"\]/)
  assert.match(adminBannerSection, /Banner top/)
  assert.match(adminBannerSection, /Banner mid/)
  assert.match(adminBannerSection, /Countdown attivo/)
})
