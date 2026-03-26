import { Fragment, useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useLocation, useNavigate } from "react-router-dom"
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline"

import { Container } from "./Container"
import { Logo } from "./Logo"
import { Button } from "./Button"
import { useShopAuth } from "../shop/context/ShopAuthProvider"
import { useShopCart } from "../shop/context/ShopCartProvider"
import { apiFetch } from "../shop/lib/api"
import { formatPrice } from "../shop/lib/format"
import { ShopProduct } from "../shop/types"

type SearchSuggestion =
  | { label: string; href: string; type: "search" | "category" | "collection" }

function highlightMatch(text: string, query: string) {
  const normalized = query.trim()
  if (!normalized) return text

  const lowerText = text.toLowerCase()
  const lowerQuery = normalized.toLowerCase()
  const index = lowerText.indexOf(lowerQuery)

  if (index === -1) return text

  return (
    <>
      {text.slice(0, index)}
      <span className="text-[#e3f503]">{text.slice(index, index + normalized.length)}</span>
      {text.slice(index + normalized.length)}
    </>
  )
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [products, setProducts] = useState<ShopProduct[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [cartPricing, setCartPricing] = useState<{
    subtotal: number
    discountTotal: number
    shippingTotal: number
    total: number
  } | null>(null)
  const [cartPricingError, setCartPricingError] = useState("")
  const [loadingCartPricing, setLoadingCartPricing] = useState(false)
  const navH = 88

  const { user, logout, loading } = useShopAuth()
  const { items, couponCode } = useShopCart()
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const profileRef = useRef<HTMLDivElement | null>(null)
  const cartRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    apiFetch<string[]>("/store/categories").then(setCategories).catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    if (!searchOpen || products.length) return

    setLoadingProducts(true)
    apiFetch<ShopProduct[]>("/store/products")
      .then(setProducts)
      .finally(() => setLoadingProducts(false))
  }, [products.length, searchOpen])

  useEffect(() => {
    if (!searchOpen && !profileOpen && !cartOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSearchOpen(false)
        setProfileOpen(false)
        setCartOpen(false)
      }
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node

      if (searchOpen && !overlayRef.current?.contains(target) && !inputRef.current?.contains(target)) {
        setSearchOpen(false)
      }

      if (profileOpen && !profileRef.current?.contains(target)) {
        setProfileOpen(false)
      }

      if (cartOpen && !cartRef.current?.contains(target)) {
        setCartOpen(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("mousedown", handlePointerDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("mousedown", handlePointerDown)
    }
  }, [cartOpen, profileOpen, searchOpen])

  useEffect(() => {
    if (!searchOpen) return
    const timer = window.setTimeout(() => inputRef.current?.focus(), 60)
    return () => window.clearTimeout(timer)
  }, [searchOpen])

  useEffect(() => {
    setSearchOpen(false)
    setProfileOpen(false)
    setCartOpen(false)
  }, [location.pathname, location.search])

  useEffect(() => {
    if (!cartOpen || !user || !items.length) {
      setCartPricing(null)
      setCartPricingError("")
      setLoadingCartPricing(false)
      return
    }

    setLoadingCartPricing(true)
    apiFetch<{ subtotal: number; discountTotal: number; shippingTotal: number; total: number }>(
      "/store/pricing/preview",
      {
        method: "POST",
        body: JSON.stringify({
          items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
          couponCode: couponCode || null,
        }),
      }
    )
      .then((data) => {
        setCartPricing(data)
        setCartPricingError("")
      })
      .catch((err) => {
        setCartPricing(null)
        setCartPricingError(err instanceof Error ? err.message : "Errore nel calcolo del carrello.")
      })
      .finally(() => setLoadingCartPricing(false))
  }, [cartOpen, couponCode, items, user])

  const trimmedSearch = search.trim()

  const liveResults = useMemo(() => {
    if (!trimmedSearch) return []

    const query = trimmedSearch.toLowerCase()
    return products
      .filter((product) => {
        const haystack = [product.title, product.slug, product.category, product.description].join(" ").toLowerCase()
        return haystack.includes(query)
      })
      .slice(0, 6)
  }, [products, trimmedSearch])

  const emptySuggestions = useMemo<SearchSuggestion[]>(() => {
    const categorySuggestions = categories.slice(0, 4).map((category) => ({
      label: category,
      href: `/shop?category=${encodeURIComponent(category)}`,
      type: "category" as const,
    }))

    return [
      { label: "Poster", href: "/shop?search=poster", type: "search" },
      { label: "Brand kit", href: "/shop?search=brand%20kit", type: "search" },
      { label: "Landing", href: "/shop?search=landing", type: "search" },
      { label: "Social pack", href: "/shop?search=social", type: "search" },
      ...categorySuggestions,
      { label: "Novita", href: "/shop?collection=new", type: "collection" },
      { label: "In evidenza", href: "/shop?collection=best", type: "collection" },
      { label: "Sconti", href: "/shop?collection=discount", type: "collection" },
    ]
  }, [categories])

  function submitSearch(nextSearch = trimmedSearch) {
    const value = nextSearch.trim()
    navigate(value ? `/shop?search=${encodeURIComponent(value)}` : "/shop")
    setSearchOpen(false)
  }

  const popularSuggestions = emptySuggestions.slice(0, 4)
  const exploreSuggestions = emptySuggestions.slice(4)

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-50" style={{ ["--nav-h" as any]: `${navH}px` } as any}>
        <div className="relative">
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-0"
            initial={false}
            animate={scrolled || searchOpen ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <div className="absolute inset-0 bg-black/30 backdrop-blur-2xl" />
            <div className="absolute inset-0 backdrop-saturate-125" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-white/12" />
            <div className="absolute inset-x-0 top-0 h-px bg-white/8" />

            <motion.div
              className="absolute -top-10 left-0 h-24 w-[55%] rotate-[-8deg]"
              style={{
                background:
                  "linear-gradient(90deg, rgba(227,245,3,0) 0%, rgba(227,245,3,0.10) 50%, rgba(227,245,3,0) 100%)",
                filter: "blur(10px)",
              }}
              animate={{ x: ["-20%", "120%"] }}
              transition={{ duration: 4.6, ease: "linear", repeat: Infinity }}
            />
          </motion.div>

          <div className={scrolled || searchOpen ? "bg-transparent" : "bg-black/15 backdrop-blur-sm"}>
            <Container>
              <motion.div
                initial={{ y: -12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative z-20 grid min-h-[72px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-3 md:min-h-[88px] md:gap-6 md:py-4"
              >
                <a href="#top" aria-label="Vai all'inizio" className="flex items-center no-underline">
                  <Logo />
                </a>

                <div
                  className={[
                    "flex h-[46px] w-full items-center gap-3 rounded-full border bg-white/[0.04] px-4 backdrop-blur-xl transition md:h-[50px] md:px-5",
                    searchOpen ? "border-white/20 text-white" : "border-white/10 text-white/55 hover:border-white/20 hover:text-white",
                  ].join(" ")}
                >
                  <MagnifyingGlassIcon className="h-5 w-5 shrink-0 text-white/45" />
                  <input
                    ref={inputRef}
                    value={search}
                    onFocus={() => setSearchOpen(true)}
                    onChange={(event) => {
                      setSearch(event.target.value)
                      if (!searchOpen) setSearchOpen(true)
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        submitSearch(search)
                      }
                    }}
                    placeholder="Cerca prodotti, nomi, artisti..."
                    className="w-full bg-transparent text-sm text-white placeholder:text-white/35 outline-none md:text-base"
                  />
                  {search || searchOpen ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSearch("")
                        setSearchOpen(false)
                      }}
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/45 transition hover:text-white"
                      aria-label="Chiudi ricerca"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>

                <div className="flex items-center justify-end gap-2 md:gap-3">
                  <Button
                    onClick={() => {
                      setSearchOpen(false)
                      setCartOpen(false)
                      setProfileOpen(true)
                    }}
                    variant="ghost"
                    size="sm"
                    className="hidden sm:inline-flex"
                  >
                    Profilo
                  </Button>

                  <Button
                    onClick={() => {
                      setSearchOpen(false)
                      setProfileOpen(false)
                      setCartOpen(true)
                    }}
                    size="sm"
                    text={`Carrello${cartCount ? ` (${cartCount})` : ""}`}
                  >
                    Carrello
                  </Button>
                </div>
              </motion.div>
            </Container>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {searchOpen ? (
          <Fragment>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed inset-x-0 top-[72px] z-50 px-4 pb-6 md:top-[88px] md:px-6"
            >
              <Container>
                <div
                  ref={overlayRef}
                  className="overflow-hidden rounded-[32px] border border-white/10 bg-[#0b0b0b]/95 shadow-[0_30px_90px_rgba(0,0,0,.45)] backdrop-blur-2xl"
                >
                  {!trimmedSearch ? (
                    <div className="grid gap-6 p-4 md:grid-cols-2 md:p-6">
                      <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                        <p className="text-xs uppercase tracking-[0.26em] text-white/45">Ricerche popolari</p>
                        <div className="mt-5 space-y-2">
                          {popularSuggestions.map((item) => (
                            <button
                              key={`${item.type}-${item.label}`}
                              type="button"
                              onClick={() => navigate(item.href)}
                              className="flex w-full items-center justify-between rounded-2xl border border-white/10 px-4 py-3 text-left text-sm text-white/75 transition hover:border-white/20 hover:text-white"
                            >
                              <span>{item.label}</span>
                              <span className="text-xs uppercase tracking-[0.2em] text-white/35">{item.type}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                        <p className="text-xs uppercase tracking-[0.26em] text-white/45">Altro</p>
                        <div className="mt-5 grid gap-2 sm:grid-cols-2">
                          {exploreSuggestions.map((item) => (
                            <button
                              key={`${item.type}-${item.label}`}
                              type="button"
                              onClick={() => navigate(item.href)}
                              className="rounded-2xl border border-white/10 px-4 py-3 text-left text-sm text-white/75 transition hover:border-white/20 hover:text-white"
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 md:p-6">
                      <div className="mb-5 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.26em] text-white/45">Risultati live</p>
                          <p className="mt-2 text-sm text-white/65">
                            {loadingProducts ? "Aggiornamento risultati..." : `${liveResults.length} prodotti trovati per "${trimmedSearch}"`}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => submitSearch()}
                          className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/75 transition hover:border-white/20 hover:text-white"
                        >
                          Vedi tutti i risultati
                        </button>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {liveResults.length ? (
                          liveResults.map((product) => (
                            <button
                              key={product.id}
                              type="button"
                              onClick={() => navigate(`/shop/${product.slug}`)}
                              className="overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03] text-left transition hover:-translate-y-0.5 hover:border-white/20"
                            >
                              <div className="aspect-[4/3] overflow-hidden bg-white/[0.04]">
                                <img
                                  src={product.imageUrls[0]}
                                  alt={product.title}
                                  className="h-full w-full object-cover transition duration-500 hover:scale-[1.03]"
                                />
                              </div>
                              <div className="space-y-2 p-4">
                                <p className="text-xs uppercase tracking-[0.2em] text-white/45">{product.category}</p>
                                <h3 className="line-clamp-2 text-base font-medium text-white">
                                  {highlightMatch(product.title, trimmedSearch)}
                                </h3>
                                <p className="text-sm font-medium text-[#e3f503]">{formatPrice(product.price)}</p>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="rounded-[24px] border border-dashed border-white/10 px-6 py-10 text-center text-white/55">
                            Nessun risultato live. Premi invio per aprire il catalogo filtrato.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Container>
            </motion.div>
          </Fragment>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {cartOpen ? (
          <Fragment>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/45 backdrop-blur-sm"
            />

            <motion.aside
              ref={cartRef}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="fixed right-0 top-0 z-50 h-screen w-full max-w-lg border-l border-white/10 bg-[#0b0b0c]/96 p-5 shadow-[0_20px_80px_rgba(0,0,0,.45)] backdrop-blur-2xl"
            >
              <div className="flex h-full flex-col">
                <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-white/45">Carrello shop</p>
                    <h2 className="mt-3 text-2xl font-semibold text-white">
                      {user ? "Il tuo carrello" : "Accesso non effettuato"}
                    </h2>
                    <p className="mt-2 text-sm text-white/60">
                      {user
                        ? "Rivedi i prodotti selezionati e completa l'acquisto senza uscire dalla pagina."
                        : "Effettua l'accesso per visualizzare il carrello e continuare il checkout."}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCartOpen(false)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/55 transition hover:border-white/20 hover:text-white"
                    aria-label="Chiudi pannello carrello"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {!user ? (
                  <div className="flex flex-1 flex-col justify-between py-6">
                    <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                      <p className="text-sm text-white/65">
                        Il carrello e disponibile solo dopo l'accesso. Entra nel tuo account per vedere prodotti salvati e procedere al checkout.
                      </p>
                    </div>

                    <div className="flex flex-col gap-3">
                      <Button href="/shop/auth" className="w-full" onClick={() => setCartOpen(false)}>
                        Accedi
                      </Button>
                      <Button href="/shop/auth" variant="ghost" className="w-full" onClick={() => setCartOpen(false)}>
                        Crea account
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 space-y-4 overflow-y-auto py-6">
                      {!items.length ? (
                        <div className="rounded-[24px] border border-dashed border-white/10 px-6 py-12 text-center text-white/60">
                          Il carrello e vuoto. Apri il catalogo per aggiungere un prodotto.
                        </div>
                      ) : (
                        items.map((item) => (
                          <article
                            key={item.productId}
                            className="flex gap-4 rounded-[24px] border border-white/10 bg-white/[0.03] p-4"
                          >
                            <img
                              src={item.product.imageUrls[0]}
                              alt={item.product.title}
                              className="h-24 w-24 rounded-[18px] object-cover"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs uppercase tracking-[0.2em] text-white/45">{item.product.category}</p>
                              <h3 className="mt-2 line-clamp-2 text-base font-medium text-white">{item.product.title}</h3>
                              <div className="mt-3 flex items-center justify-between gap-3 text-sm text-white/65">
                                <span>Qtà {item.quantity}</span>
                                <span className="font-medium text-[#e3f503]">{formatPrice(item.product.price * item.quantity)}</span>
                              </div>
                            </div>
                          </article>
                        ))
                      )}
                    </div>

                    <div className="border-t border-white/10 pt-5">
                      {cartPricingError ? <p className="mb-3 text-sm text-red-300">{cartPricingError}</p> : null}

                      {loadingCartPricing ? (
                        <p className="text-sm text-white/60">Calcolo totale in corso...</p>
                      ) : cartPricing ? (
                        <div className="space-y-3 text-sm text-white/70">
                          <div className="flex items-center justify-between">
                            <span>Subtotale</span>
                            <span>{formatPrice(cartPricing.subtotal)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Sconti</span>
                            <span>-{formatPrice(cartPricing.discountTotal)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Spedizione</span>
                            <span>{formatPrice(cartPricing.shippingTotal)}</span>
                          </div>
                          <div className="flex items-center justify-between border-t border-white/10 pt-3 text-base font-semibold text-white">
                            <span>Totale</span>
                            <span>{formatPrice(cartPricing.total)}</span>
                          </div>
                        </div>
                      ) : null}

                      <div className="mt-5 flex flex-col gap-3">
                        <Button
                          onClick={() => {
                            setCartOpen(false)
                            navigate("/shop/checkout")
                          }}
                          className="w-full"
                        >
                          Vai al checkout
                        </Button>
                        <Button
                          onClick={() => {
                            setCartOpen(false)
                            navigate("/shop/cart")
                          }}
                          variant="ghost"
                          className="w-full"
                        >
                          Apri riepilogo completo
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.aside>
          </Fragment>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {profileOpen ? (
          <Fragment>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/45 backdrop-blur-sm"
            />

            <motion.aside
              ref={profileRef}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="fixed right-0 top-0 z-50 h-screen w-full max-w-md border-l border-white/10 bg-[#0b0b0c]/96 p-5 shadow-[0_20px_80px_rgba(0,0,0,.45)] backdrop-blur-2xl"
            >
              <div className="flex h-full flex-col">
                <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-white/45">Profilo shop</p>
                    <h2 className="mt-3 text-2xl font-semibold text-white">
                      {user ? "Accesso effettuato" : "Accedi o crea un account"}
                    </h2>
                    <p className="mt-2 text-sm text-white/60">
                      {user
                        ? "Gestisci ordini, ricevute e accesso all'area account."
                        : "Apri il tuo spazio cliente per ordini, checkout rapido e storico acquisti."}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setProfileOpen(false)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/55 transition hover:border-white/20 hover:text-white"
                    aria-label="Chiudi pannello profilo"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex-1 space-y-5 overflow-y-auto py-6">
                  {loading ? (
                    <div className="rounded-[24px] border border-white/10 bg-white/[0.03] px-5 py-6 text-sm text-white/60">
                      Caricamento account...
                    </div>
                  ) : user ? (
                    <>
                      <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                        <p className="text-sm text-[#e3f503]">Accesso effettuato</p>
                        <h3 className="mt-2 text-xl font-semibold text-white">
                          {user.firstName} {user.lastName}
                        </h3>
                        <p className="mt-1 text-sm text-white/60">{user.email}</p>
                      </div>

                      <div className="grid gap-3">
                        <button
                          type="button"
                          onClick={() => navigate("/shop/profile")}
                          className="rounded-[22px] border border-white/10 bg-white/[0.03] px-5 py-4 text-left text-white/80 transition hover:border-white/20 hover:text-white"
                        >
                          <div className="text-sm font-medium">Apri profilo completo</div>
                          <div className="mt-1 text-sm text-white/55">Ordini, ricevute e dettagli account.</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => navigate("/shop/profile")}
                          className="rounded-[22px] border border-white/10 bg-white/[0.03] px-5 py-4 text-left text-white/80 transition hover:border-white/20 hover:text-white"
                        >
                          <div className="text-sm font-medium">I miei ordini</div>
                          <div className="mt-1 text-sm text-white/55">Controlla lo storico e scarica le ricevute.</div>
                        </button>

                        {user.role === "admin" ? (
                          <button
                            type="button"
                            onClick={() => navigate("/shop/admin")}
                            className="rounded-[22px] border border-white/10 bg-white/[0.03] px-5 py-4 text-left text-white/80 transition hover:border-white/20 hover:text-white"
                          >
                            <div className="text-sm font-medium">Area admin</div>
                            <div className="mt-1 text-sm text-white/55">Gestisci prodotti, ordini e coupon.</div>
                          </button>
                        ) : null}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                        <p className="text-sm text-white/65">
                          Entra nel tuo account per checkout piu rapido, storico ordini e area personale.
                        </p>
                        <div className="mt-5 flex flex-col gap-3">
                          <Button href="/shop/auth" className="w-full" onClick={() => setProfileOpen(false)}>
                            Accedi
                          </Button>
                          <Button href="/shop/auth" variant="ghost" className="w-full" onClick={() => setProfileOpen(false)}>
                            Crea account
                          </Button>
                        </div>
                      </div>

                      <div className="grid gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setProfileOpen(false)
                            setCartOpen(true)
                          }}
                          className="rounded-[22px] border border-white/10 bg-white/[0.03] px-5 py-4 text-left text-white/80 transition hover:border-white/20 hover:text-white"
                        >
                          <div className="text-sm font-medium">Continua con il carrello</div>
                          <div className="mt-1 text-sm text-white/55">Rivedi i prodotti selezionati e completa l'acquisto.</div>
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {user ? (
                  <button
                    type="button"
                    onClick={() => {
                      logout()
                      setProfileOpen(false)
                    }}
                    className="w-full rounded-full border border-white/10 px-5 py-3 text-sm text-white/75 transition hover:border-white/20 hover:text-white"
                  >
                    Logout
                  </button>
                ) : null}
              </div>
            </motion.aside>
          </Fragment>
        ) : null}
      </AnimatePresence>

      <div className="h-[76px] md:h-[92px]" />
    </>
  )
}
