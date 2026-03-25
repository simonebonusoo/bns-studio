import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { ShoppingBagIcon, UserIcon } from "@heroicons/react/24/outline"

import { Container } from "../components/Container"
import { Button } from "../components/Button"
import { ProductCard } from "../shop/components/ProductCard"
import { useShopAuth } from "../shop/context/ShopAuthProvider"
import { useShopCart } from "../shop/context/ShopCartProvider"
import { apiFetch } from "../shop/lib/api"
import { ShopProduct } from "../shop/types"

export function HomeShop() {
  const [products, setProducts] = useState<ShopProduct[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [filters, setFilters] = useState({ search: "", category: "", maxPrice: "" })

  const { items } = useShopCart()
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
        <div className="shop-card relative overflow-hidden px-6 py-8 md:px-10 md:py-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(227,245,3,0.12),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.06),transparent_30%)]" />

          <div className="relative flex flex-col gap-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
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

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to="/shop"
                  className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:border-white/25 hover:text-white"
                >
                  Catalogo completo
                </Link>
                <Link
                  to="/shop/cart"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:border-white/25 hover:text-white"
                >
                  <ShoppingBagIcon className="h-4 w-4" />
                  Cart ({items.reduce((sum, item) => sum + item.quantity, 0)})
                </Link>
                <Link
                  to={user ? "/shop/profile" : "/shop/auth"}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:border-white/25 hover:text-white"
                >
                  <UserIcon className="h-4 w-4" />
                  {user ? "Profilo" : "Accedi"}
                </Link>
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

            <div className="grid gap-4 md:grid-cols-[1.2fr_0.7fr_0.5fr]">
              <input
                className="shop-input"
                placeholder="Cerca per titolo"
                value={filters.search}
                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              />
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
