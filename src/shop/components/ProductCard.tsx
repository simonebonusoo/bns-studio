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
        <div className="h-[220px] overflow-hidden bg-white/5">
          <img src={product.imageUrls[0]} alt={product.title} className="h-[220px] w-full object-cover transition duration-500 hover:scale-[1.03]" />
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="shop-pill">{product.category}</span>
            <h2 className="mt-3 overflow-hidden text-xl font-semibold text-white [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
              {product.title}
            </h2>
            <p className="mt-2 text-xs uppercase tracking-[0.18em] text-white/45">{availableFormats.join(" · ")}</p>
          </div>
          <div className="text-sm font-medium text-[#e3f503]">
            {availableFormats.length > 1 ? `da ${formatPrice(getPriceForFormat(product, defaultFormat))}` : formatPrice(getPriceForFormat(product, defaultFormat))}
          </div>
        </div>

        <p className="mt-4 overflow-hidden text-sm leading-6 text-white/65 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]">
          {product.description}
        </p>

        <div className="mt-auto space-y-3 pt-5">
          <Link to={`/shop/${product.slug}`} className="text-sm text-white/70 transition hover:text-white">
            Scheda prodotto
          </Link>
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
