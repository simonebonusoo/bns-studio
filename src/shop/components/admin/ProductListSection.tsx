import { Button } from "../../../components/Button"
import { formatPrice } from "../../lib/format"
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
  onToggleSelected: (productId: number, checked: boolean) => void
  onEdit: (product: ShopProduct) => void
  onDuplicate: (product: ShopProduct) => Promise<void> | void
  onDelete: (product: ShopProduct) => Promise<void> | void
}

export function ProductListSection({ products, selectedIds, onToggleSelected, onEdit, onDuplicate, onDelete }: ProductListSectionProps) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pr-1">
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

        return (
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
                      Merchandising home
                    </span>
                  ) : null}
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
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="ghost" size="sm" text="Modifica" onClick={() => onEdit(product)}>
                  Modifica
                </Button>
                <Button type="button" variant="ghost" size="sm" text="Duplica" onClick={() => void onDuplicate(product)}>
                  Duplica
                </Button>
                <Button type="button" size="sm" text="Elimina" onClick={() => void onDelete(product)}>
                  Elimina
                </Button>
              </div>
            </div>
          </article>
        )
      })}
      </div>
    </div>
  )
}
