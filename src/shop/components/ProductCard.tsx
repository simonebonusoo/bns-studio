import { Link, useNavigate } from "react-router-dom"
import { useShopCart } from "../context/ShopCartProvider"
import { useShopAuth } from "../context/ShopAuthProvider"
import { formatPrice } from "../lib/format"
import { getAvailableFormats, getDefaultFormat, getPriceForFormat } from "../lib/product"
import { ShopProduct } from "../types"

export function ProductCard({ product }: { product: ShopProduct }) {
  const navigate = useNavigate()
  const { user } = useShopAuth()
  const { addItem, beginCheckout } = useShopCart()
  const defaultFormat = getDefaultFormat(product)
  const availableFormats = getAvailableFormats(product)

  function handleBuyNow() {
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
          <img src={product.imageUrls[0]} alt={product.title} className="h-[300px] w-full object-cover transition duration-500 hover:scale-[1.03] sm:h-[320px]" />
        </div>
      </Link>

      <div className="flex flex-1 flex-col justify-end p-5 pt-4">
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <h2 className="overflow-hidden text-xl font-semibold text-white [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
              {product.title}
            </h2>
            <p className="text-xs uppercase tracking-[0.18em] text-white/45">{availableFormats.join(" · ")}</p>
            <span className="shop-pill">{product.category}</span>
          </div>
          <div className="text-sm font-medium text-[#e3f503]">
            {availableFormats.length > 1 ? `da ${formatPrice(getPriceForFormat(product, defaultFormat))}` : formatPrice(getPriceForFormat(product, defaultFormat))}
          </div>
        </div>

        <div className="mt-auto pt-5">
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => addItem(product, 1, defaultFormat)}
              className="w-full rounded-full border border-white/10 px-4 py-2 text-sm text-white transition hover:border-[#e3f503] hover:text-[#e3f503]"
            >
              Aggiungi al carrello
            </button>
            <button
              type="button"
              onClick={handleBuyNow}
              className="w-full rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/90"
            >
              Acquista ora
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
