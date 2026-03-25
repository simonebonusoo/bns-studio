import { CaseStudyLayout } from "./CaseStudyLayout"

const DOT = (
  <span aria-hidden className="text-[#e3f503] leading-none translate-y-[2px]">
    •
  </span>
)

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="mt-3 space-y-2">
      {items.map((b) => (
        <li key={b} className="flex gap-2">
          {DOT}
          <span>{b}</span>
        </li>
      ))}
    </ul>
  )
}

export function AGMViaggi() {
  return (
    <CaseStudyLayout
      title="AGM Viaggi"
      subtitle="Proposta di rebranding per un’agenzia viaggi in provincia di Lecce — nuovo logo, identità visiva e applicazioni per la stampa."
      chips={["Rebranding", "Logo design", "Identità visiva", "Materiali stampa"]}
      stats={[
        { label: "Attività", value: "Agenzia viaggi" },
        { label: "Area", value: "Copertino (LE)" },
        { label: "Focus", value: "Restyling e gadget" },
        { label: "Output", value: "Logo + Brand Identity" },
      ]}
      cta={{ label: "Scarica PDF", href: "/case-studies/agm-viaggi.pdf", download: true }}
    >
      <section>
        <h2 className="text-lg font-semibold text-white/90">Il progetto e la sua visione</h2>
        <p className="mt-2">
          AGM Viaggi è un’agenzia con sede in provincia di Lecce, attiva nel settore del turismo da oltre dieci anni.
          Con il tempo l’azienda è cresciuta e il brand aveva bisogno di un’immagine più attuale, capace di comunicare
          professionalità e desiderio di esplorare, senza perdere il legame con la sua storia.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white/90">La richiesta</h2>
        <p className="mt-2">
          Il logo precedente non rispecchiava più l’evoluzione dell’azienda, ma conservava colori storici importanti.
          La proposta di rebranding doveva quindi aggiornare il marchio mantenendo continuità visiva.
        </p>

        <BulletList
          items={[
            "Rendere l’identità più moderna e riconoscibile.",
            "Mantenere i colori storici come legame con l’identità originaria.",
            "Creare un marchio che comunicasse viaggio ed esplorazione in modo immediato.",
            "Declinare l’identità su materiali di stampa e supporti aziendali.",
          ]}
        />
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white/90">Il nostro approccio</h2>

        <h3 className="mt-4 text-base font-semibold text-white/90">1) Restyling del logo</h3>
        <BulletList
          items={[
            "Conservazione dei colori storici, resi più coerenti nel nuovo sistema visivo.",
            "Scritta “AGM” attraversata da un aereo in volo.",
            "Simbolo del desiderio di esplorare e dell’idea di movimento.",
          ]}
        />

        <h3 className="mt-4 text-base font-semibold text-white/90">2) Identità visiva coordinata</h3>
        <BulletList
          items={[
            "Regole chiare per usare logo, colori e stile grafico.",
            "Immagine pulita e professionale, adatta a più contesti.",
            "Coerenza tra comunicazione e materiali fisici.",
          ]}
        />

        <h3 className="mt-4 text-base font-semibold text-white/90">3) Applicazioni per la stampa</h3>
        <BulletList
          items={[
            "Insegne e materiali espositivi.",
            "Tesserini aziendali e supporti interni.",
            "Immagine coordinata riconoscibile e uniforme.",
          ]}
        />
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white/90">Risultati e benefici</h2>
        <BulletList
          items={[
            "Identità più moderna, coerente e professionale.",
            "Marchio immediatamente riconoscibile e legato al tema del viaggio.",
            "Continuità con la storia del brand grazie ai colori mantenuti.",
            "Sistema visivo pronto per essere applicato su più materiali e supporti.",
          ]}
        />
      </section>
    </CaseStudyLayout>
  )
}