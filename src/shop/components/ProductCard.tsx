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
    <article className="shop-card overflow-hidden">
      <Link to={`/shop/${product.slug}`} className="block">
        <div className="aspect-[4/3] overflow-hidden bg-white/5">
          <img src={product.imageUrls[0]} alt={product.title} className="h-full w-full object-cover transition duration-500 hover:scale-[1.03]" />
        </div>
      </Link>

      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="shop-pill">{product.category}</span>
            <h2 className="mt-3 text-xl font-semibold text-white">{product.title}</h2>
          </div>
          <div className="text-sm font-medium text-[#e3f503]">{formatPrice(product.price)}</div>
        </div>

        <p className="overflow-hidden text-sm leading-6 text-white/65 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]">
          {product.description}
        </p>

        <div className="space-y-3">
          <Link to={`/shop/${product.slug}`} className="text-sm text-white/70 transition hover:text-white">
            Scheda prodotto
          </Link>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => addItem(product, 1)}
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-white transition hover:border-[#e3f503] hover:text-[#e3f503]"
            >
              Aggiungi al carrello
            </button>
            <button
              type="button"
              onClick={handleBuyNow}
              className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/90"
            >
              Acquista ora
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
