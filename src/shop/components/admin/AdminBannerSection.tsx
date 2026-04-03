import { Button } from "../../../components/Button"

type TopBannerState = {
  enabled: boolean
  title: string
  subtitle: string
  countdownEnabled: boolean
  countdownTarget: string
}

type MidBannerState = {
  enabled: boolean
  text: string
}

type AdminBannerSectionProps = {
  topBanner: TopBannerState
  midBanner: MidBannerState
  onTopBannerChange: (next: TopBannerState) => void
  onMidBannerChange: (next: MidBannerState) => void
  onSaveTopBanner: () => Promise<void> | void
  onSaveMidBanner: () => Promise<void> | void
}

export function AdminBannerSection({
  topBanner,
  midBanner,
  onTopBannerChange,
  onMidBannerChange,
  onSaveTopBanner,
  onSaveMidBanner,
}: AdminBannerSectionProps) {
  return (
    <section className="space-y-6">
      <article className="shop-card space-y-5 p-6">
        <div>
          <h2 className="text-xl font-semibold text-white">Banner top</h2>
          <p className="mt-1 text-sm text-white/55">Gestisce la barra promozionale superiore, con countdown opzionale.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm text-white/70">Testo principale</span>
            <input className="shop-input" value={topBanner.title} onChange={(event) => onTopBannerChange({ ...topBanner, title: event.target.value })} />
          </label>
          <label className="space-y-2">
            <span className="text-sm text-white/70">Testo secondario</span>
            <input className="shop-input" value={topBanner.subtitle} onChange={(event) => onTopBannerChange({ ...topBanner, subtitle: event.target.value })} />
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/75">
            <input type="checkbox" checked={topBanner.enabled} onChange={(event) => onTopBannerChange({ ...topBanner, enabled: event.target.checked })} />
            Banner attivo
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/75">
            <input
              type="checkbox"
              checked={topBanner.countdownEnabled}
              onChange={(event) => onTopBannerChange({ ...topBanner, countdownEnabled: event.target.checked })}
            />
            Countdown attivo
          </label>
        </div>
        {topBanner.countdownEnabled ? (
          <label className="space-y-2">
            <span className="text-sm text-white/70">Target countdown</span>
            <input
              type="datetime-local"
              className="shop-input"
              value={topBanner.countdownTarget}
              onChange={(event) => onTopBannerChange({ ...topBanner, countdownTarget: event.target.value })}
            />
          </label>
        ) : null}
        <div className="flex justify-end">
          <Button type="button" variant="cart" onClick={() => void onSaveTopBanner()}>
            Salva banner top
          </Button>
        </div>
      </article>

      <article className="shop-card space-y-5 p-6">
        <div>
          <h2 className="text-xl font-semibold text-white">Banner mid</h2>
          <p className="mt-1 text-sm text-white/55">Gestisce la seconda barra testuale globale sotto al banner promo.</p>
        </div>
        <label className="space-y-2">
          <span className="text-sm text-white/70">Testo banner</span>
          <input className="shop-input" value={midBanner.text} onChange={(event) => onMidBannerChange({ ...midBanner, text: event.target.value })} />
        </label>
        <label className="flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/75">
          <input type="checkbox" checked={midBanner.enabled} onChange={(event) => onMidBannerChange({ ...midBanner, enabled: event.target.checked })} />
          Banner attivo
        </label>
        <div className="flex justify-end">
          <Button type="button" variant="cart" onClick={() => void onSaveMidBanner()}>
            Salva banner mid
          </Button>
        </div>
      </article>
    </section>
  )
}
