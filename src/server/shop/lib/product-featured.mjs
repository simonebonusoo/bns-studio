import { HttpError } from "./http.mjs"

export const MAX_FEATURED_PRODUCTS = 16

export function assertFeaturedProductLimit({ currentFeaturedCount, nextFeatured, currentlyFeatured = false }) {
  if (!nextFeatured || currentlyFeatured) return

  if (currentFeaturedCount >= MAX_FEATURED_PRODUCTS) {
    throw new HttpError(400, `Puoi mettere in evidenza nel merchandising al massimo ${MAX_FEATURED_PRODUCTS} prodotti.`)
  }
}
