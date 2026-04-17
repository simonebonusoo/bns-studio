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
        data: normalizedIds.map((collectionId) => ({ productId, collectionId })),
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
      include: {
        collection: true,
      },
    },
    drop: true,
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

export function isDropPublic(drop, now = new Date()) {
  if (!drop || !drop.visible) return false
  const status = String(drop.status || "draft").trim().toLowerCase()
  if (status === "live") return true
  if (status === "scheduled" || status === "programmato") {
    return Boolean(drop.launchAt && new Date(drop.launchAt).getTime() <= now.getTime())
  }
  return false
}

export async function resolveDueDropLaunches(client = prisma, now = new Date()) {
  const dueDrops = await client.drop.findMany({
    where: {
      visible: true,
      status: "scheduled",
      launchAt: { lte: now },
    },
    select: { id: true },
  })
  const dueDropIds = dueDrops.map((drop) => drop.id)

  if (dueDropIds.length) {
    await client.drop.updateMany({
      where: { id: { in: dueDropIds } },
      data: { status: "live" },
    })
  }

  const liveDrops = await client.drop.findMany({
    where: { status: "live" },
    select: { id: true },
  })
  const liveDropIds = liveDrops.map((drop) => drop.id)

  if (liveDropIds.length) {
    await client.product.updateMany({
      where: {
        dropId: { in: liveDropIds },
        status: "draft",
      },
      data: { status: "active" },
    })
  }

  return {
    launchedDropIds: dueDropIds,
    liveDropIds,
  }
}

export function isProductVisibleWithDrop(product, now = new Date()) {
  if (!product?.dropId) return true
  return isDropPublic(product.drop, now)
}

export function serializeDropSummary(drop) {
  if (!drop) return null
  return {
    id: drop.id,
    title: drop.title,
    slug: drop.slug,
    shortDescription: drop.shortDescription || "",
    description: drop.description || "",
    coverImageUrl: drop.coverImageUrl || "",
    status: drop.status,
    launchAt: drop.launchAt ? drop.launchAt.toISOString() : null,
    visible: Boolean(drop.visible),
    label: drop.label || "",
    createdAt: drop.createdAt ? drop.createdAt.toISOString() : undefined,
    updatedAt: drop.updatedAt ? drop.updatedAt.toISOString() : undefined,
  }
}
