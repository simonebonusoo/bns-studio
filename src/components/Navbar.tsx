import { Fragment, useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useLocation, useNavigate } from "react-router-dom"
import {
  Bars3Icon,
  HomeIcon,
  MagnifyingGlassIcon,
  ShoppingBagIcon,
  Squares2X2Icon,
  UserCircleIcon,
  UserIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline"

import { Container } from "./Container"
import { Logo } from "./Logo"
import { Button, getButtonClassName } from "./Button"
import { MobileSheet, mobileSheetBodyClass, mobileSheetFooterClass } from "./mobile/MobileSheet"
import { useCanHover } from "../hooks/useCanHover"
import { useIsMobileViewport } from "../hooks/useIsMobileViewport"
import { useShopAuth } from "../shop/context/ShopAuthProvider"
import { useShopCart } from "../shop/context/ShopCartProvider"
import { apiFetch } from "../shop/lib/api"
import { formatPrice } from "../shop/lib/format"
import { getPriceForVariant, getProductPrimaryImage, getProductStockStatus } from "../shop/lib/product"
import { ShopProduct, ShopProductListResponse } from "../shop/types"

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

function containWheel(event: React.WheelEvent<HTMLElement>) {
  event.stopPropagation()
}

function forwardWheelToHorizontalScroll(event: React.WheelEvent<HTMLElement>) {
  const target = event.currentTarget
  if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return
  target.scrollLeft += event.deltaY
  event.preventDefault()
}

function scoreSearchSuggestion(product: ShopProduct, query: string) {
  const normalizedQuery = query.trim().toLowerCase()
  const title = product.title.toLowerCase()
  const description = product.description.toLowerCase()
  const category = product.category.toLowerCase()
  const tagNames = (product.tags || []).map((tag) => tag.name.toLowerCase())
  const collectionNames = (product.collections || []).map((collection) => collection.title.toLowerCase())

  if (!normalizedQuery) {
    return (product.featured ? 4 : 0) + (getProductStockStatus(product) === "in_stock" ? 3 : getProductStockStatus(product) === "low_stock" ? 1 : 0)
  }

  const exactTitle = title === normalizedQuery ? 12 : 0
  const titlePrefix = title.startsWith(normalizedQuery) ? 8 : 0
  const titleMatch = title.includes(normalizedQuery) ? 6 : 0
  const descriptionMatch = description.includes(normalizedQuery) ? 2 : 0
  const categoryMatch = category.includes(normalizedQuery) ? 3 : 0
  const tagMatch = tagNames.filter((tag) => tag.includes(normalizedQuery)).length * 3
  const collectionMatch = collectionNames.filter((collection) => collection.includes(normalizedQuery)).length * 3
  const availabilityBoost = getProductStockStatus(product) === "in_stock" ? 3 : getProductStockStatus(product) === "low_stock" ? 1 : 0
  const featuredBoost = product.featured ? 2 : 0

  return exactTitle + titlePrefix + titleMatch + descriptionMatch + categoryMatch + tagMatch + collectionMatch + availabilityBoost + featuredBoost
}

const overlayTransition = { duration: 0.18, ease: [0.22, 1, 0.36, 1] as const }
const drawerTransition = { duration: 0.24, ease: [0.22, 1, 0.36, 1] as const }
const mobileScrollablePanelClass = mobileSheetBodyClass

function shuffleProducts(products: ShopProduct[]) {
  const next = [...products]
  for (let index = next.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[next[index], next[randomIndex]] = [next[randomIndex], next[index]]
  }
  return next
}

function SuggestionProductCard({
  product,
  onClick,
  query = "",
}: {
  product: ShopProduct
  onClick: () => void
  query?: string
}) {
  const canHover = useCanHover()
  const primaryImage = getProductPrimaryImage(product)
  const secondaryImage = product.imageUrls?.[1] || ""
  const hasHoverImage = Boolean(canHover && primaryImage && secondaryImage && secondaryImage !== primaryImage)

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-[17rem] flex-none overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03] text-left transition hover:-translate-y-0.5 hover:border-white/20"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-white/[0.04]">
        {primaryImage ? (
          <>
            <img
              src={primaryImage}
              alt={product.title}
              className={`absolute inset-0 h-full w-full object-cover transition duration-500 ${
                hasHoverImage ? "opacity-100 group-hover:opacity-0" : ""
              }`}
            />
            {hasHoverImage ? (
              <img
                src={secondaryImage}
                alt={product.title}
                className="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-500 group-hover:opacity-100"
              />
            ) : null}
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-white/45">
            Nessuna immagine disponibile
          </div>
        )}
      </div>
      <div className="space-y-2 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-white/45">{product.category}</p>
        <h3 className="line-clamp-2 text-base font-medium text-white">
          {query ? highlightMatch(product.title, query) : product.title}
        </h3>
        <p className="text-sm font-medium text-[#e3f503]">{formatPrice(getPriceForVariant(product))}</p>
      </div>
    </button>
  )
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [profileStep, setProfileStep] = useState<"initial" | "login" | "register">("initial")
  const [profileLoggedStep, setProfileLoggedStep] = useState<"overview" | "edit">("overview")
  const [profileEditField, setProfileEditField] = useState<null | "username" | "email" | "password">(null)
  const [search, setSearch] = useState("")
  const [products, setProducts] = useState<ShopProduct[]>([])
  const [shuffledSuggestedProducts, setShuffledSuggestedProducts] = useState<ShopProduct[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [cartPricing, setCartPricing] = useState<{
    subtotal: number
    discountTotal: number
    shippingTotal: number
    total: number
  } | null>(null)
  const [cartPricingError, setCartPricingError] = useState("")
  const [loadingCartPricing, setLoadingCartPricing] = useState(false)
  const [profileError, setProfileError] = useState("")
  const [profileSubmitting, setProfileSubmitting] = useState(false)
  const [loginForm, setLoginForm] = useState({
    identifier: "",
    password: "",
  })
  const [registerForm, setRegisterForm] = useState({
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [profileForms, setProfileForms] = useState({
    username: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const navH = 88
  const isMobileViewport = useIsMobileViewport()

  const { user, effectiveRole, isGuestPreview, enableGuestPreview, disableGuestPreview, login, updateProfile, logout, loading } = useShopAuth()
  const { items, couponCode, clearCart, removeItem } = useShopCart()
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const profileRef = useRef<HTMLDivElement | null>(null)
  const cartRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const shouldUseGlobalOverlayLock = menuOpen || searchOpen || (!isMobileViewport && (profileOpen || cartOpen))

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    const openProfile = (event: Event) => {
      const detail =
        event instanceof CustomEvent
          ? (event.detail as { step?: "initial" | "login" | "register" } | undefined)
          : undefined

      setMenuOpen(false)
      setSearchOpen(false)
      setCartOpen(false)
      setProfileStep(detail?.step || "initial")
      setProfileLoggedStep("overview")
      setProfileEditField(null)
      setProfileOpen(true)
    }

    window.addEventListener("bns:open-profile", openProfile)
    return () => window.removeEventListener("bns:open-profile", openProfile)
  }, [])

  useEffect(() => {
    if (!searchOpen || products.length) return

    setLoadingProducts(true)
    apiFetch<ShopProductListResponse>("/store/products?page=1&pageSize=48&sort=manual")
      .then(async (data) => {
        const firstItems = Array.isArray(data.items) ? data.items : []

        if (!data.pagination || data.pagination.totalPages <= 1) {
          setProducts(firstItems)
          return
        }

        const nextPages = await Promise.all(
          Array.from({ length: data.pagination.totalPages - 1 }, (_, index) =>
            apiFetch<ShopProductListResponse>(`/store/products?page=${index + 2}&pageSize=48&sort=manual`),
          ),
        )

        setProducts([firstItems, ...nextPages.map((page) => page.items || [])].flat())
      })
      .catch(() => setProducts([]))
      .finally(() => setLoadingProducts(false))
  }, [products.length, searchOpen])

  useEffect(() => {
    if (!searchOpen) return
    setShuffledSuggestedProducts(shuffleProducts(products))
  }, [products, searchOpen])

  useEffect(() => {
    if (!shouldUseGlobalOverlayLock) return

    const previousOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow
    const previousBodyPaddingRight = document.body.style.paddingRight
    const previousHtmlPaddingRight = document.documentElement.style.paddingRight
    const scrollbarWidth = Math.max(0, window.innerWidth - document.documentElement.clientWidth)

    if (scrollbarWidth > 0) {
      const bodyPadding = Number.parseFloat(window.getComputedStyle(document.body).paddingRight || "0")
      const htmlPadding = Number.parseFloat(window.getComputedStyle(document.documentElement).paddingRight || "0")
      document.body.style.paddingRight = `${bodyPadding + scrollbarWidth}px`
      document.documentElement.style.paddingRight = `${htmlPadding + scrollbarWidth}px`
    }

    document.body.style.overflow = "hidden"
    document.documentElement.style.overflow = "hidden"
    window.__lenis?.stop?.()

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          setMenuOpen(false)
          setSearchOpen(false)
          setProfileOpen(false)
          setCartOpen(false)
      }
    }

      const handlePointerDown = (event: MouseEvent) => {
        const target = event.target as Node

        if (menuOpen && !menuRef.current?.contains(target)) {
          setMenuOpen(false)
        }

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
      document.documentElement.style.overflow = previousHtmlOverflow
      document.body.style.paddingRight = previousBodyPaddingRight
      document.documentElement.style.paddingRight = previousHtmlPaddingRight
      window.__lenis?.start?.()
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("mousedown", handlePointerDown)
    }
  }, [cartOpen, isMobileViewport, menuOpen, profileOpen, searchOpen, shouldUseGlobalOverlayLock])

  useEffect(() => {
    if (!searchOpen) return
    const timer = window.setTimeout(() => inputRef.current?.focus(), 60)
    return () => window.clearTimeout(timer)
  }, [searchOpen])

  useEffect(() => {
    setMenuOpen(false)
    setSearchOpen(false)
    setProfileOpen(false)
    setCartOpen(false)
  }, [location.pathname, location.search])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (location.pathname !== "/" || params.get("profile") !== "open") return

    setMenuOpen(false)
    setSearchOpen(false)
    setCartOpen(false)
    setProfileStep("initial")
    setProfileLoggedStep("overview")
    setProfileEditField(null)
    setProfileOpen(true)

    params.delete("profile")
    navigate(
      {
        pathname: "/",
        search: params.toString() ? `?${params.toString()}` : "",
      },
      { replace: true }
    )
  }, [location.pathname, location.search, navigate])

  useEffect(() => {
    if (!profileOpen) {
      setProfileStep("initial")
      setProfileLoggedStep("overview")
      setProfileEditField(null)
      setProfileError("")
      setProfileSubmitting(false)
    }
  }, [profileOpen])

  useEffect(() => {
    setProfileError("")
  }, [profileStep])

  useEffect(() => {
    setProfileError("")
  }, [profileEditField])

  useEffect(() => {
    if (!user) return
    setProfileForms({
      username: user.username || "",
      email: user.email || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    })
  }, [user])

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
          items: items.map((item) => ({ productId: item.productId, quantity: item.quantity, format: item.format, variantId: item.variantId || null })),
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
      .sort((left, right) => scoreSearchSuggestion(right, trimmedSearch) - scoreSearchSuggestion(left, trimmedSearch))
  }, [products, trimmedSearch])

  function openProfilePanel(step: "initial" | "login" | "register" = "initial") {
    setMenuOpen(false)
    setSearchOpen(false)
    setCartOpen(false)
    setProfileStep(step)
    setProfileLoggedStep("overview")
    setProfileEditField(null)
    setProfileOpen(true)
  }

  function openCartPanel() {
    setMenuOpen(false)
    setSearchOpen(false)
    setProfileOpen(false)
    setCartOpen(true)
  }

  function submitSearch(nextSearch = trimmedSearch) {
    const value = nextSearch.trim()
    navigate(value ? `/shop?search=${encodeURIComponent(value)}` : "/shop")
    setMenuOpen(false)
    setSearchOpen(false)
  }

  const suggestedProducts = shuffledSuggestedProducts
  const profileView = user ? "logged" : profileStep
  const displayUsername = user?.username || user?.email?.split("@")[0] || "cliente"

  async function submitProfileLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setProfileError("")

    const identifier = loginForm.identifier.trim()
    if (!identifier) {
      setProfileError("Inserisci email o username.")
      return
    }

    try {
      setProfileSubmitting(true)
      await login(
        {
          identifier,
          password: loginForm.password,
        },
        "login"
      )
      setLoginForm({ identifier: "", password: "" })
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Errore durante il login.")
    } finally {
      setProfileSubmitting(false)
    }
  }

  async function submitProfileRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setProfileError("")

    if (registerForm.password !== registerForm.confirmPassword) {
      setProfileError("La conferma password non coincide.")
      return
    }

    try {
      setProfileSubmitting(true)
      await login(
        {
          firstName: registerForm.firstName,
          lastName: registerForm.lastName,
          email: registerForm.email,
          password: registerForm.password,
          username: registerForm.username,
        },
        "register"
      )
      setRegisterForm({
        username: "",
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
      })
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Errore durante la registrazione.")
    } finally {
      setProfileSubmitting(false)
    }
  }

  async function submitProfileUpdate(field: "username" | "email" | "password", event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setProfileError("")

    try {
      setProfileSubmitting(true)

      if (field === "username") {
        await updateProfile({ username: profileForms.username })
      }

      if (field === "email") {
        await updateProfile({
          email: profileForms.email,
          currentPassword: profileForms.currentPassword,
        })
      }

      if (field === "password") {
        if (profileForms.newPassword !== profileForms.confirmPassword) {
          throw new Error("La conferma password non coincide.")
        }

        await updateProfile({
          currentPassword: profileForms.currentPassword,
          newPassword: profileForms.newPassword,
        })
      }

      setProfileEditField(null)
      setProfileForms((current) => ({
        ...current,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }))
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Errore durante l'aggiornamento del profilo.")
    } finally {
      setProfileSubmitting(false)
    }
  }

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
                className="relative z-20"
              >
                <div className="flex min-h-[68px] items-center justify-between gap-3 py-3 md:hidden">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSearchOpen(false)
                        setCartOpen(false)
                        setProfileOpen(false)
                        setMenuOpen((current) => !current)
                      }}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/72 transition hover:border-white/20 hover:text-white"
                      aria-label="Apri menu"
                    >
                      <Bars3Icon className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false)
                        setCartOpen(false)
                        setProfileOpen(false)
                        setSearchOpen(true)
                      }}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/72 transition hover:border-white/20 hover:text-white"
                      aria-label="Apri ricerca"
                    >
                      <MagnifyingGlassIcon className="h-5 w-5" />
                    </button>
                  </div>

                  <a href="#top" aria-label="Vai all'inizio" className="flex flex-1 items-center justify-center no-underline">
                    <Logo className="h-7" />
                  </a>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={openCartPanel}
                      className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/72 transition hover:border-white/20 hover:text-white"
                      aria-label="Apri carrello"
                    >
                      <ShoppingBagIcon className="h-5 w-5" />
                      {cartCount ? (
                        <span className="absolute -right-1 -top-1 inline-flex min-w-[1.15rem] items-center justify-center rounded-full bg-[#e3f503] px-1.5 py-0.5 text-[10px] font-semibold text-black">
                          {cartCount}
                        </span>
                      ) : null}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        openProfilePanel("initial")
                      }}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/72 transition hover:border-white/20 hover:text-white"
                      aria-label={user ? "Apri profilo" : "Accedi o crea account"}
                    >
                      <UserCircleIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="hidden min-h-[88px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-6 py-4 md:grid">
                  <a href="#top" aria-label="Vai all'inizio" className="flex items-center no-underline">
                    <Logo className="h-9" />
                  </a>

                  <div
                    className={[
                      "flex h-[50px] w-full items-center gap-3 rounded-full border bg-white/[0.04] px-5 backdrop-blur-xl transition",
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
                      className="w-full bg-transparent text-base text-white placeholder:text-white/35 outline-none"
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

                  <div className="flex items-center justify-end gap-3">
                    <Button onClick={() => openProfilePanel("initial")} variant="ghost" size="sm" className="hidden sm:inline-flex">
                      Profilo
                    </Button>

                    <Button onClick={openCartPanel} size="sm" text={`Carrello${cartCount ? ` (${cartCount})` : ""}`}>
                      Carrello
                    </Button>
                  </div>
                </div>
              </motion.div>
            </Container>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen ? (
          <Fragment>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={overlayTransition}
              className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm md:hidden"
            />

            <motion.aside
              ref={menuRef}
              initial={{ opacity: 0, x: -18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={drawerTransition}
              className="fixed inset-y-0 left-0 z-50 w-[88vw] max-w-sm border-r border-white/10 bg-[#0b0b0c]/97 p-5 shadow-[0_20px_80px_rgba(0,0,0,.45)] backdrop-blur-2xl md:hidden"
            >
              <div className="flex h-full flex-col">
                <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-white/45">Menu shop</p>
                    <h2 className="mt-3 text-2xl font-semibold text-white">Naviga BNS Studio</h2>
                    <p className="mt-2 text-sm text-white/60">Accesso rapido a shop, categorie, account, ordini e informazioni.</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setMenuOpen(false)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/55 transition hover:border-white/20 hover:text-white"
                    aria-label="Chiudi menu"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className={`${mobileScrollablePanelClass} space-y-3 py-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]`}>
                  {[
                    {
                      label: "Home",
                      description: "Torna all'inizio della homepage.",
                      icon: <HomeIcon className="h-5 w-5" />,
                      onClick: () => {
                        setMenuOpen(false)
                        navigate("/#top")
                      },
                    },
                    {
                      label: "Categorie",
                      description: "Vai alla sezione Acquista per categoria.",
                      icon: <Squares2X2Icon className="h-5 w-5" />,
                      onClick: () => {
                        setMenuOpen(false)
                        navigate("/#shop-categories")
                      },
                    },
                    {
                      label: "Ordini",
                      description: "Consulta ordini e stato spedizione.",
                      icon: <UserIcon className="h-5 w-5" />,
                      onClick: () => {
                        if (user) {
                          setMenuOpen(false)
                          navigate("/shop/profile")
                          return
                        }
                        openProfilePanel("login")
                      },
                    },
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={item.onClick}
                      className="flex w-full items-center gap-4 rounded-[24px] border border-white/10 bg-white/[0.03] px-4 py-4 text-left transition hover:border-white/20 hover:bg-white/[0.05]"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/82">
                        {item.icon}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-white">{item.label}</span>
                        <span className="mt-1 block text-xs text-white/55">{item.description}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.aside>
          </Fragment>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {searchOpen ? (
          <Fragment>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={overlayTransition}
              onClick={() => setSearchOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={drawerTransition}
              className="fixed inset-0 z-50 px-4 pb-5 pt-[calc(env(safe-area-inset-top)+14px)] md:inset-x-0 md:top-[88px] md:px-0 md:pb-6 md:pt-0"
            >
              <div className="h-full md:h-auto">
                <Container>
                  <div
                    ref={overlayRef}
                    className="flex h-full flex-col overflow-hidden rounded-[30px] border border-white/10 bg-[#0b0b0b]/95 shadow-[0_30px_90px_rgba(0,0,0,.45)] backdrop-blur-2xl md:h-auto md:rounded-[32px]"
                  >
                    <div className="border-b border-white/10 p-4 md:hidden">
                      <div className="flex h-12 items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4">
                        <MagnifyingGlassIcon className="h-5 w-5 shrink-0 text-white/45" />
                        <input
                          ref={inputRef}
                          value={search}
                          onChange={(event) => setSearch(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              submitSearch(search)
                            }
                          }}
                          placeholder="Cerca prodotti, nomi, artisti..."
                          className="w-full bg-transparent text-sm text-white placeholder:text-white/35 outline-none"
                        />
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
                      </div>
                    </div>
                  {!trimmedSearch ? (
                    <div className={`${mobileScrollablePanelClass} p-4 md:p-6 md:touch-auto md:overscroll-auto`}>
                      <div className="mb-5 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.26em] text-white/45">Suggerimenti</p>
                          <p className="mt-2 text-sm text-white/65">Apri prodotti reali direttamente dalla ricerca.</p>
                        </div>
                      </div>
                      <div
                        data-testid="mobile-search-suggestions"
                        className="flex gap-4 overflow-x-auto pb-2 touch-pan-x snap-x snap-mandatory overscroll-x-contain [-webkit-overflow-scrolling:touch]"
                        onWheel={forwardWheelToHorizontalScroll}
                      >
                        {suggestedProducts.length ? (
                          suggestedProducts.map((product) => {
                            return (
                              <SuggestionProductCard
                                key={product.id}
                                onClick={() => navigate(`/shop/${product.slug}`)}
                                product={product}
                              />
                            )
                          })
                        ) : (
                          <div className="rounded-[24px] border border-dashed border-white/10 px-6 py-10 text-center text-white/55">
                            Nessun prodotto suggerito disponibile.
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className={`${mobileScrollablePanelClass} p-4 md:p-6 md:touch-auto md:overscroll-auto`}>
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

                      <div
                        data-testid="mobile-search-live-results"
                        className="flex gap-4 overflow-x-auto pb-2 touch-pan-x snap-x snap-mandatory overscroll-x-contain [-webkit-overflow-scrolling:touch]"
                        onWheel={forwardWheelToHorizontalScroll}
                      >
                        {liveResults.length ? (
                          liveResults.map((product) => {
                            return (
                              <SuggestionProductCard
                                key={product.id}
                                onClick={() => navigate(`/shop/${product.slug}`)}
                                product={product}
                                query={trimmedSearch}
                              />
                            )
                          })
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
              </div>
            </motion.div>
          </Fragment>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {cartOpen ? (
          isMobileViewport ? (
            <MobileSheet
              ref={cartRef}
              open={cartOpen}
              eyebrow="Carrello shop"
              title={user ? "Il tuo carrello" : "Accesso non effettuato"}
              description={
                user
                  ? "Rivedi i prodotti selezionati e completa l'acquisto senza uscire dalla pagina."
                  : "Effettua l'accesso per visualizzare il carrello e continuare il checkout."
              }
              onClose={() => setCartOpen(false)}
              bodyClassName="min-h-0 flex flex-1 flex-col overflow-hidden py-6"
              footer={
                !user ? null : (
                  <>
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
                      {effectiveRole === "admin" ? (
                        <>
                          <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
                            Gli account admin non possono completare ordini cliente o avviare il pagamento PayPal.
                          </div>
                          <Button
                            onClick={() => {
                              setCartOpen(false)
                              navigate("/shop/admin")
                            }}
                            variant="profile"
                            className="w-full"
                          >
                            Vai a Gestione shop
                          </Button>
                          <Button
                            onClick={() => {
                              setCartOpen(false)
                              navigate("/shop/cart")
                            }}
                            variant="profile"
                            size="sm"
                            text="Apri il riepilogo completo"
                            className="w-full"
                          >
                            Apri riepilogo completo
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            onClick={() => clearCart()}
                            variant="ghost"
                            size="sm"
                            text="Svuota carrello"
                            className="w-full"
                          >
                            Svuota carrello
                          </Button>
                          <Button
                            onClick={() => {
                              setCartOpen(false)
                              navigate("/shop/checkout")
                            }}
                            text="Vai al checkout"
                            className="w-full"
                          >
                            Vai al checkout
                          </Button>
                        </>
                      )}
                    </div>
                  </>
                )
              }
            >
              {!user ? (
                <div className="flex min-h-full flex-col justify-between gap-5">
                  <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                    <p className="text-sm text-white/65">
                      Il carrello e disponibile solo dopo l'accesso. Entra nel tuo account per vedere prodotti salvati e procedere al checkout.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Button
                      className="w-full"
                      onClick={() => {
                        setCartOpen(false)
                        setProfileStep("login")
                        setProfileOpen(true)
                      }}
                    >
                      Accedi
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full"
                      onClick={() => {
                        setCartOpen(false)
                        setProfileStep("register")
                        setProfileOpen(true)
                      }}
                    >
                      Crea account
                    </Button>
                  </div>
                </div>
              ) : !items.length ? (
                <div className="rounded-[24px] border border-dashed border-white/10 px-6 py-12 text-center text-white/60">
                  <p>Il carrello e vuoto.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setCartOpen(false)
                      navigate("/#shop")
                    }}
                    className={`mt-4 ${getButtonClassName({ variant: "profile" })}`}
                  >
                    Vai al catalogo
                  </button>
                </div>
              ) : (
                <div className="min-h-0 flex-1 overflow-hidden">
                  <div className={`${mobileScrollablePanelClass} h-full space-y-4 pr-1`}>
                    {items.map((item) => (
                      <article
                        key={`${item.productId}-${item.variantId || item.format || "default"}`}
                        className="flex gap-4 rounded-[24px] border border-white/10 bg-white/[0.03] p-4"
                      >
                        <img
                          src={getProductPrimaryImage(item.product)}
                          alt={item.product.title}
                          className="h-24 w-24 rounded-[18px] object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs uppercase tracking-[0.2em] text-white/45">{item.product.category}</p>
                          <h3 className="mt-2 line-clamp-2 text-base font-medium text-white">{item.product.title}</h3>
                          <div className="mt-3 flex items-center justify-between gap-3 text-sm text-white/65">
                            <span>{item.variantLabel || item.format || "Variante"} · Qtà {item.quantity}</span>
                            <span className="font-medium text-[#e3f503]">{formatPrice(getPriceForVariant(item.product, item.variantId) * item.quantity)}</span>
                          </div>
                          <div className="mt-3">
                            <button
                              type="button"
                              onClick={() => removeItem(item.productId, { variantId: item.variantId, format: item.format, variantLabel: item.variantLabel, variantSku: item.variantSku })}
                              className={getButtonClassName({ variant: "cart", size: "sm" })}
                            >
                              Rimuovi
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </MobileSheet>
          ) : (
            <Fragment>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={overlayTransition}
                className="fixed inset-0 z-40 bg-black/45 backdrop-blur-sm"
              />

              <motion.aside
                ref={cartRef}
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 18 }}
                transition={drawerTransition}
                className="fixed inset-y-0 right-0 top-0 z-50 h-screen w-full max-w-lg overflow-hidden border border-white/10 border-b-0 border-l bg-[#0b0b0c]/96 p-5 shadow-[0_20px_80px_rgba(0,0,0,.45)] backdrop-blur-2xl will-change-transform"
              >
                <div className="flex h-full min-h-0 flex-col">
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
                        <Button
                          className="w-full"
                          onClick={() => {
                            setCartOpen(false)
                            setProfileStep("login")
                            setProfileOpen(true)
                          }}
                        >
                          Accedi
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full"
                          onClick={() => {
                            setCartOpen(false)
                            setProfileStep("register")
                            setProfileOpen(true)
                          }}
                        >
                          Crea account
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 space-y-4 overflow-y-auto py-6" onWheelCapture={containWheel}>
                        {!items.length ? (
                          <div className="rounded-[24px] border border-dashed border-white/10 px-6 py-12 text-center text-white/60">
                            <p>Il carrello e vuoto.</p>
                            <button
                              type="button"
                              onClick={() => {
                                setCartOpen(false)
                                navigate("/#shop")
                              }}
                              className={`mt-4 ${getButtonClassName({ variant: "profile" })}`}
                            >
                              Vai al catalogo
                            </button>
                          </div>
                        ) : (
                          items.map((item) => (
                            <article
                              key={`${item.productId}-${item.variantId || item.format || "default"}`}
                              className="flex gap-4 rounded-[24px] border border-white/10 bg-white/[0.03] p-4"
                            >
                              <img
                                src={getProductPrimaryImage(item.product)}
                                alt={item.product.title}
                                className="h-24 w-24 rounded-[18px] object-cover"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs uppercase tracking-[0.2em] text-white/45">{item.product.category}</p>
                                <h3 className="mt-2 line-clamp-2 text-base font-medium text-white">{item.product.title}</h3>
                                <div className="mt-3 flex items-center justify-between gap-3 text-sm text-white/65">
                                  <span>{item.variantLabel || item.format || "Variante"} · Qtà {item.quantity}</span>
                                  <span className="font-medium text-[#e3f503]">{formatPrice(getPriceForVariant(item.product, item.variantId) * item.quantity)}</span>
                                </div>
                                <div className="mt-3">
                                  <button
                                    type="button"
                                    onClick={() => removeItem(item.productId, { variantId: item.variantId, format: item.format, variantLabel: item.variantLabel, variantSku: item.variantSku })}
                                    className={getButtonClassName({ variant: "cart", size: "sm" })}
                                  >
                                    Rimuovi
                                  </button>
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
                          {effectiveRole === "admin" ? (
                            <>
                              <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
                                Gli account admin non possono completare ordini cliente o avviare il pagamento PayPal.
                              </div>
                              <Button
                                onClick={() => {
                                  setCartOpen(false)
                                  navigate("/shop/admin")
                                }}
                                variant="profile"
                                className="w-full"
                              >
                                Vai a Gestione shop
                              </Button>
                              <Button
                                onClick={() => {
                                  setCartOpen(false)
                                  navigate("/shop/cart")
                                }}
                                variant="profile"
                                size="sm"
                                text="Apri il riepilogo completo"
                                className="w-full"
                              >
                                Apri riepilogo completo
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                onClick={() => clearCart()}
                                variant="ghost"
                                size="sm"
                                text="Svuota carrello"
                                className="w-full"
                              >
                                Svuota carrello
                              </Button>
                              <Button
                                onClick={() => {
                                  setCartOpen(false)
                                  navigate("/shop/checkout")
                                }}
                                text="Vai al checkout"
                                className="w-full"
                              >
                                Vai al checkout
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </motion.aside>
            </Fragment>
          )
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {profileOpen ? (
          isMobileViewport ? (
            <MobileSheet
              ref={profileRef}
              open={profileOpen}
              eyebrow="Profilo shop"
              title={profileView === "logged" ? `Ciao, ${displayUsername}` : "Accedi o crea un account"}
              description={
                profileView === "logged"
                  ? "Gestisci i tuoi dati, aggiorna il profilo e controlla i tuoi ordini."
                  : "Apri il tuo spazio cliente per ordini, checkout rapido e storico acquisti."
              }
              onClose={() => setProfileOpen(false)}
              bodyClassName={profileView === "register" ? "min-h-0 flex flex-1 flex-col overflow-hidden py-6" : `${mobileScrollablePanelClass} space-y-5 py-6 pb-6`}
              footer={
                profileView === "register" ? (
                  <div className="flex flex-col gap-3">
                    <Button type="submit" form="mobile-register-form" className="w-full">
                      {profileSubmitting ? "Creazione account..." : "Crea account"}
                    </Button>
                    <Button type="button" variant="ghost" className="w-full" onClick={() => setProfileStep("initial")}>
                      Indietro
                    </Button>
                  </div>
                ) : profileView === "logged" && user ? (
                  <button
                    type="button"
                    onClick={() => {
                      logout()
                      setProfileOpen(false)
                      setCartOpen(false)
                      setSearchOpen(false)
                      navigate("/?profile=open")
                    }}
                    className={getButtonClassName({ variant: "cart", className: "w-full" })}
                  >
                    Logout
                  </button>
                ) : null
              }
            >
              {loading ? (
                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] px-5 py-6 text-sm text-white/60">
                  Caricamento account...
                </div>
              ) : profileView === "logged" && user ? (
                <>
                  {profileLoggedStep === "overview" ? (
                    <div className="grid gap-3">
                      <button
                        type="button"
                        onClick={() => setProfileLoggedStep("edit")}
                        className={getButtonClassName({ variant: "profile", className: "w-full justify-start rounded-[22px] bg-white/[0.03] px-5" })}
                      >
                        Modifica profilo
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setProfileOpen(false)
                          navigate(effectiveRole === "admin" ? "/shop/admin" : "/shop/profile")
                        }}
                        className={getButtonClassName({ variant: "profile", className: "w-full justify-start rounded-[22px] bg-white/[0.03] px-5" })}
                      >
                        {effectiveRole === "admin" ? "Gestisci negozio" : "I miei ordini"}
                      </button>
                      {user.role === "admin" ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (isGuestPreview) {
                              disableGuestPreview()
                            } else {
                              enableGuestPreview()
                            }
                            setProfileOpen(false)
                          }}
                          className={getButtonClassName({ variant: "profile", className: "w-full justify-start rounded-[22px] bg-white/[0.03] px-5" })}
                        >
                          {isGuestPreview ? "Torna admin" : "Vedi come ospite"}
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-white/45">Username</p>
                            <p className="mt-2 text-base font-medium text-white">{displayUsername}</p>
                          </div>
                        </div>
                        <form onSubmit={(event) => submitProfileUpdate("username", event)} className="mt-4 space-y-3">
                          <input
                            className="shop-input"
                            placeholder="Username"
                            value={profileForms.username}
                            onChange={(event) => setProfileForms({ ...profileForms, username: event.target.value })}
                            required
                          />
                          {profileError && profileEditField === "username" ? <p className="text-sm text-red-300">{profileError}</p> : null}
                          <Button
                            type="submit"
                            className="w-full"
                            onClick={() => setProfileEditField("username")}
                          >
                            {profileSubmitting && profileEditField === "username" ? "Salvataggio..." : "Salva username"}
                          </Button>
                        </form>
                      </div>

                      <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-5">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-white/45">Email</p>
                          <p className="mt-2 text-base font-medium text-white">{user.email}</p>
                        </div>
                        <form onSubmit={(event) => submitProfileUpdate("email", event)} className="mt-4 space-y-3">
                          <input
                            className="shop-input"
                            type="email"
                            placeholder="Nuova email"
                            value={profileForms.email}
                            onChange={(event) => setProfileForms({ ...profileForms, email: event.target.value })}
                            required
                          />
                          <input
                            className="shop-input"
                            type="password"
                            placeholder="Password attuale"
                            value={profileForms.currentPassword}
                            onChange={(event) => setProfileForms({ ...profileForms, currentPassword: event.target.value })}
                            required
                          />
                          {profileError && profileEditField === "email" ? <p className="text-sm text-red-300">{profileError}</p> : null}
                          <Button
                            type="submit"
                            className="w-full"
                            onClick={() => setProfileEditField("email")}
                          >
                            {profileSubmitting && profileEditField === "email" ? "Salvataggio..." : "Salva email"}
                          </Button>
                        </form>
                      </div>

                      <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-5">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-white/45">Password</p>
                          <p className="mt-2 text-base font-medium text-white">••••••••</p>
                        </div>
                        <form onSubmit={(event) => submitProfileUpdate("password", event)} className="mt-4 space-y-3">
                          <input
                            className="shop-input"
                            type="password"
                            placeholder="Password attuale"
                            value={profileForms.currentPassword}
                            onChange={(event) => setProfileForms({ ...profileForms, currentPassword: event.target.value })}
                            required
                          />
                          <input
                            className="shop-input"
                            type="password"
                            placeholder="Nuova password"
                            value={profileForms.newPassword}
                            onChange={(event) => setProfileForms({ ...profileForms, newPassword: event.target.value })}
                            minLength={8}
                            required
                          />
                          <input
                            className="shop-input"
                            type="password"
                            placeholder="Conferma nuova password"
                            value={profileForms.confirmPassword}
                            onChange={(event) => setProfileForms({ ...profileForms, confirmPassword: event.target.value })}
                            minLength={8}
                            required
                          />
                          {profileError && profileEditField === "password" ? <p className="text-sm text-red-300">{profileError}</p> : null}
                          <Button
                            type="submit"
                            className="w-full"
                            onClick={() => setProfileEditField("password")}
                          >
                            {profileSubmitting && profileEditField === "password" ? "Salvataggio..." : "Salva password"}
                          </Button>
                        </form>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full"
                        onClick={() => {
                          setProfileLoggedStep("overview")
                          setProfileEditField(null)
                          setProfileError("")
                        }}
                      >
                        Annulla
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {profileView === "initial" ? (
                    <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                      <p className="text-sm text-white/65">
                        Entra nel tuo account per checkout piu rapido, storico ordini e area personale.
                      </p>
                      <div className="mt-5 flex flex-col gap-3">
                        <Button className="w-full" onClick={() => setProfileStep("login")}>
                          Accedi
                        </Button>
                        <Button variant="ghost" className="w-full" onClick={() => setProfileStep("register")}>
                          Crea account
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  {profileView === "login" ? (
                    <form onSubmit={submitProfileLogin} className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                      <div className="space-y-4">
                        <div>
                          <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/45">Email o username</label>
                          <input
                            className="shop-input"
                            placeholder="Email o username"
                            value={loginForm.identifier}
                            onChange={(event) => setLoginForm({ ...loginForm, identifier: event.target.value })}
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/45">Password</label>
                          <input
                            className="shop-input"
                            type="password"
                            placeholder="Password"
                            value={loginForm.password}
                            onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
                            minLength={8}
                            required
                          />
                        </div>
                        <p className="text-xs text-white/45">Puoi accedere con email o username.</p>
                        {profileError ? <p className="text-sm text-red-300">{profileError}</p> : null}
                        <div className="flex flex-col gap-3">
                          <Button type="submit" className="w-full">
                            {profileSubmitting ? "Accesso in corso..." : "Accedi"}
                          </Button>
                          <Button type="button" variant="ghost" className="w-full" onClick={() => setProfileStep("initial")}>
                            Indietro
                          </Button>
                        </div>
                      </div>
                    </form>
                  ) : null}

                  {profileView === "register" ? (
                    <div className="min-h-0 flex flex-1 flex-col overflow-hidden">
                      <form
                        id="mobile-register-form"
                        onSubmit={submitProfileRegister}
                        className="min-h-0 flex-1 overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03] p-5"
                      >
                        <div className={`${mobileScrollablePanelClass} h-full space-y-4 pr-1`}>
                          <div>
                            <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/45">Username</label>
                            <input
                              className="shop-input"
                              placeholder="Username"
                              value={registerForm.username}
                              onChange={(event) => setRegisterForm({ ...registerForm, username: event.target.value })}
                            />
                          </div>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <input
                              className="shop-input"
                              placeholder="Nome"
                              value={registerForm.firstName}
                              onChange={(event) => setRegisterForm({ ...registerForm, firstName: event.target.value })}
                              required
                            />
                            <input
                              className="shop-input"
                              placeholder="Cognome"
                              value={registerForm.lastName}
                              onChange={(event) => setRegisterForm({ ...registerForm, lastName: event.target.value })}
                              required
                            />
                          </div>
                          <input
                            className="shop-input"
                            type="email"
                            placeholder="Email"
                            value={registerForm.email}
                            onChange={(event) => setRegisterForm({ ...registerForm, email: event.target.value })}
                            required
                          />
                          <input
                            className="shop-input"
                            type="password"
                            placeholder="Password"
                            value={registerForm.password}
                            onChange={(event) => setRegisterForm({ ...registerForm, password: event.target.value })}
                            minLength={8}
                            required
                          />
                          <input
                            className="shop-input"
                            type="password"
                            placeholder="Conferma password"
                            value={registerForm.confirmPassword}
                            onChange={(event) => setRegisterForm({ ...registerForm, confirmPassword: event.target.value })}
                            minLength={8}
                            required
                          />
                          <p className="text-xs text-white/45">Lo username viene salvato davvero nel tuo account ed è disponibile anche per il login.</p>
                          {profileError ? <p className="text-sm text-red-300">{profileError}</p> : null}
                        </div>
                      </form>
                    </div>
                  ) : null}
                </>
              )}
            </MobileSheet>
          ) : (
            <Fragment>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={overlayTransition}
                className="fixed inset-0 z-40 bg-black/45 backdrop-blur-sm"
              />

              <motion.aside
                ref={profileRef}
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 18 }}
                transition={drawerTransition}
                className="fixed inset-y-0 right-0 top-0 z-50 w-full max-w-md overflow-hidden border border-white/10 border-b-0 border-l bg-[#0b0b0c]/96 p-5 shadow-[0_20px_80px_rgba(0,0,0,.45)] backdrop-blur-2xl will-change-transform"
              >
                <div className="flex h-full min-h-0 flex-col">
                  <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-white/45">Profilo shop</p>
                      <h2 className="mt-3 text-2xl font-semibold text-white">
                        {profileView === "logged" ? `Ciao, ${displayUsername}` : "Accedi o crea un account"}
                      </h2>
                      <p className="mt-2 text-sm text-white/60">
                        {profileView === "logged"
                          ? "Gestisci i tuoi dati, aggiorna il profilo e controlla i tuoi ordini."
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

                  <div className="min-h-0 flex-1 space-y-5 overflow-y-auto py-6" onWheelCapture={containWheel}>
                    {loading ? (
                      <div className="rounded-[24px] border border-white/10 bg-white/[0.03] px-5 py-6 text-sm text-white/60">
                        Caricamento account...
                      </div>
                    ) : profileView === "logged" && user ? (
                      <>
                        {profileLoggedStep === "overview" ? (
                          <div className="grid gap-3">
                            <button
                              type="button"
                              onClick={() => setProfileLoggedStep("edit")}
                              className={getButtonClassName({ variant: "profile", className: "w-full justify-start rounded-[22px] bg-white/[0.03] px-5" })}
                            >
                              Modifica profilo
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setProfileOpen(false)
                                navigate(effectiveRole === "admin" ? "/shop/admin" : "/shop/profile")
                              }}
                              className={getButtonClassName({ variant: "profile", className: "w-full justify-start rounded-[22px] bg-white/[0.03] px-5" })}
                            >
                              {effectiveRole === "admin" ? "Gestisci negozio" : "I miei ordini"}
                            </button>
                            {user.role === "admin" ? (
                              <button
                                type="button"
                                onClick={() => {
                                  if (isGuestPreview) {
                                    disableGuestPreview()
                                  } else {
                                    enableGuestPreview()
                                  }
                                  setProfileOpen(false)
                                }}
                                className={getButtonClassName({ variant: "profile", className: "w-full justify-start rounded-[22px] bg-white/[0.03] px-5" })}
                              >
                                {isGuestPreview ? "Torna admin" : "Vedi come ospite"}
                              </button>
                            ) : null}
                          </div>
                        ) : (
                          <div className="grid gap-3">
                            <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-5">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <p className="text-xs uppercase tracking-[0.2em] text-white/45">Username</p>
                                  <p className="mt-2 text-base font-medium text-white">{displayUsername}</p>
                                </div>
                              </div>
                              <form onSubmit={(event) => submitProfileUpdate("username", event)} className="mt-4 space-y-3">
                                <input
                                  className="shop-input"
                                  placeholder="Username"
                                  value={profileForms.username}
                                  onChange={(event) => setProfileForms({ ...profileForms, username: event.target.value })}
                                  required
                                />
                                {profileError && profileEditField === "username" ? <p className="text-sm text-red-300">{profileError}</p> : null}
                                <Button
                                  type="submit"
                                  className="w-full"
                                  onClick={() => setProfileEditField("username")}
                                >
                                  {profileSubmitting && profileEditField === "username" ? "Salvataggio..." : "Salva username"}
                                </Button>
                              </form>
                            </div>

                            <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-5">
                              <div>
                                <p className="text-xs uppercase tracking-[0.2em] text-white/45">Email</p>
                                <p className="mt-2 text-base font-medium text-white">{user.email}</p>
                              </div>
                              <form onSubmit={(event) => submitProfileUpdate("email", event)} className="mt-4 space-y-3">
                                <input
                                  className="shop-input"
                                  type="email"
                                  placeholder="Nuova email"
                                  value={profileForms.email}
                                  onChange={(event) => setProfileForms({ ...profileForms, email: event.target.value })}
                                  required
                                />
                                <input
                                  className="shop-input"
                                  type="password"
                                  placeholder="Password attuale"
                                  value={profileForms.currentPassword}
                                  onChange={(event) => setProfileForms({ ...profileForms, currentPassword: event.target.value })}
                                  required
                                />
                                {profileError && profileEditField === "email" ? <p className="text-sm text-red-300">{profileError}</p> : null}
                                <Button
                                  type="submit"
                                  className="w-full"
                                  onClick={() => setProfileEditField("email")}
                                >
                                  {profileSubmitting && profileEditField === "email" ? "Salvataggio..." : "Salva email"}
                                </Button>
                              </form>
                            </div>

                            <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-5">
                              <div>
                                <p className="text-xs uppercase tracking-[0.2em] text-white/45">Password</p>
                                <p className="mt-2 text-base font-medium text-white">••••••••</p>
                              </div>
                              <form onSubmit={(event) => submitProfileUpdate("password", event)} className="mt-4 space-y-3">
                                <input
                                  className="shop-input"
                                  type="password"
                                  placeholder="Password attuale"
                                  value={profileForms.currentPassword}
                                  onChange={(event) => setProfileForms({ ...profileForms, currentPassword: event.target.value })}
                                  required
                                />
                                <input
                                  className="shop-input"
                                  type="password"
                                  placeholder="Nuova password"
                                  value={profileForms.newPassword}
                                  onChange={(event) => setProfileForms({ ...profileForms, newPassword: event.target.value })}
                                  minLength={8}
                                  required
                                />
                                <input
                                  className="shop-input"
                                  type="password"
                                  placeholder="Conferma nuova password"
                                  value={profileForms.confirmPassword}
                                  onChange={(event) => setProfileForms({ ...profileForms, confirmPassword: event.target.value })}
                                  minLength={8}
                                  required
                                />
                                {profileError && profileEditField === "password" ? <p className="text-sm text-red-300">{profileError}</p> : null}
                                <Button
                                  type="submit"
                                  className="w-full"
                                  onClick={() => setProfileEditField("password")}
                                >
                                  {profileSubmitting && profileEditField === "password" ? "Salvataggio..." : "Salva password"}
                                </Button>
                              </form>
                            </div>

                            <Button
                              type="button"
                              variant="ghost"
                              className="w-full"
                              onClick={() => {
                                setProfileLoggedStep("overview")
                                setProfileEditField(null)
                                setProfileError("")
                              }}
                            >
                              Annulla
                            </Button>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {profileView === "initial" ? (
                          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                            <p className="text-sm text-white/65">
                              Entra nel tuo account per checkout piu rapido, storico ordini e area personale.
                            </p>
                            <div className="mt-5 flex flex-col gap-3">
                              <Button className="w-full" onClick={() => setProfileStep("login")}>
                                Accedi
                              </Button>
                              <Button variant="ghost" className="w-full" onClick={() => setProfileStep("register")}>
                                Crea account
                              </Button>
                            </div>
                          </div>
                        ) : null}

                        {profileView === "login" ? (
                          <form onSubmit={submitProfileLogin} className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                            <div className="space-y-4">
                              <div>
                                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/45">Email o username</label>
                                <input
                                  className="shop-input"
                                  placeholder="Email o username"
                                  value={loginForm.identifier}
                                  onChange={(event) => setLoginForm({ ...loginForm, identifier: event.target.value })}
                                />
                              </div>
                              <div>
                                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/45">Password</label>
                                <input
                                  className="shop-input"
                                  type="password"
                                  placeholder="Password"
                                  value={loginForm.password}
                                  onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
                                  minLength={8}
                                  required
                                />
                              </div>
                              <p className="text-xs text-white/45">Puoi accedere con email o username.</p>
                              {profileError ? <p className="text-sm text-red-300">{profileError}</p> : null}
                              <div className="flex flex-col gap-3">
                                <Button type="submit" className="w-full">
                                  {profileSubmitting ? "Accesso in corso..." : "Accedi"}
                                </Button>
                                <Button type="button" variant="ghost" className="w-full" onClick={() => setProfileStep("initial")}>
                                  Indietro
                                </Button>
                              </div>
                            </div>
                          </form>
                        ) : null}

                        {profileView === "register" ? (
                          <form onSubmit={submitProfileRegister} className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                            <div className="space-y-4">
                              <div>
                                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/45">Username</label>
                                <input
                                  className="shop-input"
                                  placeholder="Username"
                                  value={registerForm.username}
                                  onChange={(event) => setRegisterForm({ ...registerForm, username: event.target.value })}
                                />
                              </div>
                              <div className="grid gap-4 sm:grid-cols-2">
                                <input
                                  className="shop-input"
                                  placeholder="Nome"
                                  value={registerForm.firstName}
                                  onChange={(event) => setRegisterForm({ ...registerForm, firstName: event.target.value })}
                                  required
                                />
                                <input
                                  className="shop-input"
                                  placeholder="Cognome"
                                  value={registerForm.lastName}
                                  onChange={(event) => setRegisterForm({ ...registerForm, lastName: event.target.value })}
                                  required
                                />
                              </div>
                              <input
                                className="shop-input"
                                type="email"
                                placeholder="Email"
                                value={registerForm.email}
                                onChange={(event) => setRegisterForm({ ...registerForm, email: event.target.value })}
                                required
                              />
                              <input
                                className="shop-input"
                                type="password"
                                placeholder="Password"
                                value={registerForm.password}
                                onChange={(event) => setRegisterForm({ ...registerForm, password: event.target.value })}
                                minLength={8}
                                required
                              />
                              <input
                                className="shop-input"
                                type="password"
                                placeholder="Conferma password"
                                value={registerForm.confirmPassword}
                                onChange={(event) => setRegisterForm({ ...registerForm, confirmPassword: event.target.value })}
                                minLength={8}
                                required
                              />
                              <p className="text-xs text-white/45">Lo username viene salvato davvero nel tuo account ed è disponibile anche per il login.</p>
                              {profileError ? <p className="text-sm text-red-300">{profileError}</p> : null}
                              <div className="flex flex-col gap-3">
                                <Button type="submit" className="w-full">
                                  {profileSubmitting ? "Creazione account..." : "Crea account"}
                                </Button>
                                <Button type="button" variant="ghost" className="w-full" onClick={() => setProfileStep("initial")}>
                                  Indietro
                                </Button>
                              </div>
                            </div>
                          </form>
                        ) : null}
                      </>
                    )}
                  </div>

                  {profileView === "logged" && user ? (
                    <button
                      type="button"
                      onClick={() => {
                        logout()
                        setProfileOpen(false)
                        setCartOpen(false)
                        setSearchOpen(false)
                        navigate("/?profile=open")
                      }}
                      className={getButtonClassName({ variant: "cart", className: "w-full" })}
                    >
                      Logout
                    </button>
                  ) : null}
                </div>
              </motion.aside>
            </Fragment>
          )
        ) : null}
      </AnimatePresence>

      <div className="h-[76px] md:h-[92px]" />
    </>
  )
}
