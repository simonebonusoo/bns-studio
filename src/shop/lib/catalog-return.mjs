const CATALOG_RETURN_KEY = "bns-shop-catalog-return-v1"

export function buildCatalogReturnState(pathnameSearch = "/shop", scrollY = 0, view = "full") {
  return {
    fromCatalog: true,
    pathnameSearch: pathnameSearch || "/shop",
    scrollY: Number.isFinite(scrollY) ? Math.max(0, Math.floor(scrollY)) : 0,
    view: view === "compact" ? "compact" : "full",
    savedAt: Date.now(),
  }
}

function normalizeStoredState(state) {
  return {
    fromCatalog: true,
    pathnameSearch: state?.pathnameSearch || "/shop",
    scrollY: Number.isFinite(state?.scrollY) ? Math.max(0, Math.floor(state.scrollY)) : 0,
    view: state?.view === "compact" ? "compact" : "full",
    savedAt: Number.isFinite(state?.savedAt) ? state.savedAt : Date.now(),
  }
}

export function persistCatalogReturnState(state, storage = typeof sessionStorage !== "undefined" ? sessionStorage : null) {
  if (!storage) return

  try {
    storage.setItem(CATALOG_RETURN_KEY, JSON.stringify(normalizeStoredState(state)))
  } catch {}
}

export function readCatalogReturnState(storage = typeof sessionStorage !== "undefined" ? sessionStorage : null) {
  if (!storage) return null

  try {
    const raw = storage.getItem(CATALOG_RETURN_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || parsed.fromCatalog !== true) return null
    return normalizeStoredState(parsed)
  } catch {
    return null
  }
}

export function clearCatalogReturnState(storage = typeof sessionStorage !== "undefined" ? sessionStorage : null) {
  if (!storage) return

  try {
    storage.removeItem(CATALOG_RETURN_KEY)
  } catch {}
}
