import { useEffect, useState } from "react";
import ProductCard from "../components/ProductCard";
import { apiFetch } from "../lib/api";

export default function ShopPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ search: "", category: "", maxPrice: "" });

  useEffect(() => {
    apiFetch("/store/categories").then(setCategories);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.category) params.set("category", filters.category);
    if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
    apiFetch(`/store/products?${params.toString()}`).then(setProducts);
  }, [filters]);

  return (
    <div className="page">
      <section className="section shop-header reveal">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Catalogo</p>
            <h1>Negozio poster</h1>
            <p className="section-subcopy">Stampe minimali con una presentazione visiva pulita e filtri semplici da usare.</p>
          </div>
        </div>
        <div className="filters filters-elevated glass-panel">
          <input
            placeholder="Cerca per titolo"
            value={filters.search}
            onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
          />
          <select
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
            placeholder="Prezzo massimo in centesimi"
            value={filters.maxPrice}
            onChange={(event) => setFilters((current) => ({ ...current, maxPrice: event.target.value }))}
          />
        </div>
        {!products.length ? <div className="empty-state"><h3>Nessun poster trovato</h3><p>Prova con un altro termine di ricerca o amplia il filtro prezzo.</p></div> : null}
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
