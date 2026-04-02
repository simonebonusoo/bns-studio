import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"

import { sanitizeMultilineText, sanitizePlainText } from "../../src/server/shop/lib/sanitize-text.mjs"
import { normalizeShippingDetails } from "../../src/shop/lib/shipping-details.mjs"

const root = process.cwd()

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8")
}

test("sanitize helpers strip script and html tags while keeping normal text readable", () => {
  assert.equal(sanitizePlainText("Città d'arte <strong>Roma</strong>"), "Città d'arte Roma")
  assert.equal(sanitizePlainText("<script>alert(1)</script>Via Roma"), "Via Roma")
  assert.equal(
    sanitizeMultilineText("Consegna <b>rapida</b>\n<script>alert(1)</script>citofono Rossi"),
    "Consegna rapida\ncitofono Rossi",
  )
})

test("normalizeShippingDetails neutralizes html/script in checkout shipping fields", () => {
  const details = normalizeShippingDetails({
    firstName: "<script>alert(1)</script>Mario",
    lastName: "Rossi <b>Cliente</b>",
    addressLine1: "Via <img src=x onerror=alert(1)> Roma",
    streetNumber: "<strong>12A</strong>",
    city: "Roma<script>alert(1)</script>",
    deliveryNotes: "Suonare <b>due volte</b>\n<script>alert(1)</script>citofono Rossi",
  })

  assert.equal(details.firstName, "Mario")
  assert.equal(details.lastName, "Rossi Cliente")
  assert.equal(details.addressLine1, "Via Roma")
  assert.equal(details.streetNumber, "12A")
  assert.equal(details.city, "Roma")
  assert.equal(details.deliveryNotes, "Suonare due volte\ncitofono Rossi")
})

test("store contact route sanitizes the subject before building the mailto link", () => {
  const source = read("src/server/shop/routes/storeRoutes.mjs")
  assert.match(source, /sanitizePlainText\(body\.subject\)/)
})
