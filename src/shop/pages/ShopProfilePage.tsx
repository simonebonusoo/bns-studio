import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import { getButtonClassName } from "../../components/Button"
import { ShopLayout } from "../components/ShopLayout"
import { OrderTimeline } from "../components/orders/OrderTimeline"
import { useShopAuth } from "../context/ShopAuthProvider"
import { apiFetch } from "../lib/api"
import { formatPrice } from "../lib/format"
import { getOrderFulfillmentStatusLabel, getOrderStatusLabel } from "../lib/order"
import { ShopOrder } from "../types"

export function ShopProfilePage() {
  const { user, effectiveRole, isGuestPreview, enableGuestPreview, disableGuestPreview } = useShopAuth()
  const [orders, setOrders] = useState<ShopOrder[]>([])

  useEffect(() => {
    apiFetch<ShopOrder[]>("/orders/my-orders").then(setOrders)
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

            <OrderTimeline
              order={order}
              actions={
                <>
                  <Link to={`/shop/orders/${order.orderReference}`} className={getButtonClassName({ variant: "profile", size: "sm" })}>
                    Visualizza ordine
                  </Link>
                  {order.trackingUrl ? (
                    <a
                      href={order.trackingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={getButtonClassName({ variant: "cart", size: "sm" })}
                    >
                      Traccia spedizione
                    </a>
                  ) : null}
                </>
              }
            />
          </article>
        ))}
      </div>
    </ShopLayout>
  )
}
