import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"

const root = process.cwd()

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8")
}

test("project contact form is reused on about page and below homepage reviews", () => {
  const about = read("src/pages/AboutPage.tsx")
  const testimonials = read("src/sections/Testimonials.tsx")
  const form = read("src/components/ProjectContactForm.tsx")

  assert.match(about, /ProjectContactForm/)
  assert.match(testimonials, /ProjectContactForm/)
  assert.match(testimonials, /className="mt-24 md:mt-28"/)
  assert.match(form, /Parliamo del tuo progetto/)
  assert.match(form, /firstName/)
  assert.match(form, /lastName/)
  assert.match(form, /email/)
  assert.match(form, /message/)
  assert.match(form, /\/store\/contact/)
  assert.match(form, /VITE_CALENDLY_URL/)
  assert.match(form, /Prenota call/)
})

test("store contact route supports contact form mailto response", () => {
  const storeRoutes = read("src/server/shop/routes/storeRoutes.mjs")

  assert.match(storeRoutes, /"\/contact"/)
  assert.match(storeRoutes, /mailtoUrl/)
  assert.match(storeRoutes, /contactEmail/)
})
