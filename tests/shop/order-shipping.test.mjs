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
    shipmentUrl: null,
    trackingUrl: null,
    labelUrl: null,
    shipmentReference: null,
    dhlShipmentReference: null,
    shippingError: null,
  })

  assert.equal(summary.method, "Non disponibile")
  assert.equal(summary.trackingNumber, "Non ancora disponibile")
  assert.equal(summary.shipmentReference, "Non disponibile")
  assert.equal(summary.shipmentUrl, null)
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
    shipmentUrl: "https://pro.packlink.it/app/shipments/SHIP-REF-1",
    trackingUrl: "https://tracking.example/1234567890",
    labelUrl: "https://labels.example/label.pdf",
    shipmentReference: "SHIP-REF-1",
    shippingError: "temporaneo",
  })

  assert.equal(summary.method, "Premium — 2 giorni lavorativi")
  assert.equal(summary.status, "Spedizione spedita")
  assert.equal(summary.trackingNumber, "1234567890")
  assert.equal(summary.shipmentUrl, "https://pro.packlink.it/app/shipments/SHIP-REF-1")
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
  const timeline = read("src/shop/components/orders/OrderTimeline.tsx")
  const trackingPage = read("src/shop/pages/ShopMockTrackingPage.tsx")

  assert.match(admin, /Apri etichetta PDF/)
  assert.match(admin, /Apri spedizione/)
  assert.match(admin, /Crea spedizione/)
  assert.match(admin, /Visualizza spedizione/)
  assert.match(admin, /Tracking manuale/)
  assert.match(admin, /Inserisci tracking, link spedizione ed etichetta qui sotto/)
  assert.match(admin, /Link spedizione/)
  assert.match(admin, /out_for_delivery/)
  assert.match(adminPage, /mergeUpdatedOrder/)
  assert.match(adminPage, /window\.open/)
  assert.match(adminPage, /Packlink Pro aperto in una nuova scheda/)
  assert.match(profile, /Informazioni ordine/)
  assert.match(profile, /Tracking ancora non disponibile/)
  assert.match(timeline, /Step \{currentStepIndex \+ 1\} di \{steps.length\}/)
  assert.doesNotMatch(timeline, /Step attuale/)
  assert.match(trackingPage, /Avanzamento spedizione/)
})
