import type { FormEvent } from "react"

import { Button } from "../../../components/Button"
import { AdminCollection, ProductManualBadge, ProductStatus } from "../../types"
import { ProductMediaManager } from "./ProductMediaManager"

type ProductFormState = {
  title: string
  sku: string
  description: string
  priceA4: string
  priceA3: string
  costPrice: string
  hasA4: boolean
  hasA3: boolean
  category: string
  tags: string
  collectionIds: number[]
  manualBadges: ProductManualBadge[]
  featured: boolean
  stock: number
  lowStockThreshold: number
  status: ProductStatus
  existingImageUrls: string[]
}

type ProductFormCardProps = {
  editingProductId: number | null
  selectedCount: number
  isMultiEdit: boolean
  canSubmit: boolean
  productForm: ProductFormState
  categories: string[]
  collections: AdminCollection[]
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
  selectedCount,
  isMultiEdit,
  canSubmit,
  productForm,
  categories,
  collections,
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
        <div>
          <h2 className="text-xl font-semibold text-white">
            {isMultiEdit ? "Modifica prodotti" : editingProductId ? "Modifica prodotto" : "Nuovo prodotto"}
          </h2>
          {isMultiEdit ? (
            <p className="mt-1 text-sm text-white/55">Stai modificando {selectedCount} prodotti selezionati. Verranno aggiornati solo i campi che cambi davvero in questo form.</p>
          ) : null}
        </div>
        {editingProductId && !isMultiEdit ? (
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

      <input
        className="shop-input"
        placeholder="SKU (opzionale)"
        aria-label="SKU"
        value={productForm.sku}
        disabled={isMultiEdit}
        onChange={(event) => onChange({ ...productForm, sku: event.target.value })}
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
        <input
          className="shop-input"
          type="number"
          min="0"
          placeholder="Soglia stock basso"
          aria-label="Soglia stock basso"
          value={productForm.lowStockThreshold}
          onChange={(event) => onChange({ ...productForm, lowStockThreshold: Number(event.target.value) })}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <input
          className="shop-input"
          placeholder="Tag separati da virgola"
          aria-label="Tag"
          value={productForm.tags}
          onChange={(event) => onChange({ ...productForm, tags: event.target.value })}
        />
        <label className="flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/70">
          <input type="checkbox" checked={productForm.featured} onChange={(event) => onChange({ ...productForm, featured: event.target.checked })} />
          Metti in evidenza
        </label>
      </div>

      <div className="space-y-3 rounded-2xl border border-white/10 p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-white">Badge prodotto</p>
            <p className="mt-1 text-xs text-white/55">
              I badge manuali compaiono per primi nell&apos;ordine che scegli qui. I badge automatici di sistema restano attivi solo se non duplicano lo stesso testo.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              onChange({
                ...productForm,
                manualBadges: [
                  ...productForm.manualBadges,
                  { id: `manual-${Date.now()}`, label: "", enabled: true },
                ],
              })
            }
          >
            Aggiungi badge
          </Button>
        </div>

        {productForm.manualBadges.length ? (
          <div className="space-y-3">
            {productForm.manualBadges.map((badge, index) => (
              <div key={badge.id} className="grid gap-3 rounded-2xl border border-white/8 p-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
                <div className="space-y-2">
                  <input
                    className="shop-input"
                    placeholder="Testo badge"
                    aria-label={`Testo badge ${index + 1}`}
                    value={badge.label}
                    onChange={(event) =>
                      onChange({
                        ...productForm,
                        manualBadges: productForm.manualBadges.map((entry) =>
                          entry.id === badge.id ? { ...entry, label: event.target.value } : entry,
                        ),
                      })
                    }
                  />
                  <label className="flex items-center gap-2 text-xs text-white/65">
                    <input
                      type="checkbox"
                      checked={badge.enabled}
                      onChange={(event) =>
                        onChange({
                          ...productForm,
                          manualBadges: productForm.manualBadges.map((entry) =>
                            entry.id === badge.id ? { ...entry, enabled: event.target.checked } : entry,
                          ),
                        })
                      }
                    />
                    Badge attivo
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={index === 0}
                    onClick={() => {
                      if (index === 0) return
                      const next = [...productForm.manualBadges]
                      ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
                      onChange({ ...productForm, manualBadges: next })
                    }}
                  >
                    Su
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={index === productForm.manualBadges.length - 1}
                    onClick={() => {
                      if (index === productForm.manualBadges.length - 1) return
                      const next = [...productForm.manualBadges]
                      ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
                      onChange({ ...productForm, manualBadges: next })
                    }}
                  >
                    Giu
                  </Button>
                </div>

                <div className="flex items-center justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      onChange({
                        ...productForm,
                        manualBadges: productForm.manualBadges.filter((entry) => entry.id !== badge.id),
                      })
                    }
                  >
                    Rimuovi
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-white/50">Nessun badge manuale impostato. Puoi aggiungere etichette come Bestseller, Edizione limitata o Promo.</p>
        )}
      </div>

      <textarea
        className="shop-textarea min-h-32 resize-none"
        placeholder="Descrizione"
        aria-label="Descrizione"
        value={productForm.description}
        onChange={(event) => onChange({ ...productForm, description: event.target.value })}
      />

      <div className="space-y-3 rounded-2xl border border-white/10 p-4">
        <div>
          <p className="text-sm font-medium text-white">Collezioni</p>
          <p className="mt-1 text-xs text-white/55">Associa il prodotto a una o più collezioni reali.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {collections.length ? (
            collections.map((collection) => (
              <label key={collection.id} className="flex items-center gap-2 rounded-xl border border-white/8 px-3 py-2 text-sm text-white/70">
                <input
                  type="checkbox"
                  checked={productForm.collectionIds.includes(collection.id)}
                  onChange={(event) =>
                    onChange({
                      ...productForm,
                      collectionIds: event.target.checked
                        ? [...productForm.collectionIds, collection.id]
                        : productForm.collectionIds.filter((id) => id !== collection.id),
                    })
                  }
                />
                {collection.title}
              </label>
            ))
          ) : (
            <p className="text-sm text-white/50">Nessuna collezione disponibile.</p>
          )}
        </div>
      </div>

      <ProductMediaManager
        images={isMultiEdit ? [] : productImages}
        existingImageUrls={isMultiEdit ? [] : productForm.existingImageUrls}
        onFileChange={isMultiEdit ? () => {} : onFileChange}
        onMakePrimary={isMultiEdit ? () => {} : onMakePrimary}
        onRemoveExisting={isMultiEdit ? () => {} : onRemoveExisting}
      />
      {isMultiEdit ? (
        <p className="text-xs text-white/50">
          Le immagini e lo SKU restano invariati nella modifica multipla. Per cambiarli, apri un singolo prodotto.
        </p>
      ) : null}

      <Button type="submit" disabled={!canSubmit}>
        {isMultiEdit ? "Aggiorna prodotti" : editingProductId ? "Aggiorna prodotto" : "Salva prodotto"}
      </Button>
    </form>
  )
}
