import { useEffect, useState } from "react"
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline"

import { Container } from "../components/Container"
import { ProductCard } from "../shop/components/ProductCard"
import { apiFetch } from "../shop/lib/api"
import { ShopProduct } from "../shop/types"

export function HomeShop() {
  const [products, setProducts] = useState<ShopProduct[]>([])

  useEffect(() => {
    apiFetch<ShopProduct[]>("/store/products").then(setProducts)
  }, [])

  return (
    <section id="shop" className="pb-24 pt-6 md:pt-10">
      <Container>
        <div className="px-0 py-8 md:py-12">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-6">
              <div className="max-w-4xl">
                <span className="shop-pill">Shop</span>
                <h2 className="mt-4 text-4xl font-semibold tracking-tight text-white md:text-5xl">
                  Poster, stampe e pezzi creativi da collezionare.
                </h2>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-white/70 md:text-base">
                  Una selezione BNS Studio di visual, print e oggetti con identità precisa.
                  Sfoglia il catalogo, apri le schede prodotto e usa il pannello profilo per gestire
                  accesso, ordini e checkout.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-[24px] border border-white/10 bg-black/30 px-5 py-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.26em] text-white/45">Catalog</p>
                <p className="mt-2 text-sm text-white/70">
                  La ricerca principale vive nella navbar: usa la barra in alto per trovare poster,
                  collezioni e prodotti BNS Studio in tempo reale.
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

            <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] items-stretch gap-6 xl:gap-7">
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
