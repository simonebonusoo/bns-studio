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
  onEdit: (product: ShopProduct) => void
  onDelete: (product: ShopProduct) => Promise<void> | void
}

export function ProductListSection({ products, onEdit, onDelete }: ProductListSectionProps) {
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
            <div className="grid gap-4 p-5 md:grid-cols-[120px_1fr_auto] md:items-center">
              <img src={getProductPrimaryImage(product)} alt={product.title} className="h-24 w-full rounded-2xl object-cover" />
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-lg font-semibold text-white">{product.title}</p>
                  <span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.2em] text-white/60">
                    {statusLabel(product.status)}
                  </span>
                </div>
                <p className="text-sm text-white/60">
                  {product.category} · {product.availableFormats?.join(" / ") || "A4"} ·
                  {product.hasA4 !== false ? ` A4 ${formatPrice(product.priceA4 ?? product.price)}` : ""}
                  {product.hasA3 ? ` · A3 ${formatPrice(product.priceA3 ?? product.price)}` : ""}
                  {" · "}disponibilita {product.stock}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => onEdit(product)} className="rounded-full border border-white/10 px-3 py-2 text-xs text-white/70">
                  Modifica
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
