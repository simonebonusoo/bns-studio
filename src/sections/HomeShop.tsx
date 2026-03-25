import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronDownIcon, FunnelIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline"

import { Container } from "../components/Container"
import { Button } from "../components/Button"
import { ProductCard } from "../shop/components/ProductCard"
import { useShopAuth } from "../shop/context/ShopAuthProvider"
import { apiFetch } from "../shop/lib/api"
import { ShopProduct } from "../shop/types"

export function HomeShop() {
  const [products, setProducts] = useState<ShopProduct[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [filters, setFilters] = useState({ search: "", category: "", maxPrice: "" })
  const [collection, setCollection] = useState<"all" | "new" | "best" | "discount">("all")
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const { user } = useShopAuth()

  useEffect(() => {
    apiFetch<string[]>("/store/categories").then(setCategories)
  }, [])

  useEffect(() => {
    const params = new URLSearchParams()
    if (filters.search) params.set("search", filters.search)
    if (filters.category) params.set("category", filters.category)
    if (filters.maxPrice) params.set("maxPrice", filters.maxPrice)

    apiFetch<ShopProduct[]>(`/store/products?${params.toString()}`).then(setProducts)
  }, [filters])

  const displayedProducts = useMemo(() => {
    if (!products.length) return []

    if (collection === "best") {
      return products.filter((product) => product.featured)
    }

    if (collection === "new") {
      const sorted = [...products].sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : a.id
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : b.id
        return bTime - aTime
      })
      return sorted.slice(0, Math.min(6, sorted.length))
    }

    if (collection === "discount") {
      const averagePrice =
        products.reduce((sum, product) => sum + product.price, 0) / Math.max(products.length, 1)
      return products.filter((product) => product.price <= averagePrice)
    }

    return products
  }, [collection, products])

  const counts = useMemo(() => {
    const averagePrice =
      products.reduce((sum, product) => sum + product.price, 0) / Math.max(products.length, 1)

    return {
      all: products.length,
      best: products.filter((product) => product.featured).length,
      new: Math.min(6, products.length),
      discount: products.filter((product) => product.price <= averagePrice).length,
    }
  }, [products])

  function clearAllFilters() {
    setFilters({ search: "", category: "", maxPrice: "" })
    setCollection("all")
  }

  function SidebarContent() {
    return (
      <div className="rounded-[28px] border border-white/10 bg-black/55 p-5 backdrop-blur-2xl backdrop-saturate-125 shadow-[0_18px_50px_rgba(0,0,0,.22)]">
        <div className="space-y-8">
          <div>
            <div className="text-xs uppercase tracking-[0.26em] text-white/45">Search</div>
            <label className="relative mt-3 block">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
              <input
                className="shop-input pl-11"
                placeholder="Cerca per titolo"
                value={filters.search}
                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              />
            </label>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-[0.26em] text-white/45">Category</div>
              <span className="text-xs text-white/35">{categories.length + 1}</span>
            </div>

            <div className="mt-4 space-y-2">
              <button
                type="button"
                onClick={() => setFilters((current) => ({ ...current, category: "" }))}
                className={[
                  "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition",
                  filters.category === ""
                    ? "border-[#e3f503]/35 bg-white/[0.05] text-white"
                    : "border-white/10 text-white/65 hover:border-white/20 hover:text-white",
                ].join(" ")}
              >
                <span>All Product</span>
                <span className="text-xs text-white/40">{products.length}</span>
              </button>

              {categories.map((category) => {
                const categoryCount = products.filter((product) => product.category === category).length
                const active = filters.category === category

                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setFilters((current) => ({ ...current, category }))}
                    className={[
                      "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition",
                      active
                        ? "border-[#e3f503]/35 bg-white/[0.05] text-white"
                        : "border-white/10 text-white/65 hover:border-white/20 hover:text-white",
                    ].join(" ")}
                  >
                    <span>{category}</span>
                    <span className="text-xs text-white/40">{categoryCount}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-[0.26em] text-white/45">Collections</div>
            <div className="mt-4 space-y-2">
              {[
                { key: "new", label: "New Arrival", count: counts.new },
                { key: "best", label: "Best Seller", count: counts.best },
                { key: "discount", label: "On Discount", count: counts.discount },
              ].map((item) => {
                const active = collection === item.key

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setCollection(item.key as typeof collection)}
                    className={[
                      "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition",
                      active
                        ? "border-[#e3f503]/35 bg-white/[0.05] text-white"
                        : "border-white/10 text-white/65 hover:border-white/20 hover:text-white",
                    ].join(" ")}
                  >
                    <span>{item.label}</span>
                    <span className="text-xs text-white/40">{item.count}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-[0.26em] text-white/45">Price</div>
            <div className="mt-4 space-y-3">
              <input
                className="shop-input"
                placeholder="Prezzo max"
                value={filters.maxPrice}
                onChange={(event) => setFilters((current) => ({ ...current, maxPrice: event.target.value }))}
              />
              <button
                type="button"
                onClick={clearAllFilters}
                className="w-full rounded-full border border-white/10 px-4 py-3 text-sm text-white/65 transition hover:border-white/20 hover:text-white"
              >
                Reset filtri
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <section id="shop" className="pb-24 pt-6 md:pt-10">
      <Container>
        <div className="px-0 py-8 md:py-12">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-6">
              <div className="max-w-2xl">
                <span className="shop-pill">Shop</span>
                <h2 className="mt-4 text-4xl font-semibold tracking-tight text-white md:text-5xl">
                  Lo shop e il cuore del sito.
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-7 text-white/70 md:text-base">
                  Catalogo ecommerce integrato direttamente in homepage, con la stessa UI, gli stessi
                  filtri e gli stessi flussi di carrello, account e checkout gia attivi nel progetto.
                </p>
              </div>
            </div>

            {!user ? (
              <div className="flex flex-col gap-3 rounded-[20px] border border-white/10 bg-black/20 px-5 py-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Accesso cliente richiesto per il checkout</p>
                  <p className="mt-1 text-sm text-white/60">
                    Login, carrello, ordini e area admin restano gli stessi dello shop gia integrato.
                  </p>
                </div>
                <Link to="/shop/auth">
                  <Button size="sm">Login / Register</Button>
                </Link>
              </div>
            ) : null}

            <div className="lg:hidden">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen((current) => !current)}
                className="flex w-full items-center justify-between rounded-[24px] border border-white/10 bg-black/45 px-5 py-4 text-left backdrop-blur-xl backdrop-saturate-125"
              >
                <span className="flex items-center gap-3 text-sm text-white/85">
                  <FunnelIcon className="h-4 w-4" />
                  Filtri shop
                </span>
                <ChevronDownIcon
                  className={["h-4 w-4 text-white/55 transition", mobileFiltersOpen ? "rotate-180" : ""].join(" ")}
                />
              </button>

              <AnimatePresence initial={false}>
                {mobileFiltersOpen ? (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="mt-4"
                  >
                    <SidebarContent />
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
              <aside className="hidden lg:block">
                <div className="sticky top-28">
                  <SidebarContent />
                </div>
              </aside>

              <div className="space-y-6">
                <div className="flex flex-col gap-3 rounded-[24px] border border-white/10 bg-black/30 px-5 py-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.26em] text-white/45">Catalog</p>
                    <p className="mt-2 text-sm text-white/70">
                      {collection === "all"
                        ? "Tutti i prodotti disponibili con i filtri attuali."
                        : collection === "new"
                          ? "Selezione dei nuovi arrivi piu recenti."
                          : collection === "best"
                            ? "Prodotti evidenza e best seller dello shop."
                            : "Selezione promo derivata dalla fascia prezzo attuale."}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/55">
                    <FunnelIcon className="h-4 w-4" />
                    <span>{displayedProducts.length} prodotti visibili</span>
                  </div>
                </div>

                {!displayedProducts.length ? (
                  <div className="rounded-[24px] border border-dashed border-white/10 px-6 py-14 text-center text-white/60">
                    Nessun prodotto trovato con i filtri attuali.
                  </div>
                ) : null}

                <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] items-stretch gap-6">
                  {displayedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
