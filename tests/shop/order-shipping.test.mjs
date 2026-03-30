import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"

import { buildAdminOrderShippingSummary, getOrderShippingHandoffModeLabel } from "../../src/shop/lib/order-shipping.mjs"

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

  assert.equal(summary.carrier, "Non disponibile")
  assert.equal(summary.method, "Non disponibile")
  assert.equal(summary.handoffMode, "Da definire")
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

  assert.equal(summary.carrier, "DHL")
  assert.equal(summary.method, "Spedizione premium (DHL)")
  assert.equal(summary.status, "Spedizione spedita")
  assert.equal(summary.handoffMode, "Pickup")
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

  assert.equal(summary.carrier, "BRT")
  assert.equal(summary.method, "Spedizione economica (BRT)")
})

test("handoff mode labels remain user-friendly", () => {
  assert.equal(getOrderShippingHandoffModeLabel("dropoff"), "Drop-off")
  assert.equal(getOrderShippingHandoffModeLabel("pickup"), "Pickup")
  assert.equal(getOrderShippingHandoffModeLabel(""), "Da definire")
})

test("admin and customer order UIs render shipping visibility hooks", () => {
  const admin = read("src/shop/components/admin/AdminOrdersSection.tsx")
  const adminPage = read("src/shop/pages/ShopAdminPage.tsx")
  const profile = read("src/shop/pages/ShopProfilePage.tsx")
  const trackingPage = read("src/shop/pages/ShopMockTrackingPage.tsx")

  assert.match(admin, /Apri etichetta PDF/)
  assert.match(admin, /Crea spedizione/)
  assert.match(admin, /Aggiorna tracking/)
  assert.match(admin, /visibile qui sotto/)
  assert.match(admin, /out_for_delivery/)
  assert.match(admin, /Drop-off/)
  assert.match(admin, /Pickup/)
  assert.match(adminPage, /mergeUpdatedOrder/)
  assert.match(adminPage, /response\.order/)
  assert.match(adminPage, /getShippingAdminActionError/)
  assert.match(profile, /Traccia spedizione/)
  assert.match(profile, /Tracking non ancora disponibile/)
  assert.match(trackingPage, /Avanzamento spedizione/)
})
