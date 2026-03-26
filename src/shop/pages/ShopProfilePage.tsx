import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import { ShopLayout } from "../components/ShopLayout"
import { useShopAuth } from "../context/ShopAuthProvider"
import { apiFetch } from "../lib/api"
import { downloadInvoicePdf } from "../lib/invoice"
import { formatPrice } from "../lib/format"
import { getOrderStatusLabel } from "../lib/order"
import { ShopOrder, ShopSettings } from "../types"

export function ShopProfilePage() {
  const { user } = useShopAuth()
  const [orders, setOrders] = useState<ShopOrder[]>([])
  const [settings, setSettings] = useState<ShopSettings>({})

  useEffect(() => {
    apiFetch<ShopOrder[]>("/orders/my-orders").then(setOrders)
    apiFetch<ShopSettings>("/store/settings").then(setSettings)
  }, [])

  return (
    <ShopLayout eyebrow="Profilo" title={`Ciao, ${user?.username || user?.firstName || "cliente"}`} intro="Gestisci e controlla i tuoi ordini passati." actions={user?.role === "admin" ? <Link to="/shop/admin" className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:border-white/25 hover:text-white">Admin</Link> : null}>
      {!orders.length ? <div className="rounded-[24px] border border-dashed border-white/10 px-6 py-14 text-center text-white/60">Nessun ordine registrato per questo account.</div> : null}

      <div className="grid gap-5 xl:grid-cols-2">
        {orders.map((order) => (
          <article key={order.id} className="shop-card space-y-4 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="shop-pill">{getOrderStatusLabel(order.status)}</span>
                <h2 className="mt-3 text-xl font-semibold text-white">{order.orderReference}</h2>
                <p className="mt-1 text-sm text-white/55">{new Date(order.createdAt).toLocaleString("it-IT")}</p>
              </div>
              <div className="text-right text-sm text-white/70">
                <p>Totale</p>
                <p className="mt-1 text-base font-semibold text-white">{formatPrice(order.total)}</p>
              </div>
            </div>

            <div className="space-y-2 text-sm text-white/65">
              <div className="flex items-center justify-between"><span>Sconti</span><span>{formatPrice(order.discountTotal)}</span></div>
              <div className="flex items-center justify-between"><span>Spedizione</span><span>{formatPrice(order.shippingTotal)}</span></div>
            </div>

            <div className="flex flex-wrap gap-3">
              {order.status === "paid" || order.status === "shipped" ? (
                <>
                  <Link to={`/shop/orders/${order.orderReference}`} className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/75 transition hover:border-white/25 hover:text-white">
                    Visualizza ordine
                  </Link>
                  <button type="button" onClick={() => downloadInvoicePdf(order, settings)} className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/75 transition hover:border-white/25 hover:text-white">
                    Scarica ricevuta
                  </button>
                </>
              ) : (
                <span className="text-sm text-white/55">La ricevuta sarà disponibile dopo il pagamento.</span>
              )}
            </div>
          </article>
        ))}
      </div>
    </ShopLayout>
  )
}
