const API_URL = import.meta.env.VITE_API_URL || "/api"

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

  return data as T
}
