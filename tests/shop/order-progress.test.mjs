import test from "node:test"
import assert from "node:assert/strict"

import {
  getFulfillmentStatusLabel,
  getFulfillmentStatusSteps,
  normalizeFulfillmentStatus,
  normalizeTrackingUrl,
} from "../../src/shop/lib/order-progress.mjs"

test("normalizeFulfillmentStatus falls back safely for legacy orders", () => {
  assert.equal(normalizeFulfillmentStatus("accepted"), "accepted")
  assert.equal(normalizeFulfillmentStatus(""), "processing")
  assert.equal(normalizeFulfillmentStatus("legacy"), "processing")
})

test("getFulfillmentStatusLabel returns client-friendly order progress labels", () => {
  assert.equal(getFulfillmentStatusLabel("processing"), "Ordine in lavorazione")
  assert.equal(getFulfillmentStatusLabel("accepted"), "Ordine accettato")
  assert.equal(getFulfillmentStatusLabel("in_progress"), "Spedizione creata")
  assert.equal(getFulfillmentStatusLabel("shipped"), "Spedito")
  assert.equal(getFulfillmentStatusLabel("completed"), "Consegnato")
})

test("getFulfillmentStatusSteps marks previous steps active and current step highlighted", () => {
  const steps = getFulfillmentStatusSteps("in_progress")

  assert.equal(steps[0].active, true)
  assert.equal(steps[1].active, true)
  assert.equal(steps[2].current, true)
  assert.equal(steps[2].label, "Spedizione creata")
  assert.equal(steps[4].active, false)
})

test("normalizeTrackingUrl keeps valid links and clears empty values", () => {
  assert.equal(normalizeTrackingUrl(" https://tracking.example/abc "), "https://tracking.example/abc")
  assert.equal(normalizeTrackingUrl(""), null)
})
