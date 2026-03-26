import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "../components/Button";
import { Container } from "../components/Container";
import { ProductCard } from "../shop/components/ProductCard";
import type { ShopProduct } from "../shop/types";
import { apiFetch } from "../shop/lib/api";

type DiscoveryCard = {
  title: string;
  description: string;
  href: string;
  query: string;
};

type ShowcaseCard = {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  query: string;
};

const popularCategories: DiscoveryCard[] = [
  {
    title: "Cantanti famosi",
    description: "Poster dedicati alle icone pop, rap e rock piu amate.",
    href: "/shop?search=cantanti",
    query: "cantanti",
  },
  {
    title: "Frasi d'amore",
    description: "Parole da regalare, appendere e trasformare in atmosfera.",
    href: "/shop?search=amore",
    query: "amore",
  },
  {
    title: "Calciatori famosi",
    description: "Stampe per chi vuole portare il tifo dentro casa.",
    href: "/shop?search=calciatori",
    query: "calciatori",
  },
  {
    title: "Film e serie TV",
    description: "Scene, citazioni e mondi diventati immagini da collezione.",
    href: "/shop?search=film",
    query: "film",
  },
  {
    title: "Arte iconica",
    description: "Visioni forti, linee pulite e riferimenti visivi senza tempo.",
    href: "/shop?search=arte",
    query: "arte",
  },
  {
    title: "Poster personalizzati",
    description: "Idee su misura da regalare o costruire intorno ai tuoi ricordi.",
    href: "/shop?search=personalizzati",
    query: "personalizzati",
  },
  {
    title: "Citazioni motivazionali",
    description: "Messaggi diretti per studio, lavoro e spazi creativi.",
    href: "/shop?search=motivazionali",
    query: "motivazionali",
  },
  {
    title: "Fotografie artistiche",
    description: "Scatti editoriali e immagini da lasciare respirare sulla parete.",
    href: "/shop?search=fotografie",
    query: "fotografie",
  },
];

const showcases: ShowcaseCard[] = [
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
      product.category?.name ?? "",
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalizedQuery) && product.imageUrls.length > 0;
  });

  if (directMatch?.imageUrls[0]) {
    return directMatch.imageUrls[0];
  }

  return products[fallbackIndex % products.length]?.imageUrls[0] ?? null;
}

export function HomeShop() {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        setStatus("loading");
        const data = await apiFetch<ShopProduct[]>("/store/products");
        if (!cancelled) {
          setProducts(data);
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

  const productCountLabel = `${products.length} ${products.length === 1 ? "prodotto" : "prodotti"}`;

  const popularCategoryCards = useMemo(
    () =>
      popularCategories.map((category, index) => ({
        ...category,
        imageUrl: pickProductImage(products, category.query, index),
      })),
    [products],
  );

  const showcaseCards = useMemo(
    () =>
      showcases.map((showcase, index) => ({
        ...showcase,
        imageUrl: pickProductImage(products, showcase.query, index + 3),
      })),
    [products],
  );

  return (
    <section id="shop" className="bg-black py-24 text-white sm:py-28">
      <Container className="space-y-18">
        <div className="space-y-7">
          <div className="shop-pill inline-flex items-center gap-3">
            <span>Shop</span>
            <span className="h-1.5 w-1.5 rounded-full bg-current/60" />
            <span>{productCountLabel}</span>
          </div>
          <div className="space-y-4">
            <h2 className="max-w-5xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Poster, stampe e pezzi creativi da collezionare.
            </h2>
            <p className="max-w-4xl text-base leading-7 text-white/72 sm:text-lg">
              Una selezione costruita per far emergere subito temi forti, immagini riconoscibili e idee
              regalo piu facili da trovare. Entri, scopri una direzione chiara, poi scendi nel catalogo
              completo con filtri e prodotti reali gia pronti all'acquisto.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.32em] text-white/45">Categorie popolari</p>
              <h3 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Le direzioni piu cercate, subito a portata di scroll.
              </h3>
            </div>
            <p className="max-w-2xl text-sm leading-6 text-white/60 sm:text-base">
              Tocca una categoria e vai direttamente al catalogo con una ricerca coerente, senza passaggi
              inutili.
            </p>
          </div>

          <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
            <div className="flex min-w-full snap-x gap-4">
              {popularCategoryCards.map((category) => (
                <Link
                  key={category.title}
                  to={category.href}
                  className="group relative flex min-h-[22rem] w-[18.5rem] flex-none snap-start overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 transition-transform duration-300 ease-out hover:-translate-y-1 hover:border-white/18 hover:bg-white/[0.06] sm:w-[20rem]"
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
                    <div className="space-y-2">
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
        </div>

        <div className="space-y-6">
          {showcaseCards.map((showcase, index) => (
            <article
              key={showcase.title}
              className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03]"
            >
              <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
                <div
                  className={`flex flex-col justify-between gap-8 p-7 sm:p-9 ${
                    index % 2 === 1 ? "lg:order-2" : ""
                  }`}
                >
                  <div className="space-y-4">
                    <p className="text-xs uppercase tracking-[0.32em] text-white/45">{showcase.eyebrow}</p>
                    <div className="space-y-3">
                      <h3 className="max-w-xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                        {showcase.title}
                      </h3>
                      <p className="max-w-xl text-base leading-7 text-white/68">{showcase.description}</p>
                    </div>
                  </div>
                  <div>
                    <Button asChild size="sm">
                      <Link to={showcase.href}>Esplora la collezione</Link>
                    </Button>
                  </div>
                </div>
                <div
                  className={`relative min-h-[18rem] border-t border-white/10 lg:min-h-[24rem] lg:border-l lg:border-t-0 ${
                    index % 2 === 1 ? "lg:order-1 lg:border-l-0 lg:border-r" : ""
                  }`}
                >
                  {showcase.imageUrl ? (
                    <img
                      src={showcase.imageUrl}
                      alt={showcase.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.14),transparent_52%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]" />
                  )}
                  <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,0,0,0.12),rgba(0,0,0,0.48))]" />
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-7 sm:p-9">
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
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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

        <div className="space-y-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.32em] text-white/45">Catalogo completo</p>
              <h3 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Tutto il catalogo reale, con prodotti e filtri gia pronti.
              </h3>
            </div>
            <p className="max-w-2xl text-sm leading-6 text-white/60 sm:text-base">
              Dopo le sezioni di scoperta trovi direttamente il catalogo completo, cosi il passaggio da
              ispirazione a acquisto resta naturale.
            </p>
          </div>

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

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
