import { useEffect, useMemo, useRef, useState } from "react"
import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  HeartIcon,
  MagnifyingGlassIcon,
  ShoppingBagIcon,
  UserIcon,
} from "@heroicons/react/24/outline"

import { Container } from "./Container"
import { Logo } from "./Logo"
import { apiFetch } from "../shop/lib/api"
import { useShopAuth } from "../shop/context/ShopAuthProvider"
import { useShopCart } from "../shop/context/ShopCartProvider"

function NavFlip({ label }: { label: string }) {
  const front = { rest: { rotateX: 0, y: 0 }, hover: { rotateX: 90, y: -10 } }
  const back = { rest: { rotateX: -90, y: 10 }, hover: { rotateX: 0, y: 0 } }
  const t = { duration: 0.28, ease: [0.2, 0.8, 0.2, 1] as const }

  return (
    <span className="relative inline-block h-6 overflow-hidden" style={{ perspective: 900 }}>
      <span className="relative block" style={{ transformStyle: "preserve-3d" }}>
        <motion.span
          variants={front}
          transition={t}
          className="block"
          style={{ transformOrigin: "50% 50% -12px", willChange: "transform" }}
        >
          {label}
        </motion.span>
        <motion.span
          variants={back}
          transition={t}
          className="absolute left-0 top-0 block text-[#e3f503]"
          style={{ transformOrigin: "50% 50% -12px", willChange: "transform" }}
        >
          {label}
        </motion.span>
      </span>
    </span>
  )
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState("")
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const navH = 80

  const { user } = useShopAuth()
  const { items } = useShopCart()
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const categoriesRef = useRef<HTMLDivElement | null>(null)

  const categoryItems = useMemo(() => ["All Product", ...categories], [categories])

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
    const syncFilters = (event: Event) => {
      const detail = (event as CustomEvent<{ search?: string; category?: string }>).detail || {}
      setSearch(detail.search || "")
      setActiveCategory(detail.category || "")
    }

    window.addEventListener("bns:shop-filter-state", syncFilters as EventListener)
    return () => window.removeEventListener("bns:shop-filter-state", syncFilters as EventListener)
  }, [])

  function emitFilters(next: { search?: string; category?: string }) {
    window.dispatchEvent(new CustomEvent("bns:shop-navbar-filters", { detail: next }))
  }

  function updateScrollState() {
    const el = categoriesRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }

  useEffect(() => {
    updateScrollState()
    const el = categoriesRef.current
    if (!el) return

    el.addEventListener("scroll", updateScrollState, { passive: true })
    window.addEventListener("resize", updateScrollState)

    return () => {
      el.removeEventListener("scroll", updateScrollState)
      window.removeEventListener("resize", updateScrollState)
    }
  }, [categoryItems.length])

  function scrollCategories(direction: "left" | "right") {
    const el = categoriesRef.current
    if (!el) return
    el.scrollBy({ left: direction === "left" ? -220 : 220, behavior: "smooth" })
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50" style={{ ["--nav-h" as any]: `${navH}px` } as any}>
        <div className="relative">
          <motion.div
            aria-hidden
            className="absolute inset-0 pointer-events-none z-0"
            initial={false}
            animate={scrolled ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <div className="absolute inset-0 backdrop-blur-2xl bg-black/30" />
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

          <div className={scrolled ? "bg-transparent" : "bg-black/15 backdrop-blur-sm"}>
            <Container>
              <div className="relative z-20 py-3 md:py-4">
                <motion.div
                  initial={{ y: -12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 md:gap-6"
                >
                  <div className="hidden min-w-0 items-center gap-2 md:flex">
                    <button
                      type="button"
                      onClick={() => scrollCategories("left")}
                      disabled={!canScrollLeft}
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-white/55 transition hover:border-white/20 hover:text-white disabled:cursor-default disabled:opacity-30"
                    >
                      <ChevronLeftIcon className="h-4 w-4" />
                    </button>

                    <div
                      ref={categoriesRef}
                      className="no-scrollbar flex min-w-0 items-center gap-6 overflow-x-auto scroll-smooth whitespace-nowrap"
                    >
                      {categoryItems.map((label) => {
                        const value = label === "All Product" ? "" : label
                        const active = activeCategory === value

                        return (
                          <motion.button
                            key={label}
                            type="button"
                            initial="rest"
                            animate="rest"
                            whileHover="hover"
                            whileTap="hover"
                            onClick={() => {
                              setActiveCategory(value)
                              emitFilters({ category: value })
                            }}
                            className={["h-10 inline-flex items-center text-sm transition", active ? "text-white" : "text-white/65 hover:text-white"].join(" ")}
                          >
                            <NavFlip label={label} />
                          </motion.button>
                        )
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => scrollCategories("right")}
                      disabled={!canScrollRight}
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-white/55 transition hover:border-white/20 hover:text-white disabled:cursor-default disabled:opacity-30"
                    >
                      <ChevronRightIcon className="h-4 w-4" />
                    </button>
                  </div>

                  <a href="#top" aria-label="Vai all'inizio" className="justify-self-center">
                    <div className="scale-105 md:scale-100">
                      <Logo />
                    </div>
                  </a>

                  <div className="flex items-center justify-end gap-2 md:gap-3">
                    <label className="hidden min-w-[220px] items-center gap-2 rounded-full border border-white/10 bg-black/25 px-4 py-2 backdrop-blur-xl md:flex">
                      <MagnifyingGlassIcon className="h-4 w-4 text-white/45" />
                      <input
                        value={search}
                        onChange={(event) => {
                          const value = event.target.value
                          setSearch(value)
                          emitFilters({ search: value })
                        }}
                        placeholder="Search product"
                        className="w-full bg-transparent text-sm text-white placeholder:text-white/35 outline-none"
                      />
                    </label>

                    <Link
                      to={user ? "/shop/profile" : "/shop/auth"}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/75 transition hover:border-white/20 hover:text-white"
                      aria-label="Profilo"
                    >
                      <UserIcon className="h-5 w-5" />
                    </Link>

                    <Link
                      to="/shop"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/75 transition hover:border-white/20 hover:text-white"
                      aria-label="Preferiti"
                    >
                      <HeartIcon className="h-5 w-5" />
                    </Link>

                    <Link
                      to="/shop/cart"
                      className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/75 transition hover:border-white/20 hover:text-white"
                      aria-label="Carrello"
                    >
                      <ShoppingBagIcon className="h-5 w-5" />
                      {cartCount ? (
                        <span className="absolute -right-1 -top-1 rounded-full bg-[#e3f503] px-1.5 py-0.5 text-[10px] font-semibold text-black">
                          {cartCount}
                        </span>
                      ) : null}
                    </Link>
                  </div>
                </motion.div>

                <div className="space-y-3 md:hidden">
                  <label className="flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-4 py-2 backdrop-blur-xl">
                    <MagnifyingGlassIcon className="h-4 w-4 text-white/45" />
                    <input
                      value={search}
                      onChange={(event) => {
                        const value = event.target.value
                        setSearch(value)
                        emitFilters({ search: value })
                      }}
                      placeholder="Search product"
                      className="w-full bg-transparent text-sm text-white placeholder:text-white/35 outline-none"
                    />
                  </label>

                  <div className="no-scrollbar flex items-center gap-5 overflow-x-auto whitespace-nowrap pb-1">
                    {categoryItems.map((label) => {
                      const value = label === "All Product" ? "" : label
                      const active = activeCategory === value

                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() => {
                            setActiveCategory(value)
                            emitFilters({ category: value })
                          }}
                          className={["text-sm transition", active ? "text-white" : "text-white/60"].join(" ")}
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </Container>
          </div>
        </div>
      </header>

      <div className="h-[118px] md:h-[96px]" />
    </>
  )
}
