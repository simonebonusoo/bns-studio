import { buildMockTrackingView, createMockShippingLabelPdf } from "./mock-shipping-documents.mjs"

export function createMockTrackingResponse(order) {
  return buildMockTrackingView(order)
}

export function createMockLabelResponse(order) {
  const shipmentReference = order?.shipmentReference || order?.dhlShipmentReference || order?.orderReference || "shipment"
  return {
    filename: `inpost-label-${String(shipmentReference).replace(/[^a-z0-9_-]+/gi, "-")}.pdf`,
    buffer: createMockShippingLabelPdf(order),
  }
}
