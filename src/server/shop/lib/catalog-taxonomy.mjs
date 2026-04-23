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

  await prisma.$transaction(async (tx) => {
    await tx.productTag.deleteMany({ where: { productId } })

    if (tagRecords.length) {
      await tx.productTag.createMany({
        data: tagRecords.map((tag) => ({ productId, tagId: tag.id })),
      })
    }
  })
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

  await prisma.$transaction(async (tx) => {
    await tx.productCollection.deleteMany({ where: { productId } })

    if (normalizedIds.length) {
      await tx.productCollection.createMany({
        data: normalizedIds.map((collectionId, position) => ({ productId, collectionId, position })),
      })
    }
  })
}

export async function syncCollectionProducts(collectionId, productIds = []) {
  const normalizedIds = Array.from(
    new Set(
      productIds
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0),
    ),
  )

  if (normalizedIds.length) {
    const existingProducts = await prisma.product.findMany({
      where: { id: { in: normalizedIds } },
      select: { id: true },
    })
    if (existingProducts.length !== normalizedIds.length) {
      throw new HttpError(400, "Uno o piu prodotti selezionati non sono validi")
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.productCollection.deleteMany({ where: { collectionId } })

    if (normalizedIds.length) {
      await tx.productCollection.createMany({
        data: normalizedIds.map((productId, position) => ({ productId, collectionId, position })),
      })
    }
  })
}

export function productRelationInclude() {
  return {
    variants: {
      orderBy: [{ position: "asc" }, { id: "asc" }],
    },
    productTags: {
      include: {
        tag: true,
      },
    },
    productCollections: {
      orderBy: [{ position: "asc" }],
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
    coverImageUrl: entry.collection.coverImageUrl || "",
    promoText: entry.collection.promoText || "",
    position: entry.collection.position ?? 0,
    status: entry.collection.status || (entry.collection.active ? "live" : "draft"),
    launchAt: entry.collection.launchAt ? entry.collection.launchAt.toISOString() : null,
    active: entry.collection.active,
    productPosition: entry.position || 0,
  }))

  return { tags, collections }
}

export function isCollectionPublic(collection, now = new Date()) {
  if (!collection || collection.active === false) return false
  const status = String(collection.status || "live").trim().toLowerCase()
  if (status === "live") return true
  if (status === "scheduled" || status === "programmata" || status === "programmato") {
    return Boolean(collection.launchAt && new Date(collection.launchAt).getTime() <= now.getTime())
  }
  return false
}

export async function resolveDueCollectionLaunches(client = prisma, now = new Date()) {
  const dueCollections = await client.collection.findMany({
    where: {
      active: true,
      status: "scheduled",
      launchAt: { lte: now },
    },
    select: { id: true },
  })
  const dueCollectionIds = dueCollections.map((collection) => collection.id)

  if (dueCollectionIds.length) {
    await client.collection.updateMany({
      where: { id: { in: dueCollectionIds } },
      data: { status: "live" },
    })
  }

  const liveCollections = await client.collection.findMany({
    where: { status: "live" },
    include: {
      products: {
        select: { productId: true },
      },
    },
  })
  const liveProductIds = Array.from(new Set(liveCollections.flatMap((collection) => collection.products.map((entry) => entry.productId))))

  if (liveProductIds.length) {
    await client.product.updateMany({
      where: {
        id: { in: liveProductIds },
        status: "draft",
      },
      data: { status: "active" },
    })
  }

  return {
    launchedCollectionIds: dueCollectionIds,
    liveProductIds,
  }
}
