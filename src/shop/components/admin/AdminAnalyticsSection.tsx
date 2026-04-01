import { useMemo, useState } from "react"

import { formatPrice } from "../../lib/format"

type ChartPoint = {
  key: string
  label: string
  siteViews: number
  revenue: number
  expenses: number
  net: number
}

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
  chartSeries?: ChartPoint[]
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
      aria-label={visible ? "Nascondi dati sezione data" : "Mostra dati sezione data"}
      title={visible ? "Nascondi dati sezione data" : "Mostra dati sezione data"}
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

function maskValue(hidden: boolean, value: string | number) {
  return hidden ? "******" : value
}

function buildPrimaryChart(points: ChartPoint[]) {
  if (!points.length) return null

  const width = 640
  const height = 220
  const paddingX = 24
  const paddingTop = 18
  const paddingBottom = 34
  const usableWidth = width - paddingX * 2
  const usableHeight = height - paddingTop - paddingBottom
  const maxViews = Math.max(...points.map((point) => point.siteViews), 1)
  const maxRevenue = Math.max(...points.map((point) => point.revenue), 1)
  const stepX = points.length > 1 ? usableWidth / (points.length - 1) : usableWidth

  const linePoints = points.map((point, index) => {
    const x = paddingX + stepX * index
    const y = paddingTop + usableHeight - (point.siteViews / maxViews) * usableHeight
    return { ...point, x, y }
  })

  const revenueBars = points.map((point, index) => {
    const x = paddingX + stepX * index - 18
    const barHeight = (point.revenue / maxRevenue) * usableHeight
    return {
      ...point,
      x,
      y: paddingTop + usableHeight - barHeight,
      width: 36,
      height: Math.max(barHeight, 8),
    }
  })

  return {
    width,
    height,
    paddingTop,
    usableHeight,
    linePoints,
    revenueBars,
    polyline: linePoints.map((point) => `${point.x},${point.y}`).join(" "),
  }
}

function buildSecondaryChart(points: ChartPoint[]) {
  if (!points.length) return null

  const width = 640
  const height = 220
  const paddingX = 24
  const paddingTop = 18
  const paddingBottom = 34
  const usableWidth = width - paddingX * 2
  const usableHeight = height - paddingTop - paddingBottom
  const minValue = Math.min(...points.flatMap((point) => [point.expenses, point.net, 0]), 0)
  const maxValue = Math.max(...points.flatMap((point) => [point.expenses, point.net, 0]), 1)
  const range = Math.max(maxValue - minValue, 1)
  const stepX = points.length > 1 ? usableWidth / (points.length - 1) : usableWidth

  const yFromValue = (value: number) => paddingTop + usableHeight - ((value - minValue) / range) * usableHeight
  const zeroY = yFromValue(0)

  const expensePoints = points.map((point, index) => {
    const x = paddingX + stepX * index
    const y = yFromValue(point.expenses)
    return { ...point, x, y }
  })

  const netPoints = points.map((point, index) => {
    const x = paddingX + stepX * index
    const y = yFromValue(point.net)
    return { ...point, x, y }
  })

  return {
    width,
    height,
    paddingTop,
    usableHeight,
    zeroY,
    expensePoints,
    netPoints,
    expenseLine: expensePoints.map((point) => `${point.x},${point.y}`).join(" "),
    netLine: netPoints.map((point) => `${point.x},${point.y}`).join(" "),
  }
}

function downloadChartCsv(filename: string, rows: Array<Record<string, string | number>>) {
  const headers = Object.keys(rows[0] || {})
  const csv = [headers.join(","), ...rows.map((row) => headers.map((header) => JSON.stringify(row[header] ?? "")).join(","))].join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function AdminAnalyticsSection({ analytics }: AdminAnalyticsSectionProps) {
  const [showMetrics, setShowMetrics] = useState(true)
  const [activePrimaryDatum, setActivePrimaryDatum] = useState<{ key: string; type: "views" | "revenue" } | null>(null)
  const [activeSecondaryDatum, setActiveSecondaryDatum] = useState<string | null>(null)

  const points = analytics?.chartSeries || []
  const primaryChart = useMemo(() => buildPrimaryChart(points), [points])
  const secondaryChart = useMemo(() => buildSecondaryChart(points), [points])

  const activePrimaryValue = useMemo(() => {
    if (!activePrimaryDatum) return null
    const point = points.find((entry) => entry.key === activePrimaryDatum.key)
    if (!point) return null
    if (activePrimaryDatum.type === "views") {
      return {
        title: `Visualizzazioni ${point.label}`,
        value: `${point.siteViews}`,
      }
    }
    return {
      title: `Incassi ${point.label}`,
      value: formatPrice(point.revenue),
    }
  }, [activePrimaryDatum, points])

  const activeSecondaryValue = useMemo(() => {
    if (!activeSecondaryDatum) return null
    const point = points.find((entry) => entry.key === activeSecondaryDatum)
    if (!point) return null
    return {
      title: point.label,
      expenses: formatPrice(point.expenses),
      net: formatPrice(point.net),
    }
  }, [activeSecondaryDatum, points])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="shop-card p-5">
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.2em] text-white/45">Visualizzazioni sito</p>
            <EyeToggle visible={showMetrics} onClick={() => setShowMetrics((current) => !current)} />
          </div>
          <p className="mt-3 text-3xl font-semibold text-white">{maskValue(!showMetrics, analytics?.siteViewsTotal ?? 0)}</p>
        </article>
        {[
          ["Vendite concluse", analytics?.salesCount ?? 0],
          ["Ordini totali", analytics?.totalOrders ?? 0],
          ["Ticket medio ordine", formatPrice(analytics?.averageOrderValue ?? 0)],
        ].map(([label, value]) => (
          <article key={label} className="shop-card p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-white/45">{label}</p>
            <p className="mt-3 text-3xl font-semibold text-white">{maskValue(!showMetrics, String(value))}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Guadagno netto totale", formatPrice(analytics?.totalNet ?? 0)],
          ["Spese totali prodotti", formatPrice(analytics?.totalExpenses ?? 0)],
          ["Incassato totale", formatPrice(analytics?.totalRevenue ?? 0)],
          ["Visualizzazioni mese", String(analytics?.siteViewsThisMonth ?? 0)],
        ].map(([label, value]) => (
          <article key={label} className="shop-card p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-white/45">{label}</p>
            <p className="mt-3 text-3xl font-semibold text-white">{maskValue(!showMetrics, value)}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
        <div className="space-y-4">
          <article className="shop-card space-y-5 p-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/45">Andamento ultimi 7 giorni</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Visualizzazioni e incassi</h2>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    downloadChartCsv(
                      "visualizzazioni-incassi.csv",
                      points.map((point) => ({
                        data: point.label,
                        visualizzazioni: point.siteViews,
                        incassi_euro: (point.revenue / 100).toFixed(2),
                      })),
                    )
                  }
                  className="inline-flex items-center rounded-full border border-white/10 px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-white/65 transition hover:border-white/20 hover:text-white"
                >
                  Scarica CSV
                </button>
                <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.16em] text-white/42">
                  <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#eef879]" /> Visualizzazioni</span>
                  <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-300" /> Incassi</span>
                </div>
              </div>
            </div>

          {!showMetrics ? (
            <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-4">
              <div className="flex h-[240px] items-center justify-center rounded-[20px] border border-dashed border-white/10 bg-black/20">
                <div className="text-center">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/38">Dati nascosti</p>
                  <p className="mt-3 text-sm text-white/55">Il grafico è censurato finché la modalità privacy resta attiva.</p>
                </div>
              </div>
            </div>
          ) : primaryChart ? (
            <div className="relative rounded-[26px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(238,248,121,0.12),transparent_48%),rgba(255,255,255,0.03)] p-4">
                {activePrimaryValue ? (
                  <div className="absolute right-4 top-4 rounded-2xl border border-white/10 bg-[#0e0e10]/95 px-4 py-3 text-right shadow-xl">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/42">{activePrimaryValue.title}</p>
                    <p className="mt-2 text-lg font-semibold text-white">{activePrimaryValue.value}</p>
                  </div>
                ) : null}
                <svg viewBox={`0 0 ${primaryChart.width} ${primaryChart.height}`} className="h-[240px] w-full">
                  {[0, 0.5, 1].map((ratio) => {
                    const y = primaryChart.paddingTop + primaryChart.usableHeight * ratio
                    return (
                      <line
                        key={ratio}
                        x1="24"
                        y1={y}
                        x2={primaryChart.width - 24}
                        y2={y}
                        stroke="rgba(255,255,255,0.08)"
                        strokeDasharray="4 8"
                      />
                    )
                  })}
                  {primaryChart.revenueBars.map((bar) => (
                    <g key={bar.key}>
                      <rect
                        x={bar.x}
                        y={bar.y}
                        width={bar.width}
                        height={bar.height}
                        rx="10"
                        fill="rgba(110,231,183,0.42)"
                      />
                      <rect
                        x={bar.x}
                        y={bar.y}
                        width={bar.width}
                        height={bar.height}
                        rx="10"
                        fill="transparent"
                        onMouseEnter={() => setActivePrimaryDatum({ key: bar.key, type: "revenue" })}
                        onMouseLeave={() => setActivePrimaryDatum(null)}
                        onFocus={() => setActivePrimaryDatum({ key: bar.key, type: "revenue" })}
                        onBlur={() => setActivePrimaryDatum(null)}
                        onClick={() => setActivePrimaryDatum({ key: bar.key, type: "revenue" })}
                      />
                    </g>
                  ))}
                  <polyline
                    fill="none"
                    stroke="#eef879"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={primaryChart.polyline}
                  />
                  {primaryChart.linePoints.map((point) => (
                    <g key={point.key}>
                      <circle cx={point.x} cy={point.y} r="4" fill="#eef879" />
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r="12"
                        fill="transparent"
                        onMouseEnter={() => setActivePrimaryDatum({ key: point.key, type: "views" })}
                        onMouseLeave={() => setActivePrimaryDatum(null)}
                        onFocus={() => setActivePrimaryDatum({ key: point.key, type: "views" })}
                        onBlur={() => setActivePrimaryDatum(null)}
                        onClick={() => setActivePrimaryDatum({ key: point.key, type: "views" })}
                      />
                      <text x={point.x} y={primaryChart.height - 10} textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="12">
                        {point.label}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            ) : (
              <div className="rounded-[24px] border border-dashed border-white/10 px-4 py-10 text-sm text-white/50">
                Dati non ancora sufficienti per mostrare l&apos;andamento settimanale.
              </div>
            )}
          </article>

          <article className="shop-card space-y-5 p-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/45">Andamento ultimi 7 giorni</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Spese e utile netto</h2>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    downloadChartCsv(
                      "spese-utile-netto.csv",
                      points.map((point) => ({
                        data: point.label,
                        spese_euro: (point.expenses / 100).toFixed(2),
                        utile_netto_euro: (point.net / 100).toFixed(2),
                      })),
                    )
                  }
                  className="inline-flex items-center rounded-full border border-white/10 px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-white/65 transition hover:border-white/20 hover:text-white"
                >
                  Scarica CSV
                </button>
                <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.16em] text-white/42">
                  <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-white/60" /> Spese</span>
                  <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#eef879]" /> Utile netto</span>
                </div>
              </div>
            </div>

            {!showMetrics ? (
              <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-4">
                <div className="flex h-[220px] items-center justify-center rounded-[20px] border border-dashed border-white/10 bg-black/20">
                  <div className="text-center">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/38">Dati nascosti</p>
                    <p className="mt-3 text-sm text-white/55">Riattiva la visibilità per consultare spese e utile netto nel tempo.</p>
                  </div>
                </div>
              </div>
            ) : secondaryChart ? (
              <div className="relative rounded-[26px] border border-white/10 bg-white/[0.03] p-4">
                {activeSecondaryValue ? (
                  <div className="absolute right-4 top-4 rounded-2xl border border-white/10 bg-[#0e0e10]/95 px-4 py-3 text-right shadow-xl">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/42">{activeSecondaryValue.title}</p>
                    <div className="mt-2 space-y-1.5 text-sm">
                      <p className="flex items-center justify-end gap-2 text-white/72">
                        <span className="h-2.5 w-2.5 rounded-full bg-white/60" />
                        <span>Spese {activeSecondaryValue.expenses}</span>
                      </p>
                      <p className="flex items-center justify-end gap-2 text-white">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#eef879]" />
                        <span>Utile netto {activeSecondaryValue.net}</span>
                      </p>
                    </div>
                  </div>
                ) : null}
                <svg viewBox={`0 0 ${secondaryChart.width} ${secondaryChart.height}`} className="h-[220px] w-full">
                  {[0, 0.5, 1].map((ratio) => {
                    const y = secondaryChart.paddingTop + secondaryChart.usableHeight * ratio
                    return (
                      <line
                        key={ratio}
                        x1="24"
                        y1={y}
                        x2={secondaryChart.width - 24}
                        y2={y}
                        stroke="rgba(255,255,255,0.08)"
                        strokeDasharray="4 8"
                      />
                    )
                  })}
                  <line
                    x1="24"
                    y1={secondaryChart.zeroY}
                    x2={secondaryChart.width - 24}
                    y2={secondaryChart.zeroY}
                    stroke="rgba(255,255,255,0.24)"
                    strokeWidth="1.5"
                  />
                  <polyline fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={secondaryChart.expenseLine} />
                  <polyline fill="none" stroke="#eef879" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={secondaryChart.netLine} />
                  {secondaryChart.expensePoints.map((point) => (
                    <g key={`expense-${point.key}`}>
                      <circle cx={point.x} cy={point.y} r="3.5" fill="rgba(255,255,255,0.55)" />
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r="12"
                        fill="transparent"
                        onMouseEnter={() => setActiveSecondaryDatum(point.key)}
                        onMouseLeave={() => setActiveSecondaryDatum(null)}
                        onFocus={() => setActiveSecondaryDatum(point.key)}
                        onBlur={() => setActiveSecondaryDatum(null)}
                        onClick={() => setActiveSecondaryDatum(point.key)}
                      />
                      <text x={point.x} y={secondaryChart.height - 10} textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="12">
                        {point.label}
                      </text>
                    </g>
                  ))}
                  {secondaryChart.netPoints.map((point) => (
                    <g key={`net-${point.key}`}>
                      <circle cx={point.x} cy={point.y} r="3.5" fill="#eef879" />
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r="12"
                        fill="transparent"
                        onMouseEnter={() => setActiveSecondaryDatum(point.key)}
                        onMouseLeave={() => setActiveSecondaryDatum(null)}
                        onFocus={() => setActiveSecondaryDatum(point.key)}
                        onBlur={() => setActiveSecondaryDatum(null)}
                        onClick={() => setActiveSecondaryDatum(point.key)}
                      />
                    </g>
                  ))}
                </svg>
              </div>
            ) : null}
          </article>
        </div>

        <article className="shop-card space-y-4 p-6">
          <h2 className="text-xl font-semibold text-white">Medie e indicatori</h2>
          <div className="grid gap-4">
            <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4">
              <p className="text-sm text-white/55">Guadagno medio giornaliero</p>
              <p className="mt-2 text-xl font-semibold text-white">{maskValue(!showMetrics, formatPrice(analytics?.averageDailyNet ?? 0))}</p>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4">
              <p className="text-sm text-white/55">Guadagno medio mensile</p>
              <p className="mt-2 text-xl font-semibold text-white">{maskValue(!showMetrics, formatPrice(analytics?.averageMonthlyNet ?? 0))}</p>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4">
              <p className="text-sm text-white/55">Spese medie giornaliere</p>
              <p className="mt-2 text-xl font-semibold text-white">{maskValue(!showMetrics, formatPrice(analytics?.averageDailyExpenses ?? 0))}</p>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4">
              <p className="text-sm text-white/55">Spese medie mensili</p>
              <p className="mt-2 text-xl font-semibold text-white">{maskValue(!showMetrics, formatPrice(analytics?.averageMonthlyExpenses ?? 0))}</p>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4">
              <p className="text-sm text-white/55">Prodotto più venduto</p>
              <p className="mt-2 text-lg font-semibold text-white">{analytics?.bestSellingProduct?.title || "Nessun dato disponibile"}</p>
              {analytics?.bestSellingProduct ? <p className="mt-1 text-sm text-white/55">{maskValue(!showMetrics, `${analytics.bestSellingProduct.quantity} unità vendute`)}</p> : null}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4">
                <p className="text-sm text-white/55">Visualizzazioni oggi</p>
                <p className="mt-2 text-xl font-semibold text-white">{maskValue(!showMetrics, analytics?.siteViewsToday ?? 0)}</p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4">
                <p className="text-sm text-white/55">Visualizzazioni mese</p>
                <p className="mt-2 text-xl font-semibold text-white">{maskValue(!showMetrics, analytics?.siteViewsThisMonth ?? 0)}</p>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  )
}
