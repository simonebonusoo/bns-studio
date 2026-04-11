const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000
const DEFAULT_TOP_TARGET = new Date(Date.now() + TWELVE_HOURS_MS).toISOString()
const DEFAULT_TOP_COLOR = "#d32f2f"
const DEFAULT_MID_COLOR = "#000000"
const DEFAULT_TEXT_COLOR = "#ffffff"

function parseJsonArray(value) {
  if (typeof value !== "string" || !value.trim()) return null
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

function parseColor(value, fallback) {
  if (typeof value !== "string") return fallback
  const normalized = value.trim()
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(normalized) ? normalized : fallback
}

function parseBoolean(value, fallback) {
  if (typeof value !== "string") return fallback
  const normalized = value.trim().toLowerCase()
  if (normalized === "true") return true
  if (normalized === "false") return false
  return fallback
}

function parseTarget(value) {
  if (typeof value !== "string") return DEFAULT_TOP_TARGET
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : DEFAULT_TOP_TARGET
}

export function parseTopBannerSettings(settings = {}) {
  const title = typeof settings.bannerTopTitle === "string" ? settings.bannerTopTitle.trim() : ""
  const subtitle = typeof settings.bannerTopSubtitle === "string" ? settings.bannerTopSubtitle.trim() : ""

  return {
    enabled: parseBoolean(settings.bannerTopEnabled, true),
    title,
    subtitle,
    backgroundColor: parseColor(settings.bannerTopBackgroundColor, DEFAULT_TOP_COLOR),
    textColor: parseColor(settings.bannerTopTextColor, DEFAULT_TEXT_COLOR),
    countdownEnabled: parseBoolean(settings.bannerTopCountdownEnabled, true),
    countdownTarget: parseTarget(settings.bannerTopCountdownTarget),
  }
}

export function parseMidBannerSettings(settings = {}) {
  const parsedMessages = parseJsonArray(settings.bannerMidMessages)
  const normalizedMessages = (parsedMessages || [settings.bannerMidText || ""])
    .map((entry) => String(entry || "").trim())
    .filter(Boolean)

  return {
    enabled: parseBoolean(settings.bannerMidEnabled, true),
    text: String(settings.bannerMidText || normalizedMessages[0] || "").trim(),
    messages: normalizedMessages,
    backgroundColor: parseColor(settings.bannerMidBackgroundColor, DEFAULT_MID_COLOR),
    textColor: parseColor(settings.bannerMidTextColor, DEFAULT_TEXT_COLOR),
  }
}
