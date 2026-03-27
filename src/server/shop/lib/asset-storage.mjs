import { env } from "../config/env.mjs"

const DEFAULT_CLOUDINARY_FOLDER = "bns-studio/products"

export function getAssetStorageMode() {
  return env.assetStorageMode === "cloudinary" ? "cloudinary" : "local"
}

export function getAssetStorageConfig() {
  const mode = getAssetStorageMode()

  return {
    mode,
    cloudinaryCloudName: env.cloudinaryCloudName,
    cloudinaryUploadPreset: env.cloudinaryUploadPreset,
    cloudinaryFolder: env.cloudinaryFolder || DEFAULT_CLOUDINARY_FOLDER,
  }
}

export function isCloudinaryConfigured() {
  const config = getAssetStorageConfig()
  return Boolean(config.cloudinaryCloudName && config.cloudinaryUploadPreset)
}

export function assetStorageWritesAreConfigured() {
  const mode = getAssetStorageMode()
  if (mode === "local") return true
  return isCloudinaryConfigured()
}

export async function storeUploadedProductImages(files) {
  const mode = getAssetStorageMode()

  if (mode === "local") {
    return files.map((file) => ({
      name: file.originalname,
      url: `/uploads/products/${file.filename}`,
    }))
  }

  const config = getAssetStorageConfig()
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary non configurato: imposta CLOUDINARY_CLOUD_NAME e CLOUDINARY_UPLOAD_PRESET.")
  }

  const uploadedFiles = []

  for (const file of files) {
    const formData = new FormData()
    const blob = new Blob([file.buffer], { type: file.mimetype || "application/octet-stream" })
    formData.append("file", blob, file.originalname)
    formData.append("upload_preset", config.cloudinaryUploadPreset)
    formData.append("folder", config.cloudinaryFolder)

    const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudinaryCloudName}/image/upload`, {
      method: "POST",
      body: formData,
    })

    const payload = await response.json().catch(() => null)

    if (!response.ok || !payload?.secure_url) {
      throw new Error(payload?.error?.message || "Upload immagine fallito sullo storage persistente.")
    }

    uploadedFiles.push({
      name: file.originalname,
      url: payload.secure_url,
    })
  }

  return uploadedFiles
}
