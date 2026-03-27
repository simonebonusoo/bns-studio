import { HttpError } from "./http.mjs"
import { prisma } from "./prisma.mjs"

export function slugifyCatalogText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 80)
}

export function normalizeSku(value) {
  const normalized = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-_./]/g, "-")
    .replace(/-{2,}/g, "-")

  return normalized || null
}

export function normalizeTagNames(values = []) {
  const seen = new Set()
  return values
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .filter((value) => {
      const key = value.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
}

export async function ensureUniqueSlug(modelName, baseValue, excludeId) {
  const base = slugifyCatalogText(baseValue) || `${modelName}-${Date.now()}`
  const model = prisma[modelName]

  for (let suffix = 0; suffix < 1000; suffix += 1) {
    const candidate =
      suffix === 0 ? base : `${base.slice(0, Math.max(1, 80 - String(suffix).length - 1))}-${suffix}`
    const existing = await model.findUnique({ where: { slug: candidate } })
    if (!existing || existing.id === excludeId) {
      return candidate
    }
  }

  throw new HttpError(500, "Impossibile generare uno slug univoco")
}

export async function syncProductTags(productId, tagNames = []) {
  const normalizedTags = normalizeTagNames(tagNames)
  const tagRecords = []

  for (const name of normalizedTags) {
    const slug = slugifyCatalogText(name)
    const existing = await prisma.tag.findUnique({ where: { slug } })
    const tag = existing
      ? await prisma.tag.update({
          where: { id: existing.id },
          data: { name },
        })
      : await prisma.tag.create({
          data: { name, slug },
        })
    tagRecords.push(tag)
  }

  await prisma.productTag.deleteMany({ where: { productId } })
  if (tagRecords.length) {
    await prisma.productTag.createMany({
      data: tagRecords.map((tag) => ({ productId, tagId: tag.id })),
      skipDuplicates: true,
    })
  }
}

export async function syncProductCollections(productId, collectionIds = []) {
  const normalizedIds = Array.from(
    new Set(
      collectionIds
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0),
    ),
  )

  if (normalizedIds.length) {
    const existingCollections = await prisma.collection.findMany({
      where: { id: { in: normalizedIds } },
      select: { id: true },
    })
    if (existingCollections.length !== normalizedIds.length) {
      throw new HttpError(400, "Una o piu collezioni selezionate non sono valide")
    }
  }

  await prisma.productCollection.deleteMany({ where: { productId } })
  if (normalizedIds.length) {
    await prisma.productCollection.createMany({
      data: normalizedIds.map((collectionId) => ({ productId, collectionId })),
      skipDuplicates: true,
    })
  }
}

export function productRelationInclude() {
  return {
    productTags: {
      include: {
        tag: true,
      },
    },
    productCollections: {
      include: {
        collection: true,
      },
    },
  }
}

export function serializeTaxonomyRelations(product) {
  const tags = (product.productTags || []).map((entry) => ({
    id: entry.tag.id,
    name: entry.tag.name,
    slug: entry.tag.slug,
  }))

  const collections = (product.productCollections || []).map((entry) => ({
    id: entry.collection.id,
    title: entry.collection.title,
    slug: entry.collection.slug,
    description: entry.collection.description || "",
    active: entry.collection.active,
  }))

  return { tags, collections }
}
