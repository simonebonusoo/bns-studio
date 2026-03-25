import { Container } from "../components/Container"
import { SectionTitle } from "../components/SectionTitle"
import { Reveal } from "../components/Reveal"

const items = [
  {
    title: "Graphic design & branding",
    desc:
      "Creo l’identità visiva del tuo brand, rendendolo riconoscibile, coerente e professionale su tutti i canali.",
    bullets: [
      "Creazione o restyling del logo",
      "Colori e stile coordinati",
      "Immagine coordinata per social e web",
      "Materiale grafico per comunicazione",
      "Supporto nella definizione del brand",
    ],
  },
  {
    title: "Creazione siti web",
    desc:
      "Siti web moderni, chiari e facili da usare, pensati per presentare al meglio la tua attività e generare contatti.",
    bullets: [
      "Siti vetrina e landing page",
      "Design moderno e responsive",
      "Navigazione semplice e intuitiva",
      "Ottimizzati per smartphone e desktop",
      "Struttura pensata per Google",
    ],
  },
  {
    title: "Grafica per stampa",
    desc:
      "Progetto materiali stampati personalizzati, pronti per la stampa e coerenti con l’identità del tuo brand.",
    bullets: [
      "Biglietti da visita personalizzati",
      "Brochure, volantini e locandine",
      "Cataloghi e listini",
      "Calendari e materiale promozionale",
      "File pronti per la tipografia",
    ],
  },
] as const

export function Services() {
  return (
    <section id="servizi" className="py-20 md:py-28">
      <Container>
        <Reveal>
          <SectionTitle eyebrow="Servizi" title="Dall’idea al prodotto finito.">
            Soluzioni flessibili: parti da una base e aggiungi solo ciò che serve davvero al tuo progetto.
          </SectionTitle>
        </Reveal>

        <div className="mt-10 grid md:grid-cols-3 gap-5">
          {items.map((s, idx) => (
            <Reveal key={s.title} delay={0.05 * idx}>
              <div className="glass rounded-2xl p-6 shadow-card hover:border-white/20 transition">
                <div className="text-lg font-semibold">{s.title}</div>
                <p className="mt-3 text-white/70 leading-relaxed">{s.desc}</p>

                <ul className="mt-5 space-y-2 text-sm text-white/70">
                  {s.bullets.map((b) => (
                    <li key={b} className="flex gap-2">
                      <span className="text-white/50">•</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  )
}