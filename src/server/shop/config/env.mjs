import dotenv from "dotenv"

dotenv.config()

function requireEnv(name, fallback = "") {
  const value = process.env[name] ?? fallback
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function parseList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

function parseBoolean(value, fallback = false) {
  if (value == null || value === "") return fallback
  const normalized = String(value).trim().toLowerCase()
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on"
}

const clientUrl = requireEnv("CLIENT_URL", "http://localhost:5173")
const clientOrigins = Array.from(new Set([clientUrl, ...parseList(process.env.CLIENT_ORIGINS)]))
const isRenderRuntime = Boolean(process.env.RENDER || process.env.RENDER_SERVICE_ID || process.env.RENDER_EXTERNAL_URL)
const hasDhlCredentials = Boolean(process.env.DHL_API_KEY && process.env.DHL_API_SECRET && process.env.DHL_ACCOUNT_NUMBER)
const hasInpostCredentials = Boolean(process.env.INPOST_API_KEY)
const hasPacklinkCredentials = Boolean(process.env.PACKLINK_API_KEY)

export const env = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || "development",
  renderDiskPath: process.env.RENDER_DISK_PATH || (isRenderRuntime ? "/var/data" : ""),
  jwtSecret: requireEnv("JWT_SECRET", "bns-shop-local-secret"),
  clientUrl,
  clientOrigins,
  uploadsDir: process.env.UPLOADS_DIR || "",
  backupsDir: process.env.BACKUPS_DIR || "",
  monitoringDir: process.env.MONITORING_DIR || "",
  assetStorageMode: process.env.ASSET_STORAGE_MODE || "local",
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
  cloudinaryUploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET || "",
  cloudinaryFolder: process.env.CLOUDINARY_FOLDER || "",
  monitoringSentryDsn: process.env.MONITORING_SENTRY_DSN || "",
  paypalMeLink: process.env.PAYPAL_ME_LINK || "",
  paypalBusinessEmail: process.env.PAYPAL_BUSINESS_EMAIL || "",
  paypalCurrencyCode: process.env.PAYPAL_CURRENCY_CODE || "EUR",
  paypalStoreName: process.env.PAYPAL_STORE_NAME || "BNS Studio Shop",
  resendApiKey: process.env.RESEND_API_KEY || "",
  notificationEmailFrom: process.env.NOTIFICATION_EMAIL_FROM || "",
  adminNotificationEmail: process.env.ADMIN_NOTIFICATION_EMAIL || "bnsstudio26@gmail.com",
  dhlEnv: process.env.DHL_ENV || "sandbox",
  dhlUseMock: parseBoolean(process.env.DHL_USE_MOCK, !hasDhlCredentials),
  dhlApiBaseUrl:
    process.env.DHL_API_BASE_URL ||
    ((process.env.DHL_ENV || "sandbox") === "production"
      ? "https://express.api.dhl.com/mydhlapi"
      : "https://express.api.dhl.com/mydhlapi/test"),
  dhlApiKey: process.env.DHL_API_KEY || "",
  dhlApiSecret: process.env.DHL_API_SECRET || "",
  dhlAccountNumber: process.env.DHL_ACCOUNT_NUMBER || "",
  dhlTrackingBaseUrl:
    process.env.DHL_TRACKING_BASE_URL ||
    "https://www.dhl.com/global-en/home/tracking/tracking-express.html",
  dhlShipperName: process.env.DHL_SHIPPER_NAME || "",
  dhlShipperCompany: process.env.DHL_SHIPPER_COMPANY || "",
  dhlShipperEmail: process.env.DHL_SHIPPER_EMAIL || "",
  dhlShipperPhone: process.env.DHL_SHIPPER_PHONE || "",
  dhlShipperAddressLine1: process.env.DHL_SHIPPER_ADDRESS_LINE1 || "",
  dhlShipperAddressLine2: process.env.DHL_SHIPPER_ADDRESS_LINE2 || "",
  dhlShipperCity: process.env.DHL_SHIPPER_CITY || "",
  dhlShipperPostalCode: process.env.DHL_SHIPPER_POSTAL_CODE || "",
  dhlShipperCountryCode: process.env.DHL_SHIPPER_COUNTRY_CODE || "IT",
  dhlShipperStateCode: process.env.DHL_SHIPPER_STATE_CODE || "",
  dhlShipmentProductCode: process.env.DHL_SHIPMENT_PRODUCT_CODE || "N",
  dhlPackageWeightKg: Number(process.env.DHL_PACKAGE_WEIGHT_KG || 1),
  dhlPackageLengthCm: Number(process.env.DHL_PACKAGE_LENGTH_CM || 40),
  dhlPackageWidthCm: Number(process.env.DHL_PACKAGE_WIDTH_CM || 30),
  dhlPackageHeightCm: Number(process.env.DHL_PACKAGE_HEIGHT_CM || 5),
  inpostEnv: process.env.INPOST_ENV || "sandbox",
  inpostUseMock: parseBoolean(process.env.INPOST_USE_MOCK, !hasInpostCredentials),
  inpostApiBaseUrl: process.env.INPOST_API_BASE_URL || "https://api-shipx-pl.easypack24.net/v1",
  inpostApiKey: process.env.INPOST_API_KEY || "",
  inpostOrganizationId: process.env.INPOST_ORGANIZATION_ID || "",
  inpostTrackingBaseUrl: process.env.INPOST_TRACKING_BASE_URL || "",
  packlinkUseMock: parseBoolean(process.env.PACKLINK_USE_MOCK, !hasPacklinkCredentials),
  packlinkApiBaseUrl: process.env.PACKLINK_API_BASE_URL || "https://api.packlink.com/v1",
  packlinkApiKey: process.env.PACKLINK_API_KEY || "",
  packlinkServiceId: process.env.PACKLINK_SERVICE_ID || "",
  packlinkDefaultCarrier: process.env.PACKLINK_DEFAULT_CARRIER || "",
  packlinkSenderName: process.env.PACKLINK_SENDER_NAME || process.env.DHL_SHIPPER_NAME || "",
  packlinkSenderCompany: process.env.PACKLINK_SENDER_COMPANY || process.env.DHL_SHIPPER_COMPANY || "",
  packlinkSenderEmail: process.env.PACKLINK_SENDER_EMAIL || process.env.DHL_SHIPPER_EMAIL || "",
  packlinkSenderPhone: process.env.PACKLINK_SENDER_PHONE || process.env.DHL_SHIPPER_PHONE || "",
  packlinkSenderStreet1: process.env.PACKLINK_SENDER_STREET1 || process.env.DHL_SHIPPER_ADDRESS_LINE1 || "",
  packlinkSenderCity: process.env.PACKLINK_SENDER_CITY || process.env.DHL_SHIPPER_CITY || "",
  packlinkSenderZip: process.env.PACKLINK_SENDER_ZIP || process.env.DHL_SHIPPER_POSTAL_CODE || "",
  packlinkSenderCountry: process.env.PACKLINK_SENDER_COUNTRY || process.env.DHL_SHIPPER_COUNTRY_CODE || "IT",
  packlinkParcelWeightKg: Number(process.env.PACKLINK_PARCEL_WEIGHT_KG || 1),
  packlinkParcelLengthCm: Number(process.env.PACKLINK_PARCEL_LENGTH_CM || 30),
  packlinkParcelWidthCm: Number(process.env.PACKLINK_PARCEL_WIDTH_CM || 20),
  packlinkParcelHeightCm: Number(process.env.PACKLINK_PARCEL_HEIGHT_CM || 5),
  shippingAutoCreateOnPayment: parseBoolean(process.env.SHOP_SHIPPING_AUTO_CREATE_ON_PAYMENT, true),
}
