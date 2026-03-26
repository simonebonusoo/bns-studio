const DEFAULT_PRODUCTION_API_BASE_URL = "https://bns-studio.onrender.com"

function normalizeBaseUrl(value: string) {
  return value.trim().replace(/\/+$/, "")
}

function normalizeApiUrl(value: string) {
  const normalized = normalizeBaseUrl(value)
  if (!normalized) return ""
  if (normalized === "/api" || normalized.endsWith("/api")) return normalized
  return `${normalized}/api`
}

const API_BASE_URL = normalizeBaseUrl(String(import.meta.env.VITE_API_BASE_URL || ""))
const CONFIGURED_API_URL = normalizeApiUrl(String(import.meta.env.VITE_API_URL || ""))
const FALLBACK_PRODUCTION_BASE_URL =
  typeof window !== "undefined" &&
  window.location.hostname !== "localhost" &&
  window.location.hostname !== "127.0.0.1"
    ? DEFAULT_PRODUCTION_API_BASE_URL
    : ""

const RESOLVED_API_BASE_URL =
  API_BASE_URL ||
  (CONFIGURED_API_URL ? CONFIGURED_API_URL.replace(/\/api$/, "") : "") ||
  FALLBACK_PRODUCTION_BASE_URL

const API_URL = RESOLVED_API_BASE_URL ? `${RESOLVED_API_BASE_URL}/api` : "/api"

function toAbsoluteAssetUrl(value: string) {
  if (!value.startsWith("/uploads/")) {
    return value
  }

  if (RESOLVED_API_BASE_URL) {
    return new URL(value, `${RESOLVED_API_BASE_URL}/`).toString()
  }

  return value
}

function normalizeApiData<T>(value: T): T {
  if (typeof value === "string") {
    return toAbsoluteAssetUrl(value) as T
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeApiData(item)) as T
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, normalizeApiData(entry)])
    ) as T
  }

  return value
}

async function parseApiResponse(response: Response) {
  const contentType = response.headers.get("content-type") || ""
  const rawText = await response.text()

  if (!rawText) {
    return { data: null, rawText }
  }

  if (contentType.includes("application/json")) {
    try {
      return { data: JSON.parse(rawText), rawText }
    } catch {
      return { data: null, rawText }
    }
  }

  try {
    return { data: JSON.parse(rawText), rawText }
  } catch {
    return { data: null, rawText }
  }
}

function buildApiError(response: Response, data: any, rawText: string) {
  const serverMessage =
    typeof data?.message === "string"
      ? data.message
      : typeof data?.error === "string"
        ? data.error
        : ""

  if (serverMessage) {
    return new Error(serverMessage)
  }

  if (response.status === 404) {
    return new Error("Servizio shop non trovato. Verifica che l'API sia attiva.")
  }

  if (response.status >= 500) {
    return new Error("Errore interno del servizio shop. Riprova tra poco.")
  }

  if (rawText.trim().startsWith("<!DOCTYPE") || rawText.trim().startsWith("<html")) {
    return new Error("Il servizio shop ha restituito una pagina HTML invece di una risposta API valida.")
  }

  if (!rawText) {
    return new Error("Il servizio shop ha restituito una risposta vuota.")
  }

  return new Error("Risposta non valida dal servizio shop.")
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("bns_shop_token")
  const isFormData = options.body instanceof FormData

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    })
  } catch {
    throw new Error("Impossibile contattare il servizio shop. Controlla che il backend sia avviato.")
  }

  if (response.status === 204) {
    return null as T
  }

  const { data, rawText } = await parseApiResponse(response)

  if (!response.ok) {
    throw buildApiError(response, data, rawText)
  }

  if (data === null) {
    throw buildApiError(response, data, rawText)
  }

  return normalizeApiData(data as T)
}
