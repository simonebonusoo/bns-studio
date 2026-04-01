import { useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Button } from "./Button"
import { useHelperChat } from "../context/HelperChatProvider"
import { HiOutlineChatBubbleLeftRight } from "react-icons/hi2"

function LiquidGlass({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={[
        "relative overflow-hidden rounded-3xl",
        // shadow un filo più soft rispetto a prima (meno “sticker”)
        "shadow-[0_18px_60px_rgba(0,0,0,.55)]",
        className,
      ].join(" ")}
    >
      {/* ✅ Glass “reale”: blur + saturate, ma senza latte bianco fisso */}
      <div className="absolute inset-0 backdrop-blur-2xl backdrop-saturate-125" />

      {/* ✅ dark tint: più leggero (prima era troppo nero/flat) */}
      <div className="absolute inset-0 bg-black/55" />

      {/* ✅ highlight molto sottile (prima era troppo visibile) */}
      <div className="absolute inset-0 bg-white/[0.018]" />

      {/* ✅ glow brand: presente ma molto discreto */}
      <div
        className="absolute -top-28 left-10 h-52 w-80 rounded-full blur-3xl opacity-[0.06]"
        style={{ background: "#e3f503" }}
      />

      {/* ✅ gradient interno per dare profondità senza “sparare” */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.045] via-transparent to-black/50" />

      {/* ✅ bordi: sottili e realistici (niente ring aggressivo) */}
      <div className="absolute inset-0 pointer-events-none rounded-3xl">
        {/* hairline */}
        <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/10" />
        {/* micro highlight top */}
        <div className="absolute inset-x-0 top-0 h-px bg-white/10" />
        {/* micro shadow bottom */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-black/40" />
      </div>

      {/* ✅ inner shadow per “vetro” */}
      <div className="absolute inset-0 shadow-[inset_0_1px_0_rgba(255,255,255,.06),inset_0_-28px_60px_rgba(0,0,0,.55)]" />

      <div className="relative">{children}</div>
    </div>
  )
}

export function FloatingHelperChat() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const { messages, send, ctx } = useHelperChat()

  const scrollerRef = useRef<HTMLDivElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  // ✅ apri da navbar / bottomnav con event
  useEffect(() => {
    const onOpen = () => setOpen(true)
    window.addEventListener("bns:open-helper-chat", onOpen as EventListener)
    return () => window.removeEventListener("bns:open-helper-chat", onOpen as EventListener)
  }, [])

  // ✅ chiudi da bottomnav quando apri dropdown
  useEffect(() => {
    const onClose = () => setOpen(false)
    window.addEventListener("bns:close-helper-chat", onClose as EventListener)
    return () => window.removeEventListener("bns:close-helper-chat", onClose as EventListener)
  }, [])

  // focus input
  useEffect(() => {
    if (!open) return
    window.setTimeout(() => inputRef.current?.focus(), 0)
  }, [open])

  // ESC chiude
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  // auto scroll
  useEffect(() => {
    if (!open) return
    const el = scrollerRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, open])

  // click fuori -> chiude (non chiude se clicchi sul FAB o nel panel)
  useEffect(() => {
    if (!open) return

    const onDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return

      if (target.closest('[data-helper-fab="1"]')) return
      if (panelRef.current?.contains(target)) return

      setOpen(false)
    }

    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [open])

  const suggestions = useMemo(
    () => ["Mi fai un preventivo per una landing?", "Vorrei un rebranding completo.", "Mi serve materiale stampa."],
    []
  )

  const isDone = ctx.stage === "done"

  return (
    <>
      {/* FAB desktop */}
      <motion.button
        type="button"
        data-helper-fab="1"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Chiudi chat assistenza" : "Apri chat assistenza"}
        aria-expanded={open}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.98 }}
        className={[
          "fixed bottom-6 right-6 z-[9999]",
          "hidden md:flex",
          "h-12 w-12 rounded-2xl",
          "bg-black/55 backdrop-blur-2xl",
          "border border-white/15",
          "shadow-[0_18px_60px_rgba(0,0,0,.55)]",
          "items-center justify-center",
        ].join(" ")}
      >
        <HiOutlineChatBubbleLeftRight className="h-6 w-6 text-white" />
      </motion.button>

      {/* PANEL */}
      <AnimatePresence>
        {open ? (
          <>
            {/* ✅ MOBILE: wrapper centrato */}
            <div
              className={[
                "fixed left-1/2 -translate-x-1/2 z-[9999]",
                "w-[min(92vw,380px)]",
                "bottom-[calc(110px+env(safe-area-inset-bottom))]",
                "md:hidden",
              ].join(" ")}
            >
              <motion.div
                ref={panelRef}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.98 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
              >
                <LiquidGlass>
                  <div className="p-4 border-b border-white/10 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white/90">Cloud</div>
                      <div className="text-xs text-white/60">Assistente digitale</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="text-xs text-white/70 hover:text-white transition"
                    >
                      Chiudi →
                    </button>
                  </div>

                  <div className="p-4">
                    <div
                      ref={scrollerRef}
                      // ✅ anche qui meno “cemento”, più vetro
                      className="h-64 overflow-auto rounded-2xl bg-black/35 border border-white/10 p-3 space-y-2"
                    >
                      {messages.map((m, idx) => (
                        <div key={idx} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                          <div
                            className={
                              m.role === "user"
                                ? "max-w-[85%] rounded-2xl rounded-tr-sm bg-white text-black px-3 py-2 text-xs"
                                : "max-w-[85%] rounded-2xl rounded-tl-sm bg-white/10 border border-white/10 px-3 py-2 text-xs text-white/90"
                            }
                          >
                            {m.text}
                          </div>
                        </div>
                      ))}
                    </div>

                    {isDone ? (
                      <div
                        className="mt-3"
                        onClickCapture={() => {
                          setOpen(false)
                        }}
                      >
                        <Button href="/#contatti" className="w-full">
                          Richiedi un preventivo
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {suggestions.map((s) => (
                            <button
                              key={s}
                              onClick={() => send(s)}
                              type="button"
                              className="text-[11px] px-3 py-1.5 rounded-full border border-white/15 bg-black/20 text-white/80 hover:border-white/25 hover:text-white transition"
                            >
                              {s}
                            </button>
                          ))}
                        </div>

                        <div className="mt-3 flex gap-2">
                          <input
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault()
                                send(input)
                                setInput("")
                              }
                            }}
                            placeholder="Scrivi…"
                            className="w-full rounded-2xl bg-black/30 border border-white/15 px-3 py-2 text-xs text-white outline-none focus:border-white/25"
                          />
                          <button
                            onClick={() => {
                              send(input)
                              setInput("")
                            }}
                            type="button"
                            className="rounded-2xl bg-white text-black px-3 py-2 text-xs font-medium hover:bg-white/90"
                          >
                            Invia
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </LiquidGlass>
              </motion.div>
            </div>

            {/* ✅ DESKTOP */}
            <motion.div
              ref={panelRef}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="fixed right-6 bottom-20 z-[9999] w-[360px] max-w-[calc(100vw-48px)] hidden md:block"
            >
              <LiquidGlass>
                <div className="p-4 border-b border-white/10 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white/90">Cloud</div>
                    <div className="text-xs text-white/60">Assistente digitale</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="text-xs text-white/70 hover:text-white transition"
                  >
                    Chiudi →
                  </button>
                </div>

                <div className="p-4">
                  <div
                    ref={scrollerRef}
                    className="h-64 overflow-auto rounded-2xl bg-black/35 border border-white/10 p-3 space-y-2"
                  >
                    {messages.map((m, idx) => (
                      <div key={idx} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                        <div
                          className={
                            m.role === "user"
                              ? "max-w-[85%] rounded-2xl rounded-tr-sm bg-white text-black px-3 py-2 text-xs"
                              : "max-w-[85%] rounded-2xl rounded-tl-sm bg-white/10 border border-white/10 px-3 py-2 text-xs text-white/90"
                          }
                        >
                          {m.text}
                        </div>
                      </div>
                    ))}
                  </div>

                  {isDone ? (
                    <div
                      className="mt-3"
                      onClickCapture={() => {
                        setOpen(false)
                      }}
                    >
                      <Button href="/#contatti" className="w-full">
                        Richiedi un preventivo
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {suggestions.map((s) => (
                          <button
                            key={s}
                            onClick={() => send(s)}
                            type="button"
                            className="text-[11px] px-3 py-1.5 rounded-full border border-white/15 bg-black/20 text-white/80 hover:border-white/25 hover:text-white transition"
                          >
                            {s}
                          </button>
                        ))}
                      </div>

                      <div className="mt-3 flex gap-2">
                        <input
                          ref={inputRef}
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault()
                              send(input)
                              setInput("")
                            }
                          }}
                          placeholder="Scrivi…"
                          className="w-full rounded-2xl bg-black/30 border border-white/15 px-3 py-2 text-xs text-white outline-none focus:border-white/25"
                        />
                        <button
                          onClick={() => {
                            send(input)
                            setInput("")
                          }}
                          type="button"
                          className="rounded-2xl bg-white text-black px-3 py-2 text-xs font-medium hover:bg-white/90"
                        >
                          Invia
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </LiquidGlass>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  )
}
