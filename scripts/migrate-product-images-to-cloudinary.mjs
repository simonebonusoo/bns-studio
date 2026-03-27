import fs from "node:fs"
import path from "node:path"

import { prisma } from "../src/server/shop/lib/prisma.mjs"
import { uploadProductImageAsset } from "../src/server/shop/lib/asset-storage.mjs"
import { reportError, logInfo } from "../src/server/shop/lib/monitoring.mjs"
import { syncAllProductMirrors } from "../src/server/shop/lib/product-mirror.mjs"
import { resolveProductUploadsDir } from "../src/server/shop/lib/uploads-storage.mjs"

function inferMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === ".png") return "image/png"
  if (ext === ".webp") return "image/webp"
  if (ext === ".gif") return "image/gif"
  return "image/jpeg"
}

function shouldMigrateImage(url) {
  return typeof url === "string" && url.startsWith("/uploads/products/")
}

async function main() {
  if (!process.argv.includes("--force")) {
    throw new Error("Migrazione immagini bloccata: usa --force per confermare l'upload verso il cloud.")
  }

  const uploadsDir = resolveProductUploadsDir()
  const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } })
  let migratedImages = 0

  for (const product of products) {
    const imageUrls = JSON.parse(product.imageUrls)
    let changed = false
    const nextUrls = []

    for (const url of imageUrls) {
      if (!shouldMigrateImage(url)) {
        nextUrls.push(url)
        continue
      }

      const localPath = path.join(uploadsDir, path.basename(url))
      if (!fs.existsSync(localPath)) {
        nextUrls.push(url)
        continue
      }

      const uploaded = await uploadProductImageAsset({
        originalname: path.basename(localPath),
        buffer: fs.readFileSync(localPath),
        mimetype: inferMimeType(localPath),
      })

      nextUrls.push(uploaded.url)
      changed = true
      migratedImages += 1
    }

    if (changed) {
      await prisma.product.update({
        where: { id: product.id },
        data: { imageUrls: JSON.stringify(nextUrls) },
      })
    }
  }

  await syncAllProductMirrors()
  logInfo("product_images_cloud_migration_completed", {
    migratedImages,
    productsChecked: products.length,
  })
  console.log(`[shop-assets] Migrazione completata. Immagini migrate: ${migratedImages}`)
}

main().catch((error) => {
  reportError(error, { event: "product_images_cloud_migration_failed" })
  console.error("[shop-assets] Migrazione immagini fallita")
  console.error(error)
  process.exit(1)
})
