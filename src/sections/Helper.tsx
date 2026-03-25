import { Container } from "../components/Container"
import { SectionTitle } from "../components/SectionTitle"
import { Reveal } from "../components/Reveal"

const faq: Array<{ q: string; a: string }> = [
  // domanda 1
  {
    q: "Quanto tempo serve per un sito?",
    a: "In media 1–4 settimane, in base a contenuti, numero pagine e complessità. Per una landing spesso 7–14 giorni.",
  },
  // domanda 2
  {
    q: "Fate anche solo grafica?",
    a: "Sì: logo, brand identity/rebranding, social kit, impaginati e materiali marketing.",
  },
  // domanda 3
  {
    q: "Mi fate un preventivo?",
    a: "Certo. Per procedere in modo preciso, compila “Raccontaci il tuo progetto” (sezione Contatti). Riceverai una proposta con tempi e costi.",
  },
  // domanda 4
  {
    q: "Che differenza c’è tra Starter e Studio?",
    a: "Starter: soluzione essenziale (es. landing) con base UI/SEO. Studio: progetto più completo (multi-pagina/brand kit) con deliverable e supporto estesi.",
  },
]

function FaqCard({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-2xl border border-white/10 bg-black/30 p-4">
      <summary className="cursor-pointer list-none flex items-center justify-between gap-3">
        <span className="font-medium">{q}</span>
        <span className="text-white/55 group-open:rotate-45 transition">+</span>
      </summary>
      <p className="mt-3 text-white/70">{a}</p>
    </details>
  )
}

export function Helper() {
  return (
    <section id="helper" className="py-20 md:py-28">
      <Container>
        <Reveal>
          <SectionTitle eyebrow="Helper 24/7" title="Assistenza guidata.">
            FAQ rapide + chat floating (icona in basso a destra).
          </SectionTitle>
        </Reveal>

        {/* SOLO FAQ 2x2 come in grafica */}
        <div className="mt-10 grid gap-6 lg:grid-cols-2 lg:items-start">
          {/* colonna sinistra: domanda 1-2 */}
          <Reveal delay={0.05}>
            <div className="min-w-0 w-full glass rounded-2xl p-6 shadow-card">
              <div className="text-sm text-white/70">FAQ rapide</div>
              <div className="mt-4 space-y-3">
                <FaqCard q={faq[0].q} a={faq[0].a} />
                <FaqCard q={faq[1].q} a={faq[1].a} />
              </div>
            </div>
          </Reveal>

          {/* colonna destra: domanda 3-4 */}
          <Reveal delay={0.1}>
            <div className="min-w-0 w-full glass rounded-2xl p-6 shadow-card">
              <div className="text-sm text-white/70">Domande frequenti</div>
              <div className="mt-4 space-y-3">
                <FaqCard q={faq[2].q} a={faq[2].a} />
                <FaqCard q={faq[3].q} a={faq[3].a} />
              </div>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  )
}