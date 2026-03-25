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

export function UmaniProject() {
  return (
    <CaseStudyLayout
      title="Umani Project"
      subtitle="Proposta di rebranding per un podcast che esplora l’essenza dell’essere umano attraverso storie, esperienze e prospettive diverse."
      chips={["Rebranding", "Logo design", "Identità visiva", "Spotify", "Instagram"]}
      stats={[
        { label: "Attività", value: "Podcast" },
        { label: "Area", value: "Milano (MI)" },
        { label: "Conduzione", value: "Giulia Bernardi" },
        { label: "Focus", value: "Identità visiva IG e Spotify" },
      ]}
      cta={{ label: "Scarica PDF", href: "/case-studies/umani-project.pdf", download: true }}
    >
      <section>
        <h2 className="text-lg font-semibold text-white/90">
          Il progetto e la sua visione
        </h2>
        <p className="mt-2">
          Umani Project è un podcast ideato e prodotto da Wannabe Management e
          condotto da Giulia Bernardi, influencer seguita da oltre 125 mila
          persone. Il progetto nasce con l’obiettivo di esplorare l’essenza
          dell’essere umano attraverso storie, esperienze e punti di vista che
          attraversano confini culturali, sociali e personali.
        </p>
        <p className="mt-2">
          Ogni episodio è pensato come uno spazio di ascolto e riflessione, in cui
          le persone diventano il centro del racconto. Il valore del progetto non
          risiede solo nei contenuti, ma nella capacità di creare connessione,
          empatia e riconoscibilità in un panorama digitale spesso veloce e
          dispersivo.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white/90">
          L’obiettivo della proposta
        </h2>
        <p className="mt-2">
          L’obiettivo della proposta di rebranding era costruire un’identità
          visiva più chiara, coerente e riconoscibile, capace di rappresentare in
          modo immediato il valore umano del podcast e di rafforzarne il
          posizionamento sulle piattaforme digitali.
        </p>

        <BulletList
          items={[
            "Rafforzare l’identità del podcast.",
            "Comunicare visivamente il tema dell’umanità.",
            "Creare un sistema visivo coerente e adattabile.",
            "Rendere il progetto riconoscibile su Spotify e Instagram.",
          ]}
        />
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white/90">
          Il concept creativo
        </h2>
        <p className="mt-2">
          Il concept visivo si basa sull’idea di umanità universale. Il segno
          grafico principale è un pittogramma che rappresenta una figura umana
          stilizzata: semplice, essenziale, ma fortemente evocativa.
        </p>
        <p className="mt-2">
          Il simbolo è progettato per adattarsi ai diversi contesti e fondersi con
          il logotipo, diventandone parte integrante. L’identità visiva oscilla
          tra minimalismo e calore, unendo linee pulite a tonalità accoglienti.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white/90">
          Elementi del rebranding
        </h2>

        <h3 className="mt-4 text-base font-semibold text-white/90">
          1) Logo e segno grafico
        </h3>
        <BulletList
          items={[
            "Pittogramma umano stilizzato come elemento centrale.",
            "Integrazione fluida tra simbolo e logotipo.",
            "Design essenziale e facilmente riconoscibile.",
          ]}
        />

        <h3 className="mt-4 text-base font-semibold text-white/90">
          2) Applicazioni digitali
        </h3>
        <BulletList
          items={[
            "Proposta di rebranding per la pagina Spotify.",
            "Copertine episodio coerenti e riconoscibili.",
            "Sistema grafico flessibile per i social.",
          ]}
        />

        <h3 className="mt-4 text-base font-semibold text-white/90">
          3) Instagram e comunicazione
        </h3>
        <BulletList
          items={[
            "Layout puliti per post e stories.",
            "Uso coerente di colori e tipografia.",
            "Immagine coordinata tra contenuti e branding.",
          ]}
        />
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white/90">
          Valore della proposta
        </h2>
        <BulletList
          items={[
            "Identità più forte e memorabile.",
            "Maggiore coerenza tra contenuti e immagine.",
            "Sistema visivo scalabile e adattabile.",
            "Comunicazione più umana, autentica e riconoscibile.",
          ]}
        />

        <p className="mt-3">
          La proposta di rebranding per Umani Project è pensata come una base
          solida su cui costruire una comunicazione riconoscibile nel tempo,
          capace di crescere insieme al progetto e alla sua community.
        </p>
      </section>
    </CaseStudyLayout>
  )
}