import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button, getButtonClassName } from "../components/Button";
import { Container } from "../components/Container";
import { ProductCard } from "../shop/components/ProductCard";
import { useShopAuth } from "../shop/context/ShopAuthProvider";
import { getProductPrimaryImage } from "../shop/lib/product";
import { apiFetch } from "../shop/lib/api";
import type { AdminCollection, ShopProduct, ShopProductListResponse } from "../shop/types";

type DiscoveryCard = {
  title: string;
  description: string;
  category: string;
  imageUrl?: string;
};

type ShowcaseCard = {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  query: string;
  collectionSlug?: string;
  imageUrl?: string;
  ctaLabel?: string;
};

const defaultPopularCategories: DiscoveryCard[] = [
  {
    title: "Cantanti famosi",
    description: "Poster dedicati alle icone pop, rap e rock piu amate.",
    category: "Cantanti famosi",
  },
  {
    title: "Frasi d'amore",
    description: "Parole da regalare, appendere e trasformare in atmosfera.",
    category: "Frasi d'amore",
  },
  {
    title: "Calciatori famosi",
    description: "Stampe per chi vuole portare il tifo dentro casa.",
    category: "Calciatori famosi",
  },
  {
    title: "Film e serie TV",
    description: "Scene, citazioni e mondi diventati immagini da collezione.",
    category: "Film e serie TV",
  },
  {
    title: "Arte iconica",
    description: "Visioni forti, linee pulite e riferimenti visivi senza tempo.",
    category: "Arte iconica",
  },
  {
    title: "Poster personalizzati",
    description: "Idee su misura da regalare o costruire intorno ai tuoi ricordi.",
    category: "Poster personalizzati",
  },
  {
    title: "Citazioni motivazionali",
    description: "Messaggi diretti per studio, lavoro e spazi creativi.",
    category: "Citazioni motivazionali",
  },
  {
    title: "Fotografie artistiche",
    description: "Scatti editoriali e immagini da lasciare respirare sulla parete.",
    category: "Fotografie artistiche",
  },
];

const defaultShowcases: ShowcaseCard[] = [
  {
    eyebrow: "Selezione in evidenza",
    title: "Cantanti famosi",
    description:
      "Volti iconici, testi che restano impressi e poster pensati per chi vuole dare subito carattere a una stanza.",
    href: "/shop?search=cantanti",
    query: "cantanti",
  },
  {
    eyebrow: "Da regalare o tenere",
    title: "Frasi d'amore",
    description:
      "Una collezione costruita per dire qualcosa di preciso con poco: parole semplici, atmosfera pulita, impatto immediato.",
    href: "/shop?search=amore",
    query: "amore",
  },
  {
    eyebrow: "Per chi vive il gioco",
    title: "Calciatori famosi",
    description:
      "Stampe con energia sportiva e taglio grafico deciso, per portare passione, memorie e riferimenti forti dentro casa.",
    href: "/shop?search=calciatori",
    query: "calciatori",
  },
];

type TrustIcon = "truck" | "package" | "delivery" | "paypal" | "receipt" | "spark";

const trustItems = [
  {
    icon: "truck" as TrustIcon,
    title: "Spedizione gratuita sopra 25 euro",
    description: "Gli ordini oltre la soglia partono senza costi aggiuntivi.",
  },
  {
    icon: "package" as TrustIcon,
    title: "Spedizione gratuita con piu di 3 articoli",
    description: "Se costruisci una piccola selezione, la spedizione resta inclusa.",
  },
  {
    icon: "delivery" as TrustIcon,
    title: "Consegna in 3-5 giorni lavorativi",
    description: "Tempi chiari e rapidi per ricevere il tuo ordine senza attese lunghe.",
  },
  {
    icon: "paypal" as TrustIcon,
    title: "Pagamento sicuro con PayPal",
    description: "Checkout protetto e flusso di pagamento gia integrato nello shop.",
  },
  {
    icon: "receipt" as TrustIcon,
    title: "Ricevuta disponibile dopo il pagamento",
    description: "Ogni acquisto genera una ricevuta scaricabile in modo semplice.",
  },
  {
    icon: "spark" as TrustIcon,
    title: "Nuovi prodotti ogni giorno",
    description: "Il catalogo resta vivo con uscite continue e nuove idee da scoprire.",
  },
];

function TrustGlyph({ icon }: { icon: TrustIcon }) {
  switch (icon) {
    case "truck":
      return (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
          <path d="M3 7.5h10v7H3z" />
          <path d="M13 10.5h3.5l2 2v2H13z" />
          <circle cx="7.5" cy="17.5" r="1.75" />
          <circle cx="17" cy="17.5" r="1.75" />
        </svg>
      );
    case "package":
      return (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 3.75 4.5 7.5 12 11.25l7.5-3.75L12 3.75Z" />
          <path d="M4.5 7.5v9L12 20.25l7.5-3.75v-9" />
          <path d="M12 11.25v9" />
        </svg>
      );
    case "delivery":
      return (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 6.75a5.25 5.25 0 1 1 0 10.5" />
          <path d="M12 3.75v3m0 10.5v3m8.25-8.25h-3M6.75 12H3.75" />
          <path d="m16.5 7.5-2.25 2.25m-4.5 4.5L7.5 16.5m9 0-2.25-2.25m-4.5-4.5L7.5 7.5" />
        </svg>
      );
    case "paypal":
      return (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
          <path d="M7 19.5 9.25 4.5h5.1c2.42 0 4.15 1.59 3.76 3.85-.41 2.4-2.26 3.65-4.95 3.65h-3.1" />
          <path d="M6 21h4.4l.85-5.25h2.1c3.3 0 5.62-1.72 6.14-4.95" />
        </svg>
      );
    case "receipt":
      return (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
          <path d="M7.5 3.75h9v16.5l-2.25-1.5-2.25 1.5-2.25-1.5-2.25 1.5V3.75Z" />
          <path d="M9.5 8.25h5M9.5 12h5M9.5 15.75h3.5" />
        </svg>
      );
    case "spark":
      return (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
          <path d="m12 3.75 1.7 4.8 4.8 1.7-4.8 1.7-1.7 4.8-1.7-4.8-4.8-1.7 4.8-1.7 1.7-4.8Z" />
          <path d="m18 15.75.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9.9-2.1Z" />
        </svg>
      );
  }
}

function pickProductImage(products: ShopProduct[], query: string, fallbackIndex: number) {
  if (!products.length) return null;

  const normalizedQuery = query.toLowerCase();
  const directMatch = products.find((product) => {
    const haystack = [
      product.title,
      product.description,
      product.category || "",
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalizedQuery) && product.imageUrls.length > 0;
  });

  if (directMatch?.imageUrls[0]) {
    return getProductPrimaryImage(directMatch);
  }

  return products[fallbackIndex % products.length] ? getProductPrimaryImage(products[fallbackIndex % products.length]) : null;
}

function pickProductImageByCategory(products: ShopProduct[], category: string, fallbackIndex: number) {
  if (!products.length) return null

  const normalizedCategory = category.toLowerCase()
  const directMatch = products.find((product) => {
    const haystack = [product.category || "", product.title, product.description].join(" ").toLowerCase()
    return haystack.includes(normalizedCategory) && product.imageUrls.length > 0
  })

  if (directMatch?.imageUrls[0]) {
    return getProductPrimaryImage(directMatch)
  }

  return products[fallbackIndex % products.length] ? getProductPrimaryImage(products[fallbackIndex % products.length]) : null
}

function pickProductImageByCollection(products: ShopProduct[], collectionSlug: string, fallbackIndex: number) {
  if (!products.length) return null

  const normalizedSlug = collectionSlug.toLowerCase()
  const directMatch = products.find((product) =>
    (product.collections || []).some((collection) => collection.slug.toLowerCase() === normalizedSlug) && product.imageUrls.length > 0,
  )

  if (directMatch?.imageUrls[0]) {
    return getProductPrimaryImage(directMatch)
  }

  return products[fallbackIndex % products.length] ? getProductPrimaryImage(products[fallbackIndex % products.length]) : null
}

function findCollectionByReference(collections: AdminCollection[], reference: string) {
  const normalizedReference = String(reference || "").trim().toLowerCase()
  if (!normalizedReference) return null
  const slugifiedReference = normalizedReference.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
  return (
    collections.find((collection) => collection.slug.toLowerCase() === normalizedReference) ||
    collections.find((collection) => collection.slug.toLowerCase() === slugifiedReference) ||
    collections.find((collection) => collection.title.trim().toLowerCase() === normalizedReference) ||
    null
  )
}

function parseHomepageShowcases(
  rawValue: string | undefined,
  fallback: ShowcaseCard[],
  collections: AdminCollection[],
) {
  const source = rawValue || JSON.stringify(fallback)

  try {
    const parsed = JSON.parse(source);
    if (!Array.isArray(parsed)) return fallback;

    const normalized = parsed
      .filter((entry) => entry && typeof entry === "object")
      .map((entry) => {
        const href = String(entry.href || "").trim()
        const hrefParams = new URLSearchParams(href.split("?")[1] || "")
        const resolvedCollection =
          findCollectionByReference(collections, String(entry.collectionSlug || "").trim()) ||
          findCollectionByReference(collections, String(hrefParams.get("collectionSlug") || "").trim()) ||
          findCollectionByReference(collections, String(entry.title || "").trim())

        return {
          eyebrow: String(entry.eyebrow || "").trim(),
          title: String(entry.title || resolvedCollection?.title || "").trim(),
          description: String(entry.description || resolvedCollection?.description || "").trim(),
          href,
          query: String(entry.query || "").trim(),
          collectionSlug: resolvedCollection?.slug || "",
          imageUrl: typeof entry.imageUrl === "string" ? entry.imageUrl : "",
          ctaLabel: String(entry.ctaLabel || "").trim(),
        }
      })
      .filter((entry) => entry.title && (entry.collectionSlug || entry.href || entry.query));

    return normalized.length ? normalized : fallback;
  } catch {
    return fallback;
  }
}

function parseHomepagePopularCategories(
  rawValue: string | undefined,
  fallback: DiscoveryCard[],
) {
  if (!rawValue) return fallback

  try {
    const parsed = JSON.parse(rawValue)
    if (!Array.isArray(parsed)) return fallback

    const normalized = parsed
      .filter((entry) => entry && typeof entry === "object")
      .map((entry) => {
        const href = typeof entry.href === "string" ? entry.href : ""
        const hrefParams = new URLSearchParams(href.split("?")[1] || "")
        const resolvedCategory = String(entry.category || hrefParams.get("category") || "").trim()

        return {
          title: String(entry.title || resolvedCategory || "").trim(),
          category: resolvedCategory,
          description: String(entry.description || "").trim(),
          imageUrl: typeof entry.imageUrl === "string" ? entry.imageUrl : "",
        }
      })
      .filter((entry) => entry.title && entry.category)

    return normalized.length ? normalized : fallback
  } catch {
    return fallback
  }
}

function buildPopularCategoryHref(category: string, title: string, subtitle?: string) {
  const params = new URLSearchParams()
  if (category) {
    params.set("category", category)
  }
  params.set("title", title)
  if (subtitle) {
    params.set("subtitle", subtitle)
  }
  return `/shop?${params.toString()}`
}

function withCatalogContext(href: string, title: string, subtitle?: string) {
  const [pathname, rawQuery = ""] = String(href || "/shop").split("?")
  const params = new URLSearchParams(rawQuery)

  if (!params.get("title") && title) {
    params.set("title", title)
  }

  if (!params.get("subtitle") && subtitle) {
    params.set("subtitle", subtitle)
  }

  const query = params.toString()
  return query ? `${pathname}?${query}` : pathname
}

function forwardHorizontalScroll(event: React.WheelEvent<HTMLElement>) {
  const target = event.currentTarget
  if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return
  target.scrollLeft += event.deltaY
  event.preventDefault()
}

export function HomeShop() {
  const navigate = useNavigate();
  const { effectiveRole } = useShopAuth();
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [productTotal, setProductTotal] = useState(0);
  const [shopSettings, setShopSettings] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        setStatus("loading");
        const [productData, settingsData] = await Promise.all([
          apiFetch<ShopProductListResponse>("/store/products?page=1&pageSize=100&sort=manual"),
          apiFetch<Record<string, string>>("/store/settings"),
        ]);
        if (!cancelled) {
          setProducts(productData.items);
          setProductTotal(productData.pagination.total);
          setShopSettings(settingsData);
          setStatus("idle");
        }
      } catch (error) {
        console.error("Unable to load home shop products", error);
        if (!cancelled) {
          setStatus("error");
        }
      }
    }

    void loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  const productCountLabel = `Totale: ${productTotal} ${productTotal === 1 ? "prodotto" : "prodotti"}`;

  const popularCategories = useMemo(
    () => parseHomepagePopularCategories(shopSettings.homepagePopularCategories, defaultPopularCategories),
    [shopSettings]
  );

  const popularCategoryCards = useMemo(
    () =>
      popularCategories.map((category, index) => ({
        ...category,
        imageUrl: category.imageUrl || pickProductImageByCategory(products, category.category, index),
      })),
    [products, popularCategories],
  );

  const trendingProducts = useMemo(() => {
    const featured = products.filter((product) => product.featured)
    const others = products.filter((product) => !product.featured)
    return [...featured, ...others].slice(0, 20)
  }, [products])

  const catalogPreviewProducts = useMemo(() => products.slice(0, 20), [products])

  return (
    <section id="shop" className="py-24 text-white sm:py-28">
      <Container className="space-y-20">
        {status === "error" ? (
          <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-6 text-sm text-white/70">
            Il catalogo non e disponibile in questo momento. Riprova tra poco.
          </div>
        ) : null}

        {status === "idle" && products.length === 0 ? (
          <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-6 text-sm text-white/70">
            Nessun prodotto disponibile al momento.
          </div>
        ) : null}

        <div className="space-y-8">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.32em] text-white/45">Poster di tendenza</p>
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Poster di tendenza
            </h2>
            <p className="max-w-3xl text-sm leading-6 text-white/62 sm:text-base">
              Scorri per scoprire le nostre tendenze e i pezzi che stanno guidando il catalogo in questo momento.
            </p>
          </div>

          <div
            className="-mx-4 overflow-x-auto px-4 pb-3 pt-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
            onWheel={forwardHorizontalScroll}
          >
            <div className="flex min-w-full gap-6">
              {trendingProducts.map((product) => (
                <div key={product.id} className="w-[18.5rem] flex-none sm:w-[20rem]">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8 pt-8 sm:pt-12">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.32em] text-white/45">Acquista per categoria</p>
              <h3 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Acquista per categoria
              </h3>
              <p className="max-w-3xl text-sm leading-6 text-white/62 sm:text-base">
                Esplora le categorie piu cercate e entra subito nel catalogo dal percorso che ti somiglia di piu.
              </p>
            </div>
            {effectiveRole === "admin" ? (
              <Button
                variant="ghost"
                size="sm"
                className="self-start md:self-auto"
                onClick={() => navigate("/shop/admin?tab=homepage&section=popular-categories")}
              >
                Modifica
              </Button>
            ) : null}
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {popularCategoryCards.map((category) => (
              <Link
                key={category.title}
                to={buildPopularCategoryHref(category.category, category.title, category.description)}
                className="group relative flex min-h-[22rem] overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 transition-transform duration-300 ease-out hover:-translate-y-1 hover:border-white/18 hover:bg-white/[0.06]"
              >
                <div className="absolute inset-0">
                  {category.imageUrl ? (
                    <img
                      src={category.imageUrl}
                      alt={category.title}
                      className="h-full w-full object-cover opacity-72 transition duration-500 group-hover:scale-[1.03]"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.14)_0%,rgba(0,0,0,0.78)_72%,rgba(0,0,0,0.94)_100%)]" />
                </div>
                <div className="relative z-10 mt-auto flex w-full items-end justify-between gap-4">
                  <div className="space-y-2 pr-3">
                    <h4 className="text-xl font-semibold tracking-tight text-white">{category.title}</h4>
                    <p className="max-w-[14rem] text-sm leading-6 text-white/72">{category.description}</p>
                  </div>
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/16 bg-white/10 text-white transition duration-300 group-hover:bg-white group-hover:text-black">
                    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8">
                      <path d="M5.25 12h13.5" />
                      <path d="m12.75 6.75 5.25 5.25-5.25 5.25" />
                    </svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-8 pt-10 sm:pt-16">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <div className="shop-pill inline-flex items-center gap-3">
                <span>{productCountLabel}</span>
              </div>
              <h3 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Tutti i poster
              </h3>
              <p className="max-w-3xl text-sm leading-6 text-white/62 sm:text-base">
                Scopri il nostro catalogo completo attraverso una preview ordinata dei pezzi disponibili adesso.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 self-start md:self-auto">
              {effectiveRole === "admin" ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/shop/admin?tab=prodotti")}
                >
                  Modifica
                </Button>
              ) : null}
              <Link to="/shop" className={getButtonClassName({ variant: "cart", size: "sm" })}>
                Vedi catalogo completo
              </Link>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {catalogPreviewProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>

        <div className="space-y-8 pt-10 sm:pt-16">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.32em] text-white/45">Fiducia</p>
            <h3 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Dettagli chiari prima dell'acquisto, zero zone grigie dopo.
            </h3>
            <p className="max-w-3xl text-sm leading-6 text-white/62 sm:text-base">
              Una sezione sintetica per togliere dubbi subito: spedizione, tempi, pagamento e ricevuta sono
              gia esplicitati prima di entrare nel catalogo completo.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {trustItems.map((item) => (
              <div
                key={item.title}
                className="rounded-[1.5rem] border border-white/8 bg-white/[0.04] p-5"
              >
                <div className="flex items-start gap-4">
                  <div className="mt-0.5 inline-flex h-11 w-11 flex-none items-center justify-center rounded-2xl border border-white/10 bg-white/8 text-white/88">
                    <TrustGlyph icon={item.icon} />
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="text-base font-semibold text-white">{item.title}</h4>
                    <p className="text-sm leading-6 text-white/62">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
