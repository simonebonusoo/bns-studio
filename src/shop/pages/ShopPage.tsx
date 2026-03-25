import { useEffect, useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline"

import { ProductCard } from "../components/ProductCard"
import { ShopLayout } from "../components/ShopLayout"
import { apiFetch } from "../lib/api"
import { ShopProduct } from "../types"

export function ShopPage() {
  const [products, setProducts] = useState<ShopProduct[]>([])
  const [searchParams] = useSearchParams()

  const filters = useMemo(
    () => ({
      search: searchParams.get("search") || "",
      category: searchParams.get("category") || "",
      maxPrice: searchParams.get("maxPrice") || "",
      collection: (searchParams.get("collection") || "all") as "all" | "new" | "best" | "discount",
    }),
    [searchParams],
  )

  useEffect(() => {
    const params = new URLSearchParams()
    if (filters.search) params.set("search", filters.search)
    if (filters.category) params.set("category", filters.category)
    if (filters.maxPrice) params.set("maxPrice", filters.maxPrice)

    apiFetch<ShopProduct[]>(`/store/products?${params.toString()}`).then(setProducts)
  }, [filters.category, filters.maxPrice, filters.search])

  const displayedProducts = useMemo(() => {
    if (!products.length) return []

    if (filters.collection === "best") {
      return products.filter((product) => product.featured)
    }

    if (filters.collection === "new") {
      return [...products]
        .sort((a, b) => {
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : a.id
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : b.id
          return bTime - aTime
        })
        .slice(0, Math.min(6, products.length))
    }

    if (filters.collection === "discount") {
      const averagePrice =
        products.reduce((sum, product) => sum + product.price, 0) / Math.max(products.length, 1)
      return products.filter((product) => product.price <= averagePrice)
    }

    return products
  }, [filters.collection, products])

  const activeFilters = [
    filters.search ? `Ricerca: ${filters.search}` : null,
    filters.category ? `Categoria: ${filters.category}` : null,
    filters.maxPrice ? `Prezzo max: ${filters.maxPrice}` : null,
    filters.collection !== "all"
      ? filters.collection === "new"
        ? "Novita"
        : filters.collection === "best"
          ? "In evidenza"
          : "Sconti"
      : null,
  ].filter(Boolean)

  return (
    <ShopLayout
      eyebrow="Shop"
      title="Asset pronti, integrati nel sito."
      intro="Catalogo ecommerce nativo BNS Studio con ricerca centralizzata, risultati filtrati e prodotto sempre in primo piano."
    >
      <div className="flex flex-col gap-4 rounded-[24px] border border-zinc-200 bg-white px-5 py-4 shadow-[0_10px_28px_rgba(15,23,42,0.05)] md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.26em] text-zinc-500">Search-first Catalog</p>
          <p className="mt-2 text-sm text-zinc-600">
            Usa la barra di ricerca nella navbar per aprire suggerimenti, categorie e risultati live.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <MagnifyingGlassIcon className="h-4 w-4" />
          <span>{displayedProducts.length} prodotti visibili</span>
        </div>
      </div>

      {activeFilters.length ? (
        <div className="flex flex-wrap items-center gap-3">
          {activeFilters.map((filter) => (
            <span key={filter} className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-700">
              {filter}
            </span>
          ))}
          <Link to="/shop" className="text-sm text-zinc-500 underline underline-offset-4 transition hover:text-zinc-900">
            Reset ricerca
          </Link>
        </div>
      ) : null}

      {!displayedProducts.length ? (
        <div className="rounded-[24px] border border-dashed border-zinc-200 bg-white/70 px-6 py-14 text-center text-zinc-500">
          Nessun prodotto trovato con i criteri attuali.
        </div>
      ) : null}

      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] items-stretch gap-6">
        {displayedProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </ShopLayout>
  )
}
