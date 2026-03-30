import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"

import { ShopLayout } from "../components/ShopLayout"
import { apiFetch } from "../lib/api"
import { getOrderShippingHandoffModeLabel } from "../lib/order-shipping.mjs"
import { getOrderShippingStatusLabel } from "../lib/order"

type MockTrackingStep = {
  key: string
  title: string
  description: string
  location: string
  at: string
  active: boolean
  current: boolean
}

type MockTrackingResponse = {
  carrier: string
  method: string
  trackingNumber: string | null
  shipmentReference: string | null
  status: string
  orderReference: string | null
  handoffMode: string | null
  lastLocation: string
  lastUpdateAt: string
  timeline: MockTrackingStep[]
}

export function ShopMockTrackingPage() {
  const { trackingNumber = "" } = useParams()
  const [tracking, setTracking] = useState<MockTrackingResponse | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!trackingNumber) return

    apiFetch<MockTrackingResponse>(`/store/mock-shipping/tracking/${encodeURIComponent(trackingNumber)}`)
      .then((data) => {
        setTracking(data)
        setError("")
      })
      .catch((err) => {
        setTracking(null)
        setError(err instanceof Error ? err.message : "Tracking non disponibile.")
      })
  }, [trackingNumber])

  return (
    <ShopLayout
      eyebrow="Tracking mock"
      title={tracking?.trackingNumber || trackingNumber}
      intro="Questa pagina simula il tracciamento cliente della spedizione economy, con stato, timeline e ultima posizione interna al progetto."
    >
      {!tracking && !error ? (
        <div className="rounded-[24px] border border-white/10 px-6 py-14 text-center text-white/60">Caricamento tracking...</div>
      ) : null}

      {error ? (
        <div className="rounded-[24px] border border-white/10 px-6 py-14 text-center text-white/60">{error}</div>
      ) : null}

      {tracking ? (
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <aside className="shop-card space-y-4 p-6">
            <span className="shop-pill">{tracking.carrier}</span>
            <h2 className="text-2xl font-semibold text-white">{tracking.method}</h2>
            <div className="space-y-2 text-sm text-white/65">
              <p><span className="text-white">Stato:</span> {getOrderShippingStatusLabel(tracking.status, null)}</p>
              <p><span className="text-white">Tracking:</span> {tracking.trackingNumber}</p>
              <p><span className="text-white">Riferimento:</span> {tracking.shipmentReference || "Non disponibile"}</p>
              <p><span className="text-white">Ordine:</span> {tracking.orderReference || "Non disponibile"}</p>
              <p><span className="text-white">Conferimento:</span> {getOrderShippingHandoffModeLabel(tracking.handoffMode)}</p>
            </div>

            <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4 text-sm text-white/60">
              <p className="text-white">Ultima posizione</p>
              <p className="mt-2">{tracking.lastLocation}</p>
              <p className="mt-2 text-white/45">
                Ultimo aggiornamento {new Date(tracking.lastUpdateAt).toLocaleString("it-IT")}
              </p>
            </div>
          </aside>

          <section className="shop-card space-y-4 p-6">
            <div>
              <span className="shop-pill">Timeline</span>
              <h2 className="mt-4 text-2xl font-semibold text-white">Avanzamento spedizione</h2>
            </div>

            <div className="space-y-3">
              {tracking.timeline.map((step) => (
                <div
                  key={step.key}
                  className={`rounded-[22px] border p-4 ${
                    step.current
                      ? "border-[#e3f503]/30 bg-[#e3f503]/10"
                      : step.active
                        ? "border-white/18 bg-white/[0.05]"
                        : "border-white/10 bg-white/[0.02]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-white">{step.title}</p>
                      <p className="mt-1 text-sm text-white/60">{step.description}</p>
                    </div>
                    <span className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                      {step.current ? "Attuale" : step.active ? "Completato" : "In attesa"}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-white/50">
                    <span>{step.location}</span>
                    <span>{new Date(step.at).toLocaleString("it-IT")}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </ShopLayout>
  )
}
