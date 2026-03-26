import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Link } from "react-router-dom"

import { Container } from "../components/Container"
import { Reveal } from "../components/Reveal"
import { SectionTitle } from "../components/SectionTitle"
import { Button } from "../components/Button"
import { useShopAuth } from "../shop/context/ShopAuthProvider"
import { apiFetch } from "../shop/lib/api"
import { ShopReview, ShopReviewSummary } from "../shop/types"

type ReviewsResponse = {
  reviews: ShopReview[]
  summary: ShopReviewSummary
}

const reviewTagOptions = [
  "Poster arrivato",
  "Collezione completata",
  "Regalo riuscito",
  "Supporto attivo",
] as const

function RatingDots({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: 5 }).map((_, index) => (
        <span
          key={index}
          className={`inline-block h-2 w-2 rounded-full ${index < rating ? "bg-[#e3f503]" : "bg-white/18"}`}
          aria-hidden
        />
      ))}
      <span className="ml-2 text-xs text-white/55">{rating.toFixed(1)}</span>
    </div>
  )
}

function formatReviewDate(value: string) {
  return new Intl.DateTimeFormat("it-IT", {
    month: "short",
    year: "numeric",
  }).format(new Date(value))
}

export function Testimonials() {
  const { user, loading } = useShopAuth()
  const [reviews, setReviews] = useState<ShopReview[]>([])
  const [summary, setSummary] = useState<ShopReviewSummary>({ averageRating: 0, count: 0 })
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState("")
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    rating: 5,
    title: "",
    body: "",
    tag: reviewTagOptions[0],
  })

  async function loadReviews() {
    try {
      const data = await apiFetch<ReviewsResponse>("/reviews")
      setReviews(data.reviews)
      setSummary(data.summary)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore nel caricamento delle recensioni.")
    }
  }

  useEffect(() => {
    loadReviews()
  }, [])

  const statsLabel = useMemo(() => {
    if (!summary.count) return "Nessuna recensione pubblicata"
    return `${summary.averageRating.toFixed(1)} / 5 • ${summary.count} recensioni verificate`
  }, [summary])

  const animatedReviews = useMemo(() => {
    if (!reviews.length) return []
    return [...reviews, ...reviews]
  }, [reviews])

  async function submitReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFeedback("")
    setError("")

    try {
      setSubmitting(true)
      await apiFetch<{ message: string }>("/reviews", {
        method: "POST",
        body: JSON.stringify(form),
      })
      setFeedback("Recensione pubblicata correttamente.")
      setForm({
        rating: 5,
        title: "",
        body: "",
        tag: reviewTagOptions[0],
      })
      await loadReviews()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante l'invio della recensione.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section id="recensioni" className="py-20 md:py-28">
      <Container>
        <motion.div
          className="grid gap-6"
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.45, ease: "easeOut", delay: 0.05 }}
        >
          <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6 md:p-7">
            <div className="max-w-none">
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">Lascia una recensione</p>
              <h3 className="mt-3 text-2xl font-semibold text-white">Racconta la tua esperienza con BNS Studio.</h3>
              <p className="mt-3 text-sm leading-7 text-white/65">
                Le recensioni vengono pubblicate dagli utenti autenticati e compaiono direttamente nello slider clienti.
              </p>
            </div>

            {!loading && !user ? (
              <div className="mt-6 rounded-[24px] border border-white/10 bg-black/20 px-5 py-5">
                <p className="text-sm text-white/65">
                  Accedi dal pannello profilo in alto a destra per lasciare una recensione reale collegata al tuo account.
                </p>
              </div>
            ) : null}

            {user ? (
              <form onSubmit={submitReview} className="mt-6 grid gap-4">
                <div className="grid gap-4 lg:grid-cols-[150px_180px_minmax(0,1fr)]">
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/45">Valutazione</label>
                    <select
                      className="shop-select"
                      value={form.rating}
                      onChange={(event) => setForm((current) => ({ ...current, rating: Number(event.target.value) }))}
                    >
                      {[5, 4, 3, 2, 1].map((value) => (
                        <option key={value} value={value}>
                          {value} / 5
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/45">Tag recensione</label>
                    <select
                      className="shop-select"
                      value={form.tag}
                      onChange={(event) => setForm((current) => ({ ...current, tag: event.target.value as (typeof reviewTagOptions)[number] }))}
                    >
                      {reviewTagOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/45">Titolo recensione</label>
                  <input
                    className="shop-input"
                    value={form.title}
                    onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                    placeholder="Titolo breve e chiaro"
                    minLength={3}
                    maxLength={80}
                    required
                  />
                </div>

                <div className="lg:max-w-none">
                  <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/45">La tua esperienza</label>
                  <textarea
                    className="shop-textarea min-h-24 resize-none"
                    value={form.body}
                    onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))}
                    placeholder="Racconta com'è andato l'acquisto, il prodotto e l'esperienza complessiva."
                    minLength={20}
                    maxLength={600}
                    required
                  />
                </div>

                {feedback ? <p className="text-sm text-emerald-300">{feedback}</p> : null}
                {error ? <p className="text-sm text-red-300">{error}</p> : null}

                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <p className="text-sm text-white/55">
                    Pubblica come <span className="text-white">{user.username || user.email}</span>
                  </p>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Link to="/chi-sono">
                      <Button variant="ghost" className="w-full sm:min-w-[180px]">
                        Chi sono
                      </Button>
                    </Link>
                    <Button type="submit" className="w-full sm:min-w-[220px]">
                      {submitting ? "Invio recensione..." : "Pubblica recensione"}
                    </Button>
                  </div>
                </div>
              </form>
            ) : null}
          </div>
        </motion.div>

        <div className="mt-14">
          <Reveal>
            <SectionTitle eyebrow="Recensioni clienti" title="Feedback reali da chi ha già acquistato.">
              Recensioni pubblicate direttamente dagli utenti del negozio, con valutazione media e storico reale.
            </SectionTitle>
          </Reveal>
        </div>

        <motion.div
          className="mt-10"
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <div className="mb-6 flex flex-col gap-4 rounded-[26px] border border-white/10 bg-white/[0.03] px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">Valutazione media</p>
              <div className="mt-3 flex items-center gap-3">
                <span className="text-3xl font-semibold text-white">
                  {summary.count ? summary.averageRating.toFixed(1) : "—"}
                </span>
                <RatingDots rating={summary.count ? Math.round(summary.averageRating) : 0} />
              </div>
            </div>
            <div className="rounded-full border border-white/10 px-4 py-2 text-xs text-white/65">
              {statsLabel}
            </div>
          </div>

          {!reviews.length ? (
            <div className="rounded-[28px] border border-dashed border-white/10 px-6 py-12 text-center text-white/55">
              Nessuna recensione disponibile al momento.
            </div>
          ) : (
            <div className="relative overflow-hidden">
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-[#0b0b0c] to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-[#0b0b0c] to-transparent" />

              <motion.div
                className="flex w-max gap-4 md:gap-6"
                animate={{ x: ["0%", "-50%"] }}
                transition={{
                  duration: Math.max(24, reviews.length * 7),
                  ease: "linear",
                  repeat: Infinity,
                }}
              >
                {animatedReviews.map((review, index) => (
                  <article
                    key={`${review.id}-${index}`}
                    className="glass w-[320px] shrink-0 rounded-2xl p-6 shadow-card md:w-[380px]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-sm font-semibold text-white/85">
                            {review.authorName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-white">{review.authorName}</div>
                            <div className="truncate text-sm text-white/55">{formatReviewDate(review.createdAt)}</div>
                          </div>
                        </div>
                      </div>
                      <RatingDots rating={review.rating} />
                    </div>

                    <div className="mt-5">
                      <h3 className="text-base font-medium text-white">{review.title}</h3>
                      <p className="mt-3 text-sm leading-relaxed text-white/72">“{review.body}”</p>
                    </div>

                    <div className="mt-5 flex items-center gap-2 text-xs text-white/55">
                      <span className="rounded-full border border-white/10 px-3 py-1">{review.tag}</span>
                    </div>
                  </article>
                ))}
              </motion.div>
            </div>
          )}
        </motion.div>
      </Container>
    </section>
  )
}
