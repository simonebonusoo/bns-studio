import { Link, useNavigate } from "react-router-dom"
import { Button } from "../../components/Button"
import { useShopCart } from "../context/ShopCartProvider"
import { useShopAuth } from "../context/ShopAuthProvider"
import { formatPrice } from "../lib/format"
import { getAvailableFormats, getDefaultFormat, getPriceForFormat, getProductPrimaryImage, isProductPurchasable } from "../lib/product"
import { ShopProduct } from "../types"

export function ProductCard({ product }: { product: ShopProduct }) {
  const navigate = useNavigate()
  const { user } = useShopAuth()
  const { addItem, beginCheckout } = useShopCart()
  const defaultFormat = getDefaultFormat(product)
  const availableFormats = getAvailableFormats(product)
  const purchasable = isProductPurchasable(product)

  function handleBuyNow() {
    if (!purchasable) return
    beginCheckout(product, 1, defaultFormat)
    if (!user) {
      window.dispatchEvent(new CustomEvent("bns:open-profile"))
      return
    }

    navigate("/shop/checkout", {
      state: { redirectTo: "/shop/checkout" },
    })
  }

  return (
    <article className="shop-card flex h-full flex-col overflow-hidden">
      <Link to={`/shop/${product.slug}`} className="block">
        <div className="h-[300px] overflow-hidden bg-white/5 sm:h-[320px]">
          <img src={getProductPrimaryImage(product)} alt={product.title} className="h-[300px] w-full object-cover transition duration-500 hover:scale-[1.03] sm:h-[320px]" />
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5 pt-4">
        <div className="min-w-0 space-y-2">
            <h2 className="overflow-hidden text-xl font-semibold text-white [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
              {product.title}
            </h2>
          <p className="text-xs uppercase tracking-[0.18em] text-white/45">{availableFormats.join(" · ")}</p>
        </div>

        <div className="mt-auto pt-5">
          <div className="flex items-end justify-between gap-4 pb-3">
            <span className="shop-pill">{product.category}</span>
            <div className="text-sm font-medium text-[#e3f503]">
              {availableFormats.length > 1 ? `da ${formatPrice(getPriceForFormat(product, defaultFormat))}` : formatPrice(getPriceForFormat(product, defaultFormat))}
            </div>
          </div>
          {!purchasable ? (
            <div className="pb-3 text-xs uppercase tracking-[0.18em] text-amber-200/75">
              {product.status === "out_of_stock" || product.stock <= 0 ? "Esaurito" : "Non disponibile"}
            </div>
          ) : null}
          <div className="flex flex-col gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => addItem(product, 1, defaultFormat)}
              className="w-full"
              disabled={!purchasable}
            >
              Aggiungi al carrello
            </Button>
            <Button
              type="button"
              onClick={handleBuyNow}
              className="w-full"
              disabled={!purchasable}
            >
              Acquista ora
            </Button>
          </div>
        </div>
      </div>
    </article>
  )
}
