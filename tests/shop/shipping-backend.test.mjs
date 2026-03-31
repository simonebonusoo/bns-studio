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
    packlinkUseMock: true,
    packlinkApiBaseUrl: "https://api.packlink.test/v1",
    packlinkApiKey: "",
    packlinkServiceId: "",
    packlinkDefaultCarrier: "",
    packlinkSenderName: "BNS Studio",
    packlinkSenderCompany: "BNS Studio",
    packlinkSenderEmail: "hello@example.com",
    packlinkSenderPhone: "3900000000",
    packlinkSenderStreet1: "Via Roma 1",
    packlinkSenderCity: "Milano",
    packlinkSenderZip: "20100",
    packlinkSenderCountry: "IT",
    packlinkParcelWeightKg: 1,
    packlinkParcelLengthCm: 30,
    packlinkParcelWidthCm: 20,
    packlinkParcelHeightCm: 5,
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

test("shipping provider resolver is disabled in manual shipping mode", () => {
  assert.equal(resolveShippingProvider("economy", createMockEnv()), null)
  assert.equal(resolveShippingProvider("premium", createMockEnv()), null)
})

test("shipping options expose both internal manual methods through the common layer", async () => {
  const options = await getAvailableShippingOptions({
    items: [{ format: "A4", quantity: 1 }],
    currentEnv: createMockEnv(),
  })

  assert.equal(options.length, 2)
  assert.equal(options[0].carrier, "inpost")
  assert.equal(options[1].carrier, "dhl")
  assert.equal(options[0].cost, 700)
  assert.equal(options[1].cost, 1000)
})

test("shipment creation stays manual and does not generate provider data", async () => {
  const order = createOrder()
  const db = createDb(order)

  const result = await createCarrierShipmentForOrder({
    db,
    order,
    currentEnv: createMockEnv(),
  })

  assert.equal(result.ok, false)
  assert.equal(result.code, "manual_shipping_only")
  assert.equal(result.shipment.carrier, "dhl")
  assert.equal(result.shipment.status, "not_created")
  assert.match(result.shipment.errorMessage || "", /manuale/i)
  assert.equal(db.getCurrent().trackingNumber, null)
  assert.equal(db.getCurrent().labelUrl, undefined)
})

test("tracking refresh stays manual and returns current shipping data without provider calls", async () => {
  const order = createOrder({
    shippingMethod: "premium",
    shippingCarrier: "DHL",
    shippingStatus: "created",
    trackingNumber: "MANUAL123",
    trackingUrl: "https://carrier.example/manual123",
    shipmentReference: "SHIP-123",
  })
  const db = createDb(order)
  let fetchCalled = false

  const result = await refreshCarrierTrackingForOrder({
    db,
    order,
    currentEnv: createMockEnv(),
    fetchImpl: async () => {
      fetchCalled = true
      throw new Error("fetch should not be called")
    },
  })

  assert.equal(fetchCalled, false)
  assert.equal(result.ok, false)
  assert.equal(result.code, "manual_tracking_only")
  assert.equal(result.shipment.status, "created")
  assert.equal(result.shipment.trackingNumber, "MANUAL123")
  assert.equal(result.shipment.trackingUrl, "https://carrier.example/manual123")
  assert.match(result.shipment.errorMessage || "", /manualmente/i)
})

test("economy orders stay in manual shipping mode after payment completion", async () => {
  const order = createOrder({
    shippingMethod: "economy",
    shippingCarrier: "BRT",
    shippingCost: 700,
  })
  const db = createDb(order)

  const result = await maybeCreateShipmentForPaidOrder({
    db,
    order,
    currentEnv: createMockEnv({ shippingAutoCreateOnPayment: true }),
  })

  assert.equal(result.ok, false)
  assert.equal(result.code, "manual_shipping_only")
  assert.equal(result.order.shippingCarrier, "BRT")
  assert.equal(result.order.trackingUrl, undefined)
  assert.equal(result.shipment.status, "not_created")
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
