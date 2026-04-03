const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000
const DEFAULT_TOP_TARGET = new Date(Date.now() + TWELVE_HOURS_MS).toISOString()

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
  return {
    enabled: parseBoolean(settings.bannerTopEnabled, true),
    title: String(settings.bannerTopTitle || "SAVE 40% OFF"),
    subtitle: String(settings.bannerTopSubtitle || "Sale ends in:"),
    countdownEnabled: parseBoolean(settings.bannerTopCountdownEnabled, true),
    countdownTarget: parseTarget(settings.bannerTopCountdownTarget),
  }
}

export function parseMidBannerSettings(settings = {}) {
  return {
    enabled: parseBoolean(settings.bannerMidEnabled, true),
    text: String(settings.bannerMidText || "3-5 DAYS FREE SHIPPING WORLDWIDE"),
  }
}

export function getTopBarsOffset(topBanner, midBanner) {
  return `${(topBanner?.enabled ? 44 : 0) + (midBanner?.enabled ? 36 : 0)}px`
}
