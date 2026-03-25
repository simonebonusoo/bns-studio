import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"

import { Container } from "./Container"
import { Logo } from "./Logo"
import { Button } from "./Button"
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

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [openMobile])

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-50" style={{ ["--nav-h" as any]: `${navH}px` } as any}>
        <div className="relative">
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-0"
            initial={false}
            animate={scrolled ? { opacity: 1 } : { opacity: 0 }}
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

          <div className={scrolled ? "bg-transparent" : "bg-black/15 backdrop-blur-sm"}>
            <Container>
              <motion.div
                initial={{ y: -12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative z-20 grid h-16 grid-cols-[auto_1fr_auto] items-center gap-4 md:h-20"
              >
                <a
                  href="#top"
                  onClick={() => setOpenMobile(false)}
                  aria-label="Vai all'inizio"
                  className="absolute left-1/2 flex -translate-x-1/2 items-center no-underline md:static md:w-auto md:translate-x-0 md:justify-start"
                >
                  <div className="scale-110 md:scale-100">
                    <Logo />
                  </div>
                </a>

                <nav className="hidden items-center justify-center gap-7 md:flex">
                  {links.map((link) => (
                    <motion.a
                      key={link.key}
                      href={link.href}
                      initial="rest"
                      animate="rest"
                      whileHover="hover"
                      whileTap="hover"
                      className="inline-flex h-10 items-center text-sm text-white/70 transition hover:text-white"
                    >
                      <NavFlip label={link.label} />
                    </motion.a>
                  ))}
                </nav>

                <div className="flex items-center justify-end gap-2 md:gap-3">
                  <Button
                    href={user ? "/shop/profile" : "/shop/auth"}
                    variant="ghost"
                    size="sm"
                    className="hidden sm:inline-flex"
                  >
                    Profilo
                  </Button>

                  <Button href="/shop/cart" size="sm" text={`Carrello${cartCount ? ` (${cartCount})` : ""}`}>
                    Carrello
                  </Button>
                </div>
              </motion.div>
            </Container>
          </div>

          <AnimatePresence>
            {openMobile ? (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="border-b border-white/10 bg-black/70 backdrop-blur-xl md:hidden"
              >
                <Container>
                  <div className="space-y-2 py-4">
                    {links.map((link) => (
                      <a
                        key={link.key}
                        href={link.href}
                        onClick={() => setOpenMobile(false)}
                        className="block rounded-xl px-3 py-2 text-sm text-white/80 transition hover:bg-white/5 hover:text-white"
                      >
                        {link.label}
                      </a>
                    ))}

                    <div className="flex gap-3 pt-3">
                      <Button
                        href={user ? "/shop/profile" : "/shop/auth"}
                        variant="ghost"
                        className="w-full"
                        onClick={() => setOpenMobile(false)}
                      >
                        Profilo
                      </Button>
                      <Button
                        href="/shop/cart"
                        className="w-full"
                        onClick={() => setOpenMobile(false)}
                        text={`Carrello${cartCount ? ` (${cartCount})` : ""}`}
                      >
                        Carrello
                      </Button>
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
