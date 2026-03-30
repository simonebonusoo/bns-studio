import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import { getButtonClassName } from "../../../components/Button"
import { formatPrice } from "../../lib/format"
import { downloadInvoicePdf } from "../../lib/invoice"
import { getOrderFulfillmentStatusLabel } from "../../lib/order"
import { buildAdminOrderShippingSummary } from "../../lib/order-shipping.mjs"
import { ShopOrder, ShopSettings } from "../../types"

type AdminOrdersSectionProps = {
  orders: ShopOrder[]
  shopSettings: ShopSettings
  loadingProfitOrderId: number | null
  containWheel: (event: React.WheelEvent<HTMLElement>) => void
  onOpenOrderProfit: (orderId: number) => void
  onUpdateOrderStatus: (orderId: number, payload: { fulfillmentStatus: string; shippingStatus: string; shippingHandoffMode: string; trackingNumber: string; trackingUrl: string; labelUrl: string }) => void
}

export function AdminOrdersSection({
  orders,
  shopSettings,
  loadingProfitOrderId,
  onOpenOrderProfit,
  onUpdateOrderStatus,
}: AdminOrdersSectionProps) {
  const [drafts, setDrafts] = useState<Record<number, { fulfillmentStatus: string; shippingStatus: string; shippingHandoffMode: string; trackingNumber: string; trackingUrl: string; labelUrl: string }>>({})

  useEffect(() => {
    setDrafts(
      Object.fromEntries(
        orders.map((order) => [
          order.id,
          {
            fulfillmentStatus: order.fulfillmentStatus || "processing",
            shippingStatus: order.shippingStatus || "pending",
            shippingHandoffMode: order.shippingHandoffMode || "",
            trackingNumber: order.trackingNumber || "",
            trackingUrl: order.trackingUrl || "",
            labelUrl: order.labelUrl || "",
          },
        ]),
      ),
    )
  }, [orders])

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <article key={order.id} className="shop-card flex flex-col gap-4 p-6 lg:flex-row lg:items-start lg:justify-between">
          {(() => {
            const shipping = buildAdminOrderShippingSummary(order)
            return (
          <>
          <div>
            <p className="text-lg font-semibold text-white">{order.orderReference}</p>
            <p className="mt-1 text-sm text-white/60">
              {order.firstName} {order.lastName} · {formatPrice(order.total)}
            </p>
            <p className="mt-2 text-xs uppercase tracking-[0.18em] text-white/45">
              Cliente: {getOrderFulfillmentStatusLabel(order.fulfillmentStatus)}
            </p>
            <div className="mt-4 grid gap-3 rounded-[22px] border border-white/10 bg-white/[0.03] p-4 text-sm text-white/60">
              <div className="grid gap-2 md:grid-cols-2">
                <p><span className="text-white">Corriere:</span> {shipping.carrier}</p>
                <p><span className="text-white">Metodo:</span> {shipping.method}</p>
                <p><span className="text-white">Stato spedizione:</span> {shipping.status}</p>
                <p><span className="text-white">Conferimento:</span> {shipping.handoffMode}</p>
                <p><span className="text-white">Tracking:</span> {shipping.trackingNumber}</p>
                <p><span className="text-white">Riferimento:</span> {shipping.shipmentReference}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {shipping.trackingUrl ? (
                  <a href={shipping.trackingUrl} target="_blank" rel="noreferrer" className={getButtonClassName({ variant: "profile", size: "sm" })}>
                    Apri tracking
                  </a>
                ) : (
                  <span className="rounded-full border border-white/10 px-3 py-2 text-xs uppercase tracking-[0.18em] text-white/40">Tracking non ancora disponibile</span>
                )}
                {shipping.labelUrl ? (
                  <a href={shipping.labelUrl} target="_blank" rel="noreferrer" className={getButtonClassName({ variant: "cart", size: "sm" })}>
                    Apri etichetta PDF
                  </a>
                ) : (
                  <span className="rounded-full border border-white/10 px-3 py-2 text-xs uppercase tracking-[0.18em] text-white/40">Etichetta non ancora disponibile</span>
                )}
              </div>
              {shipping.shippingError ? <p className="text-amber-100">In attesa di generazione: {shipping.shippingError}</p> : null}
            </div>
          </div>
          <div className="flex flex-col items-stretch gap-3 lg:min-w-[320px]">
            <div className="flex flex-wrap gap-2">
              <Link to={`/shop/orders/${order.orderReference}`} className={getButtonClassName({ variant: "profile", size: "sm" })}>
                Visualizza ordine
              </Link>
              <button type="button" onClick={() => onOpenOrderProfit(order.id)} className={getButtonClassName({ variant: "cart", size: "sm" })}>
                {loadingProfitOrderId === order.id ? "Calcolo..." : "Visualizza guadagno"}
              </button>
              {order.status === "paid" || order.status === "shipped" ? (
                <button type="button" onClick={() => downloadInvoicePdf(order, shopSettings)} className={getButtonClassName({ variant: "profile", size: "sm" })}>
                  Scarica ricevuta
                </button>
              ) : null}
            </div>
            <div className="grid gap-3 md:grid-cols-[minmax(0,0.9fr)_minmax(0,0.9fr)]">
              <select
                className="shop-select"
                value={drafts[order.id]?.fulfillmentStatus || "processing"}
                onChange={(event) =>
                  setDrafts((current) => ({
                    ...current,
                    [order.id]: {
                      ...(current[order.id] || { shippingStatus: "pending", shippingHandoffMode: "", trackingNumber: "", trackingUrl: "", labelUrl: "" }),
                      fulfillmentStatus: event.target.value,
                    },
                  }))
                }
              >
                <option value="processing">Ordine in lavorazione</option>
                <option value="accepted">Ordine accettato</option>
                <option value="in_progress">Ordine in corso</option>
                <option value="shipped">Ordine spedito</option>
                <option value="completed">Ordine completato</option>
              </select>
              <input
                className="shop-input"
                placeholder="Tracking number"
                value={drafts[order.id]?.trackingNumber || ""}
                onChange={(event) =>
                  setDrafts((current) => ({
                    ...current,
                    [order.id]: {
                      ...(current[order.id] || { fulfillmentStatus: "processing", shippingStatus: "pending", shippingHandoffMode: "", trackingUrl: "", labelUrl: "" }),
                      trackingNumber: event.target.value,
                    },
                  }))
                }
              />
              <select
                className="shop-select"
                value={drafts[order.id]?.shippingStatus || "pending"}
                onChange={(event) =>
                  setDrafts((current) => ({
                    ...current,
                    [order.id]: {
                      ...(current[order.id] || { fulfillmentStatus: "processing", shippingHandoffMode: "", trackingNumber: "", trackingUrl: "", labelUrl: "" }),
                      shippingStatus: event.target.value,
                    },
                  }))
                }
              >
                <option value="pending">Spedizione in preparazione</option>
                <option value="accepted">Spedizione accettata</option>
                <option value="created">Spedizione creata</option>
                <option value="in_transit">Spedizione in transito</option>
                <option value="shipped">Spedizione spedita</option>
                <option value="delivered">Spedizione consegnata</option>
                <option value="failed">Spedizione da completare</option>
                <option value="not_created">In attesa di creazione</option>
              </select>
              <select
                className="shop-select"
                value={drafts[order.id]?.shippingHandoffMode || ""}
                onChange={(event) =>
                  setDrafts((current) => ({
                    ...current,
                    [order.id]: {
                      ...(current[order.id] || { fulfillmentStatus: "processing", shippingStatus: "pending", trackingNumber: "", trackingUrl: "", labelUrl: "" }),
                      shippingHandoffMode: event.target.value,
                    },
                  }))
                }
              >
                <option value="">Modalità da definire</option>
                <option value="dropoff">Drop-off</option>
                <option value="pickup">Pickup</option>
              </select>
              <input
                className="shop-input"
                placeholder="Link tracking opzionale"
                value={drafts[order.id]?.trackingUrl || ""}
                onChange={(event) =>
                  setDrafts((current) => ({
                    ...current,
                    [order.id]: {
                      ...(current[order.id] || { fulfillmentStatus: "processing", shippingStatus: "pending", shippingHandoffMode: "", trackingNumber: "", labelUrl: "" }),
                      trackingUrl: event.target.value,
                    },
                  }))
                }
              />
              <input
                className="shop-input"
                placeholder="Link etichetta PDF"
                value={drafts[order.id]?.labelUrl || ""}
                onChange={(event) =>
                  setDrafts((current) => ({
                    ...current,
                    [order.id]: {
                      ...(current[order.id] || { fulfillmentStatus: "processing", shippingStatus: "pending", shippingHandoffMode: "", trackingNumber: "", trackingUrl: "" }),
                      labelUrl: event.target.value,
                    },
                  }))
                }
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() =>
                  onUpdateOrderStatus(order.id, drafts[order.id] || { fulfillmentStatus: "processing", shippingStatus: "pending", shippingHandoffMode: "", trackingNumber: "", trackingUrl: "", labelUrl: "" })
                }
                className={getButtonClassName({ variant: "cart", size: "sm" })}
              >
                Salva
              </button>
            </div>
          </div>
          </>
            )
          })()}
        </article>
      ))}
    </div>
  )
}
