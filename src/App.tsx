import { useEffect, useRef } from "react"
import Lenis from "lenis"
import { Routes, Route, useLocation, useNavigate } from "react-router-dom"

import { Navbar } from "./components/Navbar"
import { BackToTop } from "./components/BackToTop"
import { Noise } from "./components/Noise"
import { Backdrop } from "./components/Backdrop"
import { TopPromoBar } from "./components/TopPromoBar"
import { ShippingBar } from "./components/ShippingBar"
import { CookieBanner } from "./components/CookieBanner"

import { Hero } from "./sections/Hero"
import { HomeShop } from "./sections/HomeShop"
import { Testimonials } from "./sections/Testimonials"
import { Footer } from "./sections/Footer"

import { CaseStudyPage } from "./pages/CaseStudyPage"
import { AboutPage } from "./pages/AboutPage"
import { AboutMePage } from "./pages/AboutMePage"
import { PrivacyPolicyPage } from "./pages/PrivacyPolicyPage"

import { ShopAuthProvider } from "./shop/context/ShopAuthProvider"
import { ShopCartProvider } from "./shop/context/ShopCartProvider"
import { ShopPage } from "./shop/pages/ShopPage"
import { ShopOffersPage } from "./shop/pages/ShopOffersPage"
import { ShopProductPage } from "./shop/pages/ShopProductPage"
import { ShopCartPage } from "./shop/pages/ShopCartPage"
import { ShopAuthPage } from "./shop/pages/ShopAuthPage"
import { ShopRegisterPage } from "./shop/pages/ShopRegisterPage"
import { ShopCheckoutPage } from "./shop/pages/ShopCheckoutPage"
import { ShopProfilePage } from "./shop/pages/ShopProfilePage"
import { ShopReceiptPage } from "./shop/pages/ShopReceiptPage"
import { ShopAdminPage } from "./shop/pages/ShopAdminPage"
import { ShopPaypalReturnPage } from "./shop/pages/ShopPaypalReturnPage"
import { ShopMockTrackingPage } from "./shop/pages/ShopMockTrackingPage"
import { ShopAdminRoute, ShopCustomerRoute, ShopProtectedRoute } from "./shop/components/ShopProtectedRoute"
import { apiFetch } from "./shop/lib/api"
import { clearHomeReturnState, readHomeReturnState } from "./shop/lib/home-return.mjs"

declare global {
  interface Window {
    __lenis?: Lenis
  }
}

function Home() {
  const location = useLocation()

  useEffect(() => {
    const state = location.state as { restoreHomeFromShop?: boolean; restoreHomeScrollY?: number } | null
    const stored = readHomeReturnState()
    const nextY = Number.isFinite(state?.restoreHomeScrollY) ? Number(state?.restoreHomeScrollY) : stored?.homeScrollY
    const storedIsFresh = Boolean(stored?.savedAt && Date.now() - stored.savedAt < 15000)
    const shouldRestore = Boolean(state?.restoreHomeFromShop) || (storedIsFresh && Number.isFinite(nextY))

    if (!shouldRestore || !Number.isFinite(nextY)) {
      return
    }

    requestAnimationFrame(() => {
      window.scrollTo(0, nextY)
      window.__lenis?.scrollTo(nextY, { immediate: true } as any)
      clearHomeReturnState()
    })
  }, [location.key, location.state])

  return (
    <main id="top">
      <Hero />
      <HomeShop />
    </main>
  )
}

export default function App() {
  const navigate = useNavigate()
  const location = useLocation()

  const lenisRef = useRef<Lenis | null>(null)
  const rafRef = useRef<number>(0)

  const pathnameRef = useRef(location.pathname)
  useEffect(() => {
    pathnameRef.current = location.pathname
  }, [location.pathname])

  const OFFSET = -92

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.1,
      smoothWheel: true,
      smoothTouch: false,
    } as any)

    lenisRef.current = lenis
    window.__lenis = lenis

    const loop = (time: number) => {
      lenis.raf(time)
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)

    // Smooth scroll SOLO per anchor #... quando sei in HOME
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return
      if ((e as any).button !== 0) return
      if ((e as any).metaKey || (e as any).ctrlKey || (e as any).shiftKey || (e as any).altKey) return

      const target = e.target as HTMLElement | null
      if (!target) return

      const a = target.closest('a[href^="#"], a[href^="/#"]') as HTMLAnchorElement | null
      if (!a) return

      const href = a.getAttribute("href") || ""
      const hash = href.startsWith("/#") ? href.slice(1) : href
      if (!hash.startsWith("#")) return

      // Se NON sei in home, vai in home con hash
      if (pathnameRef.current !== "/") {
        e.preventDefault()
        navigate(`/${hash}`)
        return
      }

      const id = hash.replace("#", "")
      if (!id) return

      const el = document.getElementById(id)
      if (!el) return

      e.preventDefault()
      lenis.scrollTo(el, { offset: OFFSET, duration: 1.15 })
      history.pushState(null, "", `#${id}`)
    }

    document.addEventListener("click", onClick)

    return () => {
      document.removeEventListener("click", onClick)
      cancelAnimationFrame(rafRef.current)
      lenis.destroy()
      lenisRef.current = null
      delete window.__lenis
    }
  }, [navigate])

  useEffect(() => {
    const lenis = lenisRef.current
    if (!lenis) return
    if (location.pathname !== "/") return
    if (!location.hash) return

    const id = location.hash.replace("#", "")
    if (!id) return

    let tries = 0
    const tryScroll = () => {
      const el = document.getElementById(id)
      if (el) {
        lenis.scrollTo(el, { offset: OFFSET, duration: 1.15 })
        return
      }
      tries += 1
      if (tries < 10) requestAnimationFrame(tryScroll)
    }

    requestAnimationFrame(tryScroll)
  }, [location.pathname, location.hash])

  useEffect(() => {
    if (location.hash) return

    const lenis = lenisRef.current
    if (lenis) {
      lenis.scrollTo(0, { immediate: true })
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" })
    }
  }, [location.pathname, location.hash])

  useEffect(() => {
    apiFetch("/metrics/page-view", {
      method: "POST",
      body: JSON.stringify({ path: location.pathname }),
    }).catch(() => undefined)
  }, [location.pathname])

  return (
    <ShopAuthProvider>
      <ShopCartProvider>
        <div
          className="min-h-screen overflow-x-hidden bg-ink text-white"
          style={{ ["--global-top-bars-h" as any]: "80px" } as any}
        >
          <Backdrop />
          <Noise />
          <TopPromoBar />
          <ShippingBar />
          <Navbar />

          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/chi-siamo" element={<AboutPage />} />
            <Route path="/chi-sono" element={<AboutMePage />} />
            <Route path="/case/:slug" element={<CaseStudyPage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/shop/offerte" element={<ShopOffersPage />} />
            <Route path="/shop/:slug" element={<ShopProductPage />} />
            <Route path="/shop/cart" element={<ShopCartPage />} />
            <Route path="/shop/auth" element={<ShopAuthPage />} />
            <Route path="/shop/register" element={<ShopRegisterPage />} />
            <Route path="/shop/account" element={<ShopRegisterPage />} />
            {import.meta.env.DEV ? <Route path="/shop/tracking/mock/:trackingNumber" element={<ShopMockTrackingPage />} /> : null}
            <Route
              path="/shop/checkout"
              element={
                <ShopCustomerRoute>
                  <ShopCheckoutPage />
                </ShopCustomerRoute>
              }
            />
            <Route
              path="/shop/profile"
              element={
                <ShopProtectedRoute>
                  <ShopProfilePage />
                </ShopProtectedRoute>
              }
            />
            <Route
              path="/shop/orders/:orderReference"
              element={
                <ShopProtectedRoute>
                  <ShopReceiptPage />
                </ShopProtectedRoute>
              }
            />
            <Route
              path="/shop/paypal-return"
              element={
                <ShopCustomerRoute>
                  <ShopPaypalReturnPage />
                </ShopCustomerRoute>
              }
            />
            <Route
              path="/shop/admin"
              element={
                <ShopAdminRoute>
                  <ShopAdminPage />
                </ShopAdminRoute>
              }
            />
          </Routes>

          {location.pathname === "/" ? <Testimonials /> : null}

          <Footer />

          <BackToTop />
          <CookieBanner />
        </div>
      </ShopCartProvider>
    </ShopAuthProvider>
  )
}
