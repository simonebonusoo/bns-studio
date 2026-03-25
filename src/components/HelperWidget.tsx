// src/components/HelperWidget.tsx
import { useEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { getBotReply } from "../lib/faqBot"

type Msg = { role: "user" | "bot"; text: string; ts: number }

export function HelperWidget() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "bot",
      text:
        "Ciao! Sono l’assistente di BNS Studio 👋\nScrivimi “servizi”, “prezzi”, “tempi” o “contatti”.",
      ts: Date.now(),
    },
  ])

  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const el = listRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [open, messages])

  const send = () => {
    const text = input.trim()
    if (!text) return

    setMessages((prev) => [...prev, { role: "user", text, ts: Date.now() }])
    setInput("")

    const reply = getBotReply(text)

    // piccola “pausa” per sembrare umano
    window.setTimeout(() => {
      setMessages((prev) => [...prev, { role: "bot", text: reply.text, ts: Date.now() }])

      // se ci sono CTA, le aggiungiamo come testo breve cliccabile (semplice e robusto)
      if (reply.ctas?.length) {
        const ctaText = reply.ctas.map((c) => `${c.label} → ${c.href}`).join("\n")
        setMessages((prev) => [...prev, { role: "bot", text: ctaText, ts: Date.now() + 1 }])
      }
    }, 260)
  }

  const quick = useMemo(
    () => ["Servizi", "Prezzi", "Tempi", "Contatti"].map((t) => ({ t, v: t.toLowerCase() })),
    []
  )

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed z-[80] bottom-5 right-5 h-12 px-4 rounded-2xl border border-white/12 bg-black/70 backdrop-blur-xl text-white/85 hover:border-white/25 transition shadow-card"
        aria-label={open ? "Chiudi chat" : "Apri chat"}
      >
        {open ? "Chiudi" : "Helper 24/7"}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed z-[80] bottom-20 right-5 w-[360px] max-w-[calc(100vw-40px)]"
          >
            <div className="glass rounded-2xl overflow-hidden shadow-[0_20px_80px_rgba(0,0,0,.45)] border border-white/10">
              <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                <div className="text-sm font-semibold text-white/90">Helper 24/7</div>
                <button
                  onClick={() => setOpen(false)}
                  className="text-white/60 hover:text-white transition text-sm"
                >
                  ✕
                </button>
              </div>

              <div ref={listRef} className="h-[340px] overflow-auto px-4 py-3 space-y-3">
                {messages.map((m, idx) => (
                  <div key={m.ts + "-" + idx} className={m.role === "user" ? "text-right" : "text-left"}>
                    <div
                      className={[
                        "inline-block max-w-[92%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-line",
                        m.role === "user"
                          ? "bg-white/10 text-white/90 border border-white/10"
                          : "bg-black/30 text-white/80 border border-white/10",
                      ].join(" ")}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-4 pb-3">
                <div className="flex flex-wrap gap-2 mb-2">
                  {quick.map((q) => (
                    <button
                      key={q.v}
                      onClick={() => {
                        setInput(q.v)
                        // invio immediato
                        window.setTimeout(send, 0)
                      }}
                      className="text-xs px-3 py-1 rounded-full border border-white/12 bg-black/30 text-white/75 hover:border-white/25 transition"
                    >
                      {q.t}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") send()
                    }}
                    placeholder="Scrivi qui…"
                    className="flex-1 h-10 rounded-xl bg-black/40 border border-white/12 px-3 text-sm text-white/90 placeholder:text-white/40 outline-none focus:border-white/25"
                  />
                  <button
                    onClick={send}
                    className="h-10 px-4 rounded-xl bg-white/10 border border-white/12 text-sm text-white/90 hover:border-white/25 transition"
                  >
                    Invia
                  </button>
                </div>

                <div className="mt-2 text-[11px] text-white/45">
                  Risposte automatiche (no AI). Per un preventivo preciso: vai su “Contatti”.
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}