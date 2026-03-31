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
  const currentStep = steps.find((step) => step.current) || steps[0]
  const currentState = currentStep.current ? "current" : currentStep.active ? "completed" : "upcoming"
  const currentCopy = getTimelineStepCopy(order, currentStep.key, shipping)
  const currentStepIndex = steps.findIndex((step) => step.key === currentStep.key)
  const showShippingTracking =
    ["in_progress", "shipped", "completed"].includes(currentStep.key) && shipping.trackingNumber !== "Non ancora disponibile"

  return (
    <section className="rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.02))] p-4 md:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-white/42">Timeline ordine</p>
          <p className="mt-1 text-sm text-white/58">Stato aggiornato in base alla lavorazione e alla spedizione.</p>
        </div>
      </div>

      <ol className="space-y-3 md:hidden">
        {steps.map((step, index) => {
          const state = step.current ? "current" : step.active ? "completed" : "upcoming"

          return (
            <li key={step.key} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition-all ${
                    state === "current"
                      ? "border-[#e3f503]/50 bg-[#e3f503]/18 text-[#f3ff94] shadow-[0_0_24px_rgba(227,245,3,0.18)]"
                      : state === "completed"
                        ? "border-emerald-300/35 bg-emerald-300/12 text-emerald-100"
                        : "border-white/12 bg-[#111214] text-white/38"
                  }`}
                >
                  {step.active ? "✓" : String(index + 1)}
                </span>
                {index < steps.length - 1 ? <span className={`mt-2 h-8 w-px ${step.active ? "bg-emerald-300/35" : "bg-white/10"}`} /> : null}
              </div>
              <div className="min-w-0 flex-1 pt-1">
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
              </div>
            </li>
          )
        })}
      </ol>

      <ol className="hidden grid-cols-5 gap-3 md:grid">
        {steps.map((step, index) => {
          const state = step.current ? "current" : step.active ? "completed" : "upcoming"

          return (
            <li key={step.key} className="min-w-0">
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-all ${
                    state === "current"
                      ? "border-[#e3f503]/50 bg-[#e3f503]/18 text-[#f3ff94] shadow-[0_0_24px_rgba(227,245,3,0.18)]"
                      : state === "completed"
                        ? "border-emerald-300/35 bg-emerald-300/12 text-emerald-100"
                        : "border-white/12 bg-[#111214] text-white/38"
                  }`}
                >
                  {step.active ? "✓" : String(index + 1)}
                </span>
                {index < steps.length - 1 ? <span className={`h-px flex-1 ${step.active ? "bg-emerald-300/35" : "bg-white/10"}`} /> : null}
              </div>
              <div className="mt-3 space-y-1">
                <p className={`text-sm font-medium ${state === "upcoming" ? "text-white/42" : "text-white"}`}>{step.label}</p>
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/38">
                  {state === "current" ? "Attuale" : state === "completed" ? "Completato" : "In attesa"}
                </p>
              </div>
            </li>
          )
        })}
      </ol>

      <div
        className={`mt-5 rounded-[22px] border px-4 py-4 md:px-5 ${
          currentState === "current"
            ? "border-[#e3f503]/30 bg-[#e3f503]/10"
            : currentState === "completed"
              ? "border-white/14 bg-white/[0.05]"
              : "border-white/10 bg-white/[0.025]"
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/42">Step attuale</p>
            <h3 className="mt-2 text-base font-semibold text-white">{currentStep.label}</h3>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.18em] ${
              currentState === "current"
                ? "bg-[#e3f503]/16 text-[#effb89]"
                : currentState === "completed"
                  ? "bg-emerald-300/14 text-emerald-100"
                  : "bg-white/5 text-white/35"
            }`}
          >
            {currentState === "current" ? "Attuale" : currentState === "completed" ? "Completato" : "In attesa"}
          </span>
        </div>

        {currentCopy.timestamp ? <p className="mt-3 text-xs uppercase tracking-[0.16em] text-white/42">{currentCopy.timestamp}</p> : null}
        {currentCopy.description ? <p className="mt-3 text-sm leading-6 text-white/68">{currentCopy.description}</p> : null}

        {showShippingTracking ? (
          <div className="mt-4 rounded-[18px] border border-white/10 bg-black/10 px-3 py-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/38">Tracking</p>
                <p className="mt-1 text-sm text-white">{shipping.trackingNumber}</p>
              </div>
              {shipping.trackingUrl ? (
                <a
                  href={shipping.trackingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex text-sm text-[#eef879] underline underline-offset-4 transition hover:text-white"
                >
                  Traccia spedizione
                </a>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em] text-white/38">
          <span>
            Step {currentStepIndex + 1} di {steps.length}
          </span>
          <span className="text-white/18">•</span>
          <span>{steps.filter((step) => step.active).length} completati</span>
        </div>
      </div>
    </section>
  )
}
