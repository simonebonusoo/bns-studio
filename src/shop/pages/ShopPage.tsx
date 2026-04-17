import { useEffect, useMemo, useRef, useState } from "react"
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom"

import { Button, getButtonClassName } from "../../components/Button"
import { useIsMobileViewport } from "../../hooks/useIsMobileViewport"
import { ProductCard } from "../components/ProductCard"
import { ShopLayout } from "../components/ShopLayout"
import { apiFetch } from "../lib/api"
import { scrollCatalogSectionToTop } from "../lib/catalog-navigation.mjs"
import { buildCatalogReturnState, clearCatalogReturnState, readCatalogReturnState, persistCatalogReturnState } from "../lib/catalog-return.mjs"
import { formatPrice } from "../lib/format"
import { readHomeReturnState } from "../lib/home-return.mjs"
import { getDefaultVariant } from "../lib/product"
import { useShopCart } from "../context/ShopCartProvider"
import { AdminCollection, ShopDrop, ShopProduct, ShopProductListResponse } from "../types"

const SORT_OPTIONS = [
  { value: "manual", label: "Ordine catalogo" },
  { value: "newest", label: "Novita" },
  { value: "price_asc", label: "Prezzo crescente" },
  { value: "price_desc", label: "Prezzo decrescente" },
  { value: "title_asc", label: "Titolo A-Z" },
] as const

const PAGE_SIZE = 12

export function ShopPage() {
  const previousPageRef = useRef<number | null>(null)
  const cartFeedbackTimeoutsRef = useRef<Record<number, number>>({})
  const location = useLocation()
  const navigate = useNavigate()
  const { addItem, items } = useShopCart()
  const [products, setProducts] = useState<ShopProduct[]>([])
  const [collections, setCollections] = useState<AdminCollection[]>([])
  const [drops, setDrops] = useState<ShopDrop[]>([])
  const [pagination, setPagination] = useState({ page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 1 })
  const [searchInput, setSearchInput] = useState("")
  const [catalogError, setCatalogError] = useState("")
  const [searchParams, setSearchParams] = useSearchParams()
  const previousEditorialContext = useRef("")
  const isMobileViewport = useIsMobileViewport()
  const [mobileCatalogView, setMobileCatalogView] = useState<"full" | "compact">("full")
  const [mobileQuickAddFeedback, setMobileQuickAddFeedback] = useState<Record<number, number>>({})

  const filters = useMemo(
    () => {
      const rawPage = Number(searchParams.get("page") || 1)
      const safePage = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1

      return {
      search: searchParams.get("search") || "",
      category: searchParams.get("category") || "",
      format: (searchParams.get("format") || "").toUpperCase(),
      tag: searchParams.get("tag") || "",
      collectionSlug: searchParams.get("collectionSlug") || "",
      availability: searchParams.get("availability") || "",
      maxPrice: searchParams.get("maxPrice") || "",
      sort: searchParams.get("sort") || "manual",
      page: safePage,
      title: searchParams.get("title") || "",
      subtitle: searchParams.get("subtitle") || "",
      collection: (searchParams.get("collection") || "all") as "all" | "new" | "best" | "discount",
      }
    },
    [searchParams],
  )

  useEffect(() => {
    apiFetch<AdminCollection[]>("/store/collections")
      .then((data) => setCollections(Array.isArray(data) ? data : []))
      .catch(() => setCollections([]))
    apiFetch<ShopDrop[]>("/store/drops")
      .then((data) => setDrops(Array.isArray(data) ? data : []))
      .catch(() => setDrops([]))
  }, [])

  useEffect(() => {
    return () => {
      Object.values(cartFeedbackTimeoutsRef.current).forEach((timeoutId) => window.clearTimeout(timeoutId))
    }
  }, [])

  useEffect(() => {
    if (previousPageRef.current === null) {
      previousPageRef.current = filters.page
      return
    }

    if (previousPageRef.current !== filters.page) {
      scrollCatalogSectionToTop(null)
      previousPageRef.current = filters.page
    }
  }, [filters.page])

  useEffect(() => {
    let cancelled = false
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

    setCatalogError("")

    apiFetch<ShopProductListResponse>(`/store/products?${params.toString()}`)
      .then((data) => {
        if (cancelled) return
        setProducts(Array.isArray(data?.items) ? data.items : [])
        setPagination({
          page: Number.isFinite(data?.pagination?.page) ? data.pagination.page : 1,
          pageSize: Number.isFinite(data?.pagination?.pageSize) ? data.pagination.pageSize : PAGE_SIZE,
          total: Number.isFinite(data?.pagination?.total) ? data.pagination.total : 0,
          totalPages: Number.isFinite(data?.pagination?.totalPages) ? Math.max(1, data.pagination.totalPages) : 1,
        })
      })
      .catch((err) => {
        if (cancelled) return
        setProducts([])
        setPagination({ page: filters.page, pageSize: PAGE_SIZE, total: 0, totalPages: 1 })
        setCatalogError(err instanceof Error ? err.message : "Alcuni contenuti non sono disponibili al momento.")
      })

    return () => {
      cancelled = true
    }
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
  const editorialSubtitle =
    filters.subtitle.trim() ||
    (pageContextLabel !== "Catalogo" ? `Esplora la selezione dedicata a ${pageContextLabel.toLowerCase()}.` : "")

  const effectiveSort = filters.collection === "new" ? "newest" : filters.collection === "discount" ? "price_asc" : filters.sort
  const lockedEditorialContext = Boolean(filters.category || filters.collectionSlug || filters.title || filters.subtitle)
  const editorialContextKey = [filters.category, filters.collectionSlug, filters.title, filters.subtitle].join("|")

  useEffect(() => {
    if (lockedEditorialContext) {
      if (previousEditorialContext.current !== editorialContextKey || !filters.search) {
        setSearchInput("")
      }
      previousEditorialContext.current = editorialContextKey
      return
    }

    previousEditorialContext.current = editorialContextKey
    setSearchInput(filters.search)
  }, [editorialContextKey, filters.search, lockedEditorialContext])

  const resetFiltersHref = useMemo(() => {
    const next = new URLSearchParams()
    if (filters.category) next.set("category", filters.category)
    if (filters.collectionSlug) next.set("collectionSlug", filters.collectionSlug)
    if (filters.title) next.set("title", filters.title)
    if (filters.subtitle) next.set("subtitle", filters.subtitle)
    const query = next.toString()
    return query ? `/shop?${query}` : "/shop"
  }, [filters.category, filters.collectionSlug, filters.title, filters.subtitle])

  const activeFilters = [
    filters.search ? `Ricerca: ${filters.search}` : null,
    filters.format ? `Formato: ${filters.format}` : null,
    filters.maxPrice ? `Prezzo max: ${filters.maxPrice}` : null,
    effectiveSort !== "manual"
      ? `Ordina: ${SORT_OPTIONS.find((option) => option.value === effectiveSort)?.label || effectiveSort}`
      : null,
  ].filter(Boolean)

  function getProductCartQuantity(productId: number) {
    return (items ?? []).reduce((sum, item) => (item.productId === productId ? sum + item.quantity : sum), 0)
  }

  function handleMobileQuickAdd(event: React.MouseEvent<HTMLButtonElement>, product: ShopProduct) {
    event.preventDefault()
    event.stopPropagation()

    const defaultVariant = getDefaultVariant(product)
    const nextQuantity = getProductCartQuantity(product.id) + 1

    if (product.isCustomizable) {
      navigate(`/shop/${product.slug}`)
      return
    }

    addItem(product, 1, {
      variantId: defaultVariant?.id ?? null,
      format: defaultVariant?.title || null,
      variantLabel: defaultVariant?.title || null,
      variantSku: defaultVariant?.sku || null,
    })

    setMobileQuickAddFeedback((current) => ({
      ...current,
      [product.id]: nextQuantity,
    }))

    if (cartFeedbackTimeoutsRef.current[product.id]) {
      window.clearTimeout(cartFeedbackTimeoutsRef.current[product.id])
    }

    cartFeedbackTimeoutsRef.current[product.id] = window.setTimeout(() => {
      setMobileQuickAddFeedback((current) => {
        const next = { ...current }
        delete next[product.id]
        return next
      })
      delete cartFeedbackTimeoutsRef.current[product.id]
    }, 1000)
  }

  function rememberCatalogPosition() {
    const pathnameSearch = `${location.pathname}${location.search || ""}`
    persistCatalogReturnState(
      buildCatalogReturnState(pathnameSearch, typeof window !== "undefined" ? window.scrollY : 0, mobileCatalogView),
    )
  }

  function handleBackNavigation() {
    const storedHomeReturn = readHomeReturnState()
    if (storedHomeReturn) {
      navigate(storedHomeReturn.homePathname || "/", {
        state: {
          restoreHomeFromShop: true,
          restoreHomeScrollY: storedHomeReturn.homeScrollY,
        },
      })
      return
    }

    if (typeof window !== "undefined" && window.history.length > 1) {
      navigate(-1)
      return
    }

    navigate("/")
  }

  useEffect(() => {
    const state = location.state as { restoreCatalogFromProduct?: boolean; restoreCatalogScrollY?: number; restoreCatalogView?: "full" | "compact" } | null
    const stored = readCatalogReturnState()
    const nextY = Number.isFinite(state?.restoreCatalogScrollY) ? Number(state?.restoreCatalogScrollY) : stored?.scrollY
    const nextView = state?.restoreCatalogView === "compact" ? "compact" : state?.restoreCatalogView === "full" ? "full" : stored?.view
    const storedIsFresh = Boolean(stored?.savedAt && Date.now() - stored.savedAt < 15000)
    const shouldRestore = Boolean(state?.restoreCatalogFromProduct) || (storedIsFresh && location.pathname + location.search === stored?.pathnameSearch)

    if (!shouldRestore) return

    if (nextView) {
      setMobileCatalogView(nextView)
    }

    if (!Number.isFinite(nextY)) return

    requestAnimationFrame(() => {
      window.scrollTo(0, nextY)
      window.__lenis?.scrollTo(nextY, { immediate: true } as any)
      clearCatalogReturnState()
    })
  }, [location.key, location.pathname, location.search, location.state])

  return (
    <ShopLayout
      eyebrow=""
      title={pageContextLabel}
      intro=""
      actions={
        <Button
          variant="profile"
          size="sm"
          onClick={handleBackNavigation}
          icon={
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8">
              <path d="M18 12H6" />
              <path d="m11 17-5-5 5-5" />
            </svg>
          }
        >
          Torna indietro
        </Button>
      }
    >
      {drops.length ? (
        <section className="grid gap-4 md:grid-cols-2">
          {drops.slice(0, 2).map((drop) => (
            <Link
              key={drop.id}
              to={`/drop/${drop.slug}`}
              className="group overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03] transition hover:border-white/20"
            >
              {drop.coverImageUrl ? (
                <img src={drop.coverImageUrl} alt="" className="aspect-[16/9] w-full object-cover transition duration-500 group-hover:scale-[1.02]" />
              ) : null}
              <div className="space-y-2 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  {drop.label ? <span className="shop-pill">{drop.label}</span> : null}
                  <span className="text-xs uppercase tracking-[0.18em] text-white/45">Drop</span>
                </div>
                <h2 className="text-xl font-semibold text-white">{drop.title}</h2>
                {drop.shortDescription ? <p className="text-sm leading-6 text-white/60">{drop.shortDescription}</p> : null}
              </div>
            </Link>
          ))}
        </section>
      ) : null}

      <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
        <div className="border-b border-white/10 pb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/45">{pageContextLabel}</p>
            {editorialSubtitle ? <p className="mt-2 max-w-3xl text-sm leading-6 text-white/60">{editorialSubtitle}</p> : null}
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1.8fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.8fr)]">
          <input
            className="shop-input"
            placeholder="Cerca per titolo, tag, SKU o descrizione"
            value={searchInput}
            onChange={(event) => {
              setSearchInput(event.target.value)
              updateParam("search", event.target.value)
            }}
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
          <select className="shop-select" value={effectiveSort} onChange={(event) => updateParam("sort", event.target.value)}>
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {isMobileViewport ? (
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => setMobileCatalogView((current) => (current === "full" ? "compact" : "full"))}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs uppercase tracking-[0.18em] text-white/72 transition hover:border-white/20 hover:text-white"
              aria-label={mobileCatalogView === "full" ? "Attiva vista compatta catalogo" : "Torna alla vista completa del catalogo"}
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8">
                {mobileCatalogView === "full" ? (
                  <>
                    <path d="M4.5 5.25h6.75v6.75H4.5z" />
                    <path d="M12.75 5.25h6.75v6.75h-6.75z" />
                    <path d="M4.5 12.75h6.75v6.75H4.5z" />
                    <path d="M12.75 12.75h6.75v6.75h-6.75z" />
                  </>
                ) : (
                  <>
                    <path d="M4.5 6.75h15" />
                    <path d="M4.5 12h15" />
                    <path d="M4.5 17.25h15" />
                  </>
                )}
              </svg>
              {mobileCatalogView === "full" ? "Vista compatta" : "Vista completa"}
            </button>
          </div>
        ) : null}

      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          {(activeFilters || []).length ? (
            <>
              {(activeFilters || []).map((filter) => (
                <span key={filter} className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/75">
                  {filter}
                </span>
              ))}
              <Link to={resetFiltersHref} className="text-sm text-white/60 underline underline-offset-4 transition hover:text-white">
                Reset filtri
              </Link>
            </>
          ) : (
            <span className="text-sm text-white/55">{pagination.total} {pagination.total === 1 ? "prodotto" : "prodotti"}</span>
          )}
        </div>
      </div>

      {catalogError ? (
        <div className="rounded-[24px] border border-white/10 bg-white/[0.03] px-6 py-14 text-center text-white/60">
          {catalogError}
        </div>
      ) : null}

      {!catalogError && !products.length ? (
        <div className="rounded-[24px] border border-dashed border-white/10 px-6 py-14 text-center text-white/60">
          Nessun prodotto trovato con i criteri attuali.
        </div>
      ) : null}

      {isMobileViewport && mobileCatalogView === "compact" ? (
        <div className="grid grid-cols-2 gap-3">
          {(products ?? []).map((product) => (
            <Link
              key={product.id}
              to={`/shop/${product.slug}`}
              onClick={rememberCatalogPosition}
              className="overflow-hidden rounded-[20px] border border-white/10 bg-white/[0.03] transition hover:border-white/18"
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-white/[0.04]">
                {product.imageUrls?.[0] ? (
                  <img src={product.imageUrls[0]} alt={product.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-white/45">Nessuna immagine</div>
                )}
                <button
                  type="button"
                  onClick={(event) => handleMobileQuickAdd(event, product)}
                  className="absolute bottom-2 right-2 inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-white/15 bg-black/60 px-3 text-sm font-medium text-white/92 backdrop-blur transition hover:border-white/25 hover:text-white"
                  aria-label={`Aggiungi ${product.title} al carrello`}
                >
                  {mobileQuickAddFeedback[product.id] ?? "+"}
                </button>
              </div>
              <div className="space-y-1 p-3">
                <h2 className="line-clamp-2 text-sm font-medium text-white">{product.title}</h2>
                <p className="text-sm font-medium text-[#e3f503]">{formatPrice(product.price)}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] items-stretch gap-6 xl:gap-7">
          {(products ?? []).map((product) => (
            <div key={product.id} onClickCapture={rememberCatalogPosition}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      )}

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
