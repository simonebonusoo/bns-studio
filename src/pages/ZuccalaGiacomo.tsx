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

export function ZuccalaGiacomo() {
  return (
    <CaseStudyLayout
      title="Zuccalà Giacomo SRL"
      subtitle="Proposta di rebranding per un’impresa di costruzioni specializzata in ristrutturazioni, nuove costruzioni e impianti."
      chips={[
        "Rebranding",
        "Logo design",
        "Identità visiva",
        "Immagine coordinata",
        "Materiali da cantiere",
      ]}
      stats={[
        { label: "Attività", value: "Edilizia e costruzioni" },
        { label: "Area", value: "Provincia di Lecce" },
        { label: "Focus", value: "Identità visiva e riconoscibilità" },
        { label: "Output", value: "Brand + Materiali operativi" },
      ]}
      cta={{
        label: "Scarica PDF",
        href: "/case-studies/zuccala-giacomo.pdf",
        download: true,
      }}
    >
      <section>
        <h2 className="text-lg font-semibold text-white/90">
          Il cliente e la sua visione
        </h2>
        <p className="mt-2">
          Zuccalà Giacomo SRL è un’impresa di costruzioni attiva nel settore delle
          ristrutturazioni, delle nuove costruzioni e degli impianti di rilievo.
          Un’azienda solida, con esperienza sul campo, che lavora ogni giorno in
          contesti pratici e operativi, dove affidabilità e chiarezza sono
          fondamentali.
        </p>
        <p className="mt-2">
          L’obiettivo della proposta era rafforzare l’identità visiva del brand,
          rendendola più attuale e riconoscibile, senza perdere il legame con la
          storia e i valori già presenti nell’azienda.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white/90">
          La richiesta
        </h2>
        <p className="mt-2">
          La proposta di rebranding nasce dall’esigenza di aggiornare l’immagine
          aziendale, rendendola più moderna e versatile, ma allo stesso tempo
          coerente con il settore edilizio e con l’identità già esistente.
        </p>

        <BulletList
          items={[
            "Rinnovare l’immagine mantenendo continuità con il brand storico.",
            "Creare un logo più riconoscibile e strutturato.",
            "Sviluppare un’identità visiva utilizzabile su ogni supporto.",
            "Applicare il brand a materiali pratici e di uso quotidiano.",
          ]}
        />
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white/90">
          Il nostro approccio
        </h2>
        <p className="mt-2">
          Il rebranding è stato pensato partendo dagli elementi già esistenti,
          reinterpretandoli in chiave contemporanea e funzionale.
        </p>

        <h3 className="mt-4 text-base font-semibold text-white/90">
          1) Colore e continuità visiva
        </h3>
        <BulletList
          items={[
            "Mantenimento del celeste storico come colore principale.",
            "Trasformazione del colore in una tonalità pastello più moderna.",
            "Maggiore versatilità su supporti digitali e fisici.",
          ]}
        />

        <h3 className="mt-4 text-base font-semibold text-white/90">
          2) Logo e pittogramma
        </h3>
        <BulletList
          items={[
            "Integrazione delle iniziali “Z” e “G”.",
            "Composizione di una casa stilizzata come simbolo del brand.",
            "Segno semplice, solido e facilmente riconoscibile.",
          ]}
        />

        <h3 className="mt-4 text-base font-semibold text-white/90">
          3) Tipografia e immagine coordinata
        </h3>
        <BulletList
          items={[
            "Tipografia lineare e leggibile.",
            "Contrasto tra carattere, colore e pittogramma.",
            "Stile contemporaneo, mai eccessivo o banale.",
          ]}
        />
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white/90">
          Applicazioni del brand
        </h2>
        <BulletList
          items={[
            "Accessori da cantiere.",
            "Portachiavi e materiali promozionali.",
            "Insegne e segnaletica.",
            "Modulistica e supporti operativi.",
          ]}
        />
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white/90">
          Risultati e benefici
        </h2>
        <BulletList
          items={[
            "Identità più moderna e coerente.",
            "Maggiore riconoscibilità del brand.",
            "Immagine professionale e solida.",
            "Sistema visivo pronto per crescere nel tempo.",
          ]}
        />

        <p className="mt-3">
          La proposta di rebranding per Zuccalà Giacomo SRL fornisce una base
          visiva solida e funzionale, capace di rappresentare l’azienda in modo
          chiaro, professionale e riconoscibile in ogni contesto operativo.
        </p>
      </section>
    </CaseStudyLayout>
  )
}