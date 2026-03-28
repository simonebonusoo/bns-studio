import { useEffect, useState } from "react"
import { useLocation, useParams } from "react-router-dom"

import { ShopLayout } from "../components/ShopLayout"
import { useShopAuth } from "../context/ShopAuthProvider"
import { apiFetch } from "../lib/api"
import { downloadInvoicePdf } from "../lib/invoice"
import { formatPrice } from "../lib/format"
import { getOrderStatusLabel } from "../lib/order"
import { ShopOrder, ShopPayment, ShopSettings } from "../types"

const PAYPAL_UI_ERROR = "Pagamento PayPal momentaneamente non disponibile. Riprova tra poco."

function mapPaypalErrorMessage(message: string) {
  if (!message) return PAYPAL_UI_ERROR
  if (message === "Configurazione PayPal mancante nel progetto integrato") return message
  if (message === "Ordine non trovato") return message
  if (message === "Impossibile generare il link PayPal") return message
  return PAYPAL_UI_ERROR
}

export function ShopReceiptPage() {
  const { effectiveRole } = useShopAuth()
  const location = useLocation()
  const { orderReference = "" } = useParams()
  const state = location.state as { order?: ShopOrder; payment?: ShopPayment | null; paymentError?: string | null } | null
  const [order, setOrder] = useState<ShopOrder | null>(state?.order || null)
  const [payment, setPayment] = useState<ShopPayment | null>(state?.payment || null)
  const [settings, setSettings] = useState<ShopSettings>({})
  const [paymentError, setPaymentError] = useState(state?.paymentError || "")
  const [isRedirectingToPaypal, setIsRedirectingToPaypal] = useState(false)
  const paymentCancelled = new URLSearchParams(location.search).get("payment") === "cancelled"

  useEffect(() => {
    if (!state?.paymentError) {
      setPaymentError("")
    }
    setIsRedirectingToPaypal(false)
    apiFetch<ShopOrder>(`/orders/receipt/${orderReference}`).then(setOrder).catch(() => undefined)
    apiFetch<ShopSettings>("/store/settings").then(setSettings).catch(() => undefined)
  }, [orderReference, state?.paymentError])

  useEffect(() => {
    if (order && order.status !== "pending") {
      setPaymentError("")
      setIsRedirectingToPaypal(false)
    }
  }, [order])

  if (!order) {
    return <div className="px-6 py-20 text-center text-white/60">Caricamento ricevuta...</div>
  }

  const isPaid = order.status === "paid" || order.status === "shipped"
  const isAdminView = effectiveRole === "admin"

  async function handlePayPalClick() {
    if (isRedirectingToPaypal) {
      return
    }

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
    } catch (error) {
      const message = error instanceof Error ? error.message : ""
      setPaymentError(mapPaypalErrorMessage(message))
      setIsRedirectingToPaypal(false)
    }
  }

  return (
    <ShopLayout
      eyebrow={isAdminView ? "Ordine admin" : isPaid ? "Ricevuta" : "Conferma ordine"}
      title={order.orderReference}
      intro={
        isAdminView
          ? "Vista gestionale dell'ordine: riepilogo completo cliente, prodotti acquistati e download diretto della ricevuta PDF."
          : isPaid
          ? "Pagamento completato. Ora puoi aprire e scaricare la ricevuta dell'ordine."
          : "Il checkout è pronto ma l'ordine definitivo verrà creato solo dopo il pagamento PayPal completato. La ricevuta sarà disponibile subito dopo."
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
        <section className="shop-card space-y-4 p-6">
          <div className="grid gap-4 md:grid-cols-2 text-sm text-white/70">
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
          <span className="shop-pill">{getOrderStatusLabel(order.status)}</span>
          {!isAdminView && paymentCancelled ? <p className="text-sm text-amber-200">Pagamento annullato. Puoi riprovare con PayPal quando vuoi.</p> : null}
          <div className="space-y-3 text-sm text-white/70">
            <div className="flex items-center justify-between"><span>Subtotale</span><span>{formatPrice(order.subtotal)}</span></div>
            <div className="flex items-center justify-between"><span>Sconti</span><span>-{formatPrice(order.discountTotal)}</span></div>
            <div className="flex items-center justify-between"><span>Spedizione</span><span>{formatPrice(order.shippingTotal)}</span></div>
            <div className="flex items-center justify-between border-t border-white/10 pt-3 text-base font-semibold text-white"><span>Totale</span><span>{formatPrice(order.total)}</span></div>
          </div>
          {!isAdminView && !isPaid && payment ? (
            <p className="text-sm text-white/55">
              {payment.mode === "paypal_standard"
                ? "PayPal si aprirà con importo finale e riferimento ordine già precompilati."
                : "PayPal.Me si aprirà con l'importo finale già precompilato."}
            </p>
          ) : null}

          <div className="flex flex-col gap-3">
            {!isAdminView && !isPaid ? (
              <button
                type="button"
                onClick={handlePayPalClick}
                disabled={isRedirectingToPaypal}
                aria-busy={isRedirectingToPaypal}
                className="relative z-20 inline-flex w-full cursor-pointer items-center justify-center rounded-full bg-[#e3f503] px-5 py-3 text-center text-sm font-semibold text-black transition hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
                style={{ pointerEvents: isRedirectingToPaypal ? "none" : "auto" }}
              >
                {isRedirectingToPaypal ? "Reindirizzamento a PayPal..." : "Paga con PayPal"}
              </button>
            ) : null}
            {!isAdminView && !isPaid && paymentError ? (
              <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
                {paymentError}
              </div>
            ) : null}
            {isPaid ? (
              <>
                <button type="button" onClick={() => downloadInvoicePdf(order, settings)} className="rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-white/90">
                  Scarica ricevuta PDF
                </button>
              </>
            ) : (
              <p className="text-sm text-white/55">La ricevuta sarà disponibile dopo il pagamento.</p>
            )}
          </div>
        </aside>
      </div>
    </ShopLayout>
  )
}
