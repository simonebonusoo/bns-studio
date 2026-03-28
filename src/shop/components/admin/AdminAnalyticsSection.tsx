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
}

type AdminAnalyticsSectionProps = {
  analytics: AdminAnalytics | null
}

export function AdminAnalyticsSection({ analytics }: AdminAnalyticsSectionProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Visualizzazioni sito", analytics?.siteViewsTotal ?? 0],
          ["Vendite concluse", analytics?.salesCount ?? 0],
          ["Ordini totali", analytics?.totalOrders ?? 0],
          ["Ticket medio ordine", formatPrice(analytics?.averageOrderValue ?? 0)],
        ].map(([label, value]) => (
          <article key={label} className="shop-card p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-white/45">{label}</p>
            <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <article className="shop-card p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-white/45">Guadagno netto totale</p>
          <p className="mt-3 text-3xl font-semibold text-white">{formatPrice(analytics?.totalNet ?? 0)}</p>
        </article>
        <article className="shop-card p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-white/45">Spese totali prodotti</p>
          <p className="mt-3 text-3xl font-semibold text-white">{formatPrice(analytics?.totalExpenses ?? 0)}</p>
        </article>
        <article className="shop-card p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-white/45">Incassato totale</p>
          <p className="mt-3 text-3xl font-semibold text-white">{formatPrice(analytics?.totalRevenue ?? 0)}</p>
        </article>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <article className="shop-card space-y-4 p-6">
          <h2 className="text-xl font-semibold text-white">Medie e andamento</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4">
              <p className="text-sm text-white/55">Guadagno medio giornaliero</p>
              <p className="mt-2 text-xl font-semibold text-white">{formatPrice(analytics?.averageDailyNet ?? 0)}</p>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4">
              <p className="text-sm text-white/55">Guadagno medio mensile</p>
              <p className="mt-2 text-xl font-semibold text-white">{formatPrice(analytics?.averageMonthlyNet ?? 0)}</p>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4">
              <p className="text-sm text-white/55">Spese giornaliere</p>
              <p className="mt-2 text-xl font-semibold text-white">{formatPrice(analytics?.averageDailyExpenses ?? 0)}</p>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4">
              <p className="text-sm text-white/55">Spese mensili</p>
              <p className="mt-2 text-xl font-semibold text-white">{formatPrice(analytics?.averageMonthlyExpenses ?? 0)}</p>
            </div>
          </div>
        </article>

        <article className="shop-card space-y-4 p-6">
          <h2 className="text-xl font-semibold text-white">Best seller e traffico</h2>
          <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4">
            <p className="text-sm text-white/55">Prodotto più venduto</p>
            <p className="mt-2 text-lg font-semibold text-white">
              {analytics?.bestSellingProduct?.title || "Nessun dato disponibile"}
            </p>
            {analytics?.bestSellingProduct ? (
              <p className="mt-1 text-sm text-white/55">{analytics.bestSellingProduct.quantity} unità vendute</p>
            ) : null}
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
          {analytics && !analytics.shippingCostsTracked ? (
            <p className="text-sm text-white/50">
              I costi di spedizione operativi non sono ancora tracciati separatamente: le spese mostrano i costi prodotto reali salvati in admin.
            </p>
          ) : null}
        </article>
      </div>
    </div>
  )
}
