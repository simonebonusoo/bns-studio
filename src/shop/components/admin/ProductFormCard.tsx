import type { FormEvent } from "react"

import { Button } from "../../../components/Button"
import { ProductStatus } from "../../types"
import { ProductMediaManager } from "./ProductMediaManager"

type ProductFormState = {
  title: string
  description: string
  priceA4: string
  priceA3: string
  costPrice: string
  hasA4: boolean
  hasA3: boolean
  category: string
  featured: boolean
  stock: number
  status: ProductStatus
  existingImageUrls: string[]
}

type ProductFormCardProps = {
  editingProductId: number | null
  productForm: ProductFormState
  categories: string[]
  productImages: string[]
  onSubmit: (event: FormEvent) => void
  onCancel: () => void
  onChange: (next: ProductFormState) => void
  onFileChange: (files: FileList | null) => void
  onMakePrimary: (imageUrl: string) => void
  onRemoveExisting: (imageUrl: string) => void
}

export function ProductFormCard({
  editingProductId,
  productForm,
  categories,
  productImages,
  onSubmit,
  onCancel,
  onChange,
  onFileChange,
  onMakePrimary,
  onRemoveExisting,
}: ProductFormCardProps) {
  return (
    <form onSubmit={onSubmit} className="shop-card h-full space-y-4 p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-white">{editingProductId ? "Modifica prodotto" : "Nuovo prodotto"}</h2>
        {editingProductId ? (
          <button type="button" onClick={onCancel} className="text-sm text-white/60 transition hover:text-white">
            Annulla modifica
          </button>
        ) : null}
      </div>

      <input
        className="shop-input"
        placeholder="Titolo"
        aria-label="Titolo"
        value={productForm.title}
        onChange={(event) => onChange({ ...productForm, title: event.target.value })}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <select
          className="shop-select"
          aria-label="Categoria"
          value={productForm.category}
          onChange={(event) => onChange({ ...productForm, category: event.target.value })}
        >
          <option value="">Categoria</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        <select
          className="shop-select"
          aria-label="Stato prodotto"
          value={productForm.status}
          onChange={(event) => onChange({ ...productForm, status: event.target.value as ProductStatus })}
        >
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="hidden">Hidden</option>
          <option value="out_of_stock">Out of stock</option>
        </select>

        <div className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/70">
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={productForm.hasA4} onChange={(event) => onChange({ ...productForm, hasA4: event.target.checked })} />
              A4
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={productForm.hasA3} onChange={(event) => onChange({ ...productForm, hasA3: event.target.checked })} />
              A3
            </label>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <input
          className="shop-input"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          placeholder="Prezzo A4"
          aria-label="Prezzo A4 in euro"
          value={productForm.priceA4}
          disabled={!productForm.hasA4}
          onChange={(event) => onChange({ ...productForm, priceA4: event.target.value })}
        />
        <input
          className="shop-input"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          placeholder="Prezzo A3"
          aria-label="Prezzo A3 in euro"
          value={productForm.priceA3}
          disabled={!productForm.hasA3}
          onChange={(event) => onChange({ ...productForm, priceA3: event.target.value })}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <input
          className="shop-input"
          type="number"
          min="0"
          placeholder="Quantità"
          aria-label="Quantità"
          value={productForm.stock}
          onChange={(event) => onChange({ ...productForm, stock: Number(event.target.value) })}
        />
        <label className="flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/70">
          <input type="checkbox" checked={productForm.featured} onChange={(event) => onChange({ ...productForm, featured: event.target.checked })} />
          Metti in evidenza
        </label>
      </div>

      <textarea
        className="shop-textarea min-h-32 resize-none"
        placeholder="Descrizione"
        aria-label="Descrizione"
        value={productForm.description}
        onChange={(event) => onChange({ ...productForm, description: event.target.value })}
      />

      <ProductMediaManager
        images={productImages}
        existingImageUrls={productForm.existingImageUrls}
        onFileChange={onFileChange}
        onMakePrimary={onMakePrimary}
        onRemoveExisting={onRemoveExisting}
      />

      <Button type="submit">{editingProductId ? "Aggiorna prodotto" : "Salva prodotto"}</Button>
    </form>
  )
}
