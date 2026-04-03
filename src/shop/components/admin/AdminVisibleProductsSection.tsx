import { useMemo, useState, type Dispatch, type SetStateAction } from "react"

import { Button, getButtonClassName, getDangerButtonClassName } from "../../../components/Button"
import { formatPrice } from "../../lib/format"
import { getPriceForVariant, getProductPrimaryImage } from "../../lib/product"
import {
  assignProductToVisibleSlot,
  buildNormalizedSlots,
  clearVisibleSlot,
  moveVisibleSlot,
  VISIBLE_PRODUCT_SLOTS_COUNT,
} from "../../lib/visible-products-slots.mjs"
import { ShopProduct } from "../../types"

type AdminVisibleProductsSectionProps = {
  products: ShopProduct[]
  visibleProductSlots: Array<number | null>
  setVisibleProductSlots: Dispatch<SetStateAction<Array<number | null>>>
  onSave: () => Promise<void> | void
}

export function AdminVisibleProductsSection({
  products,
  visibleProductSlots,
  setVisibleProductSlots,
  onSave,
}: AdminVisibleProductsSectionProps) {
  const [draggedSlotIndex, setDraggedSlotIndex] = useState<number | null>(null)
  const [pickerOpenForSlot, setPickerOpenForSlot] = useState<number | null>(null)
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "title_asc">("newest")

  const normalizedSlots = useMemo(() => buildNormalizedSlots(visibleProductSlots), [visibleProductSlots])
  const productMap = useMemo(() => new Map((products ?? []).map((product) => [product.id, product])), [products])

  const pickerProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    const filtered = (products ?? []).filter((product) => {
      if (!normalizedSearch) return true
      const haystack = [product.title, product.slug, product.sku || ""].join(" ").toLowerCase()
      return haystack.includes(normalizedSearch)
    })

    const next = [...filtered]
    next.sort((left, right) => {
      if (sortBy === "title_asc") {
        return left.title.localeCompare(right.title, "it", { sensitivity: "base" })
      }

      const leftDate = new Date(left.createdAt || 0).getTime()
      const rightDate = new Date(right.createdAt || 0).getTime()

      if (sortBy === "oldest") {
        return leftDate - rightDate
      }

      return rightDate - leftDate
    })

    return next
  }, [products, search, sortBy])

  const currentSlotProductId = pickerOpenForSlot !== null ? normalizedSlots[pickerOpenForSlot] : null

  function setSlotProduct(slotIndex, productId) {
    setVisibleProductSlots((current) => assignProductToVisibleSlot(current, slotIndex, productId))
  }

  function removeSlotProduct(slotIndex) {
    setVisibleProductSlots((current) => clearVisibleSlot(current, slotIndex))
  }

  function moveSlot(fromIndex, toIndex) {
    setVisibleProductSlots((current) => moveVisibleSlot(current, fromIndex, toIndex))
  }

  return (
    <section className="shop-card space-y-5 p-6 xl:col-span-2">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Prodotti visibili</h2>
          <p className="mt-1 text-sm text-white/55">
            Gestisci gli 8 slot della sezione pubblica “Tutti i poster”. Gli slot pieni vengono mostrati nello stesso ordine sulla home.
          </p>
        </div>
        <Button type="button" variant="cart" onClick={() => void onSave()}>
          Salva prodotti visibili
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {normalizedSlots.map((productId, index) => {
          const product = productId ? productMap.get(productId) || null : null

          return (
            <div
              key={`visible-slot-${index}`}
              draggable={Boolean(product)}
              onDragStart={() => {
                if (!product) return
                setDraggedSlotIndex(index)
              }}
              onDragEnd={() => setDraggedSlotIndex(null)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault()
                if (draggedSlotIndex === null || draggedSlotIndex === index) return
                moveSlot(draggedSlotIndex, index)
                setDraggedSlotIndex(null)
              }}
              className={`rounded-[24px] border p-4 transition ${
                draggedSlotIndex === index ? "border-[#e3f503]/45 bg-[#e3f503]/10" : "border-white/10 bg-white/[0.03]"
              }`}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/60">
                  Slot {index + 1}
                </span>
                {product ? (
                  <span className="text-[11px] uppercase tracking-[0.18em] text-white/45">Drag & drop</span>
                ) : null}
              </div>

              {product ? (
                <div className="space-y-3">
                  <div className="overflow-hidden rounded-[18px] border border-white/10 bg-black/10">
                    <img src={getProductPrimaryImage(product)} alt={product.title} className="h-40 w-full object-cover" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-white">{product.title}</p>
                    <p className="mt-1 text-sm text-white/55">{formatPrice(getPriceForVariant(product))}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPickerOpenForSlot(index)}
                      className={getButtonClassName({ variant: "profile", size: "sm", className: "w-full" })}
                    >
                      Sostituisci
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSlotProduct(index)}
                      className={getDangerButtonClassName({ size: "sm", className: "w-full" })}
                    >
                      Rimuovi
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setPickerOpenForSlot(index)}
                  className="flex h-full min-h-[16rem] w-full flex-col items-center justify-center rounded-[18px] border border-dashed border-white/12 bg-white/[0.02] text-white/55 transition hover:border-white/24 hover:text-white"
                >
                  <span className="text-4xl leading-none">+</span>
                  <span className="mt-3 text-sm uppercase tracking-[0.18em]">Aggiungi poster</span>
                </button>
              )}
            </div>
          )
        })}
      </div>

      {pickerOpenForSlot !== null ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/72 px-4 py-6 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] border border-white/12 bg-[#080808] shadow-[0_30px_120px_rgba(0,0,0,0.55)]">
            <div className="shrink-0 border-b border-white/10 bg-[#080808] px-6 py-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-white">Seleziona prodotto per slot {pickerOpenForSlot + 1}</h3>
                  <p className="mt-1 text-sm text-white/55">Scegli un poster da assegnare allo slot. Un prodotto non può occupare due slot diversi.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPickerOpenForSlot(null)}
                  className={getButtonClassName({ variant: "profile", size: "sm" })}
                >
                  Chiudi
                </button>
              </div>
            </div>

            <div className="shrink-0 border-b border-white/10 bg-[#080808] px-6 py-4">
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_240px]">
                <input
                  className="shop-input"
                  placeholder="Cerca poster"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                <select className="shop-select" value={sortBy} onChange={(event) => setSortBy(event.target.value as "newest" | "oldest" | "title_asc")}>
                  <option value="newest">Ultimo aggiunto</option>
                  <option value="oldest">Primo aggiunto</option>
                  <option value="title_asc">Ordine alfabetico</option>
                </select>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5" style={{ maxHeight: "70vh" }}>
              {pickerProducts.length ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {pickerProducts.map((product) => {
                    const assignedSlotIndex = normalizedSlots.findIndex((id) => id === product.id)
                    const isCurrentSlotProduct = currentSlotProductId === product.id
                    const isUsedInOtherSlot = assignedSlotIndex >= 0 && !isCurrentSlotProduct
                    return (
                      <button
                        key={product.id}
                        type="button"
                        disabled={isUsedInOtherSlot}
                        onClick={() => {
                          setSlotProduct(pickerOpenForSlot, product.id)
                          setPickerOpenForSlot(null)
                        }}
                        className={`overflow-hidden rounded-[22px] border text-left transition ${
                          isCurrentSlotProduct
                            ? "border-[#e3f503]/45 bg-[#e3f503]/12"
                            : isUsedInOtherSlot
                              ? "cursor-not-allowed border-amber-300/25 bg-amber-300/8 opacity-75"
                              : "border-white/10 bg-white/[0.03] hover:border-white/22"
                        }`}
                      >
                        <div className="h-44 overflow-hidden bg-black/10">
                          <img src={getProductPrimaryImage(product)} alt={product.title} className="h-full w-full object-cover" />
                        </div>
                        <div className="space-y-2 p-4">
                          <p className="text-base font-semibold text-white">{product.title}</p>
                          <p className="text-sm text-white/55">{formatPrice(getPriceForVariant(product))}</p>
                          {isCurrentSlotProduct ? (
                            <span className="inline-flex rounded-full border border-[#e3f503]/30 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#eef879]">
                              Selezionato nello slot corrente
                            </span>
                          ) : null}
                          {isUsedInOtherSlot ? (
                            <span className="inline-flex rounded-full border border-amber-300/30 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-amber-100">
                              Già nello slot {assignedSlotIndex + 1}
                            </span>
                          ) : null}
                        </div>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="rounded-[22px] border border-dashed border-white/10 px-4 py-10 text-center text-sm text-white/50">
                  Nessun poster trovato con i filtri attuali.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
