import { Container } from "../components/Container"
import { SectionTitle } from "../components/SectionTitle"
import { Reveal } from "../components/Reveal"
import { Button } from "../components/Button"

export function Contact() {
  return (
    <section id="contatti" className="py-20 md:py-28">
      <Container>
        {/* Layout FIX: 2 colonne reali su desktop */}
        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          <Reveal>
            <div className="min-w-0">
              <SectionTitle eyebrow="Contatti" title="Raccontaci il progetto.">
                Due domande e siamo operativi: cosa vuoi ottenere e quando ti serve.
              </SectionTitle>

              <div className="mt-6 text-sm text-white/70 space-y-2">
                <div>• Risposta in 24h</div>
                <div>• Preventivo chiaro</div>
                <div>• Roadmap + milestone</div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <form
              className="min-w-0 w-full glass rounded-2xl p-6 shadow-card"
              onSubmit={(e) => {
                e.preventDefault()
                alert("Demo: collega questo form a un backend (email/CRM).")
              }}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm text-white/70">
                  Nome
                  <input
                    name="name"
                    autoComplete="name"
                    className="mt-2 w-full rounded-xl bg-black/40 border border-white/12 px-4 py-2 outline-none focus:border-white/25"
                    placeholder="Mario Rossi"
                  />
                </label>

                <label className="text-sm text-white/70">
                  Email
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    className="mt-2 w-full rounded-xl bg-black/40 border border-white/12 px-4 py-2 outline-none focus:border-white/25"
                    placeholder="nome@email.com"
                  />
                </label>
              </div>

              <label className="mt-4 block text-sm text-white/70">
                Cosa ti serve?
                <select
                  name="need"
                  className="mt-2 w-full rounded-xl bg-black/40 border border-white/12 px-4 py-2 outline-none focus:border-white/25"
                  defaultValue="Landing page"
                >
                  <option>Landing page</option>
                  <option>Sito multi-pagina</option>
                  <option>Branding / Logo</option>
                  <option>E-commerce</option>
                  <option>Altro</option>
                </select>
              </label>

              <label className="mt-4 block text-sm text-white/70">
                Dettagli
                <textarea
                  name="details"
                  rows={6}
                  className="mt-2 w-full rounded-xl bg-black/40 border border-white/12 px-4 py-2 outline-none focus:border-white/25"
                  placeholder="Obiettivo, riferimento, pagine, contenuti, scadenza..."
                />
              </label>

              <div className="mt-5 flex flex-col sm:flex-row gap-3">
                <Button type="submit">Invia richiesta</Button>
                <Button href="mailto:hello@bns.studio" variant="ghost">
                  Scrivi via email
                </Button>
              </div>

              <div className="mt-3 text-xs text-white/55">
                * Questo form è demo. Puoi collegarlo a EmailJS, Formspree o a un backend custom.
              </div>
            </form>
          </Reveal>
        </div>
      </Container>
    </section>
  )
}