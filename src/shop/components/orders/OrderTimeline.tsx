import { getOrderFulfillmentSteps } from "../../lib/order"
import { buildAdminOrderShippingSummary } from "../../lib/order-shipping.mjs"
import { ShopOrder } from "../../types"

type OrderTimelineProps = {
  order: ShopOrder
}

function formatTimelineTimestamp(value?: string | null) {
  if (!value) return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleString("it-IT", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getTimelineStepCopy(order: ShopOrder, stepKey: string, shipping: ReturnType<typeof buildAdminOrderShippingSummary>) {
  switch (stepKey) {
    case "processing":
      return {
        description: "Abbiamo ricevuto il tuo ordine e stiamo verificando tutti i dettagli.",
        timestamp: formatTimelineTimestamp(order.createdAt),
      }
    case "accepted":
      return {
        description: "Il team ha preso in carico il tuo ordine e sta preparando la spedizione.",
        timestamp: null,
      }
    case "in_progress":
      return {
        description: "La spedizione e stata creata. Ti aggiorneremo appena il pacco entra nel flusso del corriere.",
        timestamp: formatTimelineTimestamp(order.shippingCreatedAt),
      }
    case "shipped":
      return {
        description: shipping.trackingUrl
          ? "Il pacco e in viaggio. Puoi seguire ogni passaggio dal link di tracking."
          : "Il pacco e stato affidato al corriere ed e in viaggio.",
        timestamp: null,
      }
    case "completed":
      return {
        description: "La consegna risulta completata. Speriamo che l'ordine sia arrivato perfettamente.",
        timestamp: null,
      }
    default:
      return {
        description: null,
        timestamp: null,
      }
  }
}

export function OrderTimeline({ order }: OrderTimelineProps) {
  const steps = getOrderFulfillmentSteps(order.fulfillmentStatus)
  const shipping = buildAdminOrderShippingSummary(order)

  return (
    <section className="rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.02))] p-4 md:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-white/42">Timeline ordine</p>
          <p className="mt-1 text-sm text-white/58">Stato aggiornato in base alla lavorazione e alla spedizione.</p>
        </div>
      </div>

      <ol className="relative grid gap-4 md:grid-cols-5 md:gap-3">
        <div className="absolute bottom-4 left-[17px] top-4 w-px bg-white/10 md:left-8 md:right-8 md:top-[1.05rem] md:h-px md:w-auto" />
        {steps.map((step, index) => {
          const state = step.current ? "current" : step.active ? "completed" : "upcoming"
          const { description, timestamp } = getTimelineStepCopy(order, step.key, shipping)
          const isShippingPhase = step.key === "in_progress" || step.key === "shipped" || step.key === "completed"

          return (
            <li key={step.key} className="relative flex items-start gap-3 md:flex-col md:gap-4">
              <div className="relative z-[1] shrink-0 pt-0.5 md:pt-0">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition-all ${
                    state === "current"
                      ? "border-[#e3f503]/50 bg-[#e3f503]/18 text-[#f3ff94] shadow-[0_0_24px_rgba(227,245,3,0.18)]"
                      : state === "completed"
                        ? "border-emerald-300/35 bg-emerald-300/12 text-emerald-100"
                        : "border-white/12 bg-[#111214] text-white/38"
                  }`}
                >
                  {step.active ? "✓" : step.key === "completed" ? "5" : String(index + 1)}
                </span>
              </div>

              <div
                className={`min-w-0 flex-1 rounded-[22px] border px-4 py-3 md:h-full ${
                  state === "current"
                    ? "border-[#e3f503]/30 bg-[#e3f503]/10"
                    : state === "completed"
                      ? "border-white/14 bg-white/[0.05]"
                      : "border-white/10 bg-white/[0.025]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className={`text-sm font-medium ${state === "upcoming" ? "text-white/42" : "text-white"}`}>{step.label}</p>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] ${
                      state === "current"
                        ? "bg-[#e3f503]/16 text-[#effb89]"
                        : state === "completed"
                          ? "bg-emerald-300/14 text-emerald-100"
                          : "bg-white/5 text-white/35"
                    }`}
                  >
                    {state === "current" ? "Attuale" : state === "completed" ? "Completato" : "In attesa"}
                  </span>
                </div>

                {timestamp ? <p className="mt-2 text-xs uppercase tracking-[0.16em] text-white/42">{timestamp}</p> : null}
                {description ? <p className={`mt-2 text-sm leading-6 ${state === "upcoming" ? "text-white/40" : "text-white/62"}`}>{description}</p> : null}

                {isShippingPhase && shipping.trackingNumber !== "Non ancora disponibile" ? (
                  <div className="mt-3 rounded-[18px] border border-white/10 bg-black/10 px-3 py-2.5">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/38">Tracking</p>
                    <p className="mt-1 text-sm text-white">{shipping.trackingNumber}</p>
                    {shipping.trackingUrl ? (
                      <a
                        href={shipping.trackingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex text-sm text-[#eef879] underline underline-offset-4 transition hover:text-white"
                      >
                        Traccia spedizione
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
