function normalizeOptionalString(value) {
  const normalized = String(value || "").trim()
  return normalized || null
}

function toAscii(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, " ")
}

function escapePdfText(value) {
  return toAscii(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)")
}

function buildPdfBuffer(lines) {
  const content = [
    "BT",
    "/F1 18 Tf",
    "50 790 Td",
    ...lines.flatMap((line, index) => (index === 0 ? [`(${escapePdfText(line)}) Tj`] : ["0 -24 Td", `(${escapePdfText(line)}) Tj`])),
    "ET",
  ].join("\n")

  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj",
    `4 0 obj << /Length ${Buffer.byteLength(content, "utf8")} >> stream\n${content}\nendstream endobj`,
    "5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
  ]

  let offset = "%PDF-1.4\n".length
  const offsets = [0]
  for (const object of objects) {
    offsets.push(offset)
    offset += Buffer.byteLength(`${object}\n`, "utf8")
  }

  const xrefOffset = offset
  const xrefEntries = offsets.map((entry, index) => {
    if (index === 0) return "0000000000 65535 f "
    return `${String(entry).padStart(10, "0")} 00000 n `
  })

  const pdf = [
    "%PDF-1.4",
    ...objects,
    `xref\n0 ${offsets.length}\n${xrefEntries.join("\n")}`,
    `trailer << /Size ${offsets.length} /Root 1 0 R >>`,
    `startxref\n${xrefOffset}`,
    "%%EOF",
  ].join("\n")

  return Buffer.from(pdf, "utf8")
}

export function buildMockTrackingPath(trackingNumber) {
  const normalized = normalizeOptionalString(trackingNumber)
  return normalized ? `/shop/tracking/mock/${encodeURIComponent(normalized)}` : null
}

export function buildMockLabelPath(shipmentReference) {
  const normalized = normalizeOptionalString(shipmentReference)
  return normalized ? `/api/store/mock-shipping/labels/${encodeURIComponent(normalized)}` : null
}

export function buildMockTrackingTimeline(order) {
  const createdAt = new Date(order?.shippingCreatedAt || order?.createdAt || Date.now())
  const city = normalizeOptionalString(order?.city) || "Milano"
  const status = String(order?.shippingStatus || "").trim().toLowerCase() || "created"

  const steps = [
    {
      key: "created",
      title: "Etichetta generata",
      description: "La spedizione mock e stata creata correttamente.",
      location: "Centro logistico mock Milano",
      at: createdAt.toISOString(),
    },
    {
      key: "accepted",
      title: "Presa in carico",
      description: "Il pacco e pronto per il conferimento InPost.",
      location: "Drop-off point mock",
      at: new Date(createdAt.getTime() + 45 * 60 * 1000).toISOString(),
    },
    {
      key: "in_transit",
      title: "In transito",
      description: "La spedizione sta attraversando la rete logistica mock.",
      location: "Hub logistico mock Bologna",
      at: new Date(createdAt.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      key: "out_for_delivery",
      title: "In consegna",
      description: "Il corriere sta completando l'ultima tratta di consegna.",
      location: `Filiale locale mock ${city}`,
      at: new Date(createdAt.getTime() + 36 * 60 * 60 * 1000).toISOString(),
    },
    {
      key: "delivered",
      title: "Consegnato",
      description: `Il pacco e stato consegnato a ${city}.`,
      location: city,
      at: new Date(createdAt.getTime() + 48 * 60 * 60 * 1000).toISOString(),
    },
  ]

  const activeKeys =
    status === "delivered"
      ? ["created", "accepted", "in_transit", "out_for_delivery", "delivered"]
      : status === "out_for_delivery"
        ? ["created", "accepted", "in_transit", "out_for_delivery"]
        : status === "in_transit" || status === "shipped"
          ? ["created", "accepted", "in_transit"]
          : status === "accepted"
            ? ["created", "accepted"]
            : ["created"]

  return steps.map((step) => ({
    ...step,
    active: activeKeys.includes(step.key),
    current:
      (status === "shipped" && step.key === "in_transit") ||
      (status === "out_for_delivery" && step.key === "out_for_delivery") ||
      (status === "created" && step.key === "created") ||
      step.key === status,
  }))
}

export function buildMockTrackingView(order) {
  const timeline = buildMockTrackingTimeline(order)
  const current = timeline.find((step) => step.current) || timeline.find((step) => step.active) || timeline[0]

  return {
    carrier: normalizeOptionalString(order?.shippingCarrier) || "InPost",
    method: normalizeOptionalString(order?.shippingLabel) || "Spedizione economica",
    trackingNumber: normalizeOptionalString(order?.trackingNumber),
    shipmentReference: normalizeOptionalString(order?.shipmentReference || order?.dhlShipmentReference),
    status: normalizeOptionalString(order?.shippingStatus) || "created",
    orderReference: normalizeOptionalString(order?.orderReference),
    handoffMode: normalizeOptionalString(order?.shippingHandoffMode) || "dropoff",
    lastLocation: current?.location || "Centro logistico mock Milano",
    lastUpdateAt: current?.at || new Date().toISOString(),
    timeline,
  }
}

export function createMockShippingLabelPdf(order) {
  const recipient = [order?.firstName, order?.lastName].filter(Boolean).join(" ").trim() || order?.email || "Cliente"
  const address = [order?.addressLine1, order?.streetNumber, order?.city, order?.postalCode, order?.country].filter(Boolean).join(", ")
  const lines = [
    "BNS Studio - Mock Shipping Label",
    "",
    `Corriere: ${normalizeOptionalString(order?.shippingCarrier) || "InPost"}`,
    `Metodo: ${normalizeOptionalString(order?.shippingLabel) || "Spedizione economica"}`,
    `Tracking: ${normalizeOptionalString(order?.trackingNumber) || "N/D"}`,
    `Riferimento spedizione: ${normalizeOptionalString(order?.shipmentReference || order?.dhlShipmentReference) || "N/D"}`,
    `Ordine: ${normalizeOptionalString(order?.orderReference) || "N/D"}`,
    `Destinatario: ${recipient}`,
    `Indirizzo: ${address || "N/D"}`,
    `Conferimento: ${normalizeOptionalString(order?.shippingHandoffMode) || "dropoff"}`,
  ]

  return buildPdfBuffer(lines)
}
