import { useEffect, useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"

import { getButtonClassName } from "../../components/Button"
import { ProductCard } from "../components/ProductCard"
import { ShopLayout } from "../components/ShopLayout"
import { apiFetch } from "../lib/api"
import { AdminCollection, ShopProduct, ShopProductListResponse } from "../types"

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
  const [collections, setCollections] = useState<AdminCollection[]>([])
  const [pagination, setPagination] = useState({ page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 1 })
  const [searchParams, setSearchParams] = useSearchParams()

  const filters = useMemo(
    () => ({
      search: searchParams.get("search") || "",
      category: searchParams.get("category") || "",
      format: (searchParams.get("format") || "").toUpperCase(),
      tag: searchParams.get("tag") || "",
      collectionSlug: searchParams.get("collectionSlug") || "",
      availability: searchParams.get("availability") || "",
      maxPrice: searchParams.get("maxPrice") || "",
      sort: searchParams.get("sort") || "manual",
      page: Math.max(1, Number(searchParams.get("page") || 1)),
      title: searchParams.get("title") || "",
      collection: (searchParams.get("collection") || "all") as "all" | "new" | "best" | "discount",
    }),
    [searchParams],
  )

  useEffect(() => {
    apiFetch<AdminCollection[]>("/store/collections").then(setCollections).catch(() => setCollections([]))
  }, [])

  useEffect(() => {
    const params = new URLSearchParams()
    if (filters.search) params.set("search", filters.search)
    if (filters.category) params.set("category", filters.category)
    if (filters.format === "A3" || filters.format === "A4") params.set("format", filters.format)
    if (filters.tag) params.set("tag", filters.tag)
    if (filters.collectionSlug) params.set("collectionSlug", filters.collectionSlug)
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
  }, [filters.availability, filters.category, filters.collection, filters.collectionSlug, filters.format, filters.maxPrice, filters.page, filters.search, filters.sort, filters.tag])

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

  function formatContextLabel(value: string) {
    return value
      .replace(/[-_]+/g, " ")
      .trim()
      .replace(/\s+/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
  }

  const collectionTitle = collections.find((collection) => collection.slug === filters.collectionSlug)?.title || ""
  const pageContextLabel =
    filters.title.trim() ||
    filters.category.trim() ||
    collectionTitle ||
    (filters.search ? formatContextLabel(filters.search) : "") ||
    (filters.tag ? formatContextLabel(filters.tag) : "") ||
    (filters.collection === "new"
      ? "Novità"
      : filters.collection === "best"
        ? "In evidenza"
        : filters.collection === "discount"
          ? "Prezzo crescente"
          : "Catalogo")

  const effectiveSort = filters.collection === "new" ? "newest" : filters.collection === "discount" ? "price_asc" : filters.sort

  const activeFilters = [
    filters.search ? `Ricerca: ${filters.search}` : null,
    filters.format ? `Formato: ${filters.format}` : null,
    filters.maxPrice ? `Prezzo max: ${filters.maxPrice}` : null,
    effectiveSort !== "manual"
      ? `Ordina: ${SORT_OPTIONS.find((option) => option.value === effectiveSort)?.label || effectiveSort}`
      : null,
  ].filter(Boolean)

  return (
    <ShopLayout
      eyebrow=""
      title={pageContextLabel}
      intro=""
    >
      <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
        <div className="flex flex-col gap-3 border-b border-white/10 pb-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/45">{pageContextLabel}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select className="shop-select min-w-[12rem]" value={effectiveSort} onChange={(event) => updateParam("sort", event.target.value)}>
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1.8fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.8fr)]">
          <input
            className="shop-input"
            placeholder="Cerca per titolo, tag, SKU o descrizione"
            value={filters.search}
            onChange={(event) => updateParam("search", event.target.value)}
          />
          <select className="shop-select" value={filters.format} onChange={(event) => updateParam("format", event.target.value)}>
            <option value="">Tutti i formati</option>
            <option value="A4">A4</option>
            <option value="A3">A3</option>
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
            <span className="text-sm text-white/55">{pagination.total} {pagination.total === 1 ? "prodotto" : "prodotti"}</span>
          )}
        </div>
        <p className="text-sm text-white/55">
          Ordinamento attuale:{" "}
          {SORT_OPTIONS.find((option) => option.value === effectiveSort)?.label || "Ordine catalogo"}
        </p>
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
              className={getButtonClassName({ variant: "profile", size: "sm", disabled: pagination.page <= 1 })}
            >
              Precedente
            </button>
            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPage(Math.min(pagination.totalPages, pagination.page + 1))}
              className={getButtonClassName({ variant: "profile", size: "sm", disabled: pagination.page >= pagination.totalPages })}
            >
              Successiva
            </button>
          </div>
        </div>
      ) : null}
    </ShopLayout>
  )
}
