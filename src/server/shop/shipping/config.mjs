import { env } from "../config/env.mjs"

function normalizeOptionalString(value) {
  const normalized = String(value || "").trim()
  return normalized || null
}

export function buildShippingConfig(currentEnv = env) {
  return {
    autoCreateOnPayment: Boolean(currentEnv.shippingAutoCreateOnPayment),
    dhl: {
      env: currentEnv.dhlEnv === "production" ? "production" : "sandbox",
      useMock: Boolean(currentEnv.dhlUseMock),
      apiBaseUrl: normalizeOptionalString(currentEnv.dhlApiBaseUrl),
      apiKey: normalizeOptionalString(currentEnv.dhlApiKey),
      apiSecret: normalizeOptionalString(currentEnv.dhlApiSecret),
      accountNumber: normalizeOptionalString(currentEnv.dhlAccountNumber),
      trackingBaseUrl: normalizeOptionalString(currentEnv.dhlTrackingBaseUrl),
      shipmentProductCode: normalizeOptionalString(currentEnv.dhlShipmentProductCode) || "N",
      shipper: {
        name: normalizeOptionalString(currentEnv.dhlShipperName),
        company: normalizeOptionalString(currentEnv.dhlShipperCompany),
        email: normalizeOptionalString(currentEnv.dhlShipperEmail),
        phone: normalizeOptionalString(currentEnv.dhlShipperPhone),
        addressLine1: normalizeOptionalString(currentEnv.dhlShipperAddressLine1),
        addressLine2: normalizeOptionalString(currentEnv.dhlShipperAddressLine2),
        city: normalizeOptionalString(currentEnv.dhlShipperCity),
        postalCode: normalizeOptionalString(currentEnv.dhlShipperPostalCode),
        countryCode: normalizeOptionalString(currentEnv.dhlShipperCountryCode) || "IT",
        stateCode: normalizeOptionalString(currentEnv.dhlShipperStateCode),
      },
      packageDefaults: {
        weightKg: Number(currentEnv.dhlPackageWeightKg || 1),
        lengthCm: Number(currentEnv.dhlPackageLengthCm || 40),
        widthCm: Number(currentEnv.dhlPackageWidthCm || 30),
        heightCm: Number(currentEnv.dhlPackageHeightCm || 5),
      },
    },
    inpost: {
      env: currentEnv.inpostEnv === "production" ? "production" : "sandbox",
      useMock: Boolean(currentEnv.inpostUseMock),
      apiBaseUrl: normalizeOptionalString(currentEnv.inpostApiBaseUrl),
      apiKey: normalizeOptionalString(currentEnv.inpostApiKey),
      organizationId: normalizeOptionalString(currentEnv.inpostOrganizationId),
      trackingBaseUrl: normalizeOptionalString(currentEnv.inpostTrackingBaseUrl),
      economyRateA4: Number(process.env.INPOST_ECONOMY_A4_RATE_CENTS || 590),
      economyRateA3: Number(process.env.INPOST_ECONOMY_A3_RATE_CENTS || 690),
    },
  }
}
