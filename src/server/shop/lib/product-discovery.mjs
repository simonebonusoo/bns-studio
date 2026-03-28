import { getProductStockStatus } from "./product-stock.mjs"

function normalize(value) {
  return String(value || "").trim().toLowerCase()
}

function includesToken(source, token) {
  return normalize(source).includes(normalize(token))
}

function countMatches(values = [], query) {
  return values.reduce((sum, value) => sum + (includesToken(value, query) ? 1 : 0), 0)
}

export function scoreCatalogSearchProduct(product, query) {
  const normalizedQuery = normalize(query)
  if (!normalizedQuery) {
    const inStockBoost = getProductStockStatus(product) === "in_stock" ? 3 : getProductStockStatus(product) === "low_stock" ? 1 : 0
    const featuredBoost = product.featured ? 2 : 0
    return inStockBoost + featuredBoost
  }

  const title = normalize(product.title)
  const slug = normalize(product.slug)
  const description = normalize(product.description)
  const category = normalize(product.category)
  const sku = normalize(product.sku)
  const tagNames = (product.productTags || []).map((entry) => entry.tag?.name || entry.tag?.slug || "")
  const collectionNames = (product.productCollections || []).map((entry) => entry.collection?.title || entry.collection?.slug || "")

  const exactTitle = title === normalizedQuery ? 12 : 0
  const titlePrefix = title.startsWith(normalizedQuery) ? 8 : 0
  const titleMatch = title.includes(normalizedQuery) ? 6 : 0
  const slugMatch = slug.includes(normalizedQuery) ? 4 : 0
  const skuMatch = sku.includes(normalizedQuery) ? 4 : 0
  const categoryMatch = category.includes(normalizedQuery) ? 3 : 0
  const descriptionMatch = description.includes(normalizedQuery) ? 2 : 0
  const tagMatch = countMatches(tagNames, normalizedQuery) * 3
  const collectionMatch = countMatches(collectionNames, normalizedQuery) * 3
  const featuredBoost = product.featured ? 2 : 0
  const stockStatus = getProductStockStatus(product)
  const availabilityBoost = stockStatus === "in_stock" ? 3 : stockStatus === "low_stock" ? 1 : 0

  return exactTitle + titlePrefix + titleMatch + slugMatch + skuMatch + categoryMatch + descriptionMatch + tagMatch + collectionMatch + featuredBoost + availabilityBoost
}

export function sortCatalogSearchProducts(products, query) {
  return [...products].sort((left, right) => {
    const leftScore = scoreCatalogSearchProduct(left, query)
    const rightScore = scoreCatalogSearchProduct(right, query)
    if (rightScore !== leftScore) return rightScore - leftScore
    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  })
}

export function scoreRelatedProduct(baseProduct, candidate) {
  const baseTagIds = (baseProduct.productTags || []).map((entry) => entry.tagId)
  const baseCollectionIds = (baseProduct.productCollections || []).map((entry) => entry.collectionId)
  const sharedTagCount = (candidate.productTags || []).filter((entry) => baseTagIds.includes(entry.tagId)).length
  const sharedCollectionCount = (candidate.productCollections || []).filter((entry) => baseCollectionIds.includes(entry.collectionId)).length
  const sameCategory = candidate.category === baseProduct.category ? 1 : 0
  const featuredBoost = candidate.featured ? 1 : 0
  const stockStatus = getProductStockStatus(candidate)
  const availabilityBoost = stockStatus === "in_stock" ? 2 : stockStatus === "low_stock" ? 1 : 0

  return sameCategory * 5 + sharedCollectionCount * 4 + sharedTagCount * 3 + featuredBoost + availabilityBoost
}
