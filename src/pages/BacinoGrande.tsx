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

export function BacinoGrande() {
  return (
    <CaseStudyLayout
      title="Bacino Grande"
      subtitle="Proposta di rebranding per lido e ristorante a Porto Cesareo — restyling logo e sistema visivo declinabile."
      chips={["Rebranding", "Logo design", "Identità visiva", "Varianti logo"]}
      stats={[
        { label: "Attività", value: "Lido e Ristorante" },
        { label: "Area", value: "Porto Cesareo (LE)" },
        { label: "Focus", value: "Restyling logo e Brand Identity" },
        { label: "Output", value: "Logo con applicazioni" },
      ]}
      cta={{ label: "Scarica PDF", href: "/case-studies/bacino-grande.pdf", download: true }}
    >
      <section>
        <h2 className="text-lg font-semibold text-white/90">Il cliente e la sua visione</h2>
        <p className="mt-2">
          Bacino Grande è un lido e ristorante a Porto Cesareo, riconoscibile per un elemento unico: prima di entrare,
          l’area è attraversata da una distesa d’acqua che forma una sorta di “oasi”, il bacino da cui prende il nome.
        </p>
        <p className="mt-2">
          L’obiettivo della proposta di rebranding era valorizzare questa caratteristica e trasformarla in un segno
          grafico distintivo, mantenendo un tono moderno, pulito e immediatamente riconoscibile.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white/90">La richiesta del cliente</h2>
        <p className="mt-2">
          La proposta doveva creare un’identità semplice da usare e coerente, capace di funzionare bene su diversi
          supporti e formati:
        </p>

        <BulletList
          items={[
            "Un logo moderno e leggibile, adatto a lido e ristorante.",
            "Un elemento iconico legato al “bacino” per rendere il brand memorabile.",
            "Varianti del marchio (orizzontale e compatta/quadrata) per ogni utilizzo.",
            "Un sistema applicabile a materiali digitali e stampati.",
          ]}
        />
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white/90">Il nostro approccio</h2>
        <p className="mt-2">
          Abbiamo lavorato partendo dall’idea più forte del luogo: il bacino d’acqua come simbolo identitario, integrato
          in un logotipo contemporaneo.
        </p>

        <h3 className="mt-4 text-base font-semibold text-white/90">1) Logotipo + simbolo</h3>
        <BulletList
          items={[
            "Scelta di un font moderno e solido, con personalità.",
            "Sostituzione della “O” con un pittogramma che richiama l’oasi/bacino.",
            "Equilibrio tra riconoscibilità e pulizia del segno.",
          ]}
        />

        <h3 className="mt-4 text-base font-semibold text-white/90">2) Varianti del marchio</h3>
        <BulletList
          items={[
            "Versione orizzontale (rettangolare) per insegne e header.",
            "Versione compatta/quadrata per social, icone e usi ridotti.",
            "Regole di utilizzo per mantenere coerenza tra i formati.",
          ]}
        />

        <h3 className="mt-4 text-base font-semibold text-white/90">3) Sistema visivo applicabile</h3>
        <BulletList
          items={[
            "Impostazione pensata per adattarsi a menù, materiali promozionali e segnaletica.",
            "Coerenza tra logo e applicazioni per rendere il brand più riconoscibile.",
            "Base pronta per estensioni future (pattern, palette, layout).",
          ]}
        />
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white/90">Risultati e benefici</h2>
        <BulletList
          items={[
            "Identità più moderna e distintiva.",
            "Simbolo immediato legato a una caratteristica reale del luogo.",
            "Maggiore flessibilità grazie alle varianti (orizzontale e compatta).",
            "Sistema pronto per comunicazione online e materiali fisici.",
          ]}
        />

        <p className="mt-3">
          Il rebranding trasforma “Bacino Grande” in un segno riconoscibile e coerente, capace di raccontare il luogo in
          un colpo d’occhio e di funzionare in modo ordinato su ogni supporto.
        </p>
      </section>
    </CaseStudyLayout>
  )
}