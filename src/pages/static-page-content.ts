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

export const ABOUT_PAGE_SETTINGS_KEY = "staticPage.about"
export const PRIVACY_PAGE_SETTINGS_KEY = "staticPage.privacy"

export const defaultAboutContent: StaticPageContent = {
  eyebrow: "Chi siamo",
  title: "BNS Studio",
  intro:
    "BNS Studio costruisce identita visive, pagine editoriali, prodotti digitali e sistemi shop con una direzione chiara: dare forma a contenuti, brand e strumenti operativi che restano coerenti anche quando crescono.",
  sections: [
    {
      title: "Come lavoriamo",
      body:
        "Partiamo da struttura, priorita e tono. Prima definiamo cosa deve comunicare il progetto, poi costruiamo layout, immagini, testi e flussi pratici. L'obiettivo e creare un sistema leggibile, aggiornabile e utile nel lavoro quotidiano.",
    },
    {
      title: "Cosa facciamo",
      body:
        "Seguiamo siti vetrina, landing page, contenuti editoriali, identita coordinate, cataloghi e shop integrati. Ogni parte viene pensata insieme: esperienza pubblica, gestione contenuti, vendita, amministrazione e continuita visiva.",
    },
    {
      title: "Direzione creativa",
      body:
        "La direzione visiva tiene insieme ritmo, gerarchia, fotografia, tipografia e microcopy. Il risultato non deve sembrare decorazione applicata, ma un linguaggio riconoscibile e sostenibile nel tempo.",
    },
    {
      title: "Sistema shop",
      body:
        "Lo shop integrato e progettato per unire catalogo, carrello, checkout, profilo cliente, ordini e dashboard admin in un flusso unico. La parte estetica e quella operativa lavorano insieme.",
    },
    {
      title: "Metodo",
      body:
        "Preferiamo soluzioni pulite, misurabili e facili da mantenere. Ogni scelta deve avere un motivo: migliorare chiarezza, conversione, gestione interna o percezione del brand.",
    },
    {
      title: "Team e ruoli",
      body:
        "La struttura e organizzata per competenze: direzione creativa, sviluppo del sistema shop, produzione contenuti e cura visuale. I ruoli possono cambiare in base al progetto, mantenendo una responsabilita chiara sul risultato finale.",
    },
  ],
  closing:
    "BNS Studio lavora su progetti digitali che devono essere belli da vedere, semplici da usare e concreti da gestire.",
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
