import test from "node:test"
import assert from "node:assert/strict"

import { formatShippingAddressLines, normalizeShippingDetails } from "../../src/shop/lib/shipping-details.mjs"

test("normalizeShippingDetails keeps required values and clears missing optional fields safely", () => {
  const details = normalizeShippingDetails({
    email: "cliente@example.com",
    firstName: "Mario",
    lastName: "Rossi",
    phone: "3331234567",
    country: "Italia",
    region: "Lazio",
    city: "Roma",
    postalCode: "00100",
    addressLine1: "Via Roma",
    streetNumber: "12",
  })

  assert.equal(details.phone, "3331234567")
  assert.equal(details.region, "Lazio")
  assert.equal(details.streetNumber, "12")
  assert.equal(details.intercom, "")
  assert.equal(details.deliveryNotes, "")
})

test("formatShippingAddressLines renders a complete professional shipping block", () => {
  const summary = formatShippingAddressLines({
    email: "cliente@example.com",
    firstName: "Mario",
    lastName: "Rossi",
    phone: "3331234567",
    country: "Italia",
    region: "Lazio",
    city: "Roma",
    postalCode: "00100",
    addressLine1: "Via Roma",
    streetNumber: "12",
    staircase: "B",
    apartment: "7",
    floor: "3",
    intercom: "Rossi",
    deliveryNotes: "Consegnare al pomeriggio",
  })

  assert.equal(summary.personLine, "Mario Rossi")
  assert.deepEqual(summary.contactLines, ["cliente@example.com", "3331234567"])
  assert.equal(summary.addressLines[0], "Via Roma, 12")
  assert.match(summary.addressLines[1], /Scala B/)
  assert.match(summary.addressLines.at(-1), /Note consegna/)
})
