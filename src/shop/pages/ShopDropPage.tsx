import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"

import { Button } from "../../components/Button"
import { ProductCard } from "../components/ProductCard"
import { ShopLayout } from "../components/ShopLayout"
import { apiFetch } from "../lib/api"
import { ShopDrop } from "../types"

function formatLaunch(value?: string | null) {
  if (!value) return ""
  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(value))
}

export function ShopDropPage() {
  const navigate = useNavigate()
  const { slug = "" } = useParams()
  const [drop, setDrop] = useState<ShopDrop | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false
    setError("")
    apiFetch<ShopDrop>(`/store/drops/${slug}`)
      .then((data) => {
        if (!cancelled) setDrop(data)
      })
      .catch((err) => {
        if (cancelled) return
        setDrop(null)
        setError(err instanceof Error ? err.message : "Drop non disponibile.")
      })
    return () => {
      cancelled = true
    }
  }, [slug])

  return (
    <ShopLayout
      eyebrow={drop?.label || "Drop"}
      title={drop?.title || "Drop"}
      intro={drop?.shortDescription || ""}
      actions={
        <Button variant="profile" size="sm" onClick={() => navigate("/shop")}>
          Torna al catalogo
        </Button>
      }
    >
      {error ? (
        <div className="rounded-[24px] border border-white/10 bg-white/[0.03] px-6 py-14 text-center text-white/60">
          {error}
        </div>
      ) : null}

      {drop ? (
        <>
          <section className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03]">
            {drop.coverImageUrl ? (
              <img src={drop.coverImageUrl} alt="" className="max-h-[520px] w-full object-cover" />
            ) : null}
            <div className="space-y-4 p-6 md:p-8">
              <div className="flex flex-wrap items-center gap-3">
                {drop.label ? <span className="shop-pill">{drop.label}</span> : null}
                {drop.launchAt ? <span className="text-sm text-white/55">{formatLaunch(drop.launchAt)}</span> : null}
              </div>
              {drop.description ? <p className="max-w-3xl text-sm leading-7 text-white/68">{drop.description}</p> : null}
            </div>
          </section>

          {drop.products?.length ? (
            <section className="space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/45">Poster del drop</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">{drop.products.length} poster disponibili</h2>
                </div>
                <Link to="/shop" className="text-sm text-white/60 underline underline-offset-4 transition hover:text-white">
                  Vai al catalogo
                </Link>
              </div>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] items-stretch gap-6 xl:gap-7">
                {drop.products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          ) : (
            <div className="rounded-[24px] border border-dashed border-white/10 px-6 py-14 text-center text-white/60">
              Nessun poster disponibile in questo drop.
            </div>
          )}
        </>
      ) : null}
    </ShopLayout>
  )
}
