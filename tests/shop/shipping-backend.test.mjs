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

test("shipping provider resolver maps economy to Packlink and premium to DHL", () => {
  assert.equal(resolveShippingProvider("economy", createMockEnv())?.key, "packlink")
  assert.equal(resolveShippingProvider("premium", createMockEnv())?.key, "dhl")
})

test("shipping options expose both Packlink and DHL through the common layer", async () => {
  const options = await getAvailableShippingOptions({
    items: [{ format: "A4", quantity: 1 }],
    currentEnv: createMockEnv({
      packlinkUseMock: false,
      packlinkApiKey: "packlink-key",
      packlinkDefaultCarrier: "BRT",
    }),
    fetchImpl: async (input) => {
      if (String(input).endsWith("/quotes")) {
        return new Response(
          JSON.stringify({
            quotes: [
              { service_id: "service-brt", carrier_name: "BRT", amount: 4.9, service_name: "BRT Economy" },
              { service_id: "service-gls", carrier_name: "GLS", amount: 5.2, service_name: "GLS Standard" },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        )
      }
      throw new Error(`Unexpected fetch URL: ${String(input)}`)
    },
  })

  assert.equal(options.length, 2)
  assert.equal(options[0].carrier, "brt")
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

test("packlink shipment creation selects the best quote automatically and parses the real provider data", async () => {
  const order = createOrder({
    shippingMethod: "economy",
    shippingCarrier: "inpost",
    shippingCost: 590,
  })
  const db = createDb(order)
  const requests = []

  const result = await createCarrierShipmentForOrder({
    db,
    order,
    currentEnv: createMockEnv({
      packlinkUseMock: false,
      packlinkApiKey: "packlink-key",
      packlinkDefaultCarrier: "BRT",
    }),
    fetchImpl: async (input, init) => {
      requests.push({ url: String(input), body: init?.body ? JSON.parse(String(init.body)) : null })

      if (String(input).endsWith("/quotes")) {
        return new Response(
          JSON.stringify({
            quotes: [
              { service_id: "service-other", carrier_name: "GLS", amount: 5.2 },
              { service_id: "service-brt", carrier_name: "BRT", amount: 5.9 },
              { service_id: "service-brt-expensive", carrier_name: "BRT", amount: 7.5 },
            ],
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        )
      }

      return new Response(
        JSON.stringify({
          shipment_id: "pk_123",
          tracking_number: "BRT123456789",
          tracking_url: "https://tracking.packlink.test/BRT123456789",
          label_url: "https://labels.packlink.test/pk_123.pdf",
          carrier: "BRT",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      )
    },
  })

  assert.equal(result.ok, true)
  assert.equal(result.order.shippingCarrier, "BRT")
  assert.equal(result.order.shippingStatus, "created")
  assert.equal(result.order.trackingNumber, "BRT123456789")
  assert.equal(result.order.trackingUrl, "https://tracking.packlink.test/BRT123456789")
  assert.equal(result.order.labelUrl, "https://labels.packlink.test/pk_123.pdf")
  assert.equal(result.order.shipmentReference, "pk_123")
  assert.match(requests[0].url, /\/quotes$/)
  assert.match(requests[1].url, /\/shipments$/)
  assert.equal(requests[1].body?.service_id, "service-brt")
})

test("packlink full flow simulation works correctly", async () => {
  const order = createOrder({
    shippingMethod: "economy",
    shippingCarrier: "inpost",
    shippingCost: 490,
    trackingNumber: null,
    trackingUrl: null,
    labelUrl: null,
    shipmentReference: null,
  })
  const db = createDb(order)
  const requests = []

  const result = await createCarrierShipmentForOrder({
    db,
    order,
    currentEnv: createMockEnv({
      packlinkUseMock: false,
      packlinkApiKey: "packlink-key",
      packlinkDefaultCarrier: "BRT",
    }),
    fetchImpl: async (input, init) => {
      const url = String(input)
      const body = init?.body ? JSON.parse(String(init.body)) : null
      requests.push({ url, body, method: init?.method || "GET" })

      if (url.endsWith("/quotes")) {
        return new Response(
          JSON.stringify({
            quotes: [
              {
                service_id: "service-gls",
                carrier_name: "GLS",
                amount: 5.2,
                service_name: "GLS Standard",
              },
              {
                service_id: "service-brt-economy",
                carrier_name: "BRT",
                amount: 4.9,
                service_name: "BRT Economy",
              },
              {
                service_id: "service-dhl",
                carrier_name: "DHL",
                amount: 6.5,
                service_name: "DHL Express",
              },
            ],
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        )
      }

      if (url.endsWith("/shipments")) {
        return new Response(
          JSON.stringify({
            shipment_id: "pk_ship_001",
            tracking_number: "BRTREAL123456789",
            tracking_url: "https://tracking.packlink.test/BRTREAL123456789",
            label_url: "https://labels.packlink.test/pk_ship_001.pdf",
            carrier_name: "BRT",
            status: "created",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        )
      }

      throw new Error(`Unexpected fetch URL: ${url}`)
    },
  })

  assert.equal(result.ok, true)
  assert.equal(requests.length, 2)
  assert.match(requests[0].url, /\/quotes$/)
  assert.match(requests[1].url, /\/shipments$/)
  assert.equal(requests[0].method, "POST")
  assert.equal(requests[1].method, "POST")

  assert.equal(requests[0].body?.to?.name, "Mario Rossi")
  assert.equal(requests[0].body?.to?.email, "cliente@example.com")
  assert.equal(requests[0].body?.to?.phone, "3331234567")
  assert.match(requests[0].body?.to?.street1 || "", /Via Roma 1/)
  assert.equal(requests[0].body?.to?.city, "Milano")
  assert.equal(requests[0].body?.to?.zip, "20100")
  assert.equal(requests[0].body?.to?.country, "IT")

  assert.equal(requests[1].body?.service_id, "service-brt-economy")
  assert.equal(result.order.shippingCarrier, "BRT")
  assert.equal(result.order.shippingMethod, "economy")
  assert.equal(result.order.shippingStatus, "created")
  assert.equal(result.order.trackingNumber, "BRTREAL123456789")
  assert.equal(result.order.trackingUrl, "https://tracking.packlink.test/BRTREAL123456789")
  assert.equal(result.order.labelUrl, "https://labels.packlink.test/pk_ship_001.pdf")
  assert.equal(result.order.shipmentReference, "pk_ship_001")
  assert.equal(typeof result.order.shippingProviderPayload, "string")
  assert.doesNotMatch(result.order.shippingCarrier || "", /inpost|mock/i)
  assert.doesNotMatch(result.order.trackingNumber || "", /INPOST|MOCK/i)
  assert.doesNotMatch(result.order.trackingUrl || "", /\/mock\//i)
  assert.doesNotMatch(result.order.labelUrl || "", /mock-shipping/i)
})

test("packlink shipment creation fails clearly when order shipping data are incomplete", async () => {
  const order = createOrder({
    shippingMethod: "economy",
    shippingCarrier: "inpost",
    shippingCost: 590,
    phone: "",
    addressLine1: "",
  })
  const db = createDb(order)

  const result = await createCarrierShipmentForOrder({
    db,
    order,
    currentEnv: createMockEnv({
      packlinkUseMock: false,
      packlinkApiKey: "packlink-key",
    }),
  })

  assert.equal(result.ok, false)
  assert.equal(result.order.shippingStatus, "failed")
  assert.match(result.order.shippingError || "", /dati spedizione incompleti/i)
})

test("packlink quote failure does not silently fall back to mock shipment data", async () => {
  const order = createOrder({
    shippingMethod: "economy",
    shippingCarrier: "inpost",
    shippingCost: 590,
  })
  const db = createDb(order)

  const result = await createCarrierShipmentForOrder({
    db,
    order,
    currentEnv: createMockEnv({
      packlinkUseMock: false,
      packlinkApiKey: "packlink-key",
    }),
    fetchImpl: async () =>
      new Response(JSON.stringify({ error: "invalid service_id" }), {
        status: 422,
        headers: { "Content-Type": "application/json" },
      }),
  })

  assert.equal(result.ok, false)
  assert.equal(result.order.shippingStatus, "failed")
  assert.equal(result.order.trackingNumber, null)
  assert.equal(result.order.trackingUrl, null)
  assert.equal(result.order.labelUrl, null)
  assert.match(result.order.shippingError || "", /Packlink quotes ha risposto con stato 422/)
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
    shippingCarrier: "BRT",
    shippingStatus: "created",
    trackingNumber: "BRT123456789",
    shipmentReference: "pk_123",
  })
  const db = createDb(order)

  const result = await refreshCarrierTrackingForOrder({
    db,
    order,
    currentEnv: createMockEnv({
      packlinkUseMock: false,
      packlinkApiKey: "packlink-key",
    }),
    fetchImpl: async () =>
      new Response(
        JSON.stringify({
          shipment_id: "pk_123",
          tracking_number: "BRT123456789",
          tracking_url: "https://tracking.packlink.test/BRT123456789",
          carrier_name: "BRT",
          status: "accepted",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
  })

  assert.equal(result.ok, true)
  assert.equal(result.order.shippingStatus, "accepted")
  assert.equal(result.order.trackingUrl, "https://tracking.packlink.test/BRT123456789")
})

test("packlink tracking refresh uses shipment reference for real provider lookup", async () => {
  const order = createOrder({
    shippingMethod: "economy",
    shippingCarrier: "BRT",
    shippingStatus: "accepted",
    trackingNumber: "BRT123456789",
    shipmentReference: "pk_123",
  })
  const db = createDb(order)
  let requestedUrl = ""

  const result = await refreshCarrierTrackingForOrder({
    db,
    order,
    currentEnv: createMockEnv({
      packlinkUseMock: false,
      packlinkApiKey: "packlink-key",
    }),
    fetchImpl: async (input) => {
      requestedUrl = String(input)
      return new Response(
        JSON.stringify({
          shipment_id: "pk_123",
          tracking_number: "BRT123456789",
          tracking_url: "https://tracking.packlink.test/BRT123456789",
          carrier_name: "BRT",
          status: "out_for_delivery",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      )
    },
  })

  assert.equal(result.ok, true)
  assert.match(requestedUrl, /\/shipments\/pk_123$/)
  assert.equal(result.order.shippingStatus, "out_for_delivery")
  assert.equal(result.order.shippingCarrier, "BRT")
})

test("tracking refresh keeps real Packlink status progression data", async () => {
  const order = createOrder({
    shippingMethod: "economy",
    shippingCarrier: "BRT",
    shippingStatus: "in_transit",
    trackingNumber: "BRT456789123",
    shipmentReference: "pk_456",
  })
  const db = createDb(order)

  const first = await refreshCarrierTrackingForOrder({
    db,
    order,
    currentEnv: createMockEnv({
      packlinkUseMock: false,
      packlinkApiKey: "packlink-key",
    }),
    fetchImpl: async () =>
      new Response(
        JSON.stringify({
          shipment_id: "pk_456",
          tracking_number: "BRT456789123",
          tracking_url: "https://tracking.packlink.test/BRT456789123",
          carrier_name: "BRT",
          status: "out_for_delivery",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
  })

  assert.equal(first.ok, true)
  assert.equal(first.order.shippingStatus, "out_for_delivery")
  assert.equal(first.order.trackingUrl, "https://tracking.packlink.test/BRT456789123")
})

test("economy orders auto-create a real Packlink shipment when payment completes", async () => {
  const order = createOrder({
    shippingMethod: "economy",
    shippingCarrier: "BRT",
    shippingCost: 590,
  })
  const db = createDb(order)

  const result = await maybeCreateShipmentForPaidOrder({
    db,
    order,
    currentEnv: createMockEnv({
      shippingAutoCreateOnPayment: true,
      packlinkUseMock: false,
      packlinkApiKey: "packlink-key",
      packlinkDefaultCarrier: "BRT",
    }),
    fetchImpl: async (input) => {
      if (String(input).endsWith("/quotes")) {
        return new Response(
          JSON.stringify({
            quotes: [{ service_id: "service-brt", carrier_name: "BRT", amount: 4.9 }],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        )
      }

      return new Response(
        JSON.stringify({
          shipment_id: "pk_auto_001",
          tracking_number: "BRTAUTO123456",
          tracking_url: "https://tracking.packlink.test/BRTAUTO123456",
          label_url: "https://labels.packlink.test/pk_auto_001.pdf",
          carrier_name: "BRT",
          status: "created",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      )
    },
  })

  assert.equal(result.ok, true)
  assert.equal(result.order.shippingCarrier, "BRT")
  assert.equal(result.order.shippingStatus, "created")
  assert.equal(result.order.trackingUrl, "https://tracking.packlink.test/BRTAUTO123456")
  assert.equal(result.order.labelUrl, "https://labels.packlink.test/pk_auto_001.pdf")
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
