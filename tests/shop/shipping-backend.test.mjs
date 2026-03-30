import test from "node:test"
import assert from "node:assert/strict"

import {
  createCarrierShipmentForOrder,
  getAvailableShippingOptions,
  maybeCreateShipmentForPaidOrder,
  refreshCarrierTrackingForOrder,
  resolveShippingProvider,
} from "../../src/server/shop/shipping/index.mjs"
import { createMockLabelResponse, createMockTrackingResponse } from "../../src/server/shop/shipping/mocks/mock-tracking-route.mjs"

function createMockEnv(overrides = {}) {
  return {
    dhlEnv: "sandbox",
    dhlUseMock: true,
    dhlApiBaseUrl: "https://express.api.dhl.com/mydhlapi/test",
    dhlApiKey: "",
    dhlApiSecret: "",
    dhlAccountNumber: "",
    dhlTrackingBaseUrl: "https://www.dhl.com/global-en/home/tracking/tracking-express.html",
    dhlShipperName: "BNS Studio",
    dhlShipperCompany: "BNS Studio",
    dhlShipperEmail: "hello@example.com",
    dhlShipperPhone: "3900000000",
    dhlShipperAddressLine1: "Via Roma 1",
    dhlShipperAddressLine2: "",
    dhlShipperCity: "Milano",
    dhlShipperPostalCode: "20100",
    dhlShipperCountryCode: "IT",
    dhlShipperStateCode: "MI",
    dhlShipmentProductCode: "N",
    dhlPackageWeightKg: 1,
    dhlPackageLengthCm: 40,
    dhlPackageWidthCm: 30,
    dhlPackageHeightCm: 5,
    inpostEnv: "sandbox",
    inpostUseMock: true,
    inpostApiBaseUrl: "https://api-shipx.test/v1",
    inpostApiKey: "mock-key",
    inpostOrganizationId: "org-1",
    inpostTrackingBaseUrl: "https://inpost.test/track",
    shippingAutoCreateOnPayment: false,
    ...overrides,
  }
}

function createOrder(overrides = {}) {
  return {
    id: 12,
    orderReference: "BNS-ORDER-1",
    status: "paid",
    shippingMethod: "premium",
    shippingCarrier: "dhl",
    shippingCost: 990,
    firstName: "Mario",
    lastName: "Rossi",
    email: "cliente@example.com",
    phone: "3331234567",
    addressLine1: "Via Roma",
    addressLine2: "",
    streetNumber: "1",
    staircase: "",
    apartment: "",
    city: "Milano",
    region: "MI",
    postalCode: "20100",
    country: "IT",
    deliveryNotes: "",
    trackingNumber: null,
    shipmentReference: null,
    dhlShipmentReference: null,
    items: [{ productId: 1, quantity: 1, format: "A4" }],
    ...overrides,
  }
}

function createDb(order) {
  let current = { ...order }

  return {
    order: {
      async findUnique() {
        return current
      },
      async update({ data }) {
        current = { ...current, ...data }
        return current
      },
    },
    getCurrent() {
      return current
    },
  }
}

test("shipping provider resolver maps economy to InPost and premium to DHL", () => {
  assert.equal(resolveShippingProvider("economy", createMockEnv())?.key, "inpost")
  assert.equal(resolveShippingProvider("premium", createMockEnv())?.key, "dhl")
})

test("shipping options expose both InPost and DHL through the common layer", async () => {
  const options = await getAvailableShippingOptions({
    items: [{ format: "A4", quantity: 1 }],
    currentEnv: createMockEnv(),
  })

  assert.equal(options.length, 2)
  assert.equal(options[0].carrier, "inpost")
  assert.equal(options[1].carrier, "dhl")
  assert.equal(typeof options[0].cost, "number")
  assert.equal(typeof options[1].cost, "number")
})

test("mock shipment creation persists tracking, label and normalized status on the order", async () => {
  const order = createOrder()
  const db = createDb(order)

  const result = await createCarrierShipmentForOrder({
    db,
    order,
    currentEnv: createMockEnv(),
  })

  assert.equal(result.ok, true)
  assert.equal(result.shipment.carrier, "dhl")
  assert.equal(result.order.shippingStatus, "created")
  assert.match(result.order.trackingNumber, /^DHL-TRK-/)
  assert.match(result.order.labelUrl, /^https:\/\/example\.com\/mock-shipping\/dhl\/labels\//)
  assert.equal(typeof result.order.shippingProviderPayload, "string")
})

test("provider failure does not break the order and stores a safe failed shipping state", async () => {
  const order = createOrder()
  const db = createDb(order)

  const result = await createCarrierShipmentForOrder({
    db,
    order,
    currentEnv: createMockEnv({
      dhlUseMock: false,
      dhlApiKey: "",
      dhlApiSecret: "",
      dhlAccountNumber: "",
    }),
  })

  assert.equal(result.ok, false)
  assert.equal(result.order.shippingStatus, "failed")
  assert.match(result.order.shippingError, /Configurazione DHL incompleta/)
})

test("tracking refresh uses the provider layer and updates the shipment status safely", async () => {
  const order = createOrder({
    shippingMethod: "economy",
    shippingCarrier: "inpost",
    trackingNumber: "INPOST-TRK-123",
    shipmentReference: "INPOST-SHIP-123",
  })
  const db = createDb(order)

  const result = await refreshCarrierTrackingForOrder({
    db,
    order,
    currentEnv: createMockEnv(),
  })

  assert.equal(result.ok, true)
  assert.equal(result.order.shippingStatus, "in_transit")
  assert.match(result.order.trackingUrl, /\/shop\/tracking\/mock\//)
})

test("economy orders auto-create a mock InPost shipment when payment completes", async () => {
  const order = createOrder({
    shippingMethod: "economy",
    shippingCarrier: "inpost",
    shippingCost: 590,
  })
  const db = createDb(order)

  const result = await maybeCreateShipmentForPaidOrder({
    db,
    order,
    currentEnv: createMockEnv({ shippingAutoCreateOnPayment: true }),
  })

  assert.equal(result.ok, true)
  assert.equal(result.order.shippingCarrier, "InPost")
  assert.equal(result.order.shippingStatus, "created")
  assert.match(result.order.trackingUrl, /\/shop\/tracking\/mock\//)
  assert.match(result.order.labelUrl, /\/api\/store\/mock-shipping\/labels\//)
  assert.equal(result.order.shippingHandoffMode, "dropoff")
})

test("mock tracking and label helpers produce project-local assets", () => {
  const order = createOrder({
    shippingMethod: "economy",
    shippingCarrier: "InPost",
    shippingStatus: "in_transit",
    trackingNumber: "INPOST-TRK-999",
    shipmentReference: "INPOST-SHIP-999",
    shippingLabel: "Spedizione economica",
    shippingHandoffMode: "dropoff",
  })

  const tracking = createMockTrackingResponse(order)
  const label = createMockLabelResponse(order)

  assert.equal(tracking.trackingNumber, "INPOST-TRK-999")
  assert.equal(tracking.carrier, "InPost")
  assert.ok(Array.isArray(tracking.timeline))
  assert.equal(tracking.timeline.length >= 3, true)
  assert.match(label.filename, /inpost-label-/)
  assert.equal(label.buffer.subarray(0, 4).toString(), "%PDF")
})
