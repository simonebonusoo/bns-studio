import { Container } from "../components/Container"
import { SectionTitle } from "../components/SectionTitle"
import { Reveal } from "../components/Reveal"

const leftFaq: Array<{ q: string; a: string }> = [
  {
    q: "Quanto tempo serve per un sito?",
    a: "In media 1–4 settimane, in base a contenuti, numero pagine e complessità. Dopo un brief rapido definiamo timeline e milestone.",
  },
  {
    q: "Fate anche solo grafica?",
    a: "Sì. Possiamo occuparci di logo, brand identity, kit social, impaginati e materiali marketing, anche senza sviluppo web.",
  },
]

const rightFaq: Array<{ q: string; a: string }> = [
  {
    q: "Mi fate un preventivo?",
    a: "Sì. Per una proposta precisa, compila la sezione “Raccontaci il tuo progetto” nei “Contatti”: riceverai tempi e costi.",
  },
  {
    q: "Che differenza c’è tra Starter e Studio?",
    a: "Starter è pensato per esigenze rapide; Studio è un percorso più completo (strategia, design su misura, supporto e iterazioni).",
  },
]

export function FAQ() {
  return (
    <section id="faq" className="py-20 md:py-28">
      <Container>
        <Reveal>
          <SectionTitle eyebrow="HELPER 24/7" title="Assistenza guidata.">
            FAQ rapide + chat floating (icona in basso a destra).
          </SectionTitle>
        </Reveal>

        <div className="mt-10">
          <Reveal delay={0.05}>
            <div className="min-w-0 w-full glass rounded-2xl p-6 shadow-card">
              <div className="text-sm text-white/70">FAQ rapide</div>

              {/* GRIGLIA 2×2 */}
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {/* COLONNA SINISTRA */}
                <div className="space-y-3">
                  {leftFaq.map((item) => (
                    <details
                      key={item.q}
                      className="group rounded-xl border border-white/10 bg-black/30 p-4"
                    >
                      <summary className="cursor-pointer list-none flex items-center justify-between gap-3">
                        <span className="font-medium">{item.q}</span>
                        <span className="text-white/55 group-open:rotate-45 transition">+</span>
                      </summary>
                      <p className="mt-3 text-white/70">{item.a}</p>
                    </details>
                  ))}
                </div>

                {/* COLONNA DESTRA */}
                <div className="space-y-3">
                  {rightFaq.map((item) => (
                    <details
                      key={item.q}
                      className="group rounded-xl border border-white/10 bg-black/30 p-4"
                    >
                      <summary className="cursor-pointer list-none flex items-center justify-between gap-3">
                        <span className="font-medium">{item.q}</span>
                        <span className="text-white/55 group-open:rotate-45 transition">+</span>
                      </summary>
                      <p className="mt-3 text-white/70">{item.a}</p>
                    </details>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  )
}