import { useEffect, useMemo, useRef, useState } from "react"

export type Msg = { role: "user" | "bot"; text: string }

type Topic = "none" | "web" | "rebrand" | "print" | "pricing" | "resources" | "contacts"
type Stage =
  | "idle"
  | "web_need"
  | "web_deadline"
  | "web_assets"
  | "rebrand_sector"
  | "rebrand_assets"
  | "print_type"
  | "print_qty_deadline"
  | "pricing_scope"
  | "contacts_collect"
  | "done"

type Context = {
  topic: Topic
  stage: Stage
  answers: {
    webType?: "landing" | "vetrina" | "multi" | "ecommerce"
    deadline?: string
    hasAssets?: "si" | "no"
    sector?: string
    hasLogo?: "si" | "no"
    printType?: string
    qty?: string
    budget?: string
    name?: string
    contact?: string
  }
}

function normalize(s: string) {
  return s.toLowerCase().trim()
}

function short(t: string, max = 80) {
  const s = t.replace(/\s+/g, " ").trim()
  return s.length > max ? s.slice(0, max - 1) + "…" : s
}

function isYes(t: string) {
  return /(^|\s)(si|sì|certo|ok|va bene|yes|yep)(\s|$)/.test(t)
}
function isNo(t: string) {
  return /(^|\s)(no|non|nope)(\s|$)/.test(t)
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

function extractEmail(text: string) {
  const m = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)
  return m?.[0] ?? null
}

function extractPhone(text: string) {
  // pattern permissivo (IT + internazionale)
  const cleaned = text.replace(/\s+/g, " ")
  const m = cleaned.match(/(\+?\d[\d\s\-().]{7,}\d)/)
  return m?.[0]?.trim() ?? null
}

function extractNameMaybe(text: string) {
  // molto soft: prende prima parte prima di virgola se sembra nome
  const s = text.trim()
  const parts = s.split(",").map((p) => p.trim())
  if (parts.length >= 2) {
    const maybeName = parts[0]
    if (maybeName.length >= 2 && maybeName.length <= 40) return maybeName
  }
  return null
}

function setDoneReply() {
  return {
    final: "Perfetto. Ho tutto il necessario per preparare una proposta. Puoi procedere da “Preventivi” oppure lasciarmi la richiesta in “Contatti”.",
    cta: { kind: "done" as const },
  }
}

export type HelperChatState = {
  messages: Msg[]
  input: string
  setInput: (v: string) => void
  send: (text: string) => void
  reset: () => void
  suggestions: string[]
  scrollerRef: React.RefObject<HTMLDivElement>
  ctx: Context
  chatLocked: boolean
}

export function useHelperChatInternal(): HelperChatState {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "bot",
      text: "Buongiorno. Sono l’assistente di BNS Studio. Posso aiutarti con sito web, rebranding, materiali di stampa oppure informazioni su prezzi e risorse.",
    },
  ])
  const [input, setInput] = useState("")
  const [ctx, setCtx] = useState<Context>({ topic: "none", stage: "idle", answers: {} })
  const [chatLocked, setChatLocked] = useState(false)

  const scrollerRef = useRef<HTMLDivElement>(null)

  const suggestions = useMemo(
    () => [
      "Che servizi offrite?",
      "Mi serve un preventivo per una landing.",
      "Vorrei un rebranding completo.",
      "Mi serve materiale stampa.",
      "Dove scarico CV e Portfolio?",
    ],
    []
  )

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages])

  function pushBot(text: string) {
    window.setTimeout(() => {
      setMessages((m) => [...m, { role: "bot", text }])
    }, 160)
  }

  function lockAndFinish() {
    const { final } = setDoneReply()
    setChatLocked(true)
    setCtx((c) => ({ ...c, stage: "done" }))
    pushBot(final)
  }

  function ensureTopic(nextTopic: Topic) {
    setCtx((prev) => {
      if (nextTopic === "none") return prev
      if (prev.topic === nextTopic) return prev
      return { topic: nextTopic, stage: "idle", answers: { ...prev.answers } }
    })
  }

  function handleServices(t: string) {
    if (/(servizi|cosa fate|offrite|di cosa vi occupate)/.test(t)) {
      pushBot(
        "Servizi principali:\n• Web Design & Siti (UI, performance, SEO)\n• Brand Identity / Rebranding\n• Gadget e materiali per la stampa\n\nSu quale area vuoi concentrarti?"
      )
      return true
    }
    return false
  }

  function handleGreetings(t: string) {
    if (/(^|\s)(ciao|salve|buongiorno|buonasera)(\s|$)/.test(t)) {
      pushBot("Buongiorno. Dimmi pure di cosa hai bisogno: sito, rebranding, stampa oppure prezzi/risorse.")
      return true
    }
    return false
  }

  function handleResources() {
    setCtx((c) => ({ ...c, topic: "resources", stage: "idle" }))
    pushBot("Per Curriculum Vitae e Portfolio vai nella sezione “Risorse”. Se mi dici l’obiettivo (candidatura o presentazione clienti), ti indico il formato migliore.")
  }

  function handlePricing() {
    setCtx((c) => ({ ...c, topic: "pricing", stage: "pricing_scope" }))
    pushBot("Per stimare un costo mi servono: tipo progetto, scadenza e cosa hai già pronto (testi/logo/materiali). Da cosa partiamo?")
  }

  function handleContactsStart() {
    setCtx((c) => ({ ...c, topic: "contacts", stage: "contacts_collect" }))
    pushBot("Per procedere, inserisci nome e un contatto (email o telefono).")
  }

  function handleContactsCollect(userText: string) {
    const email = extractEmail(userText)
    const phone = extractPhone(userText)
    const name = extractNameMaybe(userText)

    setCtx((c) => ({
      ...c,
      answers: {
        ...c.answers,
        name: name ?? c.answers.name,
        contact: email ?? phone ?? c.answers.contact,
      },
    }))

    const contactOk = Boolean(email || phone)
    if (contactOk) {
      lockAndFinish()
      return
    }

    pushBot("Non vedo un’email o un numero. Inserisci un contatto (es. nome, email) per completare la richiesta.")
  }

  function handlePrintFlow(userText: string) {
    const t = normalize(userText)

    if (ctx.stage === "idle") {
      setCtx((c) => ({ ...c, topic: "print", stage: "print_type" }))
      pushBot("Che materiale ti serve? (es. biglietti da visita, brochure, volantini, cataloghi, adesivi, menu)")
      return
    }

    if (ctx.stage === "print_type") {
      setCtx((c) => ({
        ...c,
        topic: "print",
        stage: "print_qty_deadline",
        answers: { ...c.answers, printType: short(userText, 60) },
      }))
      pushBot("Indicami quantità e scadenza (anche approssimativa).")
      return
    }

    if (ctx.stage === "print_qty_deadline") {
      setCtx((c) => ({
        ...c,
        topic: "print",
        stage: "contacts_collect",
        answers: { ...c.answers, qty: short(userText, 60) },
      }))
      pushBot("Ultimo passaggio: inserisci nome e un contatto (email o telefono).")
      return
    }
  }

  function handleRebrandFlow(userText: string) {
    const t = normalize(userText)

    if (ctx.stage === "idle") {
      setCtx((c) => ({ ...c, topic: "rebrand", stage: "rebrand_sector" }))
      pushBot("Qual è il settore dell’attività e qual è l’obiettivo del rebranding? (es. più premium, più moderno, riposizionamento)")
      return
    }

    if (ctx.stage === "rebrand_sector") {
      setCtx((c) => ({
        ...c,
        topic: "rebrand",
        stage: "rebrand_assets",
        answers: { ...c.answers, sector: short(userText, 60) },
      }))
      pushBot("Hai già un logo/materiali da cui partire? (sì/no)")
      return
    }

    if (ctx.stage === "rebrand_assets") {
      const hasLogo = isYes(t) ? "si" : isNo(t) ? "no" : undefined
      setCtx((c) => ({
        ...c,
        topic: "rebrand",
        stage: "contacts_collect",
        answers: { ...c.answers, hasLogo: hasLogo ?? c.answers.hasLogo },
      }))
      pushBot("Inserisci nome e un contatto (email o telefono) e, se possibile, una scadenza indicativa.")
      return
    }
  }

  function handleWebFlow(userText: string) {
    const t = normalize(userText)

    if (ctx.stage === "idle") {
      setCtx((c) => ({ ...c, topic: "web", stage: "web_need" }))
      pushBot("Che tipo di sito ti serve: landing, vetrina, multi-pagina o e-commerce?")
      return
    }

    if (ctx.stage === "web_need") {
      let webType: Context["answers"]["webType"] | undefined
      if (/landing/.test(t)) webType = "landing"
      else if (/vetrina/.test(t)) webType = "vetrina"
      else if (/(multi|pagine|multi-pagina)/.test(t)) webType = "multi"
      else if (/(ecommerce|e-commerce)/.test(t)) webType = "ecommerce"

      setCtx((c) => ({
        ...c,
        topic: "web",
        stage: "web_deadline",
        answers: { ...c.answers, webType: webType ?? c.answers.webType },
      }))

      pushBot("Qual è la scadenza o la data ideale di pubblicazione?")
      return
    }

    if (ctx.stage === "web_deadline") {
      setCtx((c) => ({
        ...c,
        topic: "web",
        stage: "web_assets",
        answers: { ...c.answers, deadline: short(userText, 60) },
      }))
      pushBot("Hai già testi e immagini pronti? (sì/no)")
      return
    }

    if (ctx.stage === "web_assets") {
      const hasAssets = isYes(t) ? "si" : isNo(t) ? "no" : undefined
      setCtx((c) => ({
        ...c,
        topic: "web",
        stage: "contacts_collect",
        answers: { ...c.answers, hasAssets: hasAssets ?? c.answers.hasAssets },
      }))
      pushBot("Inserisci nome e un contatto (email o telefono). Se vuoi aggiungi anche 1 riga sugli obiettivi.")
      return
    }
  }

  function handleIntent(userText: string) {
    const t = normalize(userText)

    if (chatLocked) {
      pushBot("La richiesta è già stata registrata. Per procedere vai su “Preventivi” o “Contatti”.")
      return
    }

    if (handleGreetings(t)) return
    if (handleServices(t)) return

    // Detect topic
    const nextTopic = detectTopic(t)
    if (nextTopic !== "none") ensureTopic(nextTopic)

    const effectiveTopic = nextTopic !== "none" ? nextTopic : ctx.topic

    // Direct handlers
    if (effectiveTopic === "resources") return handleResources()
    if (effectiveTopic === "pricing") return handlePricing()
    if (effectiveTopic === "contacts") return handleContactsStart()

    // Flow by topic/stage
    if (ctx.stage === "contacts_collect") return handleContactsCollect(userText)

    if (effectiveTopic === "print") return handlePrintFlow(userText)
    if (effectiveTopic === "rebrand") return handleRebrandFlow(userText)
    if (effectiveTopic === "web") return handleWebFlow(userText)

    // Fallback (professionale)
    pushBot("Per inquadrare correttamente: si tratta di un sito web, un rebranding, materiali di stampa oppure vuoi informazioni su prezzi/risorse?")
  }

  function send(text: string) {
    const t = text.trim()
    if (!t) return
    setMessages((m) => [...m, { role: "user", text: t }])
    setInput("")
    handleIntent(t)
  }

  function reset() {
    setMessages([
      {
        role: "bot",
        text: "Buongiorno. Sono l’assistente di BNS Studio. Posso aiutarti con sito web, rebranding, materiali di stampa oppure informazioni su prezzi e risorse.",
      },
    ])
    setInput("")
    setCtx({ topic: "none", stage: "idle", answers: {} })
    setChatLocked(false)
  }

  return { messages, input, setInput, send, reset, suggestions, scrollerRef, ctx, chatLocked }
}