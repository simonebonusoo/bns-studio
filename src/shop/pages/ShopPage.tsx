import { useEffect, useState } from "react"
import { ProductCard } from "../components/ProductCard"
import { ShopLayout } from "../components/ShopLayout"
import { apiFetch } from "../lib/api"
import { ShopProduct } from "../types"

export function ShopPage() {
  const [products, setProducts] = useState<ShopProduct[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [filters, setFilters] = useState({ search: "", category: "", maxPrice: "" })

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
    <ShopLayout
      eyebrow="Shop"
      title="Asset pronti, integrati nel sito."
      intro="Catalogo ecommerce nativo BNS Studio per kit, template e pacchetti selezionati. La UI resta coerente con il sito principale, senza importare il vecchio styling del prototipo."
    >
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

      {!products.length ? <div className="rounded-[24px] border border-dashed border-white/10 px-6 py-14 text-center text-white/60">Nessun prodotto trovato con i filtri attuali.</div> : null}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </ShopLayout>
  )
}
