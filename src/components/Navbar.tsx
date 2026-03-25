import React, { useEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Container } from "./Container"
import { Logo } from "./Logo"
import { Button } from "./Button"

const BRAND = "#e3f503"

const links = [
  { label: "Shop", href: "/shop", key: "shop" },
  { label: "Servizi", href: "#servizi", key: "servizi" },
  { label: "Lavori", href: "#portfolio", key: "portfolio" },
  { label: "Prezzi", href: "#prezzi", key: "prezzi" },
  { label: "Risorse", href: "#risorse", key: "risorse" },
  { label: "Helper 24/7", href: "#helper", key: "helper" },
] as const

type MegaKey = "servizi" | "risorse" | "helper"
type MegaItem = { title: string; desc: string; href?: string; onClick?: () => void }
type MegaGroup = { heading: string; items: MegaItem[] }

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max)
}

function useOutsideClick(ref: React.RefObject<HTMLElement>, onClose: () => void) {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const el = ref.current
      if (!el) return
      if (!el.contains(e.target as Node)) onClose()
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [ref, onClose])
}

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

function MegaMenu({
  open,
  groups,
  anchor,
  onClose,
  onEnter,
}: {
  open: boolean
  groups: MegaGroup[]
  anchor: DOMRect | null
  onClose: () => void
  onEnter?: () => void
}) {
  const isSingle = groups.length <= 1
  const width = isSingle ? 520 : 820
  const pad = 22

  const left =
    typeof window === "undefined"
      ? 0
      : anchor
        ? clamp(anchor.left + anchor.width / 2 - width / 2, pad, window.innerWidth - width - pad)
        : (window.innerWidth - width) / 2

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.985 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="fixed z-[60]"
          style={{
            left,
            width,
            top: "calc(var(--nav-h, 80px) + 10px)",
          }}
          onMouseEnter={onEnter}
          onMouseLeave={onClose}
        >
          <div className="relative overflow-hidden rounded-2xl border border-white/10 shadow-[0_20px_80px_rgba(0,0,0,.45)]">
            <div className="absolute inset-0 backdrop-blur-xl backdrop-saturate-125" />
            <div className="absolute inset-0 bg-white/[0.03]" />
            <div
              className="absolute -top-32 left-16 h-56 w-96 rounded-full blur-3xl opacity-10"
              style={{ background: BRAND }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-black/10" />
            <div className="absolute inset-0 ring-1 ring-white/10" />

            <div className="relative">
              <div className={isSingle ? "grid md:grid-cols-1" : "grid md:grid-cols-2"}>
                {groups.map((g, idx) => (
                  <div
                    key={g.heading}
                    className={["p-6 md:p-7", !isSingle && idx === 0 ? "md:border-r border-white/10" : ""].join(" ")}
                  >
                    <div className="text-xs tracking-[.22em] uppercase text-white/60">{g.heading}</div>

                    <div className="mt-4 space-y-2">
                      {g.items.map((it) => {
                        const Content = (
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-base font-medium text-white/95 group-hover:text-white truncate">
                                {it.title}
                              </div>
                              <div className="mt-1 text-sm text-white/70 group-hover:text-white/80">{it.desc}</div>
                            </div>
                            <span className="text-white/30 group-hover:text-[#e3f503] transition">↗</span>
                          </div>
                        )

                        if (it.onClick) {
                          return (
                            <button
                              key={it.title}
                              type="button"
                              onClick={() => {
                                it.onClick?.()
                                onClose()
                              }}
                              className="group w-full text-left block rounded-xl px-3 py-3 hover:bg-white/[0.06] transition"
                            >
                              {Content}
                            </button>
                          )
                        }

                        return (
                          <a
                            key={it.title}
                            href={it.href || "#"}
                            onClick={onClose}
                            className="group block rounded-xl px-3 py-3 hover:bg-white/[0.06] transition"
                          >
                            {Content}
                          </a>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-[#e3f503]/18 to-transparent" />
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [openMobile, setOpenMobile] = useState(false)
  const [active, setActive] = useState<null | { key: MegaKey; rect: DOMRect }>(null)

  const wrapRef = useRef<HTMLDivElement>(null)
  useOutsideClick(wrapRef, () => setActive(null))

  const closeTimer = useRef<number | null>(null)
  const navH = 80

  const scheduleClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current)
    closeTimer.current = window.setTimeout(() => setActive(null), 160)
  }

  const cancelClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current)
    closeTimer.current = null
  }

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

  useEffect(() => {
    if (!active) return
    const update = () => {
      const el = document.querySelector(`[data-mega="${active.key}"]`) as HTMLElement | null
      if (!el) return
      setActive({ key: active.key, rect: el.getBoundingClientRect() })
    }
    window.addEventListener("resize", update)
    window.addEventListener("scroll", update, { passive: true })
    return () => {
      window.removeEventListener("resize", update)
      window.removeEventListener("scroll", update)
    }
  }, [active])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const openHelperChat = () => {
    setActive(null)
    setOpenMobile(false)
    window.dispatchEvent(new Event("bns:open-helper-chat"))
  }

  const mega = useMemo(() => {
    return {
      servizi: [
        {
          heading: "Soluzioni",
          items: [
            { title: "Brand Identity", desc: "Logo, palette, kit social.", href: "#servizi" },
            { title: "Web Design", desc: "UI + sviluppo, performance e SEO.", href: "#servizi" },
            { title: "Gadget e stampe", desc: "Materiali fisici pronti per la stampa.", href: "#servizi" },
          ],
        },
      ] satisfies MegaGroup[],

      risorse: [
        {
          heading: "Strumenti",
          items: [
            { title: "Curriculum Vitae", desc: "Scarica il CV in PDF.", href: "#risorse" },
            { title: "Portfolio", desc: "Scarica il portfolio in PDF.", href: "#risorse" },
          ],
        },
      ] satisfies MegaGroup[],

      helper: [
        {
          heading: "Supporto",
          items: [
            { title: "Cloud", desc: "Chat attiva H24.", onClick: openHelperChat },
            { title: "FAQ", desc: "Le domande più richieste.", href: "#faq" },
            { title: "Contatti", desc: "Due domande e partiamo.", href: "#contatti" },
          ],
        },
      ] satisfies MegaGroup[],
    }
  }, [])

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50" style={{ ["--nav-h" as any]: `${navH}px` } as any}>
        <div ref={wrapRef} className="relative" onMouseEnter={cancelClose} onMouseLeave={scheduleClose}>
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
                    setActive(null)
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
                    const hasMega = l.key === "servizi" || l.key === "risorse" || l.key === "helper"
                    const commonClass = "h-10 inline-flex items-center text-sm text-white/70 hover:text-white transition"

                    if (!hasMega) {
                      return (
                        <motion.a
                          key={l.key}
                          href={l.href}
                          initial="rest"
                          animate="rest"
                          whileHover="hover"
                          whileTap="hover"
                          className={commonClass}
                          onMouseEnter={() => setActive(null)}
                          onFocus={() => setActive(null)}
                          onClick={() => setActive(null)}
                        >
                          <NavFlip label={l.label} />
                        </motion.a>
                      )
                    }

                    const isActive = active?.key === (l.key as MegaKey)

                    return (
                      <motion.button
                        key={l.key}
                        type="button"
                        data-mega={l.key}
                        initial="rest"
                        animate="rest"
                        whileHover="hover"
                        whileTap="hover"
                        onMouseEnter={(e) => {
                          cancelClose()
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                          setActive({ key: l.key as MegaKey, rect })
                        }}
                        onFocus={(e) => {
                          cancelClose()
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                          setActive({ key: l.key as MegaKey, rect })
                        }}
                        onClick={(e) => {
                          cancelClose()
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                          setActive((prev) => (prev?.key === l.key ? null : { key: l.key as MegaKey, rect }))
                        }}
                        className={[commonClass, "p-0 m-0 bg-transparent border-0 outline-none"].join(" ")}
                      >
                        <span className="inline-flex items-center gap-2">
                          <NavFlip label={l.label} />
                          <span className={isActive ? "text-[#e3f503]" : "text-white/40"}>▾</span>
                        </span>
                      </motion.button>
                    )
                  })}
                </nav>

                {/* ✅ DESKTOP ACTIONS IDENTICHE | MOBILE: nascoste */}
                <div className="hidden md:flex items-center justify-end gap-3">
                  <Button href="#contatti" variant="ghost" size="sm" className="hidden sm:inline-flex">
                    Contatti
                  </Button>
                  <Button href="#prezzi" size="sm">
                    Richiedi un preventivo
                  </Button>
                </div>
              </motion.div>
            </Container>
          </div>

          {/* MEGA MENU (desktop) */}
          <div className="hidden md:block">
            <MegaMenu
              open={active?.key === "servizi"}
              groups={mega.servizi}
              anchor={active?.key === "servizi" ? active.rect : null}
              onClose={scheduleClose}
              onEnter={cancelClose}
            />
            <MegaMenu
              open={active?.key === "risorse"}
              groups={mega.risorse}
              anchor={active?.key === "risorse" ? active.rect : null}
              onClose={scheduleClose}
              onEnter={cancelClose}
            />
            <MegaMenu
              open={active?.key === "helper"}
              groups={mega.helper}
              anchor={active?.key === "helper" ? active.rect : null}
              onClose={scheduleClose}
              onEnter={cancelClose}
            />
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
                      if (l.key === "helper") {
                        return (
                          <button
                            key={l.key}
                            type="button"
                            onClick={openHelperChat}
                            className="w-full text-left block rounded-xl px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5 transition"
                          >
                            {l.label}
                          </button>
                        )
                      }

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
                      <Button href="#contatti" variant="ghost" className="w-full" onClick={() => setOpenMobile(false)}>
                        Contatti
                      </Button>
                      <Button href="#prezzi" className="w-full" onClick={() => setOpenMobile(false)}>
                        Preventivo
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
