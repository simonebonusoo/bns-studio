import { useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"

// ✅ Icone "ufficiali" Heroicons
import {
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
  BriefcaseIcon,
  Squares2X2Icon,
  FolderOpenIcon,
  QuestionMarkCircleIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline"

// ✅ HOME piena + ALTRO (settings) piena
import { HomeIcon as HomeSolidIcon, Cog6ToothIcon as CogSolidIcon } from "@heroicons/react/24/solid"

const BRAND = "#e3f503"

type OpenKey = null | "altro"
type ActiveKey = "altro" | "home" | "chat"

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

function GlassDropdown({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 shadow-[0_18px_60px_rgba(0,0,0,.60)]">
      <div className="absolute inset-0 backdrop-blur-2xl backdrop-saturate-125" />
      <div className="absolute inset-0 bg-black/70" />
      <div className="absolute inset-0 bg-white/[0.03]" />
      <div
        className="absolute -top-24 left-10 h-48 w-80 rounded-full blur-3xl opacity-[0.08]"
        style={{ background: BRAND }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-black/55" />

      <div className="relative p-5">
        <div className="text-[11px] tracking-[.26em] uppercase text-white/55">{title}</div>
        <div className="mt-4 space-y-3">{children}</div>
      </div>
    </div>
  )
}

function DropItem({
  href,
  title,
  desc,
  icon,
  onSelect,
}: {
  href: string
  title: string
  desc: string
  icon: React.ReactNode
  onSelect: () => void
}) {
  return (
    <a
      href={href}
      onClick={onSelect}
      className={[
        "block rounded-2xl",
        "bg-black/35 border border-white/10",
        "hover:bg-white/[0.06] hover:border-white/20 transition",
        "px-4 py-4",
        "outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0",
      ].join(" ")}
      style={{ WebkitTapHighlightColor: "transparent" } as any}
    >
      <div className="flex items-center gap-4">
        <span className="h-11 w-11 rounded-2xl bg-white/[0.035] border border-white/10 flex items-center justify-center text-white/90">
          {icon}
        </span>

        <div className="min-w-0">
          <div className="text-[15px] font-semibold text-white/92 truncate">{title}</div>
          <div className="text-[12px] text-white/60 truncate">{desc}</div>
        </div>

        <span className="ml-auto text-white/25">↗</span>
      </div>
    </a>
  )
}

export function BottomNavMobile() {
  const [active, setActive] = useState<ActiveKey>("home")
  const [open, setOpen] = useState<OpenKey>(null)

  const rootRef = useRef<HTMLDivElement>(null)
  useOutsideClick(rootRef, () => setOpen(null))

  // ✅ FIX BUG: misure reali per posizionare la pill in modo PERFETTO
  const gridRef = useRef<HTMLDivElement>(null)
  const altRef = useRef<HTMLButtonElement>(null)
  const homeRef = useRef<HTMLButtonElement>(null)
  const chatRef = useRef<HTMLButtonElement>(null)

  const [pill, setPill] = useState<{ left: number; width: number } | null>(null)

  const focusKill = "outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0"

  const closeAll = () => setOpen(null)

  const altroItems = useMemo(
    () => [
      {
        href: "/shop",
        title: "Shop",
        desc: "Vai al nuovo shop integrato.",
        icon: <FolderOpenIcon className="h-5 w-5" />,
      },
      {
        href: "/#shop",
        title: "Shop in home",
        desc: "Vai subito al catalogo in homepage.",
        icon: <Squares2X2Icon className="h-5 w-5" />,
      },
      {
        href: "/shop/auth",
        title: "Account",
        desc: "Login, profilo e ordini.",
        icon: <BriefcaseIcon className="h-5 w-5" />,
      },
      {
        href: "/privacy",
        title: "Privacy",
        desc: "Apri la privacy policy.",
        icon: <QuestionMarkCircleIcon className="h-5 w-5" />,
      },
      {
        href: "/shop/cart",
        title: "Carrello",
        desc: "Vai al riepilogo ordine.",
        icon: <EnvelopeIcon className="h-5 w-5" />,
      },
    ],
    []
  )

  const measurePill = () => {
    const grid = gridRef.current
    if (!grid) return

    const gridRect = grid.getBoundingClientRect()

    const target =
      active === "altro" ? altRef.current : active === "home" ? homeRef.current : chatRef.current

    if (!target) return
    const t = target.getBoundingClientRect()

    // left relativo al grid (così non “deriva” con calc/padding/safe-area)
    const left = t.left - gridRect.left
    const width = t.width

    setPill({ left, width })
  }

  // misura al mount + quando cambia active/open
  useEffect(() => {
    measurePill()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, open])

  // misura su resize / rotazione / font-load (ResizeObserver)
  useEffect(() => {
    if (!gridRef.current) return

    const ro = new ResizeObserver(() => measurePill())
    ro.observe(gridRef.current)

    // osserva anche i bottoni (alcuni browser cambiano size con font scaling)
    if (altRef.current) ro.observe(altRef.current)
    if (homeRef.current) ro.observe(homeRef.current)
    if (chatRef.current) ro.observe(chatRef.current)

    window.addEventListener("resize", measurePill)
    window.addEventListener("orientationchange", measurePill)

    return () => {
      ro.disconnect()
      window.removeEventListener("resize", measurePill)
      window.removeEventListener("orientationchange", measurePill)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const goHome = () => {
    closeAll()
    setActive("home")
    window.dispatchEvent(new Event("bns:close-helper-chat"))
    window.location.hash = "#top"
  }

  const toggleAltro = () => {
    window.dispatchEvent(new Event("bns:close-helper-chat"))
    setActive("altro")
    setOpen((v) => (v === "altro" ? null : "altro"))
  }

  const openChat = () => {
    closeAll()
    setActive("chat")
    window.dispatchEvent(new Event("bns:open-helper-chat"))
  }

  return (
    <div ref={rootRef} className="md:hidden" style={{ WebkitTapHighlightColor: "transparent" } as any}>
      {/* DROPDOWN (immutato) */}
      <AnimatePresence>
        {open === "altro" ? (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.99 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className={[
              "fixed z-[9999] inset-x-0 flex justify-center px-4",
              "bottom-[calc(96px+env(safe-area-inset-bottom))]",
              "max-h-[calc(100vh-160px)]",
            ].join(" ")}
          >
            <div className="w-[min(94vw,560px)] max-h-[calc(100vh-160px)] overflow-auto">
              <GlassDropdown title="ALTRO">
                {altroItems.map((it) => (
                  <DropItem
                    key={it.href + it.title}
                    href={it.href}
                    title={it.title}
                    desc={it.desc}
                    icon={it.icon}
                    onSelect={() => {
                      closeAll()
                      setActive("home")
                    }}
                  />
                ))}
              </GlassDropdown>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* BOTTOM BAR */}
      <div
        className={[
          "fixed z-[9998]",
          "left-1/2 -translate-x-1/2",
          "bottom-[calc(16px+env(safe-area-inset-bottom))]",
          "w-[min(92vw,560px)]",
          "h-[72px]",
        ].join(" ")}
      >
        <div className="relative h-full">
          {/* base glass (invariato) */}
          <div className="absolute inset-0 rounded-[40px] overflow-hidden border border-white/10 shadow-[0_16px_50px_rgba(0,0,0,.55)]">
            <div className="absolute inset-0 backdrop-blur-2xl backdrop-saturate-125" />
            <div className="absolute inset-0 bg-black/70" />
            <div className="absolute inset-0 bg-white/[0.03]" />
            <div
              className="absolute -top-24 left-10 h-52 w-96 rounded-full blur-3xl opacity-[0.08]"
              style={{ background: BRAND }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-black/50" />
          </div>

          {/* GRID 3 slot */}
          <div ref={gridRef} className="relative h-full grid grid-cols-3 items-center px-4">
            {/* ✅ pill precisa (posizione misurata) */}
            {pill ? (
              <motion.div
                className={[
                  "pointer-events-none absolute top-1/2 -translate-y-1/2",
                  "h-[44px] rounded-[999px]",
                  "bg-white/90",
                  "shadow-[0_10px_30px_rgba(0,0,0,.35)]",
                ].join(" ")}
                animate={{ left: pill.left, width: pill.width }}
                transition={{ type: "spring", stiffness: 520, damping: 42, mass: 0.6 }}
              />
            ) : null}

            {/* ALTRO (settings) */}
            <button
              ref={altRef}
              type="button"
              onClick={toggleAltro}
              aria-label="Altro"
              aria-expanded={open === "altro"}
              className={[
                "relative z-10 mx-auto h-[44px] w-full rounded-[999px]",
                "flex items-center justify-center gap-2",
                focusKill,
              ].join(" ")}
              style={{ WebkitTapHighlightColor: "transparent" } as any}
            >
              <CogSolidIcon className={["h-6 w-6 transition", active === "altro" ? "text-black" : "text-white/85"].join(" ")} />
              <ChevronDownIcon
                className={[
                  "h-4 w-4 transition",
                  active === "altro" ? (open === "altro" ? "text-black/70 rotate-180" : "text-black/70") : "text-white/45",
                ].join(" ")}
              />
            </button>

            {/* HOME */}
            <button
              ref={homeRef}
              type="button"
              onClick={goHome}
              aria-label="Home"
              className={[
                "relative z-10 mx-auto h-[44px] w-full rounded-[999px]",
                "flex items-center justify-center",
                focusKill,
              ].join(" ")}
              style={{ WebkitTapHighlightColor: "transparent" } as any}
            >
              <HomeSolidIcon className={["h-6 w-6 transition", active === "home" ? "text-black" : "text-white/85"].join(" ")} />
            </button>

            {/* CHAT */}
            <button
              ref={chatRef}
              type="button"
              onClick={openChat}
              aria-label="Chat"
              className={[
                "relative z-10 mx-auto h-[44px] w-full rounded-[999px]",
                "flex items-center justify-center",
                focusKill,
              ].join(" ")}
              style={{ WebkitTapHighlightColor: "transparent" } as any}
            >
              <ChatBubbleLeftRightIcon
                className={["h-6 w-6 transition", active === "chat" ? "text-black" : "text-white/85"].join(" ")}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
