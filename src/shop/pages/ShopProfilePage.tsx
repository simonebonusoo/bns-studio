import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import { getButtonClassName } from "../../components/Button"
import { ShopLayout } from "../components/ShopLayout"
import { useShopAuth } from "../context/ShopAuthProvider"
import { apiFetch } from "../lib/api"
import { downloadInvoicePdf } from "../lib/invoice"
import { formatPrice } from "../lib/format"
import { getOrderFulfillmentStatusLabel, getOrderFulfillmentSteps, getOrderStatusLabel } from "../lib/order"
import { buildAdminOrderShippingSummary } from "../lib/order-shipping.mjs"
import { ShopOrder, ShopSettings } from "../types"

export function ShopProfilePage() {
  const { user, effectiveRole, isGuestPreview, enableGuestPreview, disableGuestPreview } = useShopAuth()
  const [orders, setOrders] = useState<ShopOrder[]>([])
  const [settings, setSettings] = useState<ShopSettings>({})

  useEffect(() => {
    apiFetch<ShopOrder[]>("/orders/my-orders").then(setOrders)
    apiFetch<ShopSettings>("/store/settings").then(setSettings)
  }, [])

  return (
    <ShopLayout
      eyebrow="Profilo"
      title={`Ciao, ${user?.username || user?.firstName || "cliente"}`}
      intro="Gestisci e controlla i tuoi ordini passati."
      actions={
        user?.role === "admin" ? (
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => (isGuestPreview ? disableGuestPreview() : enableGuestPreview())}
              className={getButtonClassName({ variant: "profile", size: "sm" })}
            >
              {isGuestPreview ? "Torna admin" : "Vedi come ospite"}
            </button>
            {effectiveRole === "admin" ? (
              <Link to="/shop/admin" className={getButtonClassName({ variant: "profile", size: "sm" })}>
                Admin
              </Link>
            ) : null}
          </div>
        ) : null
      }
    >
      {isGuestPreview ? (
        <div className="mb-6 rounded-[24px] border border-amber-300/20 bg-amber-300/10 px-5 py-4 text-sm text-amber-100">
          Modalità preview cliente attiva. I controlli admin sono nascosti e il checkout finale non avvia il pagamento PayPal reale.
        </div>
      ) : null}
      {!orders.length ? <div className="rounded-[24px] border border-dashed border-white/10 px-6 py-14 text-center text-white/60">Nessun ordine registrato per questo account.</div> : null}

      <div className="grid gap-5 xl:grid-cols-2">
        {orders.map((order) => (
          <article key={order.id} className="shop-card space-y-4 p-6">
            {(() => {
              const shipping = buildAdminOrderShippingSummary(order)
              return (
                <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="shop-pill">{getOrderFulfillmentStatusLabel(order.fulfillmentStatus)}</span>
                <h2 className="mt-3 text-xl font-semibold text-white">{order.orderReference}</h2>
                <p className="mt-1 text-sm text-white/55">{new Date(order.createdAt).toLocaleString("it-IT")}</p>
                <p className="mt-2 text-sm text-white/62">Pagamento: {getOrderStatusLabel(order.status)}</p>
              </div>
              <div className="text-right text-sm text-white/70">
                <p>Totale</p>
                <p className="mt-1 text-base font-semibold text-white">{formatPrice(order.total)}</p>
              </div>
            </div>

            <div className="space-y-2 text-sm text-white/65">
              <div className="flex items-center justify-between"><span>Sconti</span><span>{formatPrice(order.discountTotal)}</span></div>
              <div className="flex items-center justify-between"><span>{order.shippingLabel || "Spedizione"}</span><span>{formatPrice(order.shippingTotal)}</span></div>
            </div>

            <div className="space-y-2 rounded-[22px] border border-white/10 bg-white/[0.03] p-4 text-sm text-white/60">
              <p><span className="text-white">Metodo:</span> {shipping.method}</p>
              <p><span className="text-white">Stato spedizione:</span> {shipping.status}</p>
              <p><span className="text-white">Tracking:</span> {shipping.trackingNumber}</p>
            </div>

            <div className="grid gap-2 sm:grid-cols-5">
              {getOrderFulfillmentSteps(order.fulfillmentStatus).map((step) => (
                <div
                  key={step.key}
                  className={`rounded-2xl border px-3 py-3 text-center text-[11px] uppercase tracking-[0.18em] ${
                    step.current
                      ? "border-[#e3f503]/30 bg-[#e3f503]/12 text-[#eef879]"
                      : step.active
                        ? "border-white/18 bg-white/[0.06] text-white/78"
                        : "border-white/10 text-white/35"
                  }`}
                >
                  {step.label}
                </div>
              ))}
            </div>

            {shipping.trackingUrl ? (
              <a href={shipping.trackingUrl} target="_blank" rel="noreferrer" className="inline-flex text-sm text-white underline underline-offset-4 transition hover:text-[#eef879]">
                Traccia spedizione
              </a>
            ) : (
              <p className="text-sm text-white/45">Tracking non ancora disponibile.</p>
            )}

            <div className="flex flex-wrap gap-3">
              <Link to={`/shop/orders/${order.orderReference}`} className={getButtonClassName({ variant: "profile", size: "sm" })}>
                Visualizza ordine
              </Link>
              {order.status === "paid" || order.status === "shipped" ? (
                <button type="button" onClick={() => downloadInvoicePdf(order, settings)} className={getButtonClassName({ variant: "profile", size: "sm" })}>
                  Scarica ricevuta
                </button>
              ) : null}
            </div>
                </>
              )
            })()}
          </article>
        ))}
      </div>
    </ShopLayout>
  )
}
