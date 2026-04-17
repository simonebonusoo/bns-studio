import { useEffect, useState, type FormEvent, type SyntheticEvent } from "react"
import { Link } from "react-router-dom"

import { Button, getDangerButtonClassName } from "../../../components/Button"
import { apiFetch } from "../../lib/api"
import { ShopDrop, ShopProduct } from "../../types"
import { ConfirmActionModal } from "./ConfirmActionModal"

type DropFormState = {
  title: string
  slug: string
  shortDescription: string
  description: string
  coverImageUrl: string
  status: ShopDrop["status"]
  launchAt: string
  visible: boolean
  label: string
  productIds: number[]
}

type Props = {
  drops: ShopDrop[]
  products: ShopProduct[]
  dropForm: DropFormState
  editingDropId: number | null
  coverPreviewUrl: string
  onDropFormChange: (next: DropFormState) => void
  onCoverFileChange: (files: FileList | null) => void
  onSaveDrop: (event: FormEvent) => void
  onResetDropForm: () => void
  onStartEditDrop: (drop: ShopDrop) => void
  onDeleteDrop: (dropId: number) => void
}

function formatDropDate(value?: string | null) {
  if (!value) return "Data non impostata"
  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function getStatusLabel(status: ShopDrop["status"]) {
  if (status === "scheduled") return "Programmato"
  if (status === "live") return "Live"
  if (status === "archived") return "Archiviato"
  return "Bozza"
}

function getDropProductBadge(product: ShopProduct, dropStatus: ShopDrop["status"]) {
  if (product.status === "draft") return dropStatus === "live" ? "Pubblicazione al salvataggio" : "Bozza nel drop"
  if (product.status === "active") return "Live"
  return product.status
}

export function AdminDropsSection({
  drops,
  products,
  dropForm,
  editingDropId,
  coverPreviewUrl,
  onDropFormChange,
  onCoverFileChange,
  onSaveDrop,
  onResetDropForm,
  onStartEditDrop,
  onDeleteDrop,
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<ShopDrop | null>(null)
  const [assignableProducts, setAssignableProducts] = useState<ShopProduct[]>([])
  const [assignableLoading, setAssignableLoading] = useState(false)
  const [assignableError, setAssignableError] = useState("")
  const selectedProducts = products.filter((product) => dropForm.productIds.includes(product.id))
  const selectableProducts = assignableProducts.filter((product) => {
    if (dropForm.productIds.includes(product.id)) return false
    if (product.status !== "draft") return false
    if (product.dropId && product.dropId !== editingDropId) return false
    return true
  })
  const coverImage = coverPreviewUrl || dropForm.coverImageUrl

  useEffect(() => {
    if (!pickerOpen) return
    const previousOverflow = document.body.style.overflow
    const previousOverscroll = document.body.style.overscrollBehavior
    document.body.style.overflow = "hidden"
    document.body.style.overscrollBehavior = "contain"
    return () => {
      document.body.style.overflow = previousOverflow
      document.body.style.overscrollBehavior = previousOverscroll
    }
  }, [pickerOpen])

  useEffect(() => {
    if (!pickerOpen) return
    let cancelled = false
    const params = new URLSearchParams()
    if (editingDropId) params.set("dropId", String(editingDropId))
    setAssignableLoading(true)
    setAssignableError("")
    apiFetch<ShopProduct[]>(`/admin/drops/assignable-products?${params.toString()}`)
      .then((data) => {
        if (cancelled) return
        setAssignableProducts(Array.isArray(data) ? data.filter((product) => product.status === "draft") : [])
      })
      .catch((err) => {
        if (cancelled) return
        setAssignableProducts([])
        setAssignableError(err instanceof Error ? err.message : "Impossibile caricare le bozze assegnabili.")
      })
      .finally(() => {
        if (!cancelled) setAssignableLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [editingDropId, pickerOpen])

  function containModalScroll(event: SyntheticEvent<HTMLElement>) {
    event.stopPropagation()
  }

  function toggleProduct(productId: number, checked: boolean) {
    onDropFormChange({
      ...dropForm,
      productIds: checked
        ? Array.from(new Set([...dropForm.productIds, productId]))
        : dropForm.productIds.filter((id) => id !== productId),
    })
  }

  return (
    <section className="grid items-start gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
      <form onSubmit={onSaveDrop} className="shop-card space-y-5 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/8 pb-5">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-white/45">Drop</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">{editingDropId ? "Modifica drop" : "Nuovo drop"}</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/55">
              Crea un lancio editoriale, assegna poster esistenti e controlla quando diventano pubblici.
            </p>
          </div>
          {editingDropId ? (
            <button type="button" onClick={onResetDropForm} className="text-sm text-white/60 transition hover:text-white">
              Annulla modifica
            </button>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <input
            className="shop-input"
            placeholder="Titolo drop"
            value={dropForm.title}
            onChange={(event) => onDropFormChange({ ...dropForm, title: event.target.value })}
            required
          />
          <input
            className="shop-input"
            placeholder="Slug opzionale"
            value={dropForm.slug}
            onChange={(event) => onDropFormChange({ ...dropForm, slug: event.target.value })}
          />
        </div>

        <textarea
          className="shop-textarea min-h-24 resize-none"
          placeholder="Descrizione breve"
          value={dropForm.shortDescription}
          onChange={(event) => onDropFormChange({ ...dropForm, shortDescription: event.target.value })}
        />

        <textarea
          className="shop-textarea min-h-32 resize-none"
          placeholder="Descrizione estesa"
          value={dropForm.description}
          onChange={(event) => onDropFormChange({ ...dropForm, description: event.target.value })}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <select
            className="shop-select"
            value={dropForm.status}
            onChange={(event) => onDropFormChange({ ...dropForm, status: event.target.value as ShopDrop["status"] })}
          >
            <option value="draft">Bozza</option>
            <option value="scheduled">Programmato</option>
            <option value="live">Live</option>
            <option value="archived">Archiviato</option>
          </select>
          <input
            className="shop-input"
            type="datetime-local"
            value={dropForm.launchAt}
            onChange={(event) => onDropFormChange({ ...dropForm, launchAt: event.target.value })}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <input
            className="shop-input"
            placeholder="Label, es. Live now"
            value={dropForm.label}
            onChange={(event) => onDropFormChange({ ...dropForm, label: event.target.value })}
          />
          <label className="flex items-center gap-3 rounded-lg border border-white/10 px-4 py-3 text-sm text-white/70">
            <input
              type="checkbox"
              checked={dropForm.visible}
              onChange={(event) => onDropFormChange({ ...dropForm, visible: event.target.checked })}
            />
            Visibile quando lo stato lo permette
          </label>
        </div>

        <div className="rounded-lg border border-white/10 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-white">Cover drop</p>
              <p className="mt-1 text-xs text-white/55">Immagine hero usata nella card e nella pagina drop.</p>
            </div>
            <label className="cursor-pointer rounded-lg border border-white/10 px-3 py-2 text-xs text-white/70 transition hover:border-white/25 hover:text-white">
              Carica cover
              <input type="file" accept="image/*" className="sr-only" onChange={(event) => onCoverFileChange(event.target.files)} />
            </label>
          </div>
          {coverImage ? (
            <img src={coverImage} alt="" className="aspect-[16/9] w-full rounded-lg object-cover" />
          ) : (
            <div className="flex aspect-[16/9] items-center justify-center rounded-lg border border-dashed border-white/10 text-sm text-white/45">
              Nessuna cover
            </div>
          )}
        </div>

        <div className="rounded-lg border border-white/10 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-white">Prodotti assegnati</p>
              <p className="mt-1 text-xs text-white/55">{selectedProducts.length} poster nel drop. Solo prodotti in bozza possono essere aggiunti; al live vengono pubblicati insieme.</p>
            </div>
            <Button type="button" variant="profile" size="sm" onClick={() => setPickerOpen(true)}>
              Aggiungi prodotto al drop
            </Button>
          </div>
          <div className="space-y-2">
            {selectedProducts.map((product, index) => (
              <div key={product.id} className="grid gap-3 rounded-lg border border-white/8 p-3 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
                <img src={product.coverImageUrl || product.imageUrls?.[0] || ""} alt="" className="h-14 w-14 rounded-lg object-cover" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{product.title}</p>
                  <p className="text-xs text-white/45">Posizione {index + 1}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-lg border border-white/10 px-2 py-1 text-[11px] text-white/55">
                      {getDropProductBadge(product, dropForm.status)}
                    </span>
                    {product.status === "draft" ? (
                      <span className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 px-2 py-1 text-[11px] text-emerald-100">
                        Pubblicazione al lancio
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => {
                      const next = [...dropForm.productIds]
                      ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
                      onDropFormChange({ ...dropForm, productIds: next })
                    }}
                    className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/60 disabled:opacity-35"
                  >
                    Su
                  </button>
                  <button
                    type="button"
                    disabled={index === selectedProducts.length - 1}
                    onClick={() => {
                      const next = [...dropForm.productIds]
                      ;[next[index + 1], next[index]] = [next[index], next[index + 1]]
                      onDropFormChange({ ...dropForm, productIds: next })
                    }}
                    className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/60 disabled:opacity-35"
                  >
                    Giu
                  </button>
                  <button type="button" onClick={() => toggleProduct(product.id, false)} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/60">
                    Rimuovi
                  </button>
                </div>
              </div>
            ))}
            {!selectedProducts.length ? <p className="text-sm text-white/50">Nessun prodotto assegnato.</p> : null}
          </div>
        </div>

        <Button type="submit" variant="cart">
          {editingDropId ? "Aggiorna drop" : "Crea drop"}
        </Button>
      </form>

      <div className="shop-card space-y-4 p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-white">Drop esistenti</h2>
            <p className="mt-1 text-sm text-white/55">Lista dei lanci con stato, data e numero prodotti.</p>
          </div>
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60">{drops.length} drop</span>
        </div>

        <div className="space-y-3">
          {drops.map((drop) => (
            <article key={drop.id} className="rounded-lg border border-white/10 bg-white/[0.025] p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex min-w-0 gap-3">
                  {drop.coverImageUrl ? (
                    <img src={drop.coverImageUrl} alt="" className="h-20 w-20 rounded-lg object-cover" />
                  ) : (
                    <span className="h-20 w-20 rounded-lg border border-white/10 bg-white/[0.04]" />
                  )}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate font-semibold text-white">{drop.title}</h3>
                      <span className="rounded-full border border-white/10 px-2 py-1 text-[11px] uppercase tracking-[0.16em] text-white/55">
                        {getStatusLabel(drop.status)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-white/45">/{drop.slug} · {formatDropDate(drop.launchAt)}</p>
                    <p className="mt-1 text-sm text-white/55">{drop._count?.products || drop.products?.length || 0} prodotti · {drop.visible ? "visibile" : "non visibile"}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link to={`/drop/${drop.slug}`} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/65 transition hover:border-white/25 hover:text-white">
                    Apri
                  </Link>
                  <Button type="button" variant="profile" size="sm" onClick={() => onStartEditDrop(drop)}>
                    Modifica
                  </Button>
                  <Button type="button" variant="profile" size="sm" className={getDangerButtonClassName({ size: "sm" })} onClick={() => setPendingDelete(drop)}>
                    Elimina
                  </Button>
                </div>
              </div>
            </article>
          ))}
          {!drops.length ? <p className="rounded-lg border border-dashed border-white/10 px-4 py-8 text-center text-sm text-white/50">Nessun drop creato.</p> : null}
        </div>
      </div>

      {pickerOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/70 px-4 py-8 backdrop-blur-sm"
          onWheel={(event) => event.preventDefault()}
          onTouchMove={(event) => event.preventDefault()}
        >
          <div className="flex max-h-[86vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-white/10 bg-[#0b0b0c] shadow-2xl">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
              <h3 className="text-base font-semibold text-white">Aggiungi prodotto al drop</h3>
              <button type="button" onClick={() => setPickerOpen(false)} className="text-sm text-white/55 transition hover:text-white">
                Chiudi
              </button>
            </div>
            <div
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5"
              onWheel={containModalScroll}
              onTouchMove={containModalScroll}
            >
              {assignableLoading ? <p className="rounded-lg border border-white/10 px-4 py-8 text-center text-sm text-white/50">Caricamento bozze...</p> : null}
              {assignableError ? <p className="mb-3 rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">{assignableError}</p> : null}
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {selectableProducts.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => toggleProduct(product.id, true)}
                    className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.025] text-left transition hover:border-white/25 hover:bg-white/[0.05]"
                  >
                    <img src={product.coverImageUrl || product.imageUrls?.[0] || ""} alt="" className="aspect-[4/3] w-full object-cover" />
                    <span className="block truncate px-3 pt-3 text-sm font-medium text-white">{product.title}</span>
                    <span className="block px-3 pb-3 pt-1 text-xs text-white/45">Bozza</span>
                  </button>
                ))}
              </div>
              {!assignableLoading && !selectableProducts.length ? <p className="rounded-lg border border-dashed border-white/10 px-4 py-8 text-center text-sm text-white/50">Nessuna bozza assegnabile disponibile.</p> : null}
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmActionModal
        open={Boolean(pendingDelete)}
        title="Elimina drop"
        description="Il drop viene eliminato e i prodotti tornano senza appartenenza drop."
        onCancel={() => setPendingDelete(null)}
        onConfirm={async () => {
          if (!pendingDelete) return
          await onDeleteDrop(pendingDelete.id)
          setPendingDelete(null)
        }}
      />
    </section>
  )
}
