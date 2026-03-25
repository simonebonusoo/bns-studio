import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Link } from "react-router-dom"
import { ShoppingBagIcon, UserIcon } from "@heroicons/react/24/outline"
import { Container } from "./Container"
import { Logo } from "./Logo"
import { useShopAuth } from "../shop/context/ShopAuthProvider"
import { useShopCart } from "../shop/context/ShopCartProvider"

const links = [
  { label: "Home", href: "#top", key: "home" },
  { label: "Shop", href: "#shop", key: "shop" },
  { label: "Catalogo", href: "/shop", key: "catalog" },
] as const

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
  const [openMobile, setOpenMobile] = useState(false)
  const navH = 80
  const { user } = useShopAuth()
  const { items } = useShopCart()
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    if (!openMobile) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [openMobile])

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
              <motion.div
                initial={{ y: -12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative z-20 h-16 md:h-20 grid grid-cols-[auto_1fr_auto] items-center gap-4"
              >
                {/* LOGO */}
                <a
                  href="#top"
                  onClick={() => {
                    setOpenMobile(false)
                  }}
                  aria-label="Vai all'inizio"
                  className={[
                    "no-underline flex items-center",
                    // ✅ DESKTOP: identico
                    "md:static md:justify-start md:w-auto",
                    // ✅ MOBILE: centro perfetto
                    "absolute left-1/2 -translate-x-1/2 md:translate-x-0",
                  ].join(" ")}
                >
                  <div className="scale-110 md:scale-100">
                    <Logo />
                  </div>
                </a>

                {/* NAV DESKTOP (immutata) */}
                <nav className="hidden md:flex items-center justify-center gap-7">
                  {links.map((l) => {
                    const commonClass = "h-10 inline-flex items-center text-sm text-white/70 hover:text-white transition"

                    return (
                      <motion.a
                        key={l.key}
                        href={l.href}
                        initial="rest"
                        animate="rest"
                        whileHover="hover"
                        whileTap="hover"
                        className={commonClass}
                      >
                        <NavFlip label={l.label} />
                      </motion.a>
                    )
                  })}
                </nav>

                <div className="flex items-center justify-end gap-2 md:gap-3">
                  <Link
                    to={user ? "/shop/profile" : "/shop/auth"}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-sm text-white/75 transition hover:border-white/25 hover:text-white md:px-4"
                  >
                    <UserIcon className="h-4 w-4" />
                    <span className="hidden md:inline">{user ? "Profilo" : "Account"}</span>
                  </Link>
                  <Link
                    to="/shop/cart"
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-sm text-white/75 transition hover:border-white/25 hover:text-white md:px-4"
                  >
                    <ShoppingBagIcon className="h-4 w-4" />
                    <span className="hidden md:inline">Carrello</span>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white">{cartCount}</span>
                  </Link>
                </div>
              </motion.div>
            </Container>
          </div>

          {/* MOBILE MENU (resta ma non più apribile senza hamburger) */}
          <AnimatePresence>
            {openMobile ? (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="md:hidden border-b border-white/10 bg-black/70 backdrop-blur-xl"
              >
                <Container>
                  <div className="py-4 space-y-2">
                    {links.map((l) => {
                      return (
                        <a
                          key={l.key}
                          href={l.href}
                          onClick={() => setOpenMobile(false)}
                          className="block rounded-xl px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5 transition"
                        >
                          {l.label}
                        </a>
                      )
                    })}

                    <div className="pt-3 flex gap-3">
                      <Link
                        to={user ? "/shop/profile" : "/shop/auth"}
                        onClick={() => setOpenMobile(false)}
                        className="w-full rounded-xl border border-white/10 px-4 py-3 text-center text-sm text-white/80 transition hover:border-white/25 hover:text-white"
                      >
                        {user ? "Profilo" : "Account"}
                      </Link>
                      <Link
                        to="/shop/cart"
                        onClick={() => setOpenMobile(false)}
                        className="w-full rounded-xl border border-white/10 px-4 py-3 text-center text-sm text-white/80 transition hover:border-white/25 hover:text-white"
                      >
                        Carrello ({cartCount})
                      </Link>
                    </div>
                  </div>
                </Container>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </header>

      <div className="h-8 md:h-20" />
    </>
  )
}
