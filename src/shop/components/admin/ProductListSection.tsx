import { useState, type WheelEvent } from "react"

import { Button, getDangerButtonClassName } from "../../../components/Button"
import { formatPrice } from "../../lib/format"
import { ConfirmActionModal } from "./ConfirmActionModal"
import { getAvailableFormats, getProductBadges, getProductPrimaryImage, getProductStockLabel, getProductStockStatus, getProductVariants } from "../../lib/product"
import { ShopProduct } from "../../types"

function statusLabel(status: ShopProduct["status"]) {
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

type ProductListSectionProps = {
  products: ShopProduct[]
  selectedIds: number[]
  updatingHomeProductId: number | null
  onToggleSelected: (productId: number, checked: boolean) => void
  onToggleHomeVisibility: (product: ShopProduct, checked: boolean) => Promise<void> | void
  onEdit: (product: ShopProduct) => void
  onDuplicate: (product: ShopProduct) => Promise<void> | void
  onDelete: (product: ShopProduct) => Promise<void> | void
}

export function ProductListSection({
  products,
  selectedIds,
  updatingHomeProductId,
  onToggleSelected,
  onToggleHomeVisibility,
  onEdit,
  onDuplicate,
  onDelete,
}: ProductListSectionProps) {
  const [pendingDelete, setPendingDelete] = useState<ShopProduct | null>(null)

  function containListWheel(event: WheelEvent<HTMLDivElement>) {
    const node = event.currentTarget
    const movingUp = event.deltaY < 0
    const movingDown = event.deltaY > 0
    const atTop = node.scrollTop <= 0
    const atBottom = node.scrollTop + node.clientHeight >= node.scrollHeight - 1

    if ((movingUp && !atTop) || (movingDown && !atBottom)) {
      event.stopPropagation()
    }
  }

  return (
    <>
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1" onWheelCapture={containListWheel}>
      {!products.length ? (
        <div className="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-white/55">
          Nessun prodotto trovato con i filtri attuali.
        </div>
      ) : null}
      {products.map((product) => {
        const variants = getProductVariants(product)
        const prices = variants.map((variant) => variant.price)
        const minPrice = prices.length ? Math.min(...prices) : product.price
        const maxPrice = prices.length ? Math.max(...prices) : product.price
        const isUpdatingHomeVisibility = updatingHomeProductId === product.id

        return (
          <article key={product.id} className="shop-card overflow-hidden">
            <div className="grid gap-4 p-5 md:grid-cols-[auto_112px_minmax(0,1.45fr)_196px] md:items-start">
              <label className="flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(product.id)}
                  onChange={(event) => onToggleSelected(product.id, event.target.checked)}
                />
              </label>
              <img src={getProductPrimaryImage(product)} alt={product.title} className="h-24 w-full rounded-2xl object-cover" />
              <div className="min-w-0 space-y-2 pr-2">
                <div className="space-y-2">
                  <p className="text-lg font-semibold leading-tight text-white">{product.title}</p>
                  <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.2em] text-white/60">
                    {statusLabel(product.status)}
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.2em] ${
                      getProductStockStatus(product) === "out_of_stock"
                        ? "border-red-400/20 text-red-100/80"
                        : getProductStockStatus(product) === "low_stock"
                          ? "border-amber-300/20 text-amber-100/80"
                          : "border-emerald-300/20 text-emerald-100/80"
                    }`}
                  >
                    {getProductStockStatus(product) === "out_of_stock"
                      ? "Esaurito"
                      : getProductStockStatus(product) === "low_stock"
                        ? "Low stock"
                        : "Disponibile"}
                  </span>
                  {product.featured ? (
                    <span className="rounded-full border border-[#e3f503]/30 px-2.5 py-1 text-[11px] uppercase tracking-[0.2em] text-[#eef879]">
                      Home attiva
                    </span>
                  ) : null}
                  </div>
                </div>
                <p className="text-sm text-white/60">
                  {product.category} · {getAvailableFormats(product).join(" / ")} · prezzo{" "}
                  {minPrice === maxPrice ? formatPrice(minPrice) : `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`}
                </p>
                <p className="text-xs text-white/45">
                  SKU {product.sku || "—"} · {getProductStockLabel(product)}
                  {product.collections?.length ? ` · Collezioni: ${product.collections.map((collection) => collection.title).join(", ")}` : ""}
                </p>
                <p className="text-xs text-white/45">
                  {product.tags?.length ? `Tag: ${product.tags.map((tag) => tag.name).join(", ")}` : "Nessun tag"}
                  {getProductBadges(product).length ? ` · Badge: ${getProductBadges(product).map((badge) => badge.label).join(", ")}` : ""}
                </p>
              </div>
              <div className="flex h-full min-w-0 flex-col justify-end">
                <div className="space-y-2.5">
                  <Button type="button" variant="cart" size="sm" className="w-full" text="Modifica" onClick={() => onEdit(product)}>
                    Modifica
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" variant="profile" size="sm" className="w-full" text="Duplica" onClick={() => void onDuplicate(product)}>
                      Duplica
                    </Button>
                    <Button type="button" variant="profile" size="sm" className={getDangerButtonClassName({ size: "sm", className: "w-full" })} text="Elimina" onClick={() => setPendingDelete(product)}>
                      Elimina
                    </Button>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-white/48">Homepage</p>
                        <p className="text-sm text-white/78">Mostra nella home</p>
                      </div>
                      <button
                        type="button"
                        aria-pressed={product.featured}
                        disabled={isUpdatingHomeVisibility}
                        onClick={() => void onToggleHomeVisibility(product, !product.featured)}
                        className={`relative inline-flex h-7 w-12 flex-none items-center rounded-full border transition ${
                          product.featured
                            ? "border-[#e3f503]/55 bg-[#e3f503]/20"
                            : "border-white/14 bg-white/[0.06]"
                        } ${isUpdatingHomeVisibility ? "cursor-wait opacity-70" : "cursor-pointer"}`}
                      >
                        <span
                          className={`absolute h-5 w-5 rounded-full transition ${
                            product.featured ? "translate-x-[1.4rem] bg-[#eef879]" : "translate-x-1 bg-white/85"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </article>
        )
      })}
      </div>
    </div>
    <ConfirmActionModal
      open={Boolean(pendingDelete)}
      title="Elimina prodotto"
      description="Sei sicuro di voler eliminare questo prodotto?"
      onCancel={() => setPendingDelete(null)}
      onConfirm={async () => {
        if (!pendingDelete) return
        await onDelete(pendingDelete)
        setPendingDelete(null)
      }}
    />
    </>
  )
}
