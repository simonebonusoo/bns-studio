import { getAvailableShippingOptions, normalizeShippingMethodSelection, resolveSelectedShippingOption } from "../shipping/index.mjs"

export { normalizeShippingMethodSelection }

export async function getAvailableShippingRates({ items, shippingAddress = null, currentEnv, fetchImpl = fetch }) {
  return getAvailableShippingOptions({ items, shippingAddress, currentEnv, fetchImpl })
}

export async function resolveSelectedShippingRate({ items, shippingMethod, shippingAddress = null, currentEnv, fetchImpl = fetch }) {
  return resolveSelectedShippingOption({ items, shippingMethod, shippingAddress, currentEnv, fetchImpl })
}
