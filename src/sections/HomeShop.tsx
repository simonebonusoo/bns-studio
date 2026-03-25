import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline"

import { Container } from "../components/Container"
import { Button } from "../components/Button"
import { ProductCard } from "../shop/components/ProductCard"
import { useShopAuth } from "../shop/context/ShopAuthProvider"
import { apiFetch } from "../shop/lib/api"
import { ShopProduct } from "../shop/types"

export function HomeShop() {
  const [products, setProducts] = useState<ShopProduct[]>([])
  const { user } = useShopAuth()

  useEffect(() => {
    apiFetch<ShopProduct[]>("/store/products").then(setProducts)
  }, [])

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
                  Esperienza catalogo integrata direttamente in homepage, con ricerca centrale in navbar,
                  schede prodotto coerenti e gli stessi flussi di carrello, account e checkout gia attivi.
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

            <div className="flex flex-col gap-3 rounded-[24px] border border-white/10 bg-black/30 px-5 py-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.26em] text-white/45">Catalog</p>
                <p className="mt-2 text-sm text-white/70">
                  La ricerca principale ora vive nella navbar: clicca la barra in alto per aprire
                  suggerimenti, popolari e risultati live.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/55">
                <MagnifyingGlassIcon className="h-4 w-4" />
                <span>{products.length} prodotti disponibili</span>
              </div>
            </div>

            {!products.length ? (
              <div className="rounded-[24px] border border-dashed border-white/10 px-6 py-14 text-center text-white/60">
                Nessun prodotto disponibile al momento.
              </div>
            ) : null}

            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] items-stretch gap-6">
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
