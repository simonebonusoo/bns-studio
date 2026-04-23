import { useMemo, useState, type FormEvent, type ReactNode } from "react"

import { Button } from "../../../components/Button"
import { AdminCollection, ProductManualBadge, ProductStatus, ShopProduct } from "../../types"
import { ProductMediaManager } from "./ProductMediaManager"

type ProductVariantFormState = {
  id: number | null
  title: string
  key: string
  editionName: string
  size: string
  variantProductId: number | null
  variantProductTitle: string
  variantProductSlug: string
  variantProductImageUrl: string
  variantProductImageUrls: string[]
  sku: string
  price: string
  discountPrice: string
  costPrice: string
  stock: number
  lowStockThreshold: number
  isDefault: boolean
  isActive: boolean
}

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
  isCustomizable: boolean
  personalizationTextEnabled: boolean
  personalizationTextRequired: boolean
  personalizationTextLabel: string
  personalizationTextMaxChars: number
  personalizationImageEnabled: boolean
  personalizationImageRequired: boolean
  personalizationImageLabel: string
  personalizationImageInstructions: string
  featured: boolean
  stock: number
  lowStockThreshold: number
  status: ProductStatus
  existingImageUrls: string[]
  variants: ProductVariantFormState[]
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
  products: ShopProduct[]
  onSubmit: (event: FormEvent) => void
  onCancel: () => void
  onChange: (next: ProductFormState) => void
  onFileChange: (files: FileList | null) => void
  onReorderImages: (nextImages: string[]) => void
  onRemoveImage: (imageUrl: string) => void
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
      return "Bozza"
    case "hidden":
      return "Nascosto"
    case "out_of_stock":
      return "Esaurito"
    default:
      return "Attivo"
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
  products,
  onSubmit,
  onCancel,
  onChange,
  onFileChange,
  onReorderImages,
  onRemoveImage,
}: ProductFormCardProps) {
  const safeVariants = Array.isArray(productForm.variants) ? productForm.variants : []
  const safeManualBadges = Array.isArray(productForm.manualBadges) ? productForm.manualBadges : []
  const safeCollectionIds = Array.isArray(productForm.collectionIds) ? productForm.collectionIds : []
  const [variantPickerOpen, setVariantPickerOpen] = useState(false)
  const mainSizeRows = safeVariants.filter((variant) => !variant.variantProductId || variant.variantProductId === editingProductId)
  const linkedRows = safeVariants.filter((variant) => variant.variantProductId && variant.variantProductId !== editingProductId)
  const activeMainSizes = mainSizeRows.filter((variant) => variant.isActive)
  const totalMainStock = activeMainSizes.reduce((sum, variant) => sum + Number(variant.stock || 0), 0)
  const lowStockMainCount = activeMainSizes.filter((variant) => variant.stock > 0 && variant.stock <= variant.lowStockThreshold).length
  const linkedVariantGroups = Array.from(
    linkedRows
      .reduce((groups, variant) => {
        const key = String(variant.variantProductId)
        const current = groups.get(key) || []
        current.push(variant)
        groups.set(key, current)
        return groups
      }, new Map<string, ProductVariantFormState[]>())
  )
  const selectedVariantProductIds = new Set(linkedRows.map((variant) => variant.variantProductId).filter(Boolean))
  const selectableVariantProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          product.id !== editingProductId &&
          !selectedVariantProductIds.has(product.id) &&
          product.status !== "draft",
      ),
    [editingProductId, products, selectedVariantProductIds],
  )
  const inventoryTone =
    productForm.status === "out_of_stock" || totalMainStock <= 0
      ? "border-red-400/20 bg-red-400/10 text-red-100"
      : lowStockMainCount > 0
        ? "border-amber-300/20 bg-amber-300/10 text-amber-100"
        : "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"

  function slugifyVariantKey(value: string) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-{2,}/g, "-")
  }

  function formatCentsInput(value?: number | null) {
    const numeric = Number(value || 0)
    if (!Number.isFinite(numeric) || numeric <= 0) return ""
    return Number.isInteger(numeric / 100) ? String(numeric / 100) : (numeric / 100).toFixed(2)
  }

  function updateVariant(index: number, patch: Partial<ProductVariantFormState>) {
    onChange({
      ...productForm,
      variants: productForm.variants.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, ...patch } : entry,
      ),
    })
  }

  function removeVariantRow(index: number) {
    onChange({
      ...productForm,
      variants: productForm.variants.filter((_, variantIndex) => variantIndex !== index),
    })
  }

  function addMainSize() {
    const existingSizes = new Set(mainSizeRows.map((variant) => variant.size.trim().toUpperCase()).filter(Boolean))
    const size = !existingSizes.has("A4") ? "A4" : !existingSizes.has("A3") ? "A3" : `Misura ${mainSizeRows.length + 1}`
    onChange({
      ...productForm,
      variants: [
        ...safeVariants,
        {
          id: null,
          title: size,
          key: slugifyVariantKey(size),
          editionName: "Standard",
          size,
          variantProductId: null,
          variantProductTitle: "",
          variantProductSlug: "",
          variantProductImageUrl: "",
          variantProductImageUrls: [],
          sku: "",
          price: "",
          discountPrice: "",
          costPrice: "",
          stock: 0,
          lowStockThreshold: 5,
          isDefault: safeVariants.length === 0,
          isActive: true,
        },
      ],
    })
  }

  function addLinkedVariant(product: ShopProduct) {
    const sourceVariants = Array.isArray(product.variants) && product.variants.length
      ? product.variants.filter((variant) => variant.isActive !== false && (!variant.variantProductId || variant.variantProductId === product.id))
      : []
    const rows = (sourceVariants.length ? sourceVariants : [{
      title: "A4",
      key: "a4",
      size: "A4",
      price: product.priceA4 ?? product.price,
      discountPrice: product.discountPriceA4 ?? product.discountPrice ?? null,
      costPrice: product.costPrice ?? 0,
      stock: product.stock ?? 0,
      lowStockThreshold: product.lowStockThreshold ?? 5,
      sku: product.sku || "",
    }]).map((variant, index) => {
      const size = String(variant.size || variant.title || `Misura ${index + 1}`).trim()
      const editionName = product.title
      return {
        id: null,
        title: `${editionName} / ${size}`,
        key: slugifyVariantKey(`${product.slug || product.id}-${size}`) || `variant-${product.id}-${index + 1}`,
        editionName,
        size,
        variantProductId: product.id,
        variantProductTitle: product.title,
        variantProductSlug: product.slug,
        variantProductImageUrl: product.coverImageUrl || product.imageUrls?.[0] || "",
        variantProductImageUrls: product.imageUrls || [],
        sku: variant.sku || "",
        price: formatCentsInput(variant.price ?? product.price),
        discountPrice: formatCentsInput(variant.discountPrice ?? product.discountPrice ?? null),
        costPrice: formatCentsInput(variant.costPrice ?? product.costPrice ?? 0),
        stock: Number(variant.stock ?? product.stock ?? 0),
        lowStockThreshold: Number(variant.lowStockThreshold ?? product.lowStockThreshold ?? 5),
        isDefault: safeVariants.length === 0 && index === 0,
        isActive: true,
      }
    })

    onChange({ ...productForm, variants: [...safeVariants, ...rows] })
    setVariantPickerOpen(false)
  }

  function addLinkedVariantSize(sourceRow: ProductVariantFormState) {
    const siblingRows = linkedRows.filter((variant) => variant.variantProductId === sourceRow.variantProductId)
    const existingSizes = new Set(siblingRows.map((variant) => variant.size.trim().toUpperCase()).filter(Boolean))
    const size = !existingSizes.has("A4") ? "A4" : !existingSizes.has("A3") ? "A3" : `Misura ${siblingRows.length + 1}`

    onChange({
      ...productForm,
      variants: [
        ...safeVariants,
        {
          id: null,
          title: `${sourceRow.variantProductTitle || sourceRow.editionName} / ${size}`,
          key: slugifyVariantKey(`${sourceRow.variantProductSlug || sourceRow.variantProductId}-${size}`),
          editionName: sourceRow.editionName || sourceRow.variantProductTitle,
          size,
          variantProductId: sourceRow.variantProductId,
          variantProductTitle: sourceRow.variantProductTitle,
          variantProductSlug: sourceRow.variantProductSlug,
          variantProductImageUrl: sourceRow.variantProductImageUrl,
          variantProductImageUrls: sourceRow.variantProductImageUrls,
          sku: "",
          price: "",
          discountPrice: "",
          costPrice: "",
          stock: 0,
          lowStockThreshold: sourceRow.lowStockThreshold || 5,
          isDefault: false,
          isActive: true,
        },
      ],
    })
  }

  function renderSizeCard(variant: ProductVariantFormState, index: number, ownerLabel: string, compact = false) {
    const updateSize = (size: string) => {
      updateVariant(index, {
        size,
        title: variant.variantProductId && variant.variantProductId !== editingProductId ? `${ownerLabel} / ${size}` : size,
        key: slugifyVariantKey(`${variant.variantProductSlug || ownerLabel}-${size}`),
      })
    }

    return (
      <article key={`${variant.id ?? "new"}-${index}`} className="rounded-xl border border-white/10 bg-black/15 p-3">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(112px,0.75fr)_minmax(96px,0.55fr)_minmax(104px,0.58fr)_minmax(104px,0.58fr)]">
          <label className="space-y-1.5">
            <span className="text-[10px] uppercase tracking-[0.16em] text-white/45">Misura</span>
            <input className="shop-input" placeholder="A4" value={variant.size} onChange={(event) => updateSize(event.target.value)} />
          </label>
          <label className="space-y-1.5">
            <span className="text-[10px] uppercase tracking-[0.16em] text-white/45">Quantita</span>
            <input className="shop-input" type="number" min="0" value={variant.stock} onChange={(event) => updateVariant(index, { stock: Number(event.target.value) })} />
          </label>
          <label className="space-y-1.5">
            <span className="text-[10px] uppercase tracking-[0.16em] text-white/45">Prezzo</span>
            <input className="shop-input" type="number" min="0" step="0.01" value={variant.price} onChange={(event) => updateVariant(index, { price: event.target.value })} />
          </label>
          <label className="space-y-1.5">
            <span className="text-[10px] uppercase tracking-[0.16em] text-white/45">Soglia</span>
            <input className="shop-input" type="number" min="0" value={variant.lowStockThreshold} onChange={(event) => updateVariant(index, { lowStockThreshold: Number(event.target.value) })} />
          </label>
        </div>

        <div className={`mt-3 grid gap-3 ${compact ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
          <label className="space-y-1.5">
            <span className="text-[10px] uppercase tracking-[0.16em] text-white/45">SKU misura</span>
            <input className="shop-input" placeholder="SKU" value={variant.sku} onChange={(event) => updateVariant(index, { sku: event.target.value })} />
          </label>
          <label className="space-y-1.5">
            <span className="text-[10px] uppercase tracking-[0.16em] text-white/45">Prezzo scontato</span>
            <input className="shop-input" type="number" min="0" step="0.01" placeholder="Opzionale" value={variant.discountPrice} onChange={(event) => updateVariant(index, { discountPrice: event.target.value })} />
          </label>
          {!compact ? (
            <label className="space-y-1.5">
              <span className="text-[10px] uppercase tracking-[0.16em] text-white/45">Costo produzione</span>
              <input className="shop-input" type="number" min="0" step="0.01" placeholder="Opzionale" value={variant.costPrice} onChange={(event) => updateVariant(index, { costPrice: event.target.value })} />
            </label>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-3">
          <div className="flex flex-wrap gap-2">
            <label className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-white/65">
              <input
                type="checkbox"
                checked={variant.isDefault}
                onChange={() =>
                  onChange({
                    ...productForm,
                    variants: productForm.variants.map((entry, entryIndex) => ({
                      ...entry,
                      isDefault: entryIndex === index,
                    })),
                  })
                }
              />
              Default
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-white/65">
              <input
                type="checkbox"
                checked={variant.isActive}
                onChange={(event) => updateVariant(index, { isActive: event.target.checked })}
              />
              Attiva
            </label>
          </div>
          <button type="button" onClick={() => removeVariantRow(index)} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/55 transition hover:border-red-300/30 hover:text-red-100">
            Rimuovi misura
          </button>
        </div>
      </article>
    )
  }

  return (
    <form onSubmit={onSubmit} className="shop-card space-y-5 p-6">
      <div className="flex flex-col gap-3 border-b border-white/8 pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-white/45">Catalogo</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            {isMultiEdit ? "Modifica prodotti" : editingProductId ? "Modifica prodotto" : "Nuovo prodotto"}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
            {isMultiEdit
              ? `Stai modificando ${selectedCount} prodotti selezionati. Aggiorna solo i campi prodotto che vuoi propagare davvero.`
              : "Ora il prodotto distingue meglio dati generali e varianti: merchandising, media, inventory e pricing restano leggibili e più vicini a un backoffice ecommerce reale."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {editingProductId && !isMultiEdit ? (
            <button type="button" onClick={onCancel} className="text-sm text-white/60 transition hover:text-white">
              Annulla modifica
            </button>
          ) : null}
        </div>
      </div>

      <Section
        title="Identita prodotto"
        description="Titolo, descrizione, SKU master e stato generale del prodotto restano separati dalle varianti."
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
              placeholder="SKU prodotto (opzionale)"
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
              <option value="active">Attivo</option>
              <option value="draft">Bozza</option>
              <option value="hidden">Nascosto</option>
              <option value="out_of_stock">Esaurito</option>
            </select>

            <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-white/45">Personalizzazione</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {[
                  { value: false, label: "No" },
                  { value: true, label: "Sì" },
                ].map((option) => (
                  <button
                    key={String(option.value)}
                    type="button"
                    onClick={() => onChange({ ...productForm, isCustomizable: option.value })}
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      productForm.isCustomizable === option.value
                        ? "border-[#e3f503]/50 bg-[#e3f503]/12 text-[#eef879]"
                        : "border-white/10 text-white/62 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {productForm.isCustomizable ? (
                <div className="mt-4 space-y-4 border-t border-white/10 pt-4">
                  <div className="rounded-2xl border border-white/10 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-white">Personalizzazione testo</p>
                        <p className="mt-1 text-xs text-white/55">Configura copy, obbligatorietà e limite caratteri.</p>
                      </div>
                      <label className="flex items-center gap-2 text-xs text-white/65">
                        <input
                          type="checkbox"
                          checked={productForm.personalizationTextEnabled}
                          onChange={(event) =>
                            onChange({
                              ...productForm,
                              personalizationTextEnabled: event.target.checked,
                              personalizationTextRequired: event.target.checked ? productForm.personalizationTextRequired : false,
                            })
                          }
                        />
                        Attiva
                      </label>
                    </div>
                    {productForm.personalizationTextEnabled ? (
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <label className="space-y-1.5 md:col-span-2">
                          <span className="text-[10px] uppercase tracking-[0.16em] text-white/45">Label utente</span>
                          <input
                            className="shop-input"
                            placeholder="Inserisci il nome o il testo breve da usare per la personalizzazione"
                            value={productForm.personalizationTextLabel}
                            onChange={(event) => onChange({ ...productForm, personalizationTextLabel: event.target.value })}
                          />
                        </label>
                        <label className="space-y-1.5">
                          <span className="text-[10px] uppercase tracking-[0.16em] text-white/45">Max caratteri</span>
                          <input
                            className="shop-input"
                            type="number"
                            min="1"
                            max="200"
                            value={productForm.personalizationTextMaxChars}
                            onChange={(event) => onChange({ ...productForm, personalizationTextMaxChars: Number(event.target.value || 50) })}
                          />
                        </label>
                        <label className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-white/65">
                          <input
                            type="checkbox"
                            checked={productForm.personalizationTextRequired}
                            onChange={(event) => onChange({ ...productForm, personalizationTextRequired: event.target.checked })}
                          />
                          Testo obbligatorio
                        </label>
                      </div>
                    ) : null}
                  </div>

                  <div className="rounded-2xl border border-white/10 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-white">Personalizzazione immagine</p>
                        <p className="mt-1 text-xs text-white/55">Consente il caricamento di un’immagine da parte del cliente.</p>
                      </div>
                      <label className="flex items-center gap-2 text-xs text-white/65">
                        <input
                          type="checkbox"
                          checked={productForm.personalizationImageEnabled}
                          onChange={(event) =>
                            onChange({
                              ...productForm,
                              personalizationImageEnabled: event.target.checked,
                              personalizationImageRequired: event.target.checked ? productForm.personalizationImageRequired : false,
                            })
                          }
                        />
                        Attiva
                      </label>
                    </div>
                    {productForm.personalizationImageEnabled ? (
                      <div className="mt-4 grid gap-3">
                        <label className="space-y-1.5">
                          <span className="text-[10px] uppercase tracking-[0.16em] text-white/45">Label upload</span>
                          <input
                            className="shop-input"
                            placeholder="Carica un’immagine da usare per adattare il poster"
                            value={productForm.personalizationImageLabel}
                            onChange={(event) => onChange({ ...productForm, personalizationImageLabel: event.target.value })}
                          />
                        </label>
                        <label className="space-y-1.5">
                          <span className="text-[10px] uppercase tracking-[0.16em] text-white/45">Istruzioni utente</span>
                          <textarea
                            className="shop-textarea min-h-24 resize-none"
                            placeholder="Spiega come verrà usata l’immagine caricata."
                            value={productForm.personalizationImageInstructions}
                            onChange={(event) => onChange({ ...productForm, personalizationImageInstructions: event.target.value })}
                          />
                        </label>
                        <label className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-white/65">
                          <input
                            type="checkbox"
                            checked={productForm.personalizationImageRequired}
                            onChange={(event) => onChange({ ...productForm, personalizationImageRequired: event.target.checked })}
                          />
                          Immagine obbligatoria
                        </label>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>

          </div>
        </div>
      </Section>

      <Section
        title="Taxonomy e merchandising"
        description="Categoria, collezioni e tag restano a livello prodotto per listing, filtri e percorsi editoriali."
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
              <p className="mt-1 text-xs text-white/55">Servono a raggruppare il prodotto in percorsi trasversali e temi editoriali.</p>
            </div>
            <span className="text-xs text-white/45">{safeCollectionIds.length} selezionate</span>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {collections.length ? (
              collections.map((collection) => (
                <label key={collection.id} className="flex items-center gap-3 rounded-2xl border border-white/8 px-4 py-3 text-sm text-white/70">
                  <input
                    type="checkbox"
                    checked={safeCollectionIds.includes(collection.id)}
                    onChange={(event) =>
                      onChange({
                        ...productForm,
                        collectionIds: event.target.checked
                          ? [...safeCollectionIds, collection.id]
                          : safeCollectionIds.filter((value) => value !== collection.id),
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

      {!isMultiEdit ? (
        <>
          <Section
            title="Misure"
            description="Misure del prodotto principale, con quantita e prezzo per ogni formato."
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className={`rounded-lg border px-4 py-3 text-sm ${inventoryTone}`}>
                <p className="font-medium">{mainSizeRows.filter((variant) => variant.isActive).length} misure attive</p>
                <p className="mt-1 opacity-80">Stock totale {totalMainStock} · low stock {lowStockMainCount}</p>
              </div>
              <Button type="button" variant="profile" size="sm" onClick={addMainSize}>
                Aggiungi misura
              </Button>
            </div>

            <div className="space-y-3">
              {mainSizeRows.length ? (
                mainSizeRows.map((variant) => renderSizeCard(variant, safeVariants.indexOf(variant), productForm.title || "Prodotto principale"))
              ) : (
                <p className="rounded-lg border border-dashed border-white/10 px-4 py-6 text-sm text-white/50">Nessuna misura configurata per il prodotto principale.</p>
              )}
            </div>
          </Section>

          <Section
            title="Varianti"
            description="Le varianti sono altri prodotti esistenti. Quando salvi, i prodotti scelti restano in admin ma spariscono dal catalogo pubblico come articoli singoli."
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-white/55">{linkedVariantGroups.length} prodotti collegati come varianti.</p>
              <Button type="button" variant="profile" size="sm" onClick={() => setVariantPickerOpen(true)}>
                Aggiungi variante
              </Button>
            </div>

            <div className="space-y-4">
              {linkedVariantGroups.length ? (
                linkedVariantGroups.map(([groupId, rows]) => {
                  const first = rows[0]
                  const activeRows = rows.filter((variant) => variant.isActive)
                  const totalStock = activeRows.reduce((sum, variant) => sum + Number(variant.stock || 0), 0)
                  return (
                    <article key={groupId} className="rounded-lg border border-white/10 bg-white/[0.025] p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          {first.variantProductImageUrl ? (
                            <img src={first.variantProductImageUrl} alt="" className="h-14 w-14 rounded-lg object-cover" />
                          ) : (
                            <span className="h-14 w-14 rounded-lg border border-white/10 bg-white/[0.04]" />
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">{first.variantProductTitle || first.editionName}</p>
                            <p className="mt-1 text-xs text-white/45">{rows.length} misure · stock {totalStock}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-xs text-emerald-100">
                            Collegata
                          </span>
                          <button
                            type="button"
                            onClick={() => addLinkedVariantSize(first)}
                            className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/65 transition hover:border-white/25 hover:text-white"
                          >
                            Aggiungi misura
                          </button>
                          <button
                            type="button"
                            onClick={() => onChange({ ...productForm, variants: safeVariants.filter((variant) => variant.variantProductId !== first.variantProductId) })}
                            className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/55 transition hover:border-red-300/30 hover:text-red-100"
                          >
                            Rimuovi variante
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 space-y-3">
                        {rows.map((variant) => renderSizeCard(variant, safeVariants.indexOf(variant), first.variantProductTitle || first.editionName || "Variante", true))}
                      </div>
                    </article>
                  )
                })
              ) : (
                <p className="rounded-lg border border-dashed border-white/10 px-4 py-6 text-sm text-white/50">Nessuna variante collegata.</p>
              )}
            </div>

            {variantPickerOpen ? (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm">
                <div className="max-h-[86vh] w-full max-w-3xl overflow-hidden rounded-lg border border-white/10 bg-[#0b0b0c] shadow-2xl">
                  <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
                    <h3 className="text-base font-semibold text-white">Aggiungi variante</h3>
                    <button type="button" onClick={() => setVariantPickerOpen(false)} className="text-sm text-white/55 transition hover:text-white">
                      Chiudi
                    </button>
                  </div>
                  <div className="max-h-[70vh] overflow-y-auto p-5">
                    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                      {selectableVariantProducts.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => addLinkedVariant(product)}
                          className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.025] text-left transition hover:border-white/25 hover:bg-white/[0.05]"
                        >
                          <img src={product.coverImageUrl || product.imageUrls?.[0] || ""} alt="" className="aspect-[4/3] w-full object-cover" />
                          <span className="block truncate px-3 py-3 text-sm font-medium text-white">{product.title}</span>
                        </button>
                      ))}
                    </div>
                    {!selectableVariantProducts.length ? (
                      <p className="rounded-lg border border-dashed border-white/10 px-4 py-8 text-center text-sm text-white/50">Nessun prodotto selezionabile.</p>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}
          </Section>
        </>
      ) : (
        <Section
          title="Misure e varianti"
          description="La modifica multipla non tocca misure e varianti per evitare di sovrascrivere prezzi, stock o collegamenti prodotto."
        >
          <p className="text-sm text-white/50">Per modificare misure e varianti apri il singolo prodotto.</p>
        </Section>
      )}

      <Section title="Badge prodotto">
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm text-white/60">Aggiungi solo le etichette che vuoi davvero mostrare nel catalogo.</div>
            <Button
              type="button"
              size="sm"
              text="Aggiungi badge"
              onClick={() =>
                onChange({
                  ...productForm,
                manualBadges: [
                  ...safeManualBadges,
                  { id: `manual-${Date.now()}`, label: "", enabled: true },
                ],
              })
            }
          >
            Aggiungi badge
          </Button>
        </div>

        {safeManualBadges.length ? (
          <div className="space-y-3">
            {safeManualBadges.map((badge, index) => (
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
                        manualBadges: safeManualBadges.map((entry) =>
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
                          manualBadges: safeManualBadges.map((entry) =>
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
                      const next = [...safeManualBadges]
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
                    disabled={index === safeManualBadges.length - 1}
                    onClick={() => {
                      const next = [...safeManualBadges]
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
                      manualBadges: safeManualBadges.filter((entry) => entry.id !== badge.id),
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
          onFileChange={onFileChange}
          onReorder={onReorderImages}
          onRemoveImage={onRemoveImage}
        />
      ) : (
        <Section
          title="Media"
          description="La modifica multipla non tocca la gallery per evitare di sovrascrivere cover o immagini tra prodotti diversi."
        >
          <p className="text-sm text-white/50">Per cambiare cover o ordine immagini, apri il singolo prodotto in modifica dedicata.</p>
        </Section>
      )}

      <div className="flex flex-col gap-3 border-t border-white/8 pt-5 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-white/50">
          {isMultiEdit
            ? "La modifica multipla aggiorna solo i campi prodotto realmente toccati."
            : "Varianti, immagini e contenuto prodotto restano compatibili con il catalogo già in produzione e con i dati legacy A3/A4."}
        </p>
        <Button type="submit" disabled={!canSubmit} className="md:min-w-[16rem]">
          {editingProductId || isMultiEdit ? (isMultiEdit ? "Aggiorna prodotti" : "Aggiorna prodotto") : "Crea prodotto"}
        </Button>
      </div>
    </form>
  )
}
