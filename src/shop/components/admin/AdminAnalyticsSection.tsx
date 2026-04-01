import { useMemo, useState } from "react"

import { formatPrice } from "../../lib/format"

type AdminAnalytics = {
  siteViewsTotal: number
  siteViewsToday: number
  siteViewsThisMonth: number
  totalOrders: number
  salesCount: number
  totalRevenue: number
  totalExpenses: number
  totalNet: number
  averageOrderValue: number
  averageDailyNet: number
  averageMonthlyNet: number
  averageDailyExpenses: number
  averageMonthlyExpenses: number
  bestSellingProduct: { productId: number; title: string; quantity: number } | null
  shippingCostsTracked: boolean
  chartSeries?: Array<{
    key: string
    label: string
    siteViews: number
    revenue: number
  }>
}

type AdminAnalyticsSectionProps = {
  analytics: AdminAnalytics | null
}

function EyeToggle({
  visible,
  onClick,
}: {
  visible: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/60 transition hover:border-white/20 hover:text-white"
      aria-label={visible ? "Nascondi valori sensibili" : "Mostra valori sensibili"}
      title={visible ? "Nascondi valori sensibili" : "Mostra valori sensibili"}
    >
      {visible ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 3L21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M10.58 10.58A2 2 0 0 0 13.41 13.41" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M9.88 5.09A11.38 11.38 0 0 1 12 4.9c5.2 0 9.27 3.05 10.8 7.1a11.76 11.76 0 0 1-3.3 4.74" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M6.23 6.23A11.82 11.82 0 0 0 1.2 12c1.53 4.05 5.6 7.1 10.8 7.1 1.74 0 3.38-.34 4.84-.95" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M1.2 12C2.73 7.95 6.8 4.9 12 4.9S21.27 7.95 22.8 12C21.27 16.05 17.2 19.1 12 19.1S2.73 16.05 1.2 12Z" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      )}
    </button>
  )
}

function renderSensitiveValue(visible: boolean, value: string) {
  return visible ? value : "******"
}

export function AdminAnalyticsSection({ analytics }: AdminAnalyticsSectionProps) {
  const [showSensitiveValues, setShowSensitiveValues] = useState(false)

  const chart = useMemo(() => {
    const series = analytics?.chartSeries || []
    if (!series.length) return null

    const width = 640
    const height = 220
    const paddingX = 24
    const paddingTop = 20
    const paddingBottom = 36
    const usableWidth = width - paddingX * 2
    const usableHeight = height - paddingTop - paddingBottom
    const maxViews = Math.max(...series.map((point) => point.siteViews), 1)
    const maxRevenue = Math.max(...series.map((point) => point.revenue), 1)
    const stepX = series.length > 1 ? usableWidth / (series.length - 1) : usableWidth

    const viewPoints = series
      .map((point, index) => {
        const x = paddingX + stepX * index
        const y = paddingTop + usableHeight - (point.siteViews / maxViews) * usableHeight
        return `${x},${y}`
      })
      .join(" ")

    const revenueBars = series.map((point, index) => {
      const x = paddingX + stepX * index - 16
      const barHeight = (point.revenue / maxRevenue) * usableHeight
      return {
        key: point.key,
        label: point.label,
        x,
        y: paddingTop + usableHeight - barHeight,
        height: Math.max(barHeight, 6),
      }
    })

    return {
      width,
      height,
      paddingTop,
      paddingBottom,
      usableHeight,
      series,
      viewPoints,
      revenueBars,
    }
  }, [analytics?.chartSeries])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Visualizzazioni sito", analytics?.siteViewsTotal ?? 0],
          ["Vendite concluse", analytics?.salesCount ?? 0],
          ["Ordini totali", analytics?.totalOrders ?? 0],
          ["Ticket medio ordine", renderSensitiveValue(showSensitiveValues, formatPrice(analytics?.averageOrderValue ?? 0))],
        ].map(([label, value]) => (
          <article key={label} className="shop-card p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-white/45">{label}</p>
            <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Guadagno netto totale", formatPrice(analytics?.totalNet ?? 0)],
          ["Spese totali", formatPrice(analytics?.totalExpenses ?? 0)],
          ["Incassato totale", formatPrice(analytics?.totalRevenue ?? 0)],
          ["Ticket medio ordine", formatPrice(analytics?.averageOrderValue ?? 0)],
        ].map(([label, value]) => (
          <article key={label} className="shop-card p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.2em] text-white/45">{label}</p>
              <EyeToggle visible={showSensitiveValues} onClick={() => setShowSensitiveValues((current) => !current)} />
            </div>
            <p className="mt-3 text-3xl font-semibold text-white">{renderSensitiveValue(showSensitiveValues, String(value))}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
        <article className="shop-card space-y-5 p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/45">Andamento ultimi 7 giorni</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Visualizzazioni e incassi</h2>
            </div>
            <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.16em] text-white/42">
              <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#eef879]" /> Visualizzazioni</span>
              <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-300" /> Incassi</span>
            </div>
          </div>

          {chart ? (
            <div className="rounded-[26px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(238,248,121,0.12),transparent_48%),rgba(255,255,255,0.03)] p-4">
              <svg viewBox={`0 0 ${chart.width} ${chart.height}`} className="h-[240px] w-full">
                {[0, 0.5, 1].map((ratio) => {
                  const y = chart.paddingTop + chart.usableHeight * ratio
                  return (
                    <line
                      key={ratio}
                      x1="24"
                      y1={y}
                      x2={chart.width - 24}
                      y2={y}
                      stroke="rgba(255,255,255,0.08)"
                      strokeDasharray="4 8"
                    />
                  )
                })}
                {chart.revenueBars.map((bar) => (
                  <rect
                    key={bar.key}
                    x={bar.x}
                    y={bar.y}
                    width="32"
                    height={bar.height}
                    rx="10"
                    fill="rgba(110,231,183,0.42)"
                  />
                ))}
                <polyline
                  fill="none"
                  stroke="#eef879"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={chart.viewPoints}
                />
                {chart.series.map((point, index) => {
                  const x = 24 + ((chart.width - 48) / Math.max(chart.series.length - 1, 1)) * index
                  return (
                    <g key={point.key}>
                      <circle
                        cx={x}
                        cy={chart.paddingTop + chart.usableHeight - (point.siteViews / Math.max(...chart.series.map((entry) => entry.siteViews), 1)) * chart.usableHeight}
                        r="4"
                        fill="#eef879"
                      />
                      <text x={x} y={chart.height - 10} textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="12">
                        {point.label}
                      </text>
                    </g>
                  )
                })}
              </svg>
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-white/10 px-4 py-10 text-sm text-white/50">
              Dati non ancora sufficienti per mostrare l&apos;andamento settimanale.
            </div>
          )}
        </article>

        <article className="shop-card space-y-4 p-6">
          <h2 className="text-xl font-semibold text-white">Medie e indicatori</h2>
          <div className="grid gap-4">
            <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4">
              <p className="text-sm text-white/55">Guadagno medio giornaliero</p>
              <p className="mt-2 text-xl font-semibold text-white">{formatPrice(analytics?.averageDailyNet ?? 0)}</p>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4">
              <p className="text-sm text-white/55">Guadagno medio mensile</p>
              <p className="mt-2 text-xl font-semibold text-white">{formatPrice(analytics?.averageMonthlyNet ?? 0)}</p>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4">
              <p className="text-sm text-white/55">Spese medie giornaliere</p>
              <p className="mt-2 text-xl font-semibold text-white">{formatPrice(analytics?.averageDailyExpenses ?? 0)}</p>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4">
              <p className="text-sm text-white/55">Spese medie mensili</p>
              <p className="mt-2 text-xl font-semibold text-white">{formatPrice(analytics?.averageMonthlyExpenses ?? 0)}</p>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4">
              <p className="text-sm text-white/55">Prodotto più venduto</p>
              <p className="mt-2 text-lg font-semibold text-white">{analytics?.bestSellingProduct?.title || "Nessun dato disponibile"}</p>
              {analytics?.bestSellingProduct ? <p className="mt-1 text-sm text-white/55">{analytics.bestSellingProduct.quantity} unità vendute</p> : null}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4">
                <p className="text-sm text-white/55">Visualizzazioni oggi</p>
                <p className="mt-2 text-xl font-semibold text-white">{analytics?.siteViewsToday ?? 0}</p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4">
                <p className="text-sm text-white/55">Visualizzazioni mese</p>
                <p className="mt-2 text-xl font-semibold text-white">{analytics?.siteViewsThisMonth ?? 0}</p>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  )
}
