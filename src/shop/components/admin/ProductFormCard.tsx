import type { FormEvent, ReactNode } from "react"

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
  onMoveImageBackward: (imageUrl: string) => void
  onMoveImageForward: (imageUrl: string) => void
  onRemoveExisting: (imageUrl: string) => void
}

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="space-y-4 rounded-[24px] border border-white/10 bg-white/[0.02] p-5">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-white/85">{title}</h3>
        {description ? <p className="mt-2 text-sm leading-6 text-white/55">{description}</p> : null}
      </div>
      {children}
    </section>
  )
}

function statusLabel(status: ProductStatus) {
  switch (status) {
    case "draft":
      return "Draft"
    case "hidden":
      return "Hidden"
    case "out_of_stock":
      return "Out of stock"
    default:
      return "Active"
  }
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
  onMoveImageBackward,
  onMoveImageForward,
  onRemoveExisting,
}: ProductFormCardProps) {
  const inventoryTone =
    productForm.status === "out_of_stock" || productForm.stock <= 0
      ? "border-red-400/20 bg-red-400/10 text-red-100"
      : productForm.stock <= productForm.lowStockThreshold
        ? "border-amber-300/20 bg-amber-300/10 text-amber-100"
        : "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"

  return (
    <form onSubmit={onSubmit} className="shop-card h-full space-y-5 p-6">
      <div className="flex flex-col gap-3 border-b border-white/8 pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-white/45">Catalogo</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            {isMultiEdit ? "Modifica prodotti" : editingProductId ? "Modifica prodotto" : "Nuovo prodotto"}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
            {isMultiEdit
              ? `Stai modificando ${selectedCount} prodotti selezionati. Aggiorna solo i campi che vuoi propagare davvero.`
              : "Organizza il prodotto in blocchi chiari: identità, merchandising, formati, disponibilità, media e contenuti."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/60">
            {statusLabel(productForm.status)}
          </span>
          <span className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em] ${inventoryTone}`}>
            {productForm.status === "out_of_stock" || productForm.stock <= 0
              ? "Esaurito"
              : productForm.stock <= productForm.lowStockThreshold
                ? "Low stock"
                : "Disponibile"}
          </span>
          {editingProductId && !isMultiEdit ? (
            <button type="button" onClick={onCancel} className="text-sm text-white/60 transition hover:text-white">
              Annulla modifica
            </button>
          ) : null}
        </div>
      </div>

      <Section
        title="Identita prodotto"
        description="I campi che definiscono il prodotto nel catalogo e nell’admin: titolo, SKU, stato e descrizione principale."
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div className="space-y-4">
            <input
              className="shop-input"
              placeholder="Titolo prodotto"
              aria-label="Titolo"
              value={productForm.title}
              onChange={(event) => onChange({ ...productForm, title: event.target.value })}
            />

            <textarea
              className="shop-textarea min-h-36 resize-none"
              placeholder="Descrizione prodotto"
              aria-label="Descrizione"
              value={productForm.description}
              onChange={(event) => onChange({ ...productForm, description: event.target.value })}
            />
          </div>

          <div className="space-y-4">
            <input
              className="shop-input"
              placeholder="SKU (opzionale)"
              aria-label="SKU"
              value={productForm.sku}
              disabled={isMultiEdit}
              onChange={(event) => onChange({ ...productForm, sku: event.target.value })}
            />

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

            <label className="flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/70">
              <input type="checkbox" checked={productForm.featured} onChange={(event) => onChange({ ...productForm, featured: event.target.checked })} />
              Metti in evidenza nel merchandising
            </label>
          </div>
        </div>
      </Section>

      <Section
        title="Taxonomy e merchandising"
        description="Categoria, collezioni e tag aiutano listing, filtri, collegamenti editoriali e prodotti correlati."
      >
        <div className="grid gap-4 xl:grid-cols-2">
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

          <input
            className="shop-input"
            placeholder="Tag separati da virgola"
            aria-label="Tag"
            value={productForm.tags}
            onChange={(event) => onChange({ ...productForm, tags: event.target.value })}
          />
        </div>

        <div className="rounded-2xl border border-white/10 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-white">Collezioni</p>
              <p className="mt-1 text-xs text-white/55">Usale per raggruppare il prodotto in percorsi editoriali e pagine dedicate.</p>
            </div>
            <span className="text-xs text-white/45">{productForm.collectionIds.length} selezionate</span>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {collections.length ? (
              collections.map((collection) => (
                <label key={collection.id} className="flex items-center gap-3 rounded-2xl border border-white/8 px-4 py-3 text-sm text-white/70">
                  <input
                    type="checkbox"
                    checked={productForm.collectionIds.includes(collection.id)}
                    onChange={(event) =>
                      onChange({
                        ...productForm,
                        collectionIds: event.target.checked
                          ? [...productForm.collectionIds, collection.id]
                          : productForm.collectionIds.filter((value) => value !== collection.id),
                      })
                    }
                  />
                  <span className="truncate">{collection.title}</span>
                </label>
              ))
            ) : (
              <p className="text-sm text-white/50">Nessuna collezione disponibile.</p>
            )}
          </div>
        </div>
      </Section>

      <Section
        title="Formati e prezzi"
        description="Mantiene stabile la logica attuale A3/A4, ma rende più leggibile cosa è acquistabile e a quale prezzo."
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div className="rounded-2xl border border-white/10 p-4">
            <p className="text-sm font-medium text-white">Formati disponibili</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <label className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-white/75">
                <input type="checkbox" checked={productForm.hasA4} onChange={(event) => onChange({ ...productForm, hasA4: event.target.checked })} />
                A4
              </label>
              <label className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-white/75">
                <input type="checkbox" checked={productForm.hasA3} onChange={(event) => onChange({ ...productForm, hasA3: event.target.checked })} />
                A3
              </label>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
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
            <input
              className="shop-input"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              placeholder="Costo interno"
              aria-label="Costo interno in euro"
              value={productForm.costPrice}
              onChange={(event) => onChange({ ...productForm, costPrice: event.target.value })}
            />
          </div>
        </div>
      </Section>

      <Section
        title="Disponibilita"
        description="Stock reale, soglia low stock e stato prodotto vengono mostrati con segnali più chiari anche nel catalogo pubblico."
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)]">
          <input
            className="shop-input"
            type="number"
            min="0"
            placeholder="Stock disponibile"
            aria-label="Stock disponibile"
            value={productForm.stock}
            onChange={(event) => onChange({ ...productForm, stock: Number(event.target.value) })}
          />
          <input
            className="shop-input"
            type="number"
            min="0"
            placeholder="Soglia low stock"
            aria-label="Soglia stock basso"
            value={productForm.lowStockThreshold}
            onChange={(event) => onChange({ ...productForm, lowStockThreshold: Number(event.target.value) })}
          />
          <div className={`rounded-2xl border px-4 py-3 text-sm ${inventoryTone}`}>
            <p className="font-medium">
              {productForm.status === "out_of_stock" || productForm.stock <= 0
                ? "Prodotto esaurito"
                : productForm.stock <= productForm.lowStockThreshold
                  ? "Prodotto quasi esaurito"
                  : "Prodotto disponibile"}
            </p>
            <p className="mt-1 opacity-80">
              {productForm.stock} pezzi a stock · soglia alert {productForm.lowStockThreshold}
            </p>
          </div>
        </div>
      </Section>

      <Section title="Badge prodotto">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-white/60">Mostrati nel catalogo pubblico solo se li salvi qui manualmente.</p>
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
                      const next = [...productForm.manualBadges]
                      ;[next[index + 1], next[index]] = [next[index], next[index + 1]]
                      onChange({ ...productForm, manualBadges: next })
                    }}
                  >
                    Giu
                  </Button>
                </div>

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
            ))}
          </div>
        ) : (
          <p className="text-sm text-white/50">Nessun badge manuale configurato.</p>
        )}
      </Section>

      {!isMultiEdit ? (
        <ProductMediaManager
          images={productImages}
          existingImageUrls={productForm.existingImageUrls}
          onFileChange={onFileChange}
          onMakePrimary={onMakePrimary}
          onMoveBackward={onMoveImageBackward}
          onMoveForward={onMoveImageForward}
          onRemoveExisting={onRemoveExisting}
        />
      ) : (
        <Section
          title="Media"
          description="La modifica multipla non tocca la gallery per evitare di sovrascrivere immagini o cover tra prodotti diversi."
        >
          <p className="text-sm text-white/50">Per cambiare cover o ordine immagini, apri il singolo prodotto in modifica dedicata.</p>
        </Section>
      )}

      <div className="flex flex-col gap-3 border-t border-white/8 pt-5 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-white/50">
          {isMultiEdit
            ? "La modifica multipla aggiorna solo i campi realmente toccati."
            : "Il salvataggio mantiene compatibilità con prodotti esistenti, immagini e formati A3/A4."}
        </p>
        <Button type="submit" disabled={!canSubmit} className="md:min-w-[16rem]">
          {editingProductId || isMultiEdit ? (isMultiEdit ? "Aggiorna prodotti" : "Aggiorna prodotto") : "Crea prodotto"}
        </Button>
      </div>
    </form>
  )
}
