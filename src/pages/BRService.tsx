import { CaseStudyLayout } from "./CaseStudyLayout"

export function BRService() {
  return (
    <CaseStudyLayout
      title="BR Service"
      subtitle="Negozio di elettrodomestici e assistenza a Nardò — sito web, preventivi online, identità visiva e materiali pronti per la stampa."
      chips={["Sito web", "Preventivo online", "Identità visiva", "Grafica per stampa"]}
      stats={[
        { label: "Attività", value: "BR Service" },
        { label: "Area", value: "Nardò (LE)" },
        { label: "Focus", value: "Sito + Preventivi online" },
        { label: "Output", value: "Website + Stampe personalizzate" },
      ]}
      website={{ label: "brservicenardo.it", href: "https://brservicenardo.it" }}
    >
      <section>
        <h2 className="text-lg font-semibold text-white/90">Il cliente e la sua visione</h2>
        <p className="mt-2">
          BR Service è un punto di riferimento a Nardò per chi cerca elettrodomestici, ricambi e assistenza.
          Ogni giorno le persone hanno bisogno di risposte rapide: capire un prodotto, chiedere un consiglio,
          prenotare una riparazione o richiedere un preventivo.
        </p>
        <p className="mt-2">
          L’obiettivo era costruire una presenza online chiara e affidabile, capace di far capire subito cosa fa
          BR Service e di semplificare il primo contatto, soprattutto da smartphone.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white/90">La richiesta del cliente</h2>
        <p className="mt-2">
          Il cliente ci ha chiesto una soluzione semplice, concreta e orientata alle richieste reali che arrivano ogni giorno:
        </p>
        <ul className="mt-3 space-y-2">
          {[
            "Un sito facile da consultare anche da telefono.",
            "Un modo veloce per chiedere un preventivo (sia per acquisti che per riparazioni).",
            "Un’immagine visiva coerente e riconoscibile, online e in negozio.",
            "Materiali pronti per la stampa (biglietti da visita, calendari e supporti promozionali).",
          ].map((b) => (
            <li key={b} className="flex gap-2">
              <span className="text-white/40">•</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white/90">Il nostro approccio</h2>
        <p className="mt-2">
          Abbiamo progettato il sito partendo dalle domande più frequenti e dalle azioni che contano davvero:
          contattare, chiedere un preventivo e capire i servizi in pochi secondi.
        </p>

        <p className="mt-4 font-semibold text-white/90">1) Struttura e contenuti</p>
        <ul className="mt-2 space-y-2">
          {[
            "Pagine essenziali, con informazioni chiare e immediate.",
            "Servizi ben spiegati, senza giri di parole.",
            "Percorsi rapidi per arrivare a contatto e preventivo.",
          ].map((b) => (
            <li key={b} className="flex gap-2">
              <span className="text-white/40">•</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>

        <p className="mt-4 font-semibold text-white/90">2) Preventivo online (guidato)</p>
        <ul className="mt-2 space-y-2">
          {[
            "Un modulo semplice e veloce da compilare.",
            "Domande guidate per ricevere richieste più complete e ordinate.",
            "Pensato per ridurre tempi e incomprensioni tra cliente e negozio.",
          ].map((b) => (
            <li key={b} className="flex gap-2">
              <span className="text-white/40">•</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>

        <p className="mt-4 font-semibold text-white/90">3) Identità visiva e materiali per la stampa</p>
        <ul className="mt-2 space-y-2">
          {[
            "Coerenza tra sito, comunicazione e materiale promozionale.",
            "Supporti pronti per essere stampati e usati subito in negozio.",
            "Stile riconoscibile e ordinato, per dare un’immagine più professionale.",
          ].map((b) => (
            <li key={b} className="flex gap-2">
              <span className="text-white/40">•</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white/90">Risultati e benefici</h2>
        <ul className="mt-3 space-y-2">
          {[
            "Servizi comunicati in modo più chiaro e ordinato.",
            "Richieste di preventivo più complete e meglio strutturate.",
            "Immagine più professionale, sia online che offline.",
            "Base solida e pronta per aggiornamenti futuri.",
          ].map((b) => (
            <li key={b} className="flex gap-2">
              <span className="text-[#e3f503]/90">•</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>

        <p className="mt-3">
          BR Service oggi ha una presenza digitale più chiara e coerente, che aiuta le persone a capire subito cosa offre
          e rende più semplice trasformare una domanda in un contatto reale.
        </p>
      </section>
    </CaseStudyLayout>
  )
}