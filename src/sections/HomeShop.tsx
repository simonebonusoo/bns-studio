import { useEffect, useState } from "react"

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
              <div className="max-w-6xl">
                <span className="shop-pill">Shop · {products.length} prodotti</span>
                <h2 className="mt-4 text-4xl font-semibold tracking-tight text-white md:text-5xl">
                  Poster, stampe e pezzi creativi da collezionare.
                </h2>
                <p className="mt-4 max-w-none text-sm leading-7 text-white/70 md:text-base">
                  Una selezione BNS Studio di visual, print e oggetti con identità precisa.
                  Sfoglia il catalogo, apri le schede prodotto e usa il pannello profilo per gestire
                  accesso, ordini e checkout.
                </p>
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
