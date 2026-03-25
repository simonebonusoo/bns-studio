import { Link, useNavigate } from "react-router-dom"
import { useShopCart } from "../context/ShopCartProvider"
import { useShopAuth } from "../context/ShopAuthProvider"
import { formatPrice } from "../lib/format"
import { ShopProduct } from "../types"

export function ProductCard({ product }: { product: ShopProduct }) {
  const navigate = useNavigate()
  const { user } = useShopAuth()
  const { addItem, beginCheckout } = useShopCart()

  function handleBuyNow() {
    beginCheckout(product, 1)
    navigate(user ? "/shop/checkout" : "/shop/auth", {
      state: { redirectTo: "/shop/checkout" },
    })
  }

  return (
    <article className="shop-card flex h-full flex-col overflow-hidden">
      <Link to={`/shop/${product.slug}`} className="block">
        <div className="h-[220px] overflow-hidden bg-zinc-100">
          <img src={product.imageUrls[0]} alt={product.title} className="h-[220px] w-full object-cover transition duration-500 hover:scale-[1.03]" />
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="shop-pill">{product.category}</span>
            <h2 className="mt-3 overflow-hidden text-xl font-semibold text-zinc-950 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
              {product.title}
            </h2>
          </div>
          <div className="text-sm font-medium text-[#b8cf00]">{formatPrice(product.price)}</div>
        </div>

        <p className="mt-4 overflow-hidden text-sm leading-6 text-zinc-600 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]">
          {product.description}
        </p>

        <div className="mt-auto space-y-3 pt-5">
          <Link to={`/shop/${product.slug}`} className="text-sm text-zinc-600 transition hover:text-zinc-950">
            Scheda prodotto
          </Link>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => addItem(product, 1)}
              className="w-full rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-800 transition hover:border-[#b8cf00] hover:text-[#8fa300]"
            >
              Aggiungi al carrello
            </button>
            <button
              type="button"
              onClick={handleBuyNow}
              className="w-full rounded-full bg-[#111111] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1d1d1d]"
            >
              Acquista ora
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
