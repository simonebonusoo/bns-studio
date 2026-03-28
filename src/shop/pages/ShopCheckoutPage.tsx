import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"

import { ShopLayout } from "../components/ShopLayout"
import { useShopAuth } from "../context/ShopAuthProvider"
import { useShopCart } from "../context/ShopCartProvider"
import { apiFetch } from "../lib/api"
import { downloadInvoicePdf } from "../lib/invoice"
import { formatPrice } from "../lib/format"
import { getPriceForVariant, getProductPrimaryImage } from "../lib/product"
import { ShopOrder, ShopPayment, ShopPricing, ShopSettings } from "../types"

type CheckoutStep = "review" | "details" | "payment"

const PAYPAL_UI_ERROR = "Pagamento PayPal momentaneamente non disponibile. Riprova tra poco."

function mapPaypalErrorMessage(message: string) {
  if (!message) return PAYPAL_UI_ERROR
  if (message === "Configurazione PayPal mancante nel progetto integrato") return message
  if (message === "Ordine non trovato") return message
  if (message === "Impossibile generare il link PayPal") return message
  return PAYPAL_UI_ERROR
}

export function ShopCheckoutPage() {
  const { user, isGuestPreview } = useShopAuth()
  const { items, couponCode, setCouponCode, clearCart } = useShopCart()
  const [step, setStep] = useState<CheckoutStep>("review")
  const [pricing, setPricing] = useState<ShopPricing | null>(null)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [isRedirectingToPaypal, setIsRedirectingToPaypal] = useState(false)
  const [order, setOrder] = useState<ShopOrder | null>(null)
  const [payment, setPayment] = useState<ShopPayment | null>(null)
  const [settings, setSettings] = useState<ShopSettings>({})
  const [paymentError, setPaymentError] = useState("")
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

  const stepIndex = useMemo(() => ["review", "details", "payment"].indexOf(step) + 1, [step])

  useEffect(() => {
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
        setError(err instanceof Error ? err.message : "Errore durante il calcolo del riepilogo.")
      })
  }, [couponCode, items])

  useEffect(() => {
    if (!user) return
    setForm((current) => ({
      ...current,
      email: user.email || current.email,
      firstName: user.firstName || current.firstName,
      lastName: user.lastName || current.lastName,
    }))
  }, [user])

  useEffect(() => {
    apiFetch<ShopSettings>("/store/settings").then(setSettings).catch(() => setSettings({}))
  }, [])

  async function handleCreateOrder(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError("")
    setPaymentError("")

    try {
      if (user?.role === "admin" && isGuestPreview && pricing) {
        setOrder({
          id: 0,
          orderReference: `PREVIEW-${Date.now()}`,
          email: form.email,
          firstName: form.firstName,
          lastName: form.lastName,
          addressLine1: form.addressLine1,
          addressLine2: form.addressLine2 || null,
          city: form.city,
          postalCode: form.postalCode,
          country: form.country,
          status: "preview",
          subtotal: pricing.subtotal,
          discountTotal: pricing.discountTotal,
          shippingTotal: pricing.shippingTotal,
          total: pricing.total,
          couponCode: couponCode || null,
          createdAt: new Date().toISOString(),
          pricingBreakdown: pricing,
          items: pricing.items.map((item, index) => ({
            id: index + 1,
            productId: item.productId,
            variantId: item.variantId ?? null,
            title: item.title,
            imageUrl: item.imageUrl,
            format: item.format || null,
            variantLabel: item.variantLabel || null,
            variantSku: item.variantSku || null,
            unitPrice: item.unitPrice,
            unitCost: item.unitCost,
            quantity: item.quantity,
            lineTotal: item.lineTotal,
            costTotal: item.costTotal,
          })),
        })
        setPayment(null)
        setPaymentError("")
        setStep("payment")
        return
      }

      const data = await apiFetch<{ order: ShopOrder; payment: ShopPayment | null; paymentError?: string | null }>("/orders/checkout", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          couponCode: couponCode || null,
          items: items.map((item) => ({ productId: item.productId, quantity: item.quantity, format: item.format, variantId: item.variantId || null })),
        }),
      })

      setOrder(data.order)
      setPayment(data.payment)
      setPaymentError(data.paymentError || "")
      clearCart()
      setStep("payment")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante la conferma dell'ordine.")
    } finally {
      setSubmitting(false)
    }
  }

  async function handlePayPalClick() {
    if (!order || isRedirectingToPaypal) return

    setPaymentError("")
    setIsRedirectingToPaypal(true)

    try {
      if (payment?.redirectUrl) {
        window.location.assign(payment.redirectUrl)
        return
      }

      const data = await apiFetch<{ url: string; status: string; payment?: ShopPayment }>(`/orders/payment/${order.orderReference}`)
      const redirectUrl = data.payment?.redirectUrl || data.url

      if (!redirectUrl) {
        throw new Error("Impossibile generare il link PayPal")
      }

      if (data.payment) {
        setPayment(data.payment)
      }

      window.location.assign(redirectUrl)
    } catch (err) {
      const message = err instanceof Error ? err.message : ""
      setPaymentError(mapPaypalErrorMessage(message))
      setIsRedirectingToPaypal(false)
    }
  }

  if (!items.length && !order) {
    return <div className="px-6 py-20 text-center text-white/60">Il carrello è vuoto.</div>
  }

  return (
    <ShopLayout
      eyebrow={`Checkout · Step ${stepIndex}/3`}
      title={
        step === "review"
          ? "Riepilogo ordine"
          : step === "details"
            ? "Dati checkout"
            : "Pagamento finale"
      }
      intro={
        step === "review"
          ? "Controlla prodotti, formati, coupon e totale finale prima di proseguire."
          : step === "details"
            ? "Inserisci i dati di spedizione e conferma il riepilogo prima di passare al pagamento."
            : user?.role === "admin" && isGuestPreview
              ? "Preview finale cliente: l'ordine viene simulato e PayPal non viene avviato."
              : "Questo è l'ultimo passaggio: l'ordine è pronto e PayPal compare solo qui."
      }
    >
      <div className="mb-6 flex flex-wrap gap-3 text-xs uppercase tracking-[0.2em] text-white/45">
        {[
          { key: "review", label: "1. Riepilogo" },
          { key: "details", label: "2. Dati" },
          { key: "payment", label: "3. Pagamento" },
        ].map((item) => (
          <span
            key={item.key}
            className={`rounded-full border px-3 py-1 ${
              step === item.key ? "border-[#e3f503]/50 text-[#e3f503]" : "border-white/10 text-white/45"
            }`}
          >
            {item.label}
          </span>
        ))}
      </div>

      {step === "review" ? (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-4">
            {items.map((item) => (
              <article key={`${item.productId}-${item.variantId || item.format || "default"}`} className="shop-card flex flex-col gap-4 p-4 md:flex-row md:items-center">
                <img src={getProductPrimaryImage(item.product)} alt={item.product.title} className="h-28 w-full rounded-[20px] object-cover md:w-40" />
                <div className="min-w-0 flex-1">
                  <span className="shop-pill">{item.product.category}</span>
                  <h2 className="mt-3 text-xl font-semibold text-white">{item.product.title}</h2>
                  <p className="mt-2 text-sm text-white/65">
                    {item.variantLabel || item.format || "Variante"} · Qtà {item.quantity} · {formatPrice(getPriceForVariant(item.product, item.variantId))}
                  </p>
                </div>
                <div className="text-sm font-medium text-[#e3f503]">
                  {formatPrice(getPriceForVariant(item.product, item.variantId) * item.quantity)}
                </div>
              </article>
            ))}
          </section>

          <aside className="shop-card space-y-5 p-6">
            <div>
              <span className="shop-pill">Step 1</span>
              <h2 className="mt-4 text-2xl font-semibold text-white">Rivedi il tuo ordine</h2>
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
                <div className="flex items-center justify-between"><span>Spedizione</span><span>{formatPrice(pricing.shippingTotal)}</span></div>
                <div className="flex items-center justify-between border-t border-white/10 pt-3 text-base font-semibold text-white"><span>Totale</span><span>{formatPrice(pricing.total)}</span></div>
              </div>
            ) : (
              <p className="text-sm text-white/55">Calcolo del riepilogo in corso...</p>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setStep("details")}
                disabled={!pricing}
                className="rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Avanti
              </button>
              <Link
                to="/shop/cart"
                className="rounded-full border border-white/10 px-5 py-3 text-sm text-white/75 transition hover:border-white/25 hover:text-white"
              >
                Torna al carrello
              </Link>
            </div>
          </aside>
        </div>
      ) : null}

      {step === "details" ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
          <form onSubmit={handleCreateOrder} className="shop-card space-y-4 p-6 md:p-8">
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
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setStep("review")}
                className="rounded-full border border-white/10 px-5 py-3 text-sm text-white/75 transition hover:border-white/25 hover:text-white"
              >
                Indietro
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-white/90 disabled:cursor-wait disabled:opacity-70"
              >
                {submitting ? "Preparazione pagamento..." : "Vai al pagamento"}
              </button>
            </div>
          </form>

          <aside className="shop-card space-y-4 p-6">
            <span className="shop-pill">Step 2</span>
            <h2 className="text-2xl font-semibold text-white">Riepilogo conferma</h2>
            {items.map((item) => (
              <div key={`${item.productId}-${item.variantId || item.format || "default"}`} className="flex items-center justify-between gap-4 text-sm text-white/70">
                <span>{item.product.title} · {item.variantLabel || item.format || "Variante"} x {item.quantity}</span>
                <span>{formatPrice(getPriceForVariant(item.product, item.variantId) * item.quantity)}</span>
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
      ) : null}

      {step === "payment" && order ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
          <section className="shop-card space-y-4 p-6">
            <div className="grid gap-4 text-sm text-white/70 md:grid-cols-2">
              <div>
                <p className="text-white">Cliente</p>
                <p className="mt-2">{order.firstName} {order.lastName}</p>
                <p>{order.email}</p>
              </div>
              <div>
                <p className="text-white">Spedizione</p>
                <p className="mt-2">{order.addressLine1}</p>
                {order.addressLine2 ? <p>{order.addressLine2}</p> : null}
                <p>{order.postalCode} {order.city}</p>
                <p>{order.country}</p>
              </div>
            </div>

            <div className="space-y-3 border-t border-white/10 pt-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4 text-sm text-white/70">
                  <span>{item.title} · {item.variantLabel || item.format || "Variante"} x {item.quantity}</span>
                  <span>{formatPrice(item.lineTotal)}</span>
                </div>
              ))}
            </div>
          </section>

          <aside className="shop-card space-y-4 p-6">
            <span className="shop-pill">Step 3</span>
            <h2 className="text-2xl font-semibold text-white">Pagamento finale</h2>
            <div className="space-y-3 text-sm text-white/70">
              <div className="flex items-center justify-between"><span>Subtotale</span><span>{formatPrice(order.subtotal)}</span></div>
              <div className="flex items-center justify-between"><span>Sconti</span><span>-{formatPrice(order.discountTotal)}</span></div>
              <div className="flex items-center justify-between"><span>Spedizione</span><span>{formatPrice(order.shippingTotal)}</span></div>
              <div className="flex items-center justify-between border-t border-white/10 pt-3 text-base font-semibold text-white"><span>Totale</span><span>{formatPrice(order.total)}</span></div>
            </div>
            {user?.role === "admin" && isGuestPreview ? (
              <div className="rounded-2xl border border-sky-300/20 bg-sky-300/10 px-4 py-3 text-sm text-sky-100">
                Modalità preview cliente attiva: il pagamento PayPal reale è disattivato.
              </div>
            ) : payment ? (
              <p className="text-sm text-white/55">
                {payment.mode === "paypal_standard"
                  ? "PayPal si aprirà con importo finale e riferimento ordine già precompilati."
                  : "PayPal.Me si aprirà con l'importo finale già precompilato."}
              </p>
            ) : null}
            {paymentError ? (
              <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
                {paymentError}
              </div>
            ) : null}
            <div className="flex flex-wrap gap-3">
              {user?.role === "admin" && isGuestPreview ? (
                <button
                  type="button"
                  onClick={() => downloadInvoicePdf(order, settings)}
                  className="rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-white/90"
                >
                  Scarica ricevuta anteprima
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePayPalClick}
                  disabled={isRedirectingToPaypal}
                  className="rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-white/90 disabled:cursor-wait disabled:opacity-70"
                >
                  {isRedirectingToPaypal ? "Reindirizzamento a PayPal..." : "Paga con PayPal"}
                </button>
              )}
            </div>
          </aside>
        </div>
      ) : null}
    </ShopLayout>
  )
}
