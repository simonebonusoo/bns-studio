const HOME_RETURN_KEY = "bns-shop-home-return-v1"

export function buildHomeReturnState(pathname = "/", scrollY = 0) {
  return {
    fromHomeShop: true,
    homePathname: pathname || "/",
    homeScrollY: Number.isFinite(scrollY) ? Math.max(0, Math.floor(scrollY)) : 0,
    savedAt: Date.now(),
  }
}

function normalizeStoredState(state) {
  return {
    fromHomeShop: true,
    homePathname: state?.homePathname || "/",
    homeScrollY: Number.isFinite(state?.homeScrollY) ? Math.max(0, Math.floor(state.homeScrollY)) : 0,
    savedAt: Number.isFinite(state?.savedAt) ? state.savedAt : Date.now(),
  }
}

export function persistHomeReturnState(state, storage = typeof sessionStorage !== "undefined" ? sessionStorage : null) {
  if (!storage) return

  try {
    storage.setItem(HOME_RETURN_KEY, JSON.stringify(normalizeStoredState(state)))
  } catch {}
}

export function readHomeReturnState(storage = typeof sessionStorage !== "undefined" ? sessionStorage : null) {
  if (!storage) return null

  try {
    const raw = storage.getItem(HOME_RETURN_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || parsed.fromHomeShop !== true) return null
    return normalizeStoredState(parsed)
  } catch {
    return null
  }
}

export function clearHomeReturnState(storage = typeof sessionStorage !== "undefined" ? sessionStorage : null) {
  if (!storage) return

  try {
    storage.removeItem(HOME_RETURN_KEY)
  } catch {}
}

export function resolveHomeReturnState(locationState, storage = typeof sessionStorage !== "undefined" ? sessionStorage : null) {
  if (locationState?.fromHomeShop) {
    const resolved = normalizeStoredState(locationState)
    persistHomeReturnState(resolved, storage)
    return resolved
  }

  return readHomeReturnState(storage)
}
