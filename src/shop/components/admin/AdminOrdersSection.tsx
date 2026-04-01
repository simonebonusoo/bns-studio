import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import { getButtonClassName, getDangerButtonClassName } from "../../../components/Button"
import { formatPrice } from "../../lib/format"
import { downloadInvoicePdf } from "../../lib/invoice"
import { getOrderFulfillmentStatusLabel } from "../../lib/order"
import { buildAdminOrderShippingSummary } from "../../lib/order-shipping.mjs"
import { ShopOrder, ShopSettings } from "../../types"

type OrderDraft = {
  fulfillmentStatus: string
  shippingStatus: string
  trackingNumber: string
  shipmentUrl: string
  trackingUrl: string
  labelUrl: string
}

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
  onUpdateOrderStatus: (orderId: number, payload: OrderDraft) => Promise<ShopOrder | null>
  onCreateShipment: (orderId: number) => Promise<ShopOrder | null>
  onRefreshTracking: (orderId: number) => Promise<ShopOrder | null>
  onDeleteOrder: (orderId: number) => Promise<void>
}

function buildDraft(order: ShopOrder): OrderDraft {
  return {
    fulfillmentStatus: order.fulfillmentStatus || "processing",
    shippingStatus: order.shippingStatus || "pending",
    trackingNumber: order.trackingNumber || "",
    shipmentUrl: order.shipmentUrl || "",
    trackingUrl: order.trackingUrl || "",
    labelUrl: order.labelUrl || "",
  }
}

function hasCreatedShipment(order: ShopOrder) {
  if (order.shipmentUrl || order.trackingNumber || order.trackingUrl || order.labelUrl) return true
  return ["accepted", "created", "in_transit", "out_for_delivery", "shipped", "delivered"].includes(String(order.shippingStatus || "").trim().toLowerCase())
}

function InfoSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-white/42">{title}</p>
      <div className="mt-3 grid gap-3">{children}</div>
    </section>
  )
}

function InfoRow({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm text-white/62">
      <span>{label}</span>
      <span className="text-right font-medium text-white">{value}</span>
    </div>
  )
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
  onDeleteOrder,
}: AdminOrdersSectionProps) {
  const [drafts, setDrafts] = useState<Record<number, OrderDraft>>({})
  const [shippingFeedback, setShippingFeedback] = useState<Record<number, string>>({})
  const [shippingActionState, setShippingActionState] = useState<Record<number, "create" | "refresh" | "save" | "delete" | null>>({})

  useEffect(() => {
    setDrafts(Object.fromEntries(orders.map((order) => [order.id, buildDraft(order)])))
  }, [orders])

  useEffect(() => {
    if (!Object.keys(shippingFeedback).length) return undefined
    const timeoutId = window.setTimeout(() => setShippingFeedback({}), 3200)
    return () => window.clearTimeout(timeoutId)
  }, [shippingFeedback])

  function updateDraft(orderId: number, patch: Partial<OrderDraft>) {
    setDrafts((current) => ({
      ...current,
      [orderId]: {
        ...(current[orderId] || {
          fulfillmentStatus: "processing",
          shippingStatus: "pending",
          trackingNumber: "",
          shipmentUrl: "",
          trackingUrl: "",
          labelUrl: "",
        }),
        ...patch,
      },
    }))
  }

  function markOrderUpdated(orderId: number, message: string) {
    setShippingFeedback((current) => ({ ...current, [orderId]: message }))
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const shipping = buildAdminOrderShippingSummary(order)
        const shipmentCreated = hasCreatedShipment(order)
        const shipmentPageUrl = shipping.shipmentUrl
        const draft = drafts[order.id] || buildDraft(order)

        return (
          <article key={order.id} className="shop-card p-6">
            <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
              <section
                className={`rounded-[26px] border p-5 transition-all duration-300 ${
                  shippingFeedback[order.id]
                    ? "border-emerald-300/40 bg-emerald-400/[0.08] shadow-[0_0_0_1px_rgba(110,231,183,0.16)]"
                    : "border-white/10 bg-white/[0.03]"
                }`}
              >
                <div className="flex flex-col gap-3 border-b border-white/10 pb-5 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-white">{order.orderReference}</p>
                    <p className="mt-1 text-sm text-white/58">
                      {order.firstName} {order.lastName} · {new Date(order.createdAt).toLocaleString("it-IT")}
                    </p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/42">Totale cliente</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{formatPrice(order.total)}</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                  <InfoSection title="Stato ordine">
                    <InfoRow label="Stato ordine" value={getOrderFulfillmentStatusLabel(order.fulfillmentStatus)} />
                    <InfoRow label="Stato spedizione" value={shipping.status} />
                    <InfoRow label="Metodo scelto" value={shipping.method} />
                  </InfoSection>

                  <InfoSection title="Dimensioni pacco">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <InfoRow label="Peso" value={`${defaultParcel.weightKg} kg`} />
                      <InfoRow label="Lunghezza" value={`${defaultParcel.lengthCm} cm`} />
                      <InfoRow label="Larghezza" value={`${defaultParcel.widthCm} cm`} />
                      <InfoRow label="Altezza" value={`${defaultParcel.heightCm} cm`} />
                    </div>
                  </InfoSection>
                </div>

                <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                  <InfoSection title="Totale ordine">
                    <InfoRow label="Totale speso dal cliente" value={formatPrice(order.total)} />
                    <InfoRow label="Costo spedizione addebitato" value={typeof order.shippingCost === "number" ? formatPrice(order.shippingCost) : "Non disponibile"} />
                  </InfoSection>

                  <InfoSection title="Collegamenti utili">
                    <InfoRow label="Tracking" value={shipping.trackingNumber} />
                    <InfoRow label="Riferimento" value={shipping.shipmentReference} />
                    <div className="flex flex-wrap gap-2 pt-1">
                      {shipping.trackingUrl ? (
                        <a href={shipping.trackingUrl} target="_blank" rel="noreferrer" className={getButtonClassName({ variant: "profile", size: "sm" })}>
                          Apri tracking
                        </a>
                      ) : null}
                      {shipping.labelUrl ? (
                        <a href={shipping.labelUrl} target="_blank" rel="noreferrer" className={getButtonClassName({ variant: "cart", size: "sm" })}>
                          Apri etichetta PDF
                        </a>
                      ) : null}
                      {shipmentPageUrl ? (
                        <a href={shipmentPageUrl} target="_blank" rel="noreferrer" className={getButtonClassName({ variant: "profile", size: "sm" })}>
                          Apri spedizione
                        </a>
                      ) : null}
                      {!shipping.trackingUrl && !shipping.labelUrl && !shipmentPageUrl ? (
                        <span className="rounded-full border border-white/10 px-3 py-2 text-xs uppercase tracking-[0.18em] text-white/38">
                          Collegamenti non ancora disponibili
                        </span>
                      ) : null}
                    </div>
                  </InfoSection>
                </div>

                {shipping.shippingError ? <p className="mt-4 text-sm text-amber-100">In attesa di generazione: {shipping.shippingError}</p> : null}
                {shippingFeedback[order.id] ? (
                  <p className="mt-4 rounded-2xl border border-emerald-200/20 bg-emerald-300/10 px-3 py-2 text-sm text-emerald-100">
                    {shippingFeedback[order.id]}
                  </p>
                ) : null}
                {!shipmentCreated && packlinkProNewShipmentUrl ? (
                  <p className="mt-4 text-xs text-white/45">
                    Packlink Pro:{" "}
                    <a href={packlinkProNewShipmentUrl} target="_blank" rel="noreferrer" className="text-[#e3f503] underline underline-offset-4">
                      Nuova spedizione
                    </a>
                  </p>
                ) : null}
              </section>

              <section className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/45">Azioni principali</p>
                    <div className="grid gap-2 md:grid-cols-3">
                      <Link to={`/shop/orders/${order.orderReference}`} className={`${getButtonClassName({ variant: "profile", size: "sm" })} w-full text-center`}>
                        Visualizza ordine
                      </Link>
                      <button type="button" onClick={() => onOpenOrderProfit(order.id)} className={`${getButtonClassName({ variant: "profile", size: "sm" })} w-full justify-center`}>
                        {loadingProfitOrderId === order.id ? "Calcolo..." : "Visualizza guadagno"}
                      </button>
                      {order.status === "paid" || order.status === "shipped" ? (
                        <button type="button" onClick={() => downloadInvoicePdf(order, shopSettings)} className={`${getButtonClassName({ variant: "cart", size: "sm" })} w-full justify-center`}>
                          Scarica ricevuta
                        </button>
                      ) : (
                        <div className="hidden md:block" />
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/45">Spedizione</p>
                    <div className="grid gap-2 md:grid-cols-2">
                      <button
                        type="button"
                        onClick={async () => {
                          setShippingActionState((current) => ({ ...current, [order.id]: "create" }))
                          try {
                            if (shipmentPageUrl) {
                              window.open(shipmentPageUrl, "_blank", "noopener,noreferrer")
                              markOrderUpdated(order.id, "Pagina spedizione aperta in una nuova scheda.")
                            } else {
                              const updatedOrder = await onCreateShipment(order.id)
                              if (updatedOrder) {
                                markOrderUpdated(order.id, "Packlink Pro aperto. Inserisci tracking, link spedizione ed etichetta qui sotto dopo aver creato la spedizione.")
                              }
                            }
                          } finally {
                            setShippingActionState((current) => ({ ...current, [order.id]: null }))
                          }
                        }}
                        className={`${getButtonClassName({ variant: "cart", size: "sm" })} w-full justify-center`}
                      >
                        {shippingActionState[order.id] === "create" ? "Apertura..." : shipmentCreated ? "Visualizza spedizione" : "Crea spedizione"}
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          setShippingActionState((current) => ({ ...current, [order.id]: "refresh" }))
                          try {
                            const updatedOrder = await onRefreshTracking(order.id)
                            if (updatedOrder) {
                              markOrderUpdated(order.id, "Aggiorna manualmente tracking, link spedizione ed etichetta nei campi qui sotto, poi salva.")
                            }
                          } finally {
                            setShippingActionState((current) => ({ ...current, [order.id]: null }))
                          }
                        }}
                        className={`${getButtonClassName({ variant: "profile", size: "sm" })} w-full justify-center`}
                      >
                        {shippingActionState[order.id] === "refresh" ? "Verifica..." : "Tracking manuale"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/45">Controlli manuali</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <select className="shop-select" value={draft.fulfillmentStatus} onChange={(event) => updateDraft(order.id, { fulfillmentStatus: event.target.value })}>
                      <option value="processing">Ordine in lavorazione</option>
                      <option value="accepted">Ordine accettato</option>
                      <option value="in_progress">Spedizione creata</option>
                      <option value="shipped">Ordine spedito</option>
                      <option value="completed">Ordine consegnato</option>
                    </select>
                    <input className="shop-input" placeholder="Tracking number" value={draft.trackingNumber} onChange={(event) => updateDraft(order.id, { trackingNumber: event.target.value })} />
                    <select className="shop-select" value={draft.shippingStatus} onChange={(event) => updateDraft(order.id, { shippingStatus: event.target.value })}>
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
                    <input className="shop-input" placeholder="Link spedizione" value={draft.shipmentUrl} onChange={(event) => updateDraft(order.id, { shipmentUrl: event.target.value })} />
                    <input className="shop-input" placeholder="Link tracking" value={draft.trackingUrl} onChange={(event) => updateDraft(order.id, { trackingUrl: event.target.value })} />
                    <input className="shop-input" placeholder="Link etichetta PDF" value={draft.labelUrl} onChange={(event) => updateDraft(order.id, { labelUrl: event.target.value })} />
                  </div>

                  <div className="flex flex-wrap justify-end gap-3 pt-1">
                    <button
                      type="button"
                      onClick={async () => {
                        if (!window.confirm("Sei sicuro di voler eliminare questo ordine? Questa azione è irreversibile.")) return
                        setShippingActionState((current) => ({ ...current, [order.id]: "delete" }))
                        try {
                          await onDeleteOrder(order.id)
                        } finally {
                          setShippingActionState((current) => ({ ...current, [order.id]: null }))
                        }
                      }}
                      className={getDangerButtonClassName({ size: "sm" })}
                    >
                      {shippingActionState[order.id] === "delete" ? "Eliminazione..." : "Elimina"}
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        setShippingActionState((current) => ({ ...current, [order.id]: "save" }))
                        try {
                          const updatedOrder = await onUpdateOrderStatus(order.id, draft)
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
              </section>
            </div>
          </article>
        )
      })}
    </div>
  )
}
