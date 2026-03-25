// src/data/caseStudies.ts
export type CaseStudy = {
  slug: string
  eyebrow: string
  title: string
  excerpt: string
  tags: string[]
  cover?: string // opzionale: /portfolio/br-service.jpg
  content: Array<
    | { type: "p"; text: string }
    | { type: "h2"; text: string }
    | { type: "ul"; items: string[] }
  >
}

export const CASE_STUDIES: CaseStudy[] = [
  {
    slug: "br-service",
    eyebrow: "Website + Brand identity",
    title: "BR Service — Ricambi e assistenza a Nardò",
    excerpt:
      "Sito web + preventivo online, identità visiva e materiali per stampa: una presenza digitale completa e coerente.",
    tags: ["Sito web", "Identità visiva", "Preventivi", "Stampa"],
    content: [
      { type: "h2", text: "Il cliente e la sua visione" },
      {
        type: "p",
        text:
          "BR Service è un negozio di elettrodomestici a Nardò (Lecce) specializzato in vendita, ricambi e assistenza. L’obiettivo era rendere più semplice per i clienti trovare informazioni, richiedere un preventivo e capire subito servizi e punti di forza.",
      },

      { type: "h2", text: "La richiesta" },
      {
        type: "ul",
        items: [
          "Creare un sito web chiaro e moderno, semplice da navigare",
          "Inserire un sistema di richiesta preventivo per acquisti e riparazioni",
          "Rendere il brand più riconoscibile con un’identità visiva coerente",
          "Realizzare materiali pronti per la stampa (biglietti da visita, calendari, ecc.)",
        ],
      },

      { type: "h2", text: "Il nostro approccio" },
      {
        type: "p",
        text:
          "Abbiamo lavorato per step: prima la struttura del sito e i contenuti, poi la parte visiva e infine l’integrazione dei moduli di contatto/preventivo. L’obiettivo era mantenere tutto pulito, immediato e orientato alle richieste reali dei clienti.",
      },

      { type: "h2", text: "Cosa è stato realizzato" },
      {
        type: "ul",
        items: [
          "Sito web con sezioni servizi, contatti e richieste",
          "Modulo preventivo online (acquisti / riparazioni)",
          "Brand identity: colori, stile e coerenza grafica",
          "Materiali stampabili: calendari, biglietti da visita e grafiche su richiesta",
        ],
      },

      { type: "h2", text: "Risultati e benefici" },
      {
        type: "ul",
        items: [
          "Richieste più semplici e più veloci per i clienti",
          "Comunicazione più chiara dei servizi",
          "Immagine più professionale e coerente online e offline",
        ],
      },
    ],
  },

  {
    slug: "a-casa-di-flavia",
    eyebrow: "Caso studio",
    title: "A Casa di Flavia — Home Restaurant in Salento",
    excerpt:
      "Branding, sito e storytelling per trasformare un’esperienza culinaria e di ospitalità in una presenza digitale efficace.",
    tags: ["Branding", "Sito web", "Storytelling", "SEO"],
    content: [
      { type: "h2", text: "Il cliente e la sua visione" },
      {
        type: "p",
        text:
          "Flavia, chef di yacht di lusso con una lunga esperienza, ha trasformato la sua passione in un progetto unico: un home restaurant che unisce cucina tipica salentina e ospitalità con alloggi esclusivi.",
      },
      { type: "h2", text: "La sfida" },
      {
        type: "p",
        text:
          "Tradurre l’esperienza in un sito capace di raccontare storia, piatti e alloggi, valorizzando il territorio e aumentando la visibilità online.",
      },
      { type: "h2", text: "La richiesta del cliente" },
      {
        type: "ul",
        items: [
          "Sito web moderno e accattivante",
          "Integrazione e presentazione dei tre appartamenti",
          "Logo e identità visiva coerente",
          "Shooting fotografico professionale",
          "Ottimizzazione contenuti per visibilità online",
          "Navigazione fluida tra sezioni",
        ],
      },
      { type: "h2", text: "Risultati e benefici" },
      {
        type: "ul",
        items: [
          "Sito completo e funzionale",
          "Maggiore visibilità online",
          "Esperienza utente più chiara e piacevole",
          "Progetto riconoscibile e coerente",
        ],
      },
    ],
  },
]