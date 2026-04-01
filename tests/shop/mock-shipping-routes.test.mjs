import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"

import { createMockLabelResponse, createMockTrackingResponse } from "../../src/server/shop/shipping/mocks/mock-tracking-route.mjs"

const projectRoot = path.resolve(import.meta.dirname, "../..")

function createOrder(overrides = {}) {
  return {
    id: 42,
    orderReference: "BNS-MOCK-42",
    firstName: "Mario",
    lastName: "Rossi",
    addressLine1: "Via Roma",
    streetNumber: "10",
    city: "Milano",
    region: "MI",
    postalCode: "20100",
    country: "IT",
    shippingCarrier: "InPost",
    shippingMethod: "economy",
    shippingLabel: "Spedizione economica",
    shippingStatus: "in_transit",
    shippingHandoffMode: "dropoff",
    trackingNumber: "INPOST-TRK-4242",
    shipmentReference: "INPOST-SHIP-4242",
    shippingCreatedAt: new Date("2026-03-30T09:30:00.000Z"),
    ...overrides,
  }
}

test("mock tracking response exposes a real customer-facing payload", () => {
  const payload = createMockTrackingResponse(createOrder())

  assert.equal(payload.trackingNumber, "INPOST-TRK-4242")
  assert.equal(payload.carrier, "InPost")
  assert.equal(payload.status, "in_transit")
  assert.equal(payload.handoffMode, "dropoff")
  assert.equal(Array.isArray(payload.timeline), true)
  assert.equal(payload.timeline.length >= 3, true)
  assert.match(payload.lastLocation || "", /Centro logistico|Milano|Hub/i)
})

test("mock label response returns a downloadable PDF payload", () => {
  const label = createMockLabelResponse(createOrder())

  assert.match(label.filename, /^inpost-label-INPOST-SHIP-4242\.pdf$/)
  assert.equal(label.buffer.subarray(0, 4).toString(), "%PDF")
  assert.match(label.buffer.toString("latin1"), /InPost|INPOST-TRK-4242|BNS-MOCK-42/)
})

test("store routes expose internal mock tracking and label endpoints", () => {
  const storeRoutesPath = path.join(projectRoot, "src/server/shop/routes/storeRoutes.mjs")
  const source = fs.readFileSync(storeRoutesPath, "utf8")

  assert.match(source, /\/mock-shipping\/tracking\/:trackingNumber/)
  assert.match(source, /\/mock-shipping\/labels\/:shipmentReference/)
  assert.match(source, /createMockTrackingResponse/)
  assert.match(source, /createMockLabelResponse/)
  assert.match(source, /if \(!env\.mockDebugRoutesEnabled\)/)
})

test("frontend router exposes the internal mock tracking page", () => {
  const appPath = path.join(projectRoot, "src/App.tsx")
  const source = fs.readFileSync(appPath, "utf8")

  assert.match(source, /\/shop\/tracking\/mock\/:trackingNumber/)
  assert.match(source, /ShopMockTrackingPage/)
  assert.match(source, /import\.meta\.env\.DEV/)
})
