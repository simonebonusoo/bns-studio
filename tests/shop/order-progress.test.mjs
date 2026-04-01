import test from "node:test"
import assert from "node:assert/strict"

import {
  getFulfillmentStatusLabel,
  getFulfillmentStatusSteps,
  getTimelineFulfillmentStatus,
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
  assert.equal(getFulfillmentStatusLabel("shipped"), "Ordine spedito")
  assert.equal(getFulfillmentStatusLabel("shipped", "out_for_delivery"), "Ordine in consegna")
  assert.equal(getFulfillmentStatusLabel("completed"), "Ordine consegnato")
})

test("getFulfillmentStatusSteps marks previous steps active and current step highlighted", () => {
  const steps = getFulfillmentStatusSteps("in_progress")

  assert.equal(steps[0].active, true)
  assert.equal(steps[1].active, true)
  assert.equal(steps[2].current, true)
  assert.equal(steps[2].label, "Spedizione creata")
  assert.equal(steps[4].label, "Ordine in consegna")
  assert.equal(steps[5].active, false)
})

test("shipping status out_for_delivery maps to the dedicated delivery step", () => {
  assert.equal(getTimelineFulfillmentStatus("shipped", "out_for_delivery"), "out_for_delivery")
  const steps = getFulfillmentStatusSteps("shipped", "out_for_delivery")

  assert.equal(steps.length, 6)
  assert.equal(steps[4].current, true)
  assert.equal(steps[4].label, "Ordine in consegna")
  assert.equal(steps[5].label, "Ordine consegnato")
})

test("normalizeTrackingUrl keeps valid links and clears empty values", () => {
  assert.equal(normalizeTrackingUrl(" https://tracking.example/abc "), "https://tracking.example/abc")
  assert.equal(normalizeTrackingUrl(""), null)
})
