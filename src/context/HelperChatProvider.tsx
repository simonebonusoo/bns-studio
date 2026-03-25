import React, { createContext, useContext, useMemo, useRef, useState } from "react"

export type Msg = { role: "user" | "bot"; text: string }

export type Topic = "none" | "web" | "rebrand" | "print" | "pricing" | "resources" | "contacts"
export type Stage =
  | "idle"
  | "web_need"
  | "web_deadline"
  | "web_assets"
  | "rebrand_sector"
  | "rebrand_assets"
  | "print_type"
  | "print_qty_deadline"
  | "pricing_scope"
  | "done"

export type ContextState = {
  topic: Topic
  stage: Stage
  answers: {
    webType?: "landing" | "vetrina" | "multi" | "ecommerce"
    deadline?: string
    hasAssets?: "si" | "no"
    sector?: string
    hasLogo?: "si" | "no"
    printType?: string
    qtyDeadline?: string
    pricingInfo?: string
  }
}

function normalize(s: string) {
  return s.toLowerCase().trim()
}
function isYes(t: string) {
  return /(^|\s)(si|sì|certo|ok|va bene|yes|yep)(\s|$)/.test(t)
}
function isNo(t: string) {
  return /(^|\s)(no|non|nope)(\s|$)/.test(t)
}
function short(t: string, max = 90) {
  const s = t.replace(/\s+/g, " ").trim()
  return s.length > max ? s.slice(0, max - 1) + "…" : s
}
function detectTopic(t: string): Topic {
  if (/(cv|curriculum|portfolio|risorse|pdf)/.test(t)) return "resources"
  if (/(contatti|email|telefono|call|contatt)/.test(t)) return "contacts"
  if (/(prezzi|costi|budget|preventivo|tariff|listino|quanto)/.test(t)) return "pricing"
  if (/(stampa|stamp(e|a)|gadget|bigliett|brochure|volantin|catalog|menu|locandin|calendari)/.test(t))
    return "print"
  if (/(rebranding|brand|logo|identit|branding|marchio)/.test(t)) return "rebrand"
  if (/(sito|website|landing|pagina|vetrina|ecommerce|e-commerce)/.test(t)) return "web"
  return "none"
}

type HelperChatContextValue = {
  messages: Msg[]
  ctx: ContextState
  send: (text: string) => void
  reset: () => void
}

const HelperChatContext = createContext<HelperChatContextValue | null>(null)

const WELCOME =
  "Benvenuto. Posso raccogliere le informazioni essenziali per siti web, rebranding, materiali stampa/gadget e indicazioni su prezzi/risorse. Indichi l’argomento."

// ✅ ora rimanda a “Raccontaci il tuo progetto” (sezione contatti)
const FINAL_PREVENTIVO =
  "Grazie. Per proseguire correttamente, compili la sezione “Raccontaci il tuo progetto”: riceverà una proposta con tempi e costi."

const FINAL_CONTATTI =
  "Per proseguire, compili la sezione “Raccontaci il tuo progetto”. La ricontatteremo con le indicazioni necessarie."

export function HelperChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Msg[]>([{ role: "bot", text: WELCOME }])
  const [ctx, setCtx] = useState<ContextState>({ topic: "none", stage: "idle", answers: {} })

  const botTimer = useRef<number | null>(null)

  function pushBot(text: string) {
    if (botTimer.current) window.clearTimeout(botTimer.current)
    botTimer.current = window.setTimeout(() => {
      setMessages((m) => [...m, { role: "bot", text }])
    }, 140)
  }

  function finalize(kind: "preventivo" | "contatti") {
    setCtx((c) => ({ ...c, stage: "done" }))
    pushBot(kind === "preventivo" ? FINAL_PREVENTIVO : FINAL_CONTATTI)
  }

  function handleIntent(userText: string) {
    const t = normalize(userText)

    // ✅ se finito: non risponde più
    if (ctx.stage === "done") return

    // saluti
    if (/(^|\s)(ciao|salve|buongiorno|buonasera|hey|ehi)(\s|$)/.test(t)) {
      pushBot("Buongiorno. Indichi l’argomento: sito, rebranding, stampa/gadget, prezzi o risorse.")
      return
    }

    // servizi
    if (/(servizi|cosa fate|offrite|di cosa vi occupate)/.test(t)) {
      pushBot(
        "Servizi principali:\n• Siti web (landing, vetrina, multi-pagina, e-commerce)\n• Brand identity e rebranding\n• Materiali grafici e stampa (inclusi gadget)\n\nSu quale area desidera informazioni?"
      )
      return
    }

    const nextTopic = detectTopic(t)
    const topicChanged = nextTopic !== "none" && nextTopic !== ctx.topic
    const base: ContextState = topicChanged
      ? { topic: nextTopic, stage: "idle", answers: { ...ctx.answers } }
      : ctx

    // RISORSE -> risposta + done
    if (base.topic === "resources" || nextTopic === "resources") {
      setCtx((c) => ({ ...c, topic: "resources", stage: "done" }))
      pushBot("Nella sezione “Risorse” può scaricare Curriculum Vitae e Portfolio.")
      return
    }

    // CONTATTI -> done + rimando
    if (base.topic === "contacts" || nextTopic === "contacts") {
      setCtx((c) => ({ ...c, topic: "contacts", stage: "done" }))
      pushBot(FINAL_CONTATTI)
      return
    }

    // PREZZI -> 1 domanda + done
    if (base.topic === "pricing" || nextTopic === "pricing") {
      if (base.stage === "idle") {
        setCtx((c) => ({ ...c, topic: "pricing", stage: "pricing_scope" }))
        pushBot("Per una stima indicativa: indichi il tipo lavoro (sito / rebranding / stampa) e una scadenza indicativa.")
        return
      }
      if (base.stage === "pricing_scope") {
        setCtx((c) => ({
          topic: "pricing",
          stage: "done",
          answers: { ...c.answers, pricingInfo: short(userText, 120) },
        }))
        pushBot(FINAL_PREVENTIVO)
        return
      }
    }

    // STAMPA / GADGET
    if (base.topic === "print" || nextTopic === "print") {
      if (base.stage === "idle") {
        setCtx((c) => ({ ...c, topic: "print", stage: "print_type" }))
        pushBot("Indichi il materiale richiesto (es. biglietti da visita, brochure, volantini, menu, cataloghi, adesivi).")
        return
      }

      if (base.stage === "print_type") {
        setCtx((c) => ({
          topic: "print",
          stage: "print_qty_deadline",
          answers: { ...c.answers, printType: short(userText, 80) },
        }))
        pushBot("Indichi quantità e scadenza (anche indicativa).")
        return
      }

      if (base.stage === "print_qty_deadline") {
        setCtx((c) => ({
          topic: "print",
          stage: "done",
          answers: { ...c.answers, qtyDeadline: short(userText, 90) },
        }))
        pushBot(FINAL_PREVENTIVO)
        return
      }
    }

    // REBRANDING
    if (base.topic === "rebrand" || nextTopic === "rebrand") {
      if (base.stage === "idle") {
        setCtx((c) => ({ ...c, topic: "rebrand", stage: "rebrand_sector" }))
        pushBot("Indichi settore e obiettivo (es. riposizionamento, modernizzazione, coerenza visiva).")
        return
      }

      if (base.stage === "rebrand_sector") {
        setCtx((c) => ({
          topic: "rebrand",
          stage: "rebrand_assets",
          answers: { ...c.answers, sector: short(userText, 90) },
        }))
        pushBot("Sono disponibili logo e materiali pregressi? (sì/no)")
        return
      }

      if (base.stage === "rebrand_assets") {
        const hasLogo = isYes(t) ? "si" : isNo(t) ? "no" : undefined
        setCtx((c) => ({
          topic: "rebrand",
          stage: "done",
          answers: { ...c.answers, hasLogo: hasLogo ?? c.answers.hasLogo },
        }))
        pushBot(FINAL_PREVENTIVO)
        return
      }
    }

    // WEB
    if (base.topic === "web" || nextTopic === "web") {
      if (base.stage === "idle") {
        setCtx((c) => ({ ...c, topic: "web", stage: "web_need" }))
        pushBot("Indichi il tipo di sito: landing, vetrina, multi-pagina o e-commerce.")
        return
      }

      if (base.stage === "web_need") {
        let webType: ContextState["answers"]["webType"] | undefined
        if (/landing/.test(t)) webType = "landing"
        else if (/(vetrina)/.test(t)) webType = "vetrina"
        else if (/(multi|pagine|multi-pagina)/.test(t)) webType = "multi"
        else if (/(ecommerce|e-commerce)/.test(t)) webType = "ecommerce"

        setCtx((c) => ({
          topic: "web",
          stage: "web_deadline",
          answers: { ...c.answers, webType: webType ?? c.answers.webType },
        }))
        pushBot("Indichi la scadenza (quando desidera essere online).")
        return
      }

      if (base.stage === "web_deadline") {
        setCtx((c) => ({
          topic: "web",
          stage: "web_assets",
          answers: { ...c.answers, deadline: short(userText, 60) },
        }))
        pushBot("Sono disponibili testi e immagini? (sì/no)")
        return
      }

      if (base.stage === "web_assets") {
        const hasAssets = isYes(t) ? "si" : isNo(t) ? "no" : undefined
        setCtx((c) => ({
          topic: "web",
          stage: "done",
          answers: { ...c.answers, hasAssets: hasAssets ?? c.answers.hasAssets },
        }))
        pushBot(FINAL_PREVENTIVO)
        return
      }
    }

    // fallback (professionale, non ripetitivo)
    pushBot("Per favore specifichi l’argomento: sito, rebranding, stampa/gadget, prezzi o risorse.")
  }

  function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return
    if (ctx.stage === "done") return // ✅ non aggiunge messaggi quando finito

    setMessages((m) => [...m, { role: "user", text: trimmed }])
    handleIntent(trimmed)
  }

  function reset() {
    setMessages([{ role: "bot", text: WELCOME }])
    setCtx({ topic: "none", stage: "idle", answers: {} })
  }

  const value = useMemo<HelperChatContextValue>(() => ({ messages, ctx, send, reset }), [messages, ctx])

  return <HelperChatContext.Provider value={value}>{children}</HelperChatContext.Provider>
}

export function useHelperChat() {
  const v = useContext(HelperChatContext)
  if (!v) throw new Error("useHelperChat must be used within HelperChatProvider")
  return v
}