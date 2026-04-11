export type StaticPageSection = {
  title: string
  body: string
}

export type StaticPageContent = {
  eyebrow: string
  title: string
  intro: string
  sections: StaticPageSection[]
  closing?: string
}

export type AboutStaffMember = {
  id: string
  name: string
  role: string
  imageUrl: string
}

export type AboutPageContent = StaticPageContent & {
  introImageUrl: string
  staffTitle: string
  staffIntro: string
  staff: AboutStaffMember[]
}

export const ABOUT_PAGE_SETTINGS_KEY = "staticPage.about"
export const PRIVACY_PAGE_SETTINGS_KEY = "staticPage.privacy"

export const defaultAboutContent: AboutPageContent = {
  eyebrow: "Chi siamo",
  title: "Chi siamo",
  intro:
    "BNS Studio nasce per mettere insieme direzione creativa, contenuti digitali e strumenti operativi. Costruiamo identita visive, pagine editoriali e sistemi shop con un approccio concreto: ogni scelta deve rendere il brand piu chiaro, riconoscibile e facile da gestire.",
  introImageUrl: "",
  sections: [
    {
      title: "Un sistema, non una vetrina",
      body:
        "Ogni progetto viene trattato come un sistema: struttura dei contenuti, gerarchia visiva, immagini, microcopy, catalogo e strumenti admin devono parlare la stessa lingua. Il risultato deve funzionare per chi guarda e per chi lo aggiorna ogni giorno.",
    },
    {
      title: "Dal visual alla gestione",
      body:
        "Seguiamo identita, landing page, contenuti editoriali, cataloghi, prodotti digitali e shop integrati. La parte estetica resta collegata alla parte operativa: vendita, profilo cliente, ordini, contenuti e dashboard devono rimanere coerenti.",
    },
    {
      title: "Metodo pulito",
      body:
        "Preferiamo soluzioni essenziali, leggibili e mantenibili. Prima si chiarisce il messaggio, poi si costruisce il layout, poi si rifinisce l'esperienza. Niente decorazione gratuita: solo elementi che aiutano identita, conversione o gestione.",
    },
  ],
  staffTitle: "Il nostro staff",
  staffIntro:
    "Una struttura compatta, con ruoli chiari e responsabilita diretta sul risultato creativo, tecnico e operativo.",
  staff: [
    {
      id: "simone-bonuse",
      name: "Simone Bonuse",
      role: "CEO & Founder",
      imageUrl: "",
    },
  ],
  closing:
    "BNS Studio lavora su progetti digitali che devono essere belli da vedere, semplici da usare e concreti da mantenere nel tempo.",
}

export const defaultPrivacyContent: StaticPageContent = {
  eyebrow: "Privacy",
  title: "Privacy Policy",
  intro:
    "Questa informativa descrive in modo chiaro quali dati possono essere trattati attraverso il sito e lo shop integrato BNS Studio, per quali finalita vengono usati e quali limiti operativi vengono rispettati.",
  sections: [
    {
      title: "Titolare e riferimento del sito",
      body:
        "Il sito e lo shop sono gestiti da BNS Studio. Per richieste relative alla privacy, ai dati personali o alla gestione di un ordine puoi contattarci all'indirizzo email indicato nei riferimenti del sito.",
    },
    {
      title: "Dati raccolti",
      body:
        "Possiamo trattare dati forniti volontariamente dall'utente, come nome, cognome, email, username, dati di spedizione, dati di contatto, informazioni inserite nei form, dettagli ordine e preferenze operative necessarie alla gestione dello shop.",
    },
    {
      title: "Finalita del trattamento",
      body:
        "I dati vengono usati per permettere la navigazione del sito, creare e gestire account, elaborare ordini, preparare spedizioni, generare ricevute, fornire assistenza, inviare comunicazioni operative e mantenere sicuro e funzionante il servizio.",
    },
    {
      title: "Account e autenticazione",
      body:
        "Per creare un account possono essere richiesti email, username, password e dati essenziali di profilo. Le password non vengono mostrate in chiaro nelle risposte dell'applicazione. Le informazioni dell'account sono usate per login, profilo, ordini e assistenza.",
    },
    {
      title: "Ordini, spedizioni e ricevute",
      body:
        "Per completare un ordine trattiamo i dati necessari alla gestione operativa: prodotti acquistati, quantita, prezzi, sconti, indirizzo di spedizione, metodo di spedizione, stato ordine, tracking e ricevute. Queste informazioni sono accessibili solo nei limiti necessari a evasione, assistenza e amministrazione.",
    },
    {
      title: "Pagamenti",
      body:
        "I pagamenti vengono gestiti tramite provider esterni o strumenti dedicati. BNS Studio non ha accesso libero ai dati completi della carta come informazioni consultabili internamente. Possiamo vedere solo le informazioni operative necessarie a collegare pagamento, ordine, importo e assistenza.",
    },
    {
      title: "Email e comunicazioni",
      body:
        "L'email puo essere usata per conferme d'ordine, aggiornamenti operativi, richieste di assistenza, notifiche legate allo stato dell'ordine o disponibilita dei prodotti. Non vengono inviate comunicazioni non necessarie senza una base coerente con il servizio richiesto.",
    },
    {
      title: "Conservazione dei dati",
      body:
        "I dati vengono conservati per il tempo necessario a gestire account, ordini, obblighi amministrativi, assistenza e sicurezza del servizio. Alcune informazioni possono restare nello storico ordini per garantire consultazione, ricevute e continuita operativa.",
    },
    {
      title: "Sicurezza e protezione",
      body:
        "I dati sono trattati con misure di protezione adeguate al funzionamento del sito e dello shop. L'accesso alle aree amministrative e ai dati operativi e limitato agli utenti autorizzati. Le informazioni sensibili vengono ridotte a cio che serve realmente per erogare il servizio.",
    },
    {
      title: "Diritti dell'utente",
      body:
        "L'utente puo richiedere informazioni sui propri dati, aggiornamento, rettifica o cancellazione nei limiti previsti dagli obblighi operativi, amministrativi e legali applicabili. Le richieste possono essere inviate tramite i contatti privacy.",
    },
    {
      title: "Contatti privacy",
      body:
        "Per richieste relative ai dati personali, allo storico ordini, al profilo o alla gestione privacy puoi scrivere a bnsstudio26@gmail.com specificando il motivo della richiesta.",
    },
  ],
  closing:
    "Questa informativa e pensata per riflettere il funzionamento reale del sito e dello shop integrato, evitando promesse tecniche non verificabili e mantenendo un linguaggio chiaro.",
}

export function parseStaticPageContent(rawValue: string | undefined, fallback: StaticPageContent) {
  if (!rawValue?.trim()) return fallback

  try {
    const parsed = JSON.parse(rawValue)
    if (!parsed || typeof parsed !== "object") return fallback

    const sections = Array.isArray(parsed.sections)
      ? parsed.sections
          .map((section: Partial<StaticPageSection>) => ({
            title: String(section?.title || "").trim(),
            body: String(section?.body || "").trim(),
          }))
          .filter((section: StaticPageSection) => section.title && section.body)
      : fallback.sections

    return {
      eyebrow: String(parsed.eyebrow || fallback.eyebrow).trim(),
      title: String(parsed.title || fallback.title).trim(),
      intro: String(parsed.intro || fallback.intro).trim(),
      sections: sections.length ? sections : fallback.sections,
      closing: String(parsed.closing || fallback.closing || "").trim(),
    }
  } catch {
    return fallback
  }
}

export function parseAboutPageContent(rawValue: string | undefined, fallback: AboutPageContent) {
  const base = parseStaticPageContent(rawValue, fallback)
  if (!rawValue?.trim()) return fallback

  try {
    const parsed = JSON.parse(rawValue)
    if (!parsed || typeof parsed !== "object") {
      return fallback
    }

    const staff = Array.isArray(parsed.staff)
      ? parsed.staff
          .map((member: Partial<AboutStaffMember>, index: number) => ({
            id: String(member?.id || `staff-${index + 1}`).trim(),
            name: String(member?.name || "").trim(),
            role: String(member?.role || "").trim(),
            imageUrl: String(member?.imageUrl || "").trim(),
          }))
          .filter((member: AboutStaffMember) => member.name && member.role)
      : fallback.staff

    return {
      ...base,
      introImageUrl: String(parsed.introImageUrl || fallback.introImageUrl || "").trim(),
      staffTitle: String(parsed.staffTitle || fallback.staffTitle).trim(),
      staffIntro: String(parsed.staffIntro || fallback.staffIntro).trim(),
      staff: staff.length ? staff : fallback.staff,
    }
  } catch {
    return fallback
  }
}
