import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import { getButtonClassName } from "../../../components/Button"
import { formatPrice } from "../../lib/format"
import { downloadInvoicePdf } from "../../lib/invoice"
import { getOrderFulfillmentStatusLabel } from "../../lib/order"
import { ShopOrder, ShopSettings } from "../../types"

type AdminOrdersSectionProps = {
  orders: ShopOrder[]
  shopSettings: ShopSettings
  loadingProfitOrderId: number | null
  containWheel: (event: React.WheelEvent<HTMLElement>) => void
  onOpenOrderProfit: (orderId: number) => void
  onUpdateOrderStatus: (orderId: number, payload: { fulfillmentStatus: string; trackingUrl: string }) => void
}

export function AdminOrdersSection({
  orders,
  shopSettings,
  loadingProfitOrderId,
  onOpenOrderProfit,
  onUpdateOrderStatus,
}: AdminOrdersSectionProps) {
  const [drafts, setDrafts] = useState<Record<number, { fulfillmentStatus: string; trackingUrl: string }>>({})

  useEffect(() => {
    setDrafts(
      Object.fromEntries(
        orders.map((order) => [
          order.id,
          {
            fulfillmentStatus: order.fulfillmentStatus || "processing",
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
            <div className="grid gap-3 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)_auto]">
              <select
                className="shop-select"
                value={drafts[order.id]?.fulfillmentStatus || "processing"}
                onChange={(event) =>
                  setDrafts((current) => ({
                    ...current,
                    [order.id]: { ...(current[order.id] || { trackingUrl: "" }), fulfillmentStatus: event.target.value },
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
                placeholder="Link tracking opzionale"
                value={drafts[order.id]?.trackingUrl || ""}
                onChange={(event) =>
                  setDrafts((current) => ({
                    ...current,
                    [order.id]: { ...(current[order.id] || { fulfillmentStatus: "processing" }), trackingUrl: event.target.value },
                  }))
                }
              />
              <button
                type="button"
                onClick={() => onUpdateOrderStatus(order.id, drafts[order.id] || { fulfillmentStatus: "processing", trackingUrl: "" })}
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
