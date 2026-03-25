import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

import { ShopLayout } from "../components/ShopLayout"
import { useShopAuth } from "../context/ShopAuthProvider"
import { useShopCart } from "../context/ShopCartProvider"
import { apiFetch } from "../lib/api"
import { formatPrice } from "../lib/format"
import { ShopOrder, ShopPayment, ShopPricing } from "../types"

export function ShopCheckoutPage() {
  const { user } = useShopAuth()
  const { items, couponCode, clearCart } = useShopCart()
  const navigate = useNavigate()
  const [pricing, setPricing] = useState<ShopPricing | null>(null)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    email: user?.email || "",
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    postalCode: "",
    country: "Italia",
  })

  useEffect(() => {
    if (!items.length) return

    apiFetch<ShopPricing>("/store/pricing/preview", {
      method: "POST",
      body: JSON.stringify({
        items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        couponCode: couponCode || null,
      }),
    })
      .then(setPricing)
      .catch((err) => setError(err.message))
  }, [items, couponCode])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    try {
      const data = await apiFetch<{ order: ShopOrder; payment: ShopPayment | null; paymentError?: string | null }>("/orders/checkout", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          couponCode: couponCode || null,
          items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        }),
      })
      clearCart()
      navigate(`/shop/orders/${data.order.orderReference}`, {
        replace: true,
        state: {
          order: data.order,
          payment: data.payment,
          paymentError: data.paymentError || null,
        },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante la conferma dell'ordine.")
    }
  }

  if (!items.length) {
    return <div className="px-6 py-20 text-center text-white/60">Il carrello è vuoto.</div>
  }

  return (
    <ShopLayout eyebrow="Checkout" title="Conferma ordine" intro="Confermi l'ordine, il server salva il riepilogo finale e nella schermata successiva trovi sia la ricevuta PDF sia il pulsante per pagare con PayPal.">
      <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
        <form onSubmit={handleSubmit} className="shop-card space-y-4 p-6 md:p-8">
          <div className="grid gap-4 md:grid-cols-2">
            <input className="shop-input" type="email" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            <input className="shop-input" placeholder="Nome" value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} />
            <input className="shop-input" placeholder="Cognome" value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} />
            <input className="shop-input" placeholder="Paese" value={form.country} onChange={(event) => setForm({ ...form, country: event.target.value })} />
          </div>
          <input className="shop-input" placeholder="Indirizzo" value={form.addressLine1} onChange={(event) => setForm({ ...form, addressLine1: event.target.value })} />
          <input className="shop-input" placeholder="Dettagli aggiuntivi" value={form.addressLine2} onChange={(event) => setForm({ ...form, addressLine2: event.target.value })} />
          <div className="grid gap-4 md:grid-cols-2">
            <input className="shop-input" placeholder="Città" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} />
            <input className="shop-input" placeholder="CAP" value={form.postalCode} onChange={(event) => setForm({ ...form, postalCode: event.target.value })} />
          </div>
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <button type="submit" className="rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-white/90">
            Conferma ordine
          </button>
        </form>

        <aside className="shop-card space-y-4 p-6">
          <span className="shop-pill">Riepilogo ordine</span>
          {items.map((item) => (
            <div key={item.productId} className="flex items-center justify-between gap-4 text-sm text-white/70">
              <span>{item.product.title} x {item.quantity}</span>
              <span>{formatPrice(item.product.price * item.quantity)}</span>
            </div>
          ))}
          {pricing ? (
            <div className="space-y-3 border-t border-white/10 pt-4 text-sm text-white/70">
              <div className="flex items-center justify-between"><span>Subtotale</span><span>{formatPrice(pricing.subtotal)}</span></div>
              <div className="flex items-center justify-between"><span>Sconti</span><span>-{formatPrice(pricing.discountTotal)}</span></div>
              <div className="flex items-center justify-between"><span>Spedizione</span><span>{formatPrice(pricing.shippingTotal)}</span></div>
              <div className="flex items-center justify-between text-base font-semibold text-white"><span>Totale</span><span>{formatPrice(pricing.total)}</span></div>
            </div>
          ) : null}
        </aside>
      </div>
    </ShopLayout>
  )
}
