import { useEffect, useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"

import { ProductCard } from "../components/ProductCard"
import { ShopLayout } from "../components/ShopLayout"
import { apiFetch } from "../lib/api"
import { ShopProduct, ShopProductListResponse } from "../types"

const SORT_OPTIONS = [
  { value: "manual", label: "Ordine catalogo" },
  { value: "newest", label: "Novita" },
  { value: "price_asc", label: "Prezzo crescente" },
  { value: "price_desc", label: "Prezzo decrescente" },
  { value: "title_asc", label: "Titolo A-Z" },
] as const

const PAGE_SIZE = 12

export function ShopPage() {
  const [products, setProducts] = useState<ShopProduct[]>([])
  const [pagination, setPagination] = useState({ page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 1 })
  const [searchParams, setSearchParams] = useSearchParams()

  const filters = useMemo(
    () => ({
      search: searchParams.get("search") || "",
      category: searchParams.get("category") || "",
      format: (searchParams.get("format") || "").toUpperCase(),
      availability: searchParams.get("availability") || "",
      maxPrice: searchParams.get("maxPrice") || "",
      sort: searchParams.get("sort") || "manual",
      page: Math.max(1, Number(searchParams.get("page") || 1)),
      collection: (searchParams.get("collection") || "all") as "all" | "new" | "best" | "discount",
    }),
    [searchParams],
  )

  useEffect(() => {
    const params = new URLSearchParams()
    if (filters.search) params.set("search", filters.search)
    if (filters.category) params.set("category", filters.category)
    if (filters.format === "A3" || filters.format === "A4") params.set("format", filters.format)
    if (filters.availability) params.set("availability", filters.availability)
    if (filters.maxPrice) params.set("maxPrice", filters.maxPrice)
    params.set("sort", filters.collection === "new" ? "newest" : filters.collection === "discount" ? "price_asc" : filters.sort)
    params.set("page", String(filters.page))
    params.set("pageSize", String(PAGE_SIZE))
    if (filters.collection === "best") {
      params.set("featured", "true")
    }

    apiFetch<ShopProductListResponse>(`/store/products?${params.toString()}`).then((data) => {
      setProducts(data.items)
      setPagination(data.pagination)
    })
  }, [filters.availability, filters.category, filters.collection, filters.format, filters.maxPrice, filters.page, filters.search, filters.sort])

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams)
    if (value) {
      next.set(key, value)
    } else {
      next.delete(key)
    }
    next.set("page", "1")
    setSearchParams(next)
  }

  function setPage(page: number) {
    const next = new URLSearchParams(searchParams)
    next.set("page", String(page))
    setSearchParams(next)
  }

  const activeFilters = [
    filters.search ? `Ricerca: ${filters.search}` : null,
    filters.category ? `Categoria: ${filters.category}` : null,
    filters.format ? `Formato: ${filters.format}` : null,
    filters.availability === "available"
      ? "Disponibili"
      : filters.availability === "out_of_stock"
        ? "Esauriti"
        : null,
    filters.maxPrice ? `Prezzo max: ${filters.maxPrice}` : null,
    filters.collection !== "all"
      ? filters.collection === "new"
        ? "Novita"
        : filters.collection === "best"
          ? "In evidenza"
          : "Prezzo crescente"
      : null,
    filters.sort !== "manual" && filters.collection === "all"
      ? `Ordina: ${SORT_OPTIONS.find((option) => option.value === filters.sort)?.label || filters.sort}`
      : null,
  ].filter(Boolean)

  return (
    <ShopLayout
      eyebrow={`Shop · ${pagination.total} ${pagination.total === 1 ? "prodotto" : "prodotti"}`}
      title="Asset pronti, integrati nel sito."
      intro="Catalogo BNS Studio con ricerca centralizzata, filtri più robusti, ordinamento reale e paginazione server-side per mantenere il flusso shop leggibile anche quando il catalogo cresce."
    >
      <div className="grid gap-3 rounded-[24px] border border-white/10 bg-white/[0.03] p-4 md:grid-cols-2 xl:grid-cols-6">
        <input
          className="shop-input xl:col-span-2"
          placeholder="Cerca per titolo, slug o descrizione"
          value={filters.search}
          onChange={(event) => updateParam("search", event.target.value)}
        />
        <input
          className="shop-input"
          placeholder="Categoria"
          value={filters.category}
          onChange={(event) => updateParam("category", event.target.value)}
        />
        <select className="shop-select" value={filters.format} onChange={(event) => updateParam("format", event.target.value)}>
          <option value="">Tutti i formati</option>
          <option value="A4">A4</option>
          <option value="A3">A3</option>
        </select>
        <select
          className="shop-select"
          value={filters.availability}
          onChange={(event) => updateParam("availability", event.target.value)}
        >
          <option value="">Tutta la disponibilita</option>
          <option value="available">Acquistabili</option>
          <option value="out_of_stock">Esauriti</option>
        </select>
        <input
          className="shop-input"
          type="number"
          min="0"
          placeholder="Prezzo max"
          value={filters.maxPrice}
          onChange={(event) => updateParam("maxPrice", event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          {activeFilters.length ? (
            <>
              {activeFilters.map((filter) => (
                <span key={filter} className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/75">
                  {filter}
                </span>
              ))}
              <Link to="/shop" className="text-sm text-white/60 underline underline-offset-4 transition hover:text-white">
                Reset ricerca
              </Link>
            </>
          ) : (
            <span className="text-sm text-white/55">Catalogo completo con filtri attivi lato server.</span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select className="shop-select min-w-[12rem]" value={filters.collection} onChange={(event) => updateParam("collection", event.target.value)}>
            <option value="all">Tutte le collezioni</option>
            <option value="new">Novita</option>
            <option value="best">In evidenza</option>
            <option value="discount">Prezzo crescente</option>
          </select>
          <select className="shop-select min-w-[12rem]" value={filters.sort} onChange={(event) => updateParam("sort", event.target.value)}>
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!products.length ? (
        <div className="rounded-[24px] border border-dashed border-white/10 px-6 py-14 text-center text-white/60">
          Nessun prodotto trovato con i criteri attuali.
        </div>
      ) : null}

      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] items-stretch gap-6 xl:gap-7">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {pagination.totalPages > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[24px] border border-white/10 bg-white/[0.03] px-4 py-4">
          <p className="text-sm text-white/65">
            Pagina {pagination.page} di {pagination.totalPages} · {pagination.total} prodotti totali
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => setPage(Math.max(1, pagination.page - 1))}
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/75 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Precedente
            </button>
            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPage(Math.min(pagination.totalPages, pagination.page + 1))}
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/75 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Successiva
            </button>
          </div>
        </div>
      ) : null}
    </ShopLayout>
  )
}
