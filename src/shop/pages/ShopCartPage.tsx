import { Link } from "react-router-dom"
import { useEffect, useState } from "react"

import { ShopLayout } from "../components/ShopLayout"
import { useShopCart } from "../context/ShopCartProvider"
import { apiFetch } from "../lib/api"
import { formatPrice } from "../lib/format"
import { ShopPricing } from "../types"

export function ShopCartPage() {
  const { items, updateItem, removeItem, couponCode, setCouponCode } = useShopCart()
  const [pricing, setPricing] = useState<ShopPricing | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!items.length) {
      setPricing(null)
      return
    }

    apiFetch<ShopPricing>("/store/pricing/preview", {
      method: "POST",
      body: JSON.stringify({
        items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        couponCode: couponCode || null,
      }),
    })
      .then((data) => {
        setPricing(data)
        setError("")
      })
      .catch((err) => {
        setPricing(null)
        setError(err.message)
      })
  }, [items, couponCode])

  return (
    <ShopLayout eyebrow="Cart" title="Riepilogo ordine" intro="Carrello, coupon e totale sono calcolati dal nuovo backend integrato, senza separare l’esperienza dallo shell principale del sito.">
      {!items.length ? (
        <div className="rounded-[24px] border border-dashed border-zinc-200 bg-white/70 px-6 py-14 text-center text-zinc-500">
          Il carrello e vuoto. <Link to="/shop" className="text-zinc-900 underline underline-offset-4">Apri il catalogo</Link>.
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          {items.map((item) => (
            <article key={item.productId} className="shop-card flex flex-col gap-4 p-4 md:flex-row md:items-center">
              <img src={item.product.imageUrls[0]} alt={item.product.title} className="h-28 w-full rounded-[20px] object-cover md:w-40" />
              <div className="min-w-0 flex-1">
                <span className="shop-pill">{item.product.category}</span>
                <h2 className="mt-3 text-xl font-semibold text-zinc-950">{item.product.title}</h2>
                <p className="mt-2 text-sm text-zinc-600">{formatPrice(item.product.price)}</p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  className="shop-input w-24"
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(event) => updateItem(item.productId, Number(event.target.value))}
                />
                <button type="button" onClick={() => removeItem(item.productId)} className="text-sm text-zinc-500 transition hover:text-zinc-900">
                  Rimuovi
                </button>
              </div>
            </article>
          ))}
        </div>

        <aside className="shop-card h-fit space-y-5 p-6">
          <div>
            <span className="shop-pill">Summary</span>
            <h2 className="mt-4 text-2xl font-semibold text-zinc-950">Totali ordine</h2>
          </div>
          <input
            className="shop-input"
            placeholder="Codice coupon"
            value={couponCode}
            onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
          />
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          {pricing ? (
            <div className="space-y-3 text-sm text-zinc-600">
              <div className="flex items-center justify-between"><span>Subtotale</span><span>{formatPrice(pricing.subtotal)}</span></div>
              <div className="flex items-center justify-between"><span>Sconti</span><span>-{formatPrice(pricing.discountTotal)}</span></div>
              <div className="flex items-center justify-between"><span>Spedizione</span><span>{formatPrice(pricing.shippingTotal)}</span></div>
              <div className="flex items-center justify-between border-t border-zinc-200 pt-3 text-base font-semibold text-zinc-950"><span>Totale</span><span>{formatPrice(pricing.total)}</span></div>
              <Link to="/shop/checkout" className="block rounded-full bg-[#111111] px-5 py-3 text-center text-sm font-medium text-white transition hover:bg-[#1d1d1d]">
                Vai al checkout
              </Link>
            </div>
          ) : null}
        </aside>
      </div>
    </ShopLayout>
  )
}
