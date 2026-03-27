import fs from "node:fs"
import path from "node:path"

import { prisma } from "./prisma.mjs"
import { applyStoredProductOrder, getStoredProductOrderSetting } from "./product-order.mjs"
import { getAvailableProductFormats, getDefaultProductFormat, getProductPriceForFormat } from "./product-formats.mjs"
import { resolveProductUploadsDir, resolveUploadsRootDir } from "./uploads-storage.mjs"

const PRODUCTS_ARCHIVE_DIRNAME = "Prodotti"

function ensureDir(targetPath) {
  fs.mkdirSync(targetPath, { recursive: true })
}

function removeDir(targetPath) {
  if (fs.existsSync(targetPath)) {
    fs.rmSync(targetPath, { recursive: true, force: true })
  }
}

function safeFileName(value, fallback) {
  const sanitized = String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")

  return sanitized || fallback
}

function resolveProductsArchiveRoot() {
  return path.join(path.dirname(resolveUploadsRootDir()), PRODUCTS_ARCHIVE_DIRNAME)
}

export { resolveProductsArchiveRoot }

function resolveProductArchiveDir(slug) {
  return path.join(resolveProductsArchiveRoot(), safeFileName(slug, "prodotto"))
}

function writeTextFile(filePath, value) {
  ensureDir(path.dirname(filePath))
  fs.writeFileSync(filePath, value, "utf8")
}

function buildMirrorMetadata(product, orderIndex, imageEntries) {
  const availableFormats = getAvailableProductFormats(product)

  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    category: product.category,
    description: product.description,
    availableFormats,
    defaultFormat: getDefaultProductFormat(product),
    priceA4: availableFormats.includes("A4") ? getProductPriceForFormat(product, "A4") : null,
    priceA3: availableFormats.includes("A3") ? getProductPriceForFormat(product, "A3") : null,
    featured: Boolean(product.featured),
    stock: product.stock,
    order: orderIndex,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    imageUrls: imageEntries.map((entry) => entry.sourceUrl),
    archivedImages: imageEntries.map((entry) => ({
      kind: entry.kind,
      sourceUrl: entry.sourceUrl,
      archivedPath: entry.archivedRelativePath,
    })),
  }
}

function archiveProductImages(product, imagesDir) {
  const uploadsDir = resolveProductUploadsDir()
  removeDir(imagesDir)
  ensureDir(imagesDir)

  return JSON.parse(product.imageUrls).map((imageUrl, index) => {
    const prefix = index === 0 ? "cover" : `extra-${index}`

    if (typeof imageUrl === "string" && imageUrl.startsWith("/uploads/products/")) {
      const sourcePath = path.join(uploadsDir, path.basename(imageUrl))
      const extension = path.extname(sourcePath) || ".img"
      const fileName = `${prefix}${extension}`
      const targetPath = path.join(imagesDir, fileName)

      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, targetPath)
      }

      return {
        kind: "local-file",
        sourceUrl: imageUrl,
        archivedRelativePath: path.join("immagini", fileName),
      }
    }

    const fileName = `${prefix}.url`
    writeTextFile(path.join(imagesDir, fileName), String(imageUrl))

    return {
      kind: "remote-url",
      sourceUrl: imageUrl,
      archivedRelativePath: path.join("immagini", fileName),
    }
  })
}

export function removeProductMirror(slug) {
  removeDir(resolveProductArchiveDir(slug))
}

export function syncProductMirror(product, orderIndex, previousSlug) {
  const archiveRoot = resolveProductsArchiveRoot()
  ensureDir(archiveRoot)

  const currentDir = resolveProductArchiveDir(product.slug)
  const previousDir = previousSlug && previousSlug !== product.slug ? resolveProductArchiveDir(previousSlug) : null

  if (previousDir && fs.existsSync(previousDir) && previousDir !== currentDir) {
    removeDir(currentDir)
    fs.renameSync(previousDir, currentDir)
  }

  ensureDir(currentDir)
  const imagesDir = path.join(currentDir, "immagini")
  const imageEntries = archiveProductImages(product, imagesDir)

  writeTextFile(path.join(currentDir, "descrizione.txt"), product.description || "")
  writeTextFile(
    path.join(currentDir, "product.json"),
    `${JSON.stringify(buildMirrorMetadata(product, orderIndex, imageEntries), null, 2)}\n`
  )
}

export async function syncAllProductMirrors() {
  const [products, orderSetting] = await Promise.all([
    prisma.product.findMany({ orderBy: { createdAt: "desc" } }),
    getStoredProductOrderSetting(),
  ])

  const orderedProducts = applyStoredProductOrder(products, orderSetting?.value)
  const archiveRoot = resolveProductsArchiveRoot()
  ensureDir(archiveRoot)

  const expectedDirs = new Set()

  orderedProducts.forEach((product, index) => {
    syncProductMirror(product, index + 1)
    expectedDirs.add(resolveProductArchiveDir(product.slug))
  })

  for (const entry of fs.readdirSync(archiveRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const entryPath = path.join(archiveRoot, entry.name)
    if (!expectedDirs.has(entryPath)) {
      removeDir(entryPath)
    }
  }
}
