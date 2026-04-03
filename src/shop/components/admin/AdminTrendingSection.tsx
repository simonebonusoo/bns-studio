import { useMemo, useState, type Dispatch, type SetStateAction } from "react"

import { Button } from "../../../components/Button"
import { formatPrice } from "../../lib/format"
import { getPriceForVariant, getProductPrimaryImage } from "../../lib/product"
import { moveTrendingProductId } from "../../lib/trending-products.mjs"
import { ShopProduct } from "../../types"

type AdminTrendingSectionProps = {
  products: ShopProduct[]
  trendingProductIds: number[]
  setTrendingProductIds: Dispatch<SetStateAction<number[]>>
  onSave: () => Promise<void> | void
}

export function AdminTrendingSection({
  products,
  trendingProductIds,
  setTrendingProductIds,
  onSave,
}: AdminTrendingSectionProps) {
  const [draggedProductId, setDraggedProductId] = useState<number | null>(null)
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "title_asc">("newest")

  const selectedProducts = useMemo(() => {
    const productMap = new Map((products ?? []).map((product) => [product.id, product]))
    return (trendingProductIds ?? [])
      .map((id) => productMap.get(id))
      .filter((product): product is ShopProduct => Boolean(product))
  }, [products, trendingProductIds])

  const visibleProducts = useMemo(() => {
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

  function toggleProduct(productId, checked) {
    setTrendingProductIds((current) => {
      const safeCurrent = Array.isArray(current) ? current : []
      if (checked) {
        if (safeCurrent.includes(productId)) return safeCurrent
        return [...safeCurrent, productId]
      }
      return safeCurrent.filter((id) => id !== productId)
    })
  }

  function moveProduct(fromId, toId) {
    setTrendingProductIds((current) => moveTrendingProductId(current, fromId, toId))
  }

  return (
    <section className="space-y-6">
      <article className="shop-card space-y-5 p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Tendenza</h2>
            <p className="mt-1 text-sm text-white/55">
              Seleziona i poster da mostrare nella sezione pubblica “Poster di tendenza” e riordinali con drag & drop.
            </p>
          </div>
          <Button type="button" variant="cart" onClick={() => void onSave()}>
            Salva tendenza
          </Button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-white/55">Selezionati</h3>
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60">
              {selectedProducts.length} attivi
            </span>
          </div>

          {selectedProducts.length ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {selectedProducts.map((product, index) => (
                <div
                  key={product.id}
                  draggable
                  onDragStart={() => setDraggedProductId(product.id)}
                  onDragEnd={() => setDraggedProductId(null)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault()
                    if (!draggedProductId || draggedProductId === product.id) return
                    moveProduct(draggedProductId, product.id)
                    setDraggedProductId(null)
                  }}
                  className={`rounded-[24px] border p-4 transition ${
                    draggedProductId === product.id
                      ? "border-[#e3f503]/45 bg-[#e3f503]/10"
                      : "border-white/10 bg-white/[0.03]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-white/45">Posizione {index + 1}</p>
                      <p className="mt-2 text-base font-semibold text-white">{product.title}</p>
                      <p className="mt-1 text-sm text-white/55">{formatPrice(getPriceForVariant(product))}</p>
                    </div>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/60">
                      Trascina
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[22px] border border-dashed border-white/10 px-4 py-10 text-center text-sm text-white/50">
              Nessun poster selezionato per la sezione Tendenza.
            </div>
          )}
        </div>
      </article>

      <article className="shop-card space-y-5 p-6">
        <div>
          <h3 className="text-xl font-semibold text-white">Tutti i poster</h3>
          <p className="mt-1 text-sm text-white/55">Attiva o disattiva i poster che devono comparire nella sezione pubblica.</p>
        </div>

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

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleProducts.map((product) => {
            const isSelected = (trendingProductIds ?? []).includes(product.id)
            return (
              <article key={product.id} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                <div className="overflow-hidden rounded-[18px] border border-white/10 bg-black/10">
                  <img src={getProductPrimaryImage(product)} alt={product.title} className="h-44 w-full object-cover" />
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-white">{product.title}</p>
                      <p className="mt-1 text-sm text-white/55">{formatPrice(getPriceForVariant(product))}</p>
                    </div>
                    <label className="flex shrink-0 items-center gap-2 text-sm text-white/75">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(event) => toggleProduct(product.id, event.target.checked)}
                      />
                      <span>Tick</span>
                    </label>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/60">
                      {isSelected ? "Selezionato" : "Non selezionato"}
                    </span>
                    {isSelected ? (
                      <span className="text-xs text-[#eef879]">
                        {(trendingProductIds ?? []).findIndex((id) => id === product.id) + 1}
                      </span>
                    ) : null}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
        {!visibleProducts.length ? (
          <div className="rounded-[22px] border border-dashed border-white/10 px-4 py-10 text-center text-sm text-white/50">
            Nessun poster trovato con i filtri attuali.
          </div>
        ) : null}
      </article>
    </section>
  )
}
