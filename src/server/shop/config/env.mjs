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

const clientUrl = requireEnv("CLIENT_URL", "http://localhost:5173")
const clientOrigins = Array.from(new Set([clientUrl, ...parseList(process.env.CLIENT_ORIGINS)]))
const isRenderRuntime = Boolean(process.env.RENDER || process.env.RENDER_SERVICE_ID || process.env.RENDER_EXTERNAL_URL)

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
}
