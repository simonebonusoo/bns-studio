import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { FunnelIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline"

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

            <div className="sticky top-16 z-40 md:top-20">
              <div className="rounded-[28px] border border-white/10 bg-black/65 px-4 py-4 backdrop-blur-2xl backdrop-saturate-125 shadow-[0_20px_60px_rgba(0,0,0,.28)] md:px-6">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.26em] text-white/45">Shop Bar</p>
                      <p className="mt-1 text-sm text-white/70">
                        Ricerca e filtri sempre disponibili mentre scorri il catalogo.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/55">
                      <FunnelIcon className="h-4 w-4" />
                      <span>{products.length} prodotti visibili</span>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-[1.4fr_0.8fr_0.55fr_auto]">
                    <label className="relative block">
                      <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                      <input
                        className="shop-input pl-11"
                        placeholder="Cerca per titolo"
                        value={filters.search}
                        onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                      />
                    </label>
                    <select
                      className="shop-select"
                      value={filters.category}
                      onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}
                    >
                      <option value="">Tutte le categorie</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                    <input
                      className="shop-input"
                      placeholder="Prezzo max"
                      value={filters.maxPrice}
                      onChange={(event) => setFilters((current) => ({ ...current, maxPrice: event.target.value }))}
                    />
                    <Link
                      to="/shop"
                      className="inline-flex items-center justify-center rounded-full border border-white/10 px-4 py-3 text-sm text-white/75 transition hover:border-white/25 hover:text-white"
                    >
                      Catalogo
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {!products.length ? (
              <div className="rounded-[24px] border border-dashed border-white/10 px-6 py-14 text-center text-white/60">
                Nessun prodotto trovato con i filtri attuali.
              </div>
            ) : null}

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
