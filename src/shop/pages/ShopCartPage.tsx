import { Link } from "react-router-dom"
import { useEffect, useState } from "react"

import { getButtonClassName } from "../../components/Button"
import { ShopLayout } from "../components/ShopLayout"
import { useShopAuth } from "../context/ShopAuthProvider"
import { useShopCart } from "../context/ShopCartProvider"
import { apiFetch } from "../lib/api"
import { formatPrice } from "../lib/format"
import { getPriceForVariant, getProductPrimaryImage } from "../lib/product"
import { ShopPricing } from "../types"

function mapPricingPreviewErrorMessage(message: string) {
  if (!message) return "Errore durante il calcolo del riepilogo."
  if (/Packlink quotes/i.test(message) || /Packlink shipment/i.test(message)) {
    return "Tariffe spedizione temporaneamente non disponibili. Riprova tra poco."
  }
  return message
}

export function ShopCartPage() {
  const { user, loading, effectiveRole } = useShopAuth()
  const { items, updateItem, decrementItem, couponCode, setCouponCode } = useShopCart()
  const [pricing, setPricing] = useState<ShopPricing | null>(null)
  const [error, setError] = useState("")

  function openProfilePanel() {
    window.dispatchEvent(new CustomEvent("bns:open-profile"))
  }

  useEffect(() => {
    if (!user) {
      setPricing(null)
      return
    }

    if (!items.length) {
      setPricing(null)
      return
    }

    apiFetch<ShopPricing>("/store/pricing/preview", {
      method: "POST",
      body: JSON.stringify({
        items: items.map((item) => ({ productId: item.productId, quantity: item.quantity, format: item.format, variantId: item.variantId || null })),
        couponCode: couponCode || null,
      }),
    })
      .then((data) => {
        setPricing(data)
        setError("")
      })
      .catch((err) => {
        setPricing(null)
        setError(mapPricingPreviewErrorMessage(err instanceof Error ? err.message : "Errore durante il calcolo del riepilogo."))
      })
  }, [couponCode, items, user])

  return (
    <ShopLayout eyebrow="Cart" title="Riepilogo ordine" intro="Carrello, coupon e totale sono calcolati dal nuovo backend integrato, senza separare l’esperienza dallo shell principale del sito.">
      {loading ? (
        <div className="rounded-[24px] border border-white/10 px-6 py-14 text-center text-white/60">
          Verifica accesso in corso...
        </div>
      ) : null}

      {!loading && !user ? (
        <div className="rounded-[24px] border border-white/10 px-6 py-14 text-center text-white/60">
          Accesso non effettuato.{" "}
          <button
            type="button"
            onClick={openProfilePanel}
            className="text-white underline underline-offset-4"
          >
            Accedi dal pannello profilo
          </button>{" "}
          per visualizzare il carrello.
        </div>
      ) : null}

      {loading || !user ? null : (
        <>
      {!items.length ? (
        <div className="rounded-[24px] border border-dashed border-white/10 px-6 py-14 text-center text-white/60">
          <p>Il carrello e vuoto.</p>
          <Link
            to="/#shop"
            className={`mt-4 ${getButtonClassName({ variant: "profile" })}`}
          >
            Vai al catalogo
          </Link>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          {items.map((item) => (
            <article key={`${item.productId}-${item.variantId || item.format || "default"}`} className="shop-card flex flex-col gap-4 p-4 md:flex-row md:items-center">
              <img src={getProductPrimaryImage(item.product)} alt={item.product.title} className="h-28 w-full rounded-[20px] object-cover md:w-40" />
              <div className="min-w-0 flex-1">
                <span className="shop-pill">{item.product.category}</span>
                <h2 className="mt-3 text-xl font-semibold text-white">{item.product.title}</h2>
                <p className="mt-2 text-sm text-white/65">{item.variantLabel || item.format || "Variante"} · {formatPrice(getPriceForVariant(item.product, item.variantId))}</p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  className="shop-input w-24"
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(event) => updateItem(item.productId, Number(event.target.value), { variantId: item.variantId, format: item.format, variantLabel: item.variantLabel, variantSku: item.variantSku })}
                />
                <button
                  type="button"
                  onClick={() => decrementItem(item.productId, { variantId: item.variantId, format: item.format, variantLabel: item.variantLabel, variantSku: item.variantSku })}
                  className={getButtonClassName({ variant: "cart", size: "sm" })}
                >
                  Rimuovi
                </button>
              </div>
            </article>
          ))}
        </div>

        <aside className="shop-card h-fit space-y-5 p-6">
          <div>
            <span className="shop-pill">Summary</span>
            <h2 className="mt-4 text-2xl font-semibold text-white">Totali ordine</h2>
          </div>
          <input
            className="shop-input"
            placeholder="Codice coupon"
            value={couponCode}
            onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
          />
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          {pricing ? (
            <div className="space-y-3 text-sm text-white/70">
              <div className="flex items-center justify-between"><span>Subtotale</span><span>{formatPrice(pricing.subtotal)}</span></div>
              <div className="flex items-center justify-between"><span>Sconti</span><span>-{formatPrice(pricing.discountTotal)}</span></div>
              <div className="flex items-center justify-between"><span>Spedizione</span><span>Calcolata al checkout</span></div>
              <div className="flex items-center justify-between border-t border-white/10 pt-3 text-base font-semibold text-white"><span>Totale</span><span>{formatPrice(pricing.total)}</span></div>
              {effectiveRole === "admin" ? (
                <>
                  <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
                    Gli account admin non possono effettuare ordini cliente o avviare pagamenti PayPal.
                  </div>
                  <Link
                    to="/shop/admin"
                    className={`block text-center ${getButtonClassName({ variant: "profile" })}`}
                  >
                    Vai a Gestione shop
                  </Link>
                </>
              ) : (
                <Link to="/shop/checkout" className={`block text-center ${getButtonClassName({ variant: "cart" })}`}>
                  Vai al checkout
                </Link>
              )}
            </div>
          ) : null}
        </aside>
      </div>
        </>
      )}
    </ShopLayout>
  )
}
