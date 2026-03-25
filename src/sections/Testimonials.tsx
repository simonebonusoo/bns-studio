import { motion } from "framer-motion"
import { Container } from "../components/Container"
import { Reveal } from "../components/Reveal"
import { SectionTitle } from "../components/SectionTitle"

type Review = {
  name: string
  text: string
  rating?: number
  meta?: string
}

const BRAND = "#e3f503"

const reviews: Review[] = [
  {
    name: "Bacino Grande",
    text: "Veloce, trasparente e con una cura maniacale dei dettagli. Brand identity in tempi record.",
    rating: 5,
    meta: "Brand & Social",
  },
  {
    name: "Umani Project",
    text: "Estetica essenziale ma super caratteristica per il nostro progetto. Conversioni in crescita già dalla prima settimana.",
    rating: 5,
    meta: "Instagram & Spotify",
  },
  {
    name: "BR Service",
    text: "Struttura del sito web molto chiara, stampe precise e assistenza sempre presente. Consigliatissimo.",
    rating: 5,
    meta: "Website & Stampe",
  },
  {
    name: "Samurai - Barber Shop",
    text: "Finalmente un logo coerente e professionale. Comunicazione semplice e risultati concreti.",
    rating: 5,
    meta: "Creazione logo",
  },
  {
    name: "Monnalisa",
    text: "Top la creazione del logo con varie dimensioni per le stampe. Locandine studiate per la nostra nuova brand identity",
    rating: 5,
    meta: "Logo & locandine eventi",
  },
  {
    name: "Clouteq",
    text: "Brand identity minimal e pulita come da richiesta. Gestione social efficiente, puntuale e precisa nelle scadenze",
    rating: 5,
    meta: "Brand identity & Social",
  },
  {
    name: "Il Terzo Spazio",
    text: "Ottimo il logo versatile sia in digitale che nelle stampe. Ci siamo affidati anche per la gestione del nostro profilo Instagram, consigliatissimo",
    rating: 5,
    meta: "Logo & Gestione social",
  },
]

function Stars({ n = 5 }: { n?: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: n }).map((_, i) => (
        <span
          key={i}
          className="inline-block h-1.5 w-1.5 rounded-full bg-[#e3f503]/90"
          aria-hidden
        />
      ))}
      <span className="ml-2 text-xs text-white/55">{n}.0</span>
    </div>
  )
}

export function Testimonials() {
  const row = [...reviews, ...reviews]

  return (
    <section id="recensioni" className="py-20 md:py-28">
      <Container>
        <Reveal>
          <SectionTitle eyebrow="Recensioni clienti" title="Esperienze reali di chi ha acquistato.">
            Una selezione di feedback raccolti dai clienti che hanno già scelto BNS Studio.
          </SectionTitle>
        </Reveal>

        {/* entrance wrapper */}
        <motion.div
          className="mt-10 relative overflow-hidden"
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        >
          <div className="pointer-events-none absolute inset-y-0 left-0 w-20 z-10 bg-gradient-to-r from-[#0b0b0c] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-20 z-10 bg-gradient-to-l from-[#0b0b0c] to-transparent" />

          <motion.div
            className="flex gap-4 md:gap-6 w-max"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 34, ease: "linear", repeat: Infinity }}
          >
            {row.map((r, idx) => (
              <article
                key={`${r.name}-${idx}`}
                className="glass rounded-2xl p-6 shadow-card w-[320px] md:w-[380px]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-sm font-semibold text-white/85">
                      {r.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{r.name}</div>
                      <div className="text-sm text-white/60 truncate">{r.meta}</div>
                    </div>
                  </div>
                  <Stars n={r.rating ?? 5} />
                </div>

                <p className="mt-4 text-sm md:text-[15px] leading-relaxed text-white/75">
                  “{r.text}”
                </p>

                <div className="mt-5 flex items-center gap-2 text-xs text-white/55">
                  <span className="h-1 w-1 rounded-full bg-white/35" />
                  <span>Progetto consegnato</span>
                  <span className="h-1 w-1 rounded-full bg-white/35" />
                  <span className="text-[#e3f503]/90">Supporto attivo</span>
                </div>
              </article>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          className="mt-8 flex justify-center"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 }}
        >
          <div className="rounded-full border border-white/12 bg-black/30 px-4 py-2 text-xs text-white/65">
            Media <span className="text-[#e3f503]">5.0</span> • Risposte rapide • Delivery pulito
          </div>
        </motion.div>
      </Container>
    </section>
  )
}
