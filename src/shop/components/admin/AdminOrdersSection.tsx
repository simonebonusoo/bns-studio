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
  packlinkProNewShipmentUrl: string
  defaultParcel: {
    weightKg: number
    lengthCm: number
    widthCm: number
    heightCm: number
  }
  loadingProfitOrderId: number | null
  containWheel: (event: React.WheelEvent<HTMLElement>) => void
  onOpenOrderProfit: (orderId: number) => void
  onUpdateOrderStatus: (orderId: number, payload: { fulfillmentStatus: string; shippingStatus: string; trackingNumber: string; trackingUrl: string; labelUrl: string }) => Promise<ShopOrder | null>
  onCreateShipment: (orderId: number) => Promise<ShopOrder | null>
  onRefreshTracking: (orderId: number) => Promise<ShopOrder | null>
}

export function AdminOrdersSection({
  orders,
  shopSettings,
  packlinkProNewShipmentUrl,
  defaultParcel,
  loadingProfitOrderId,
  onOpenOrderProfit,
  onUpdateOrderStatus,
  onCreateShipment,
  onRefreshTracking,
}: AdminOrdersSectionProps) {
  const [drafts, setDrafts] = useState<Record<number, { fulfillmentStatus: string; shippingStatus: string; trackingNumber: string; trackingUrl: string; labelUrl: string }>>({})
  const [shippingFeedback, setShippingFeedback] = useState<Record<number, string>>({})
  const [shippingActionState, setShippingActionState] = useState<Record<number, "create" | "refresh" | "save" | null>>({})

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
            labelUrl: order.labelUrl || "",
          },
        ]),
      ),
    )
  }, [orders])

  useEffect(() => {
    if (!Object.keys(shippingFeedback).length) return undefined

    const timeoutId = window.setTimeout(() => setShippingFeedback({}), 3200)
    return () => window.clearTimeout(timeoutId)
  }, [shippingFeedback])

  function markOrderUpdated(orderId: number, message: string) {
    setShippingFeedback((current) => ({ ...current, [orderId]: message }))
  }

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
            <div
              className={`mt-4 grid gap-3 rounded-[22px] border p-4 text-sm text-white/60 transition-all duration-300 ${
                shippingFeedback[order.id]
                  ? "border-emerald-300/40 bg-emerald-400/[0.08] shadow-[0_0_0_1px_rgba(110,231,183,0.16)]"
                  : "border-white/10 bg-white/[0.03]"
              }`}
            >
              <div className="grid gap-2 md:grid-cols-2">
                <p><span className="text-white">Metodo:</span> {shipping.method}</p>
                <p><span className="text-white">Costo spedizione:</span> {typeof order.shippingCost === "number" ? formatPrice(order.shippingCost) : "Non disponibile"}</p>
                <p><span className="text-white">Stato spedizione:</span> {shipping.status}</p>
                <p><span className="text-white">Tracking:</span> {shipping.trackingNumber}</p>
                <p><span className="text-white">Riferimento:</span> {shipping.shipmentReference}</p>
                <p><span className="text-white">Peso:</span> {defaultParcel.weightKg} kg</p>
                <p><span className="text-white">Lunghezza:</span> {defaultParcel.lengthCm} cm</p>
                <p><span className="text-white">Larghezza:</span> {defaultParcel.widthCm} cm</p>
                <p><span className="text-white">Altezza:</span> {defaultParcel.heightCm} cm</p>
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
              {shippingFeedback[order.id] ? (
                <p className="rounded-2xl border border-emerald-200/20 bg-emerald-300/10 px-3 py-2 text-sm text-emerald-100">
                  {shippingFeedback[order.id]}
                </p>
              ) : null}
              {packlinkProNewShipmentUrl ? (
                <p className="text-xs text-white/45">
                  Packlink Pro: <a href={packlinkProNewShipmentUrl} target="_blank" rel="noreferrer" className="text-[#e3f503] underline underline-offset-4">Nuova spedizione</a>
                </p>
              ) : null}
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
              {!order.trackingNumber || !order.shipmentReference ? (
                <button
                  type="button"
                  onClick={async () => {
                    setShippingActionState((current) => ({ ...current, [order.id]: "create" }))
                    try {
                      const updatedOrder = await onCreateShipment(order.id)
                      if (updatedOrder) {
                        markOrderUpdated(order.id, "Spedizione salvata e visibile qui sotto.")
                      }
                    } finally {
                      setShippingActionState((current) => ({ ...current, [order.id]: null }))
                    }
                  }}
                  className={getButtonClassName({ variant: "cart", size: "sm" })}
                >
                  {shippingActionState[order.id] === "create" ? "Apertura..." : "Crea spedizione"}
                </button>
              ) : null}
              <button
                type="button"
                onClick={async () => {
                  setShippingActionState((current) => ({ ...current, [order.id]: "refresh" }))
                  try {
                    const updatedOrder = await onRefreshTracking(order.id)
                    if (updatedOrder) {
                      markOrderUpdated(order.id, "Tracking aggiornato e visibile qui sotto.")
                    }
                  } finally {
                    setShippingActionState((current) => ({ ...current, [order.id]: null }))
                  }
                }}
                className={getButtonClassName({ variant: "profile", size: "sm" })}
              >
                {shippingActionState[order.id] === "refresh" ? "Verifica..." : "Tracking manuale"}
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
                      ...(current[order.id] || { shippingStatus: "pending", trackingNumber: "", trackingUrl: "", labelUrl: "" }),
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
                      ...(current[order.id] || { fulfillmentStatus: "processing", shippingStatus: "pending", trackingUrl: "", labelUrl: "" }),
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
                      ...(current[order.id] || { fulfillmentStatus: "processing", trackingNumber: "", trackingUrl: "", labelUrl: "" }),
                      shippingStatus: event.target.value,
                    },
                  }))
                }
              >
                <option value="pending">Spedizione in preparazione</option>
                <option value="accepted">Spedizione accettata</option>
                <option value="created">Spedizione creata</option>
                <option value="in_transit">Spedizione in transito</option>
                <option value="out_for_delivery">In consegna</option>
                <option value="shipped">Spedizione spedita</option>
                <option value="delivered">Spedizione consegnata</option>
                <option value="failed">Spedizione da completare</option>
                <option value="not_created">In attesa di creazione</option>
              </select>
              <input
                className="shop-input"
                placeholder="Link tracking opzionale"
                value={drafts[order.id]?.trackingUrl || ""}
                onChange={(event) =>
                  setDrafts((current) => ({
                    ...current,
                    [order.id]: {
                      ...(current[order.id] || { fulfillmentStatus: "processing", shippingStatus: "pending", trackingNumber: "", labelUrl: "" }),
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
                      ...(current[order.id] || { fulfillmentStatus: "processing", shippingStatus: "pending", trackingNumber: "", trackingUrl: "" }),
                      labelUrl: event.target.value,
                    },
                  }))
                }
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={async () => {
                  setShippingActionState((current) => ({ ...current, [order.id]: "save" }))
                  try {
                    const updatedOrder = await onUpdateOrderStatus(
                      order.id,
                      drafts[order.id] || { fulfillmentStatus: "processing", shippingStatus: "pending", trackingNumber: "", trackingUrl: "", labelUrl: "" },
                    )
                    if (updatedOrder) {
                      markOrderUpdated(order.id, "Dati ordine aggiornati e visibili qui sotto.")
                    }
                  } finally {
                    setShippingActionState((current) => ({ ...current, [order.id]: null }))
                  }
                }}
                className={getButtonClassName({ variant: "cart", size: "sm" })}
              >
                {shippingActionState[order.id] === "save" ? "Salvataggio..." : "Salva"}
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
