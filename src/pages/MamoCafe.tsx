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

export function MamoCafe() {
  return (
    <CaseStudyLayout
      title="M’amo Café"
      subtitle="Proposta di rebranding per una caffetteria a Copertino — restyling logo e identità visiva applicata su materiali di comunicazione."
      chips={["Rebranding", "Logo", "Identità visiva", "Packaging", "Menu"]}
      stats={[
        { label: "Attività", value: "Caffetteria" },
        { label: "Area", value: "Copertino (LE)" },
        { label: "Focus", value: "Restyling e immagine coordinata" },
        { label: "Output", value: "Logo + Prodotti fisici" },
      ]}
      cta={{ label: "Scarica PDF", href: "/case-studies/mamo-cafe.pdf", download: true }}
    >
      <section>
        <h2 className="text-lg font-semibold text-white/90">Il cliente e la sua visione</h2>
        <p className="mt-2">
          M’amo Café è una caffetteria attiva nella città di Copertino da oltre dieci anni.
          Con il tempo, però, il vecchio marchio non rispecchiava più l’evoluzione del locale e lo stile
          che voleva comunicare oggi.
        </p>
        <p className="mt-2">
          L’obiettivo della proposta era rinfrescare l’identità visiva mantenendo un legame con la storia
          del brand: stessi colori, ma un design più moderno, fresco e riconoscibile.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white/90">La richiesta</h2>
        <p className="mt-2">
          La proposta di rebranding puntava a creare un sistema visivo coerente e applicabile su tutti i materiali
          usati ogni giorno:
        </p>
        <BulletList
          items={[
            "Mantenere i colori storici, aggiornando stile e leggibilità.",
            "Creare un simbolo riconoscibile e coerente con il nome “M’amo”.",
            "Rendere l’identità applicabile su packaging, divise e insegne.",
            "Costruire un’immagine moderna, professionale ma con carattere.",
          ]}
        />
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white/90">Il concept</h2>
        <p className="mt-2">
          Il nuovo pittogramma fonde un chicco di caffè con un cuore: un gioco visivo che richiama direttamente il nome
          “M’amo” e racconta la passione per il caffè in modo semplice e immediato.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white/90">Applicazioni dell’identità</h2>

        <h3 className="mt-4 text-base font-semibold text-white/90">1) Logo e segno grafico</h3>
        <BulletList
          items={[
            "Restyling più contemporaneo mantenendo i colori storici.",
            "Pittogramma cuore + chicco per un’identità più memorabile.",
            "Stile fresco e pulito, facilmente riconoscibile.",
          ]}
        />

        <h3 className="mt-4 text-base font-semibold text-white/90">2) Materiali di comunicazione</h3>
        <BulletList
          items={[
            "Packaging e materiali per il take-away.",
            "Divise e accessori per lo staff.",
            "Insegne e materiali espositivi.",
            "Menu e supporti informativi.",
          ]}
        />
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white/90">Risultati e benefici</h2>
        <BulletList
          items={[
            "Immagine più moderna senza perdere continuità col passato.",
            "Identità coerente su tutti i supporti, dal packaging alle insegne.",
            "Maggiore riconoscibilità e più “personalità” visiva.",
            "Sistema pronto per crescere e restare consistente nel tempo.",
          ]}
        />
      </section>
    </CaseStudyLayout>
  )
}