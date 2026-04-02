function stripTagLikeContent(value) {
  return String(value || "")
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
}

function normalizeWhitespace(value) {
  return String(value || "").replace(/\s+/g, " ").trim()
}

function sanitizePlainText(value) {
  return normalizeWhitespace(stripTagLikeContent(value))
}

function sanitizeMultilineText(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => sanitizePlainText(line))
    .filter(Boolean)
    .join("\n")
    .trim()
}

export function normalizeShippingDetails(input = {}) {
  return {
    email: String(input.email || "").trim(),
    firstName: sanitizePlainText(input.firstName),
    lastName: sanitizePlainText(input.lastName),
    phone: sanitizePlainText(input.phone),
    country: sanitizePlainText(input.country),
    region: sanitizePlainText(input.region),
    city: sanitizePlainText(input.city),
    postalCode: sanitizePlainText(input.postalCode),
    addressLine1: sanitizePlainText(input.addressLine1),
    streetNumber: sanitizePlainText(input.streetNumber),
    addressLine2: sanitizePlainText(input.addressLine2),
    staircase: sanitizePlainText(input.staircase),
    apartment: sanitizePlainText(input.apartment),
    floor: sanitizePlainText(input.floor),
    intercom: sanitizePlainText(input.intercom),
    deliveryNotes: sanitizeMultilineText(input.deliveryNotes),
  }
}

export function formatShippingAddressLines(input = {}) {
  const shipping = normalizeShippingDetails(input)
  const personLine = [shipping.firstName, shipping.lastName].filter(Boolean).join(" ").trim()
  const streetLine = [shipping.addressLine1, shipping.streetNumber].filter(Boolean).join(", ").trim()
  const accessLine = [
    shipping.staircase ? `Scala ${shipping.staircase}` : "",
    shipping.apartment ? `Interno ${shipping.apartment}` : "",
    shipping.floor ? `Piano ${shipping.floor}` : "",
    shipping.intercom ? `Citofono ${shipping.intercom}` : "",
  ]
    .filter(Boolean)
    .join(" · ")
  const cityLine = [shipping.postalCode, shipping.city].filter(Boolean).join(" ").trim()
  const regionLine = [shipping.region, shipping.country].filter(Boolean).join(" · ").trim()

  return {
    personLine,
    contactLines: [shipping.email, shipping.phone].filter(Boolean),
    addressLines: [
      streetLine,
      shipping.addressLine2,
      accessLine,
      cityLine,
      regionLine,
      shipping.deliveryNotes ? `Note consegna: ${shipping.deliveryNotes}` : "",
    ].filter(Boolean),
  }
}
