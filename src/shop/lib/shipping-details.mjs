export function normalizeShippingDetails(input = {}) {
  return {
    email: String(input.email || "").trim(),
    firstName: String(input.firstName || "").trim(),
    lastName: String(input.lastName || "").trim(),
    phone: String(input.phone || "").trim(),
    country: String(input.country || "").trim(),
    region: String(input.region || "").trim(),
    city: String(input.city || "").trim(),
    postalCode: String(input.postalCode || "").trim(),
    addressLine1: String(input.addressLine1 || "").trim(),
    streetNumber: String(input.streetNumber || "").trim(),
    addressLine2: String(input.addressLine2 || "").trim(),
    staircase: String(input.staircase || "").trim(),
    apartment: String(input.apartment || "").trim(),
    floor: String(input.floor || "").trim(),
    intercom: String(input.intercom || "").trim(),
    deliveryNotes: String(input.deliveryNotes || "").trim(),
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
