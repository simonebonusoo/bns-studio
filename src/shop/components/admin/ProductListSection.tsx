import { formatPrice } from "../../lib/format"
import { getProductPrimaryImage } from "../../lib/product"
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
  onToggleSelected: (productId: number, checked: boolean) => void
  onEdit: (product: ShopProduct) => void
  onDuplicate: (product: ShopProduct) => Promise<void> | void
  onDelete: (product: ShopProduct) => Promise<void> | void
}

export function ProductListSection({ products, selectedIds, onToggleSelected, onEdit, onDuplicate, onDelete }: ProductListSectionProps) {
  return (
    <section className="shop-card flex h-full min-h-0 flex-col p-6">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pr-1">
        {!products.length ? (
          <div className="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-white/55">
            Nessun prodotto trovato con i filtri attuali.
          </div>
        ) : null}
        {products.map((product) => (
          <article key={product.id} className="shop-card overflow-hidden">
            <div className="grid gap-4 p-5 md:grid-cols-[auto_120px_1fr_auto] md:items-center">
              <label className="flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(product.id)}
                  onChange={(event) => onToggleSelected(product.id, event.target.checked)}
                />
              </label>
              <img src={getProductPrimaryImage(product)} alt={product.title} className="h-24 w-full rounded-2xl object-cover" />
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-lg font-semibold text-white">{product.title}</p>
                  <span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.2em] text-white/60">
                    {statusLabel(product.status)}
                  </span>
                  {product.stockStatus === "low_stock" ? (
                    <span className="rounded-full border border-amber-300/20 px-2.5 py-1 text-[11px] uppercase tracking-[0.2em] text-amber-100/80">
                      Low stock
                    </span>
                  ) : null}
                </div>
                <p className="text-sm text-white/60">
                  {product.category} · {product.availableFormats?.join(" / ") || "A4"} ·
                  {product.hasA4 !== false ? ` A4 ${formatPrice(product.priceA4 ?? product.price)}` : ""}
                  {product.hasA3 ? ` · A3 ${formatPrice(product.priceA3 ?? product.price)}` : ""}
                  {" · "}disponibilita {product.stock}
                </p>
                <p className="text-xs text-white/45">
                  SKU {product.sku || "—"} {product.tags?.length ? `· Tag: ${product.tags.map((tag) => tag.name).join(", ")}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => onEdit(product)} className="rounded-full border border-white/10 px-3 py-2 text-xs text-white/70">
                  Modifica
                </button>
                <button type="button" onClick={() => void onDuplicate(product)} className="rounded-full border border-white/10 px-3 py-2 text-xs text-white/70">
                  Duplica
                </button>
                <button type="button" onClick={() => void onDelete(product)} className="rounded-full border border-white/10 px-3 py-2 text-xs text-white/70">
                  Elimina
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
