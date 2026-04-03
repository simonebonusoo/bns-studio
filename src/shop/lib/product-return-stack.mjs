const PRODUCT_RETURN_STACK_KEY = "bns-shop-product-return-stack-v1"
const MAX_STACK_SIZE = 12

function normalizeEntry(entry) {
  return {
    pathname: String(entry?.pathname || ""),
    savedAt: Number.isFinite(entry?.savedAt) ? entry.savedAt : Date.now(),
  }
}

function readRawStack(storage = typeof sessionStorage !== "undefined" ? sessionStorage : null) {
  if (!storage) return []

  try {
    const raw = storage.getItem(PRODUCT_RETURN_STACK_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map(normalizeEntry).filter((entry) => entry.pathname)
  } catch {
    return []
  }
}

function writeRawStack(stack, storage = typeof sessionStorage !== "undefined" ? sessionStorage : null) {
  if (!storage) return

  try {
    storage.setItem(PRODUCT_RETURN_STACK_KEY, JSON.stringify(stack.slice(-MAX_STACK_SIZE)))
  } catch {}
}

export function pushProductReturnEntry(entry, storage = typeof sessionStorage !== "undefined" ? sessionStorage : null) {
  const normalized = normalizeEntry(entry)
  if (!normalized.pathname) return

  const stack = readRawStack(storage)
  const top = stack[stack.length - 1]
  if (top?.pathname === normalized.pathname) return

  writeRawStack([...stack, normalized], storage)
}

export function consumePreviousProductReturnEntry(currentPathname, storage = typeof sessionStorage !== "undefined" ? sessionStorage : null) {
  const stack = readRawStack(storage)
  if (!stack.length) return null

  const normalizedCurrentPathname = String(currentPathname || "")
  const next = [...stack]

  while (next.length && normalizedCurrentPathname && next[next.length - 1]?.pathname === normalizedCurrentPathname) {
    next.pop()
  }

  let entry = next.pop() || null
  while (entry?.pathname && normalizedCurrentPathname && entry.pathname === normalizedCurrentPathname) {
    entry = next.pop() || null
  }

  writeRawStack(next, storage)
  return entry
}
