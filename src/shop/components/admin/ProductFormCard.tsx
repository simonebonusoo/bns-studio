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
  const activeVariants = safeVariants.filter((variant) => variant.isActive)
  const totalVariantStock = activeVariants.reduce((sum, variant) => sum + Number(variant.stock || 0), 0)
  const lowStockVariantCount = activeVariants.filter((variant) => variant.stock > 0 && variant.stock <= variant.lowStockThreshold).length
  const [variantPickerOpen, setVariantPickerOpen] = useState(false)
  const mainSizeRows = safeVariants.filter((variant) => !variant.variantProductId)
  const linkedVariantGroups = Array.from(
    safeVariants
      .filter((variant) => variant.variantProductId)
      .reduce((groups, variant) => {
        const key = String(variant.variantProductId)
        const current = groups.get(key) || []
        current.push(variant)
        groups.set(key, current)
        return groups
      }, new Map<string, ProductVariantFormState[]>())
  )
  const variantGroups: Array<[string, string[]]> = []
  const selectedVariantProductIds = new Set(safeVariants.map((variant) => variant.variantProductId).filter(Boolean))
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
    productForm.status === "out_of_stock" || totalVariantStock <= 0
      ? "border-red-400/20 bg-red-400/10 text-red-100"
      : lowStockVariantCount > 0
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
    const size = mainSizeRows.length ? "A3" : "A4"
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
      ? product.variants.filter((variant) => variant.isActive !== false)
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

  function renderMeasureRow(variant: ProductVariantFormState, index: number, compact = false) {
    return (
      <div key={`${variant.id ?? "new"}-${index}`} className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-3 lg:grid-cols-[minmax(110px,0.8fr)_minmax(100px,0.7fr)_minmax(110px,0.7fr)_minmax(110px,0.7fr)_auto]">
        <input
          className="shop-input"
          placeholder="Misura"
          value={variant.size}
          onChange={(event) => {
            const size = event.target.value
            updateVariant(index, {
              size,
              title: variant.variantProductId ? `${variant.variantProductTitle || variant.editionName} / ${size}` : size,
              key: slugifyVariantKey(`${variant.variantProductSlug || variant.editionName}-${size}`),
            })
          }}
        />
        <input
          className="shop-input"
          type="number"
          min="0"
          placeholder="Quantita"
          value={variant.stock}
          onChange={(event) => updateVariant(index, { stock: Number(event.target.value) })}
        />
        <input
          className="shop-input"
          type="number"
          min="0"
          step="0.01"
          placeholder="Prezzo"
          value={variant.price}
          onChange={(event) => updateVariant(index, { price: event.target.value })}
        />
        <input
          className="shop-input"
          type="number"
          min="0"
          placeholder="Soglia"
          value={variant.lowStockThreshold}
          onChange={(event) => updateVariant(index, { lowStockThreshold: Number(event.target.value) })}
        />
        <div className="flex items-center gap-2">
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
          <button type="button" onClick={() => removeVariantRow(index)} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/55 transition hover:border-red-300/30 hover:text-red-100">
            Rimuovi
          </button>
        </div>
        {!compact ? (
          <div className="lg:col-span-5 grid gap-3 md:grid-cols-3">
            <input className="shop-input" placeholder="SKU misura" value={variant.sku} onChange={(event) => updateVariant(index, { sku: event.target.value })} />
            <input className="shop-input" type="number" min="0" step="0.01" placeholder="Prezzo scontato" value={variant.discountPrice} onChange={(event) => updateVariant(index, { discountPrice: event.target.value })} />
            <input className="shop-input" type="number" min="0" step="0.01" placeholder="Costo produzione" value={variant.costPrice} onChange={(event) => updateVariant(index, { costPrice: event.target.value })} />
          </div>
        ) : null}
      </div>
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
                <p className="mt-1 opacity-80">Stock totale {totalVariantStock} · low stock {lowStockVariantCount}</p>
              </div>
              <Button type="button" variant="profile" size="sm" onClick={addMainSize}>
                Aggiungi misura
              </Button>
            </div>

            <div className="grid gap-2 text-[11px] uppercase tracking-[0.16em] text-white/45 lg:grid-cols-[minmax(110px,0.8fr)_minmax(100px,0.7fr)_minmax(110px,0.7fr)_minmax(110px,0.7fr)_auto]">
              <span>Nome misura</span>
              <span>Quantita</span>
              <span>Prezzo</span>
              <span>Soglia</span>
              <span>Stato</span>
            </div>
            <div className="space-y-3">
              {mainSizeRows.length ? (
                mainSizeRows.map((variant) => renderMeasureRow(variant, safeVariants.indexOf(variant)))
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
                            <p className="mt-1 text-xs text-white/45">{rows.length} misure disponibili</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onChange({ ...productForm, variants: safeVariants.filter((variant) => variant.variantProductId !== first.variantProductId) })}
                          className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/55 transition hover:border-red-300/30 hover:text-red-100"
                        >
                          Rimuovi variante
                        </button>
                      </div>

                      <div className="mt-4 space-y-3">
                        {rows.map((variant) => renderMeasureRow(variant, safeVariants.indexOf(variant), true))}
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

      {false ? (
        <Section
          title="Varianti e misure"
          description="Ogni riga è una misura acquistabile dentro una variante estetica. Esempio: Variante Black edition, Misura A4."
        >
          <div className="flex items-center justify-between gap-4">
            <div className={`rounded-2xl border px-4 py-3 text-sm ${inventoryTone}`}>
              <p className="font-medium">{activeVariants.length} varianti attive</p>
              <p className="mt-1 opacity-80">
                Stock totale {totalVariantStock} · varianti low stock {lowStockVariantCount}
              </p>
            </div>
            <Button
              type="button"
              variant="profile"
              size="sm"
              text="Aggiungi variante"
              onClick={() =>
                onChange({
                    ...productForm,
                    variants: [
                    ...safeVariants,
                    {
                      id: null,
                      title: `Standard / A4`,
                      key: `standard-a4-${safeVariants.length + 1}`,
                      editionName: "Standard",
                      size: "A4",
                      variantProductId: null,
                      variantProductTitle: "",
                      variantProductSlug: "",
                      variantProductImageUrl: "",
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
            >
              Aggiungi variante
            </Button>
          </div>

          {variantGroups.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {variantGroups.map(([editionName, sizes]) => (
                <div key={editionName} className="rounded-2xl border border-white/10 bg-white/[0.025] px-4 py-3">
                  <p className="text-sm font-medium text-white">{editionName}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {Array.from(new Set(sizes)).map((size) => (
                      <span key={size} className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/62">
                        {size}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          <div className="space-y-3">
            {safeVariants.map((variant, index) => (
              <div key={`${variant.id ?? "new"}-${index}`} className="rounded-[24px] border border-white/10 bg-white/[0.02] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-white">{variant.editionName || "Standard"} / {variant.size || variant.title || `Misura ${index + 1}`}</p>
                    {variant.isDefault ? (
                      <span className="rounded-full bg-[#e3f503] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-black">
                        Default
                      </span>
                    ) : null}
                    {!variant.isActive ? (
                      <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-white/55">
                        Inattiva
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="profile"
                      size="sm"
                      disabled={index === 0}
                      onClick={() => {
                        const next = [...productForm.variants]
                        ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
                        onChange({ ...productForm, variants: next })
                      }}
                    >
                      Su
                    </Button>
                    <Button
                      type="button"
                      variant="profile"
                      size="sm"
                      disabled={index === safeVariants.length - 1}
                      onClick={() => {
                        const next = [...productForm.variants]
                        ;[next[index + 1], next[index]] = [next[index], next[index + 1]]
                        onChange({ ...productForm, variants: next })
                      }}
                    >
                      Giu
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      text="Rimuovi"
                      onClick={() =>
                        onChange({
                          ...productForm,
                          variants: productForm.variants.filter((_, variantIndex) => variantIndex !== index),
                        })
                      }
                    >
                      Rimuovi
                    </Button>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-xs uppercase tracking-[0.18em] text-white/55">Nome variante estetica</span>
                    <input
                      className="shop-input"
                      placeholder="Black edition"
                      value={variant.editionName}
                      onChange={(event) =>
                        onChange({
                          ...productForm,
                          variants: productForm.variants.map((entry, entryIndex) =>
                            entryIndex === index ? { ...entry, editionName: event.target.value } : entry,
                          ),
                        })
                      }
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs uppercase tracking-[0.18em] text-white/55">Misura</span>
                    <input
                      className="shop-input"
                      placeholder="A4"
                      value={variant.size}
                      onChange={(event) =>
                        onChange({
                          ...productForm,
                          variants: productForm.variants.map((entry, entryIndex) =>
                            entryIndex === index ? { ...entry, size: event.target.value } : entry,
                          ),
                        })
                      }
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs uppercase tracking-[0.18em] text-white/55">Titolo tecnico riga</span>
                    <input
                      className="shop-input"
                      placeholder="Black edition / A4"
                      value={variant.title}
                      onChange={(event) =>
                        onChange({
                          ...productForm,
                          variants: productForm.variants.map((entry, entryIndex) =>
                            entryIndex === index ? { ...entry, title: event.target.value } : entry,
                          ),
                        })
                      }
                    />
                    <p className="text-xs leading-5 text-white/45">Può restare vuoto: verrà generato da variante e misura.</p>
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs uppercase tracking-[0.18em] text-white/55">Key tecnica</span>
                    <input
                      className="shop-input"
                      placeholder="black-edition-a4"
                      value={variant.key}
                      onChange={(event) =>
                        onChange({
                          ...productForm,
                          variants: productForm.variants.map((entry, entryIndex) =>
                            entryIndex === index ? { ...entry, key: event.target.value } : entry,
                          ),
                        })
                      }
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs uppercase tracking-[0.18em] text-white/55">SKU variante</span>
                    <input
                      className="shop-input"
                      placeholder="PRINT-A4"
                      value={variant.sku}
                      onChange={(event) =>
                        onChange({
                          ...productForm,
                          variants: productForm.variants.map((entry, entryIndex) =>
                            entryIndex === index ? { ...entry, sku: event.target.value } : entry,
                          ),
                        })
                      }
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs uppercase tracking-[0.18em] text-white/55">Prezzo di vendita (€)</span>
                    <input
                      className="shop-input"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="20"
                      value={variant.price}
                      onChange={(event) =>
                        onChange({
                          ...productForm,
                          variants: productForm.variants.map((entry, entryIndex) =>
                            entryIndex === index ? { ...entry, price: event.target.value } : entry,
                          ),
                        })
                      }
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs uppercase tracking-[0.18em] text-white/55">Prezzo scontato (€)</span>
                    <input
                      className="shop-input"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="15"
                      value={variant.discountPrice}
                      onChange={(event) =>
                        onChange({
                          ...productForm,
                          variants: productForm.variants.map((entry, entryIndex) =>
                            entryIndex === index ? { ...entry, discountPrice: event.target.value } : entry,
                          ),
                        })
                      }
                    />
                    <p className="text-xs leading-5 text-white/45">Lascialo vuoto se il prodotto non e in offerta.</p>
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs uppercase tracking-[0.18em] text-white/55">Costo produzione (€)</span>
                    <input
                      className="shop-input"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="10"
                      value={variant.costPrice}
                      onChange={(event) =>
                        onChange({
                          ...productForm,
                          variants: productForm.variants.map((entry, entryIndex) =>
                            entryIndex === index ? { ...entry, costPrice: event.target.value } : entry,
                          ),
                        })
                      }
                    />
                    <p className="text-xs leading-5 text-white/45">Usato per calcolare il guadagno netto su questa variante.</p>
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs uppercase tracking-[0.18em] text-white/55">Stock disponibile</span>
                    <input
                      className="shop-input"
                      type="number"
                      min="0"
                      placeholder="50"
                      value={variant.stock}
                      onChange={(event) =>
                        onChange({
                          ...productForm,
                          variants: productForm.variants.map((entry, entryIndex) =>
                            entryIndex === index ? { ...entry, stock: Number(event.target.value) } : entry,
                          ),
                        })
                      }
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs uppercase tracking-[0.18em] text-white/55">Soglia scorte basse</span>
                    <input
                      className="shop-input"
                      type="number"
                      min="0"
                      placeholder="5"
                      value={variant.lowStockThreshold}
                      onChange={(event) =>
                        onChange({
                          ...productForm,
                          variants: productForm.variants.map((entry, entryIndex) =>
                            entryIndex === index ? { ...entry, lowStockThreshold: Number(event.target.value) } : entry,
                          ),
                        })
                      }
                    />
                  </label>
                  <div className="flex flex-wrap gap-3">
                    <label className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-white/70">
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
                      Variante default
                    </label>
                    <label className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-white/70">
                      <input
                        type="checkbox"
                        checked={variant.isActive}
                        onChange={(event) =>
                          onChange({
                            ...productForm,
                            variants: productForm.variants.map((entry, entryIndex) =>
                              entryIndex === index ? { ...entry, isActive: event.target.checked } : entry,
                            ),
                          })
                        }
                      />
                      Variante attiva
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      ) : null}
      {false ? (
        <Section
          title="Varianti"
          description="La modifica multipla non tocca la matrice varianti per evitare di sovrascrivere prezzi, stock o SKU specifici di prodotto."
        >
          <p className="text-sm text-white/50">Per modificare varianti, prezzi o inventory specifica apri il singolo prodotto.</p>
        </Section>
      ) : null}

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
