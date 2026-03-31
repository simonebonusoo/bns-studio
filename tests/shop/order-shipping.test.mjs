import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"

import { buildAdminOrderShippingSummary } from "../../src/shop/lib/order-shipping.mjs"

const root = process.cwd()

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8")
}

test("buildAdminOrderShippingSummary exposes friendly fallbacks for legacy orders", () => {
  const summary = buildAdminOrderShippingSummary({
    fulfillmentStatus: "processing",
    shippingStatus: null,
    shippingCarrier: null,
    shippingMethod: null,
    shippingHandoffMode: null,
    trackingNumber: null,
    trackingUrl: null,
    labelUrl: null,
    shipmentReference: null,
    dhlShipmentReference: null,
    shippingError: null,
  })

  assert.equal(summary.method, "Non disponibile")
  assert.equal(summary.trackingNumber, "Non ancora disponibile")
  assert.equal(summary.shipmentReference, "Non disponibile")
  assert.equal(summary.labelUrl, null)
})

test("buildAdminOrderShippingSummary preserves tracking, label and handoff mode when present", () => {
  const summary = buildAdminOrderShippingSummary({
    fulfillmentStatus: "shipped",
    shippingStatus: "shipped",
    shippingCarrier: "dhl",
    shippingMethod: "premium",
    shippingHandoffMode: "pickup",
    trackingNumber: "1234567890",
    trackingUrl: "https://tracking.example/1234567890",
    labelUrl: "https://labels.example/label.pdf",
    shipmentReference: "SHIP-REF-1",
    shippingError: "temporaneo",
  })

  assert.equal(summary.method, "Premium — 2 giorni lavorativi")
  assert.equal(summary.status, "Spedizione spedita")
  assert.equal(summary.trackingNumber, "1234567890")
  assert.equal(summary.labelUrl, "https://labels.example/label.pdf")
})

test("buildAdminOrderShippingSummary prefers the real carrier label when the shipment is created by an external aggregator", () => {
  const summary = buildAdminOrderShippingSummary({
    fulfillmentStatus: "accepted",
    shippingStatus: "created",
    shippingCarrier: "BRT",
    shippingMethod: "economy",
    shippingLabel: "Spedizione economica",
  })

  assert.equal(summary.method, "Spedizione economica")
})

test("admin and customer order UIs render shipping visibility hooks", () => {
  const admin = read("src/shop/components/admin/AdminOrdersSection.tsx")
  const adminPage = read("src/shop/pages/ShopAdminPage.tsx")
  const profile = read("src/shop/pages/ShopProfilePage.tsx")
  const trackingPage = read("src/shop/pages/ShopMockTrackingPage.tsx")

  assert.match(admin, /Apri etichetta PDF/)
  assert.match(admin, /Crea spedizione/)
  assert.match(admin, /Tracking manuale/)
  assert.match(admin, /visibile qui sotto/)
  assert.match(admin, /out_for_delivery/)
  assert.match(adminPage, /mergeUpdatedOrder/)
  assert.match(adminPage, /window\.open/)
  assert.match(adminPage, /Packlink Pro aperto in una nuova scheda/)
  assert.match(profile, /Traccia spedizione/)
  assert.match(profile, /Tracking non ancora disponibile/)
  assert.match(trackingPage, /Avanzamento spedizione/)
})
