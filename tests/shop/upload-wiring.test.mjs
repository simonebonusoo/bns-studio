import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import path from "node:path"

const repoRoot = process.cwd()

function read(relativePath) {
  return readFileSync(path.join(repoRoot, relativePath), "utf8")
}

test("ProductMediaManager collega Carica immagini a un input file reale e resetta il valore", () => {
  const source = read("src/shop/components/admin/ProductMediaManager.tsx")

  assert.match(source, /const inputId = "product-media-upload-input"/)
  assert.match(source, /<label[\s\S]*htmlFor=\{inputId\}/)
  assert.match(source, /<input[\s\S]*id=\{inputId\}[\s\S]*type="file"/)
  assert.match(source, /multiple/)
  assert.match(source, /onFileChange\(event\.target\.files\)/)
  assert.match(source, /event\.currentTarget\.value = ""/)
})

test("ProductFormCard usa ProductMediaManager anche nel form prodotto standard", () => {
  const source = read("src/shop/components/admin/ProductFormCard.tsx")

  assert.match(source, /!isMultiEdit \? \(/)
  assert.match(source, /<ProductMediaManager/)
  assert.match(source, /onFileChange=\{onFileChange\}/)
  assert.match(source, /images=\{productImages\}/)
})

test("AdminHomepageSection collega l'upload immagine delle selezioni in evidenza al blocco corretto", () => {
  const source = read("src/shop/components/admin/AdminHomepageSection.tsx")

  assert.match(source, /htmlFor=\{`homepage-showcase-image-\$\{index\}`\}/)
  assert.match(source, /id=\{`homepage-showcase-image-\$\{index\}`\}/)
  assert.match(source, /void onUploadShowcaseImage\(index, event\.target\.files\)/)
  assert.match(source, /event\.currentTarget\.value = ""/)
})

test("AdminHomepageSection collega l'upload immagine delle categorie popolari al blocco corretto", () => {
  const source = read("src/shop/components/admin/AdminHomepageSection.tsx")

  assert.match(source, /htmlFor=\{`homepage-popular-category-image-\$\{index\}`\}/)
  assert.match(source, /id=\{`homepage-popular-category-image-\$\{index\}`\}/)
  assert.match(source, /void onUploadPopularCategoryImage\(index, event\.target\.files\)/)
  assert.match(source, /event\.currentTarget\.value = ""/)
})

test("ShopAdminPage salva l'immagine caricata nello state corretto per prodotto e homepage", () => {
  const source = read("src/shop/pages/ShopAdminPage.tsx")

  assert.match(source, /async function uploadProductImages\(\)/)
  assert.match(source, /apiFetch<\{ files: \{ url: string \}\[] \}>\("\/admin\/uploads"/)
  assert.match(source, /const imageUrls = \[\.\.\.productForm\.existingImageUrls, \.\.\.uploadedUrls\]/)
  assert.match(source, /itemIndex === index \? \{ \.\.\.entry, imageUrl \} : entry/)
})
