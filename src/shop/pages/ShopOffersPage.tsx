import { useEffect, useState } from "react"

import { ProductCard } from "../components/ProductCard"
import { ShopLayout } from "../components/ShopLayout"
import { apiFetch } from "../lib/api"
import { ShopProduct, ShopProductListResponse } from "../types"

const OFFERS_PAGE_SIZE = 48

export function ShopOffersPage() {
  const [products, setProducts] = useState<ShopProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    setLoading(true)
    setError("")

    apiFetch<ShopProductListResponse>(`/store/products?discounted=true&page=1&pageSize=${OFFERS_PAGE_SIZE}&sort=manual`)
      .then((data) => {
        setProducts(data.items)
        setLoading(false)
      })
      .catch((err) => {
        setProducts([])
        setError(err instanceof Error ? err.message : "Alcuni contenuti non sono disponibili al momento.")
        setLoading(false)
      })
  }, [])

  return (
    <ShopLayout
      eyebrow="Offerte"
      title="Vedi offerte"
      intro="Una selezione pulita di prodotti attualmente in sconto, senza filtri aggiuntivi o percorsi secondari."
    >
      <div className="space-y-6">
        {loading ? <div className="rounded-[24px] border border-white/10 bg-white/[0.03] px-6 py-14 text-center text-white/60">Caricamento offerte...</div> : null}

        {!loading && error ? (
          <div className="rounded-[24px] border border-amber-400/20 bg-amber-400/10 px-6 py-14 text-center text-amber-100">
            {error}
          </div>
        ) : null}

        {!loading && !error && !products.length ? (
          <div className="rounded-[24px] border border-dashed border-white/10 px-6 py-14 text-center text-white/60">
            Al momento non ci sono offerte attive. Torna presto per vedere le prossime selezioni scontate.
          </div>
        ) : null}

        {!loading && !error && products.length ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] items-stretch gap-6 xl:gap-7">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : null}
      </div>
    </ShopLayout>
  )
}
