import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import { getButtonClassName } from "../../../components/Button"
import { formatPrice } from "../../lib/format"
import { downloadInvoicePdf } from "../../lib/invoice"
import { getOrderFulfillmentStatusLabel, getOrderShippingStatusLabel } from "../../lib/order"
import { formatShippingMethodSummary } from "../../lib/shipping-methods.mjs"
import { ShopOrder, ShopSettings } from "../../types"

type AdminOrdersSectionProps = {
  orders: ShopOrder[]
  shopSettings: ShopSettings
  loadingProfitOrderId: number | null
  containWheel: (event: React.WheelEvent<HTMLElement>) => void
  onOpenOrderProfit: (orderId: number) => void
  onUpdateOrderStatus: (orderId: number, payload: { fulfillmentStatus: string; shippingStatus: string; trackingNumber: string; trackingUrl: string }) => void
}

export function AdminOrdersSection({
  orders,
  shopSettings,
  loadingProfitOrderId,
  onOpenOrderProfit,
  onUpdateOrderStatus,
}: AdminOrdersSectionProps) {
  const [drafts, setDrafts] = useState<Record<number, { fulfillmentStatus: string; shippingStatus: string; trackingNumber: string; trackingUrl: string }>>({})

  useEffect(() => {
    setDrafts(
      Object.fromEntries(
        orders.map((order) => [
          order.id,
          {
            fulfillmentStatus: order.fulfillmentStatus || "processing",
            shippingStatus: order.shippingStatus || "pending",
            trackingNumber: order.trackingNumber || "",
            trackingUrl: order.trackingUrl || "",
          },
        ]),
      ),
    )
  }, [orders])

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <article key={order.id} className="shop-card flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-lg font-semibold text-white">{order.orderReference}</p>
            <p className="mt-1 text-sm text-white/60">
              {order.firstName} {order.lastName} · {formatPrice(order.total)}
            </p>
            <p className="mt-2 text-xs uppercase tracking-[0.18em] text-white/45">
              Cliente: {getOrderFulfillmentStatusLabel(order.fulfillmentStatus)}
            </p>
            <div className="mt-3 space-y-1 text-sm text-white/55">
              {order.shippingMethod ? <p>{formatShippingMethodSummary(order.shippingMethod)}</p> : null}
              {order.shippingCarrier ? <p>Corriere: {String(order.shippingCarrier).toUpperCase()}</p> : null}
              <p>Stato spedizione: {getOrderShippingStatusLabel(order.shippingStatus, order.fulfillmentStatus)}</p>
              {order.trackingNumber ? <p>Tracking: {order.trackingNumber}</p> : null}
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
                      ...(current[order.id] || { shippingStatus: "pending", trackingNumber: "", trackingUrl: "" }),
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
                      ...(current[order.id] || { fulfillmentStatus: "processing", shippingStatus: "pending", trackingUrl: "" }),
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
                      ...(current[order.id] || { fulfillmentStatus: "processing", trackingNumber: "", trackingUrl: "" }),
                      shippingStatus: event.target.value,
                    },
                  }))
                }
              >
                <option value="pending">Spedizione in preparazione</option>
                <option value="accepted">Spedizione accettata</option>
                <option value="shipped">Spedizione spedita</option>
                <option value="failed">Spedizione da completare</option>
              </select>
              <input
                className="shop-input"
                placeholder="Link tracking opzionale"
                value={drafts[order.id]?.trackingUrl || ""}
                onChange={(event) =>
                  setDrafts((current) => ({
                    ...current,
                    [order.id]: {
                      ...(current[order.id] || { fulfillmentStatus: "processing", shippingStatus: "pending", trackingNumber: "" }),
                      trackingUrl: event.target.value,
                    },
                  }))
                }
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() =>
                  onUpdateOrderStatus(order.id, drafts[order.id] || { fulfillmentStatus: "processing", shippingStatus: "pending", trackingNumber: "", trackingUrl: "" })
                }
                className={getButtonClassName({ variant: "cart", size: "sm" })}
              >
                Salva
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}
