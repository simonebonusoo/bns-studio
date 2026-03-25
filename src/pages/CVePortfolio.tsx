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

export function CVePortfolio() {
  return (
    <CaseStudyLayout
      title="CV e Portfolio"
      subtitle="Una pagina dedicata al download dei materiali e al contatto rapido — CV, portfolio e richiesta preventivo."
      chips={["CV", "Portfolio", "Download", "Presentazione"]}
      stats={[
        { label: "Tipo", value: "Pagina personale" },
        { label: "Focus", value: "Download materiali" },
        { label: "Output", value: "PDF + contatto" },
        { label: "Uso", value: "Candidature e clienti" },
      ]}
      cta={{ label: "Scarica CV", href: "/downloads/cv.pdf", download: true }}
      cta2={{
        label: "Scarica Portfolio",
        href: "/downloads/portfolio.pdf",
        download: true,
      }}
    >
      <section>
        <h2 className="text-lg font-semibold text-white/90">Il contesto</h2>
        <p className="mt-2">
          Questa sezione nasce per rendere immediato l’accesso ai materiali
          principali: un CV aggiornato e un portfolio completo, pronti da
          scaricare e condividere.
        </p>
        <p className="mt-2">
          L’obiettivo è ridurre frizioni e passaggi inutili: in pochi secondi
          puoi scaricare i file e, se serve, richiedere un preventivo o avviare
          una collaborazione.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white/90">Cosa include</h2>
        <BulletList
          items={[
            "CV pronto da scaricare e inviare.",
            "Portfolio completo in PDF.",
            "Contatto rapido per richiedere un preventivo.",
          ]}
        />
      </section>
    </CaseStudyLayout>
  )
}