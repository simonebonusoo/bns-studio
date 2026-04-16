import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import { getButtonClassName } from "../../components/Button"
import { ShopLayout } from "../components/ShopLayout"
import { useShopAuth } from "../context/ShopAuthProvider"
import { apiFetch } from "../lib/api"
import { formatPrice } from "../lib/format"
import { formatVariantSelectionLabel } from "../lib/product"
import { getOrderFulfillmentStatusLabel, getOrderStatusLabel } from "../lib/order"
import { ShopOrder } from "../types"

export function ShopProfilePage() {
  const { user, effectiveRole, isGuestPreview, enableGuestPreview, disableGuestPreview } = useShopAuth()
  const [orders, setOrders] = useState<ShopOrder[]>([])
  const [trackingFeedback, setTrackingFeedback] = useState<Record<number, string>>({})

  useEffect(() => {
    apiFetch<ShopOrder[]>("/orders/my-orders").then(setOrders)
  }, [])

  useEffect(() => {
    if (!Object.keys(trackingFeedback).length) return undefined

    const timeoutId = window.setTimeout(() => setTrackingFeedback({}), 3200)
    return () => window.clearTimeout(timeoutId)
  }, [trackingFeedback])

  function buildOrderItemsSummary(order: ShopOrder) {
    const previewItems = order.items.slice(0, 2).map((item) => `${item.title} · ${formatVariantSelectionLabel(item)}${item.personalizationText ? ` (${item.personalizationText})` : ""} x ${item.quantity}`)
    if (order.items.length > 2) {
      previewItems.push(`+ ${order.items.length - 2} altri articoli`)
    }
    return previewItems.join(" • ")
  }

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
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="shop-pill">{getOrderFulfillmentStatusLabel(order.fulfillmentStatus, order.shippingStatus)}</span>
                <h2 className="mt-3 text-xl font-semibold text-white">{order.orderReference}</h2>
                <p className="mt-1 text-sm text-white/55">{new Date(order.createdAt).toLocaleString("it-IT")}</p>
                <p className="mt-2 text-sm text-white/62">Pagamento: {getOrderStatusLabel(order.status)}</p>
              </div>
              <div className="text-right text-sm text-white/70">
                <p>Totale</p>
                <p className="mt-1 text-base font-semibold text-white">{formatPrice(order.total)}</p>
              </div>
            </div>

            <div className="space-y-3 text-sm text-white/65">
              <p className="text-white/72">{buildOrderItemsSummary(order)}</p>
              <div className="flex items-center justify-between"><span>Sconti</span><span>{formatPrice(order.discountTotal)}</span></div>
              <div className="flex items-center justify-between"><span>{order.shippingLabel || "Spedizione"}</span><span>{formatPrice(order.shippingTotal)}</span></div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link to={`/shop/orders/${order.orderReference}`} className={getButtonClassName({ variant: "profile", size: "sm" })}>
                Informazioni ordine
              </Link>
              <button
                type="button"
                onClick={() => {
                  if (order.trackingUrl) {
                    window.open(order.trackingUrl, "_blank", "noopener,noreferrer")
                    return
                  }
                  setTrackingFeedback((current) => ({
                    ...current,
                    [order.id]: "Tracking ancora non disponibile, riprova tra un po'.",
                  }))
                }}
                className={getButtonClassName({ variant: "cart", size: "sm" })}
              >
                Tracking
              </button>
            </div>

            {trackingFeedback[order.id] ? <p className="text-sm text-white/45">{trackingFeedback[order.id]}</p> : null}
          </article>
        ))}
      </div>
    </ShopLayout>
  )
}
