import { useEffect, useMemo, useState, type FormEvent } from "react"

import { Button, getDangerButtonClassName } from "../../../components/Button"
import { AdminCollection, ShopProduct } from "../../types"
import { ConfirmActionModal } from "./ConfirmActionModal"

type CollectionFormState = {
  title: string
  slug: string
  description: string
  coverImageUrl: string
  promoText: string
  status: NonNullable<AdminCollection["status"]>
  launchAt: string
  active: boolean
  productIds: number[]
}

type AdminCollectionsSectionProps = {
  collections: AdminCollection[]
  products: ShopProduct[]
  collectionForm: CollectionFormState
  editingCollectionId: number | null
  coverPreviewUrl: string
  onCollectionFormChange: (next: CollectionFormState) => void
  onCoverFileChange: (files: FileList | null) => void
  onSaveCollection: (event: FormEvent) => void
  onResetCollectionForm: () => void
  onStartEditCollection: (collection: AdminCollection) => void
  onDeleteCollection: (collectionId: number) => void
  onReorderCollections: (collectionIds: number[]) => void
  isSavingOrder?: boolean
}

function statusLabel(status?: AdminCollection["status"]) {
  switch (status) {
    case "draft":
      return "Bozza"
    case "scheduled":
      return "Programmata"
    case "archived":
      return "Archiviata"
    default:
      return "Live"
  }
}

function formatLaunchDate(value?: string | null) {
  if (!value) return "Nessuna data"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Data non valida"
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function getProductImage(product: ShopProduct) {
  return product.coverImageUrl || product.imageUrls?.[0] || ""
}

export function AdminCollectionsSection({
  collections,
  products,
  collectionForm,
  editingCollectionId,
  coverPreviewUrl,
  onCollectionFormChange,
  onCoverFileChange,
  onSaveCollection,
  onResetCollectionForm,
  onStartEditCollection,
  onDeleteCollection,
  onReorderCollections,
  isSavingOrder = false,
}: AdminCollectionsSectionProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<AdminCollection | null>(null)
  const [positionDrafts, setPositionDrafts] = useState<Record<number, string>>({})
  const selectedProductIds = useMemo(
    () =>
      Array.from(
        new Set([
          ...collectionForm.productIds,
          ...products
            .filter((product) =>
              editingCollectionId
                ? (product.collections || []).some((collection) => collection.id === editingCollectionId)
                : false,
            )
            .map((product) => product.id),
        ]),
      ),
    [collectionForm.productIds, editingCollectionId, products],
  )
  const selectedProducts = useMemo(
    () => selectedProductIds.map((id) => products.find((product) => product.id === id)).filter((product): product is ShopProduct => Boolean(product)),
    [products, selectedProductIds],
  )
  const selectableProducts = useMemo(
    () => products.filter((product) => !selectedProductIds.includes(product.id)),
    [products, selectedProductIds],
  )
  const coverImage = coverPreviewUrl || collectionForm.coverImageUrl
  const orderedCollections = useMemo(
    () =>
      [...collections].sort(
        (left, right) =>
          (left.position ?? Number.MAX_SAFE_INTEGER) - (right.position ?? Number.MAX_SAFE_INTEGER) ||
          left.title.localeCompare(right.title, "it"),
      ),
    [collections],
  )

  useEffect(() => {
    setPositionDrafts(
      Object.fromEntries(orderedCollections.map((collection, index) => [collection.id, String(index + 1)])),
    )
  }, [orderedCollections])

  const normalizedCollectionIds = useMemo(() => {
    return orderedCollections
      .map((collection, index) => {
        const rawValue = positionDrafts[collection.id]
        const parsed = Number.parseInt(String(rawValue || ""), 10)
        return {
          collection,
          desiredPosition: Number.isInteger(parsed) && parsed > 0 ? parsed : index + 1,
          currentIndex: index,
        }
      })
      .sort((left, right) => left.desiredPosition - right.desiredPosition || left.currentIndex - right.currentIndex)
      .map((entry) => entry.collection.id)
  }, [orderedCollections, positionDrafts])

  const hasPendingOrderChanges = useMemo(
    () => normalizedCollectionIds.some((id, index) => id !== orderedCollections[index]?.id),
    [normalizedCollectionIds, orderedCollections],
  )

  function updateCollectionPosition(collectionId: number, value: string) {
    setPositionDrafts((current) => ({
      ...current,
      [collectionId]: value,
    }))
  }

  function applyCollectionOrder() {
    if (!normalizedCollectionIds.length || isSavingOrder) return
    setPositionDrafts(
      Object.fromEntries(normalizedCollectionIds.map((collectionId, index) => [collectionId, String(index + 1)])),
    )
    onReorderCollections(normalizedCollectionIds)
  }

  return (
    <section className="grid items-start gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <div className="shop-card space-y-5 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-white/45">Collezioni</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">{editingCollectionId ? "Modifica collezione" : "Nuova collezione"}</h2>
            <p className="mt-2 text-sm leading-6 text-white/55">
              Gestisci raccolte editoriali, lanci programmati, cover e prodotti assegnati in un unico sistema.
            </p>
          </div>
          {editingCollectionId ? (
            <button type="button" onClick={onResetCollectionForm} className="text-sm text-white/60 transition hover:text-white">
              Annulla
            </button>
          ) : null}
        </div>

        <form onSubmit={onSaveCollection} className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <input className="shop-input" placeholder="Titolo collezione" value={collectionForm.title} onChange={(event) => onCollectionFormChange({ ...collectionForm, title: event.target.value })} />
            <input className="shop-input" placeholder="Slug (opzionale)" value={collectionForm.slug} onChange={(event) => onCollectionFormChange({ ...collectionForm, slug: event.target.value })} />
          </div>
          <textarea className="shop-textarea min-h-28 resize-none" placeholder="Descrizione collezione" value={collectionForm.description} onChange={(event) => onCollectionFormChange({ ...collectionForm, description: event.target.value })} />
          <textarea className="shop-textarea min-h-20 resize-none" placeholder="Testo promo breve / lancio" value={collectionForm.promoText} onChange={(event) => onCollectionFormChange({ ...collectionForm, promoText: event.target.value })} />

          <div className="grid gap-3 md:grid-cols-2">
            <select className="shop-select" value={collectionForm.status} onChange={(event) => onCollectionFormChange({ ...collectionForm, status: event.target.value as CollectionFormState["status"] })}>
              <option value="draft">Bozza</option>
              <option value="scheduled">Programmata</option>
              <option value="live">Live</option>
              <option value="archived">Archiviata</option>
            </select>
            <input className="shop-input" type="datetime-local" value={collectionForm.launchAt} onChange={(event) => onCollectionFormChange({ ...collectionForm, launchAt: event.target.value })} />
          </div>

          <label className="flex items-center gap-3 rounded-lg border border-white/10 px-4 py-3 text-sm text-white/70">
            <input type="checkbox" checked={collectionForm.active} onChange={(event) => onCollectionFormChange({ ...collectionForm, active: event.target.checked })} />
            Collezione attiva nel sistema pubblico
          </label>

          <div className="rounded-lg border border-white/10 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-white">Cover collezione</p>
                <p className="mt-1 text-xs text-white/55">Usata nelle card e negli highlight editoriali.</p>
              </div>
              <label className="cursor-pointer rounded-lg border border-white/10 px-3 py-2 text-xs text-white/70 transition hover:border-white/25 hover:text-white">
                Carica immagine
                <input type="file" accept="image/*" className="sr-only" onChange={(event) => onCoverFileChange(event.target.files)} />
              </label>
            </div>
            {coverImage ? <img src={coverImage} alt="" className="mt-4 aspect-[16/9] w-full rounded-lg object-cover" /> : null}
          </div>

          <div className="rounded-lg border border-white/10 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-white">Prodotti assegnati</p>
                <p className="mt-1 text-xs text-white/55">{selectedProducts.length} prodotti nella collezione, unificati da prodotto e pannello collezione.</p>
              </div>
              <Button type="button" variant="profile" size="sm" onClick={() => setPickerOpen(true)}>
                Aggiungi prodotto
              </Button>
            </div>

            <div className="mt-4 space-y-2">
              {selectedProducts.map((product) => (
                <div key={product.id} className="flex items-center gap-3 rounded-lg border border-white/8 px-3 py-2">
                  {getProductImage(product) ? <img src={getProductImage(product)} alt="" className="h-12 w-12 rounded-lg object-cover" /> : <div className="h-12 w-12 rounded-lg bg-white/8" />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{product.title}</p>
                    <p className="text-xs text-white/45">{product.status === "draft" ? "Bozza" : "Pubblico/gestito da stato prodotto"}</p>
                  </div>
                  {collectionForm.productIds.includes(product.id) ? (
                    <button
                      type="button"
                      className="text-xs text-white/45 transition hover:text-white"
                      onClick={() => onCollectionFormChange({ ...collectionForm, productIds: collectionForm.productIds.filter((id) => id !== product.id) })}
                    >
                      Rimuovi
                    </button>
                  ) : (
                    <span className="text-xs text-white/35">Dal prodotto</span>
                  )}
                </div>
              ))}
              {!selectedProducts.length ? <p className="rounded-lg border border-dashed border-white/10 px-4 py-6 text-center text-sm text-white/45">Nessun prodotto assegnato.</p> : null}
            </div>
          </div>

          <Button type="submit" variant="cart" text={editingCollectionId ? "Aggiorna collezione" : "Crea collezione"}>
            {editingCollectionId ? "Aggiorna collezione" : "Crea collezione"}
          </Button>
        </form>
      </div>

      <div className="shop-card space-y-4 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Collezioni esistenti</h2>
            <p className="mt-1 text-sm text-white/55">Stato, uscita e prodotti collegati. Imposta una posizione numerica e applica il riordino.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60">{collections.length} collezioni</span>
            <Button type="button" variant="cart" size="sm" onClick={applyCollectionOrder} disabled={!hasPendingOrderChanges || isSavingOrder}>
              {isSavingOrder ? "Salvataggio..." : "Applica riordino"}
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {orderedCollections.map((collection) => (
            <article
              key={collection.id}
              className="rounded-lg border border-white/10 bg-white/[0.025] p-4 transition"
            >
              <div className="flex gap-4">
                {collection.coverImageUrl ? <img src={collection.coverImageUrl} alt="" draggable={false} className="h-20 w-20 rounded-lg object-cover" /> : <div className="h-20 w-20 rounded-lg bg-white/8" />}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate font-semibold text-white">{collection.title}</h3>
                    <span className="rounded-full border border-white/10 px-2 py-1 text-[11px] uppercase tracking-[0.18em] text-white/55">{statusLabel(collection.status)}</span>
                  </div>
                  <p className="mt-1 text-xs text-white/45">/{collection.slug} · {formatLaunchDate(collection.launchAt)}</p>
                  <p className="mt-1 text-sm text-white/55">{collection._count?.products || collection.products?.length || 0} prodotti · {collection.active ? "attiva" : "non attiva"}</p>
                </div>
                <label className="shrink-0 self-start rounded-2xl border border-white/10 bg-black/10 px-3 py-3 text-xs text-white/55">
                  <span className="block uppercase tracking-[0.18em] text-white/40">Posizione</span>
                  <input
                    type="number"
                    min="1"
                    inputMode="numeric"
                    value={positionDrafts[collection.id] || ""}
                    onChange={(event) => updateCollectionPosition(collection.id, event.target.value)}
                    className="shop-input mt-2 w-24"
                    disabled={isSavingOrder}
                  />
                </label>
              </div>
              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <Button type="button" variant="profile" size="sm" onClick={() => onStartEditCollection(collection)}>
                  Modifica
                </Button>
                <Button type="button" variant="profile" size="sm" className={getDangerButtonClassName({ size: "sm" })} onClick={() => setPendingDelete(collection)}>
                  Elimina
                </Button>
              </div>
            </article>
          ))}
          {!collections.length ? <p className="rounded-lg border border-dashed border-white/10 px-4 py-8 text-center text-sm text-white/50">Nessuna collezione creata.</p> : null}
        </div>
      </div>

      {pickerOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4" onClick={() => setPickerOpen(false)}>
          <div className="w-full max-w-3xl rounded-lg border border-white/10 bg-[#111] p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-white">Aggiungi prodotto alla collezione</h3>
                <p className="mt-1 text-sm text-white/50">Seleziona prodotti esistenti. La collezione gestisce il lancio editoriale.</p>
              </div>
              <button type="button" className="text-sm text-white/50 transition hover:text-white" onClick={() => setPickerOpen(false)}>
                Chiudi
              </button>
            </div>
            <div className="max-h-[62vh] overflow-y-auto pr-1 overscroll-contain">
              <div className="grid gap-3 sm:grid-cols-2">
                {selectableProducts.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.025] p-3 text-left transition hover:border-white/25"
                    onClick={() => {
                      onCollectionFormChange({ ...collectionForm, productIds: [...collectionForm.productIds, product.id] })
                    }}
                  >
                    {getProductImage(product) ? <img src={getProductImage(product)} alt="" className="h-14 w-14 rounded-lg object-cover" /> : <div className="h-14 w-14 rounded-lg bg-white/8" />}
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-white">{product.title}</span>
                  </button>
                ))}
              </div>
              {!selectableProducts.length ? <p className="rounded-lg border border-dashed border-white/10 px-4 py-8 text-center text-sm text-white/50">Nessun altro prodotto selezionabile.</p> : null}
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmActionModal
        open={Boolean(pendingDelete)}
        title="Elimina collezione"
        description="La collezione viene eliminata, i prodotti restano disponibili nel catalogo admin."
        onCancel={() => setPendingDelete(null)}
        onConfirm={async () => {
          if (!pendingDelete) return
          await onDeleteCollection(pendingDelete.id)
          setPendingDelete(null)
        }}
      />
    </section>
  )
}
