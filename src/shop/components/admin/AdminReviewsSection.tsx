import { ShopReview } from "../../types"

type AdminReview = ShopReview & {
  status: string
  showOnHomepage: boolean
}

type AdminReviewsSectionProps = {
  reviews: AdminReview[]
  onToggleHomepageReview: (reviewId: string, checked: boolean) => void
}

export function AdminReviewsSection({ reviews, onToggleHomepageReview }: AdminReviewsSectionProps) {
  return (
    <section className="shop-card space-y-5 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Recensioni</h2>
          <p className="mt-1 text-sm text-white/55">Seleziona fino a 10 recensioni da mostrare nel loop della homepage.</p>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/65">
          {reviews.filter((review) => review.showOnHomepage).length} / 10 in homepage
        </span>
      </div>

      <div className="space-y-3">
        {reviews.map((review) => {
          const selectedCount = reviews.filter((item) => item.showOnHomepage).length
          const disableSelect = !review.showOnHomepage && selectedCount >= 10

          return (
            <article key={review.id} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-base font-medium text-white">{review.authorName}</p>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60">{review.rating}/5</span>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60">{new Date(review.createdAt).toLocaleDateString("it-IT")}</span>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60">{review.status}</span>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-white">{review.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-7 text-white/68">{review.body}</p>
                  <div className="mt-3">
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60">{review.tag}</span>
                  </div>
                </div>

                <label className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm ${review.showOnHomepage ? "border-[#e3f503]/40 text-white" : "border-white/10 text-white/65"}`}>
                  <input type="checkbox" checked={review.showOnHomepage} disabled={disableSelect} onChange={(event) => onToggleHomepageReview(review.id, event.target.checked)} />
                  Mostra in homepage
                </label>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
