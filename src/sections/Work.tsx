import { Container } from "../components/Container"
import { SectionTitle } from "../components/SectionTitle"
import { Reveal } from "../components/Reveal"
import { motion } from "framer-motion"
import { Link } from "react-router-dom"

const projects = [
  {
    name: "BR Service",
    slug: "br-service",
    tag: "Web / Branding",
    note: "Sito web, brand identity e materiali digitali per negozio di elettrodomestici.",
  },
  {
    name: "Umani Project",
    slug: "umani-project",
    tag: "Rebranding",
    note: "Proposta di rebranding: logo e immagine coordinata per Spotify e Instagram.",
  },
  {
    name: "Zuccalà Giacomo SRL",
    slug: "zuccala-giacomo",
    tag: "Rebranding",
    note: "Proposta di rebranding: logo, identità visiva e applicazioni su materiali operativi.",
  },
  {
    name: "AGM Viaggi",
    slug: "agm-viaggi",
    tag: "Rebranding",
    note: "Proposta di rebranding: logo, identità visiva e materiali stampati coordinati.",
  },
  {
    name: "M’amo Café",
    slug: "mamo-cafe",
    tag: "Rebranding",
    note: "Proposta di rebranding: logo e immagine coordinata applicata a packaging, menu e materiali.",
  },
  {
    name: "Bacino Grande",
    slug: "bacino-grande",
    tag: "Rebranding",
    note: "Proposta di rebranding: logo moderno con simbolo “bacino” e varianti per ogni formato.",
  },
]

export function Work() {
  return (
    <section id="portfolio" className="py-20 md:py-28">
      <Container>
        <Reveal>
          <SectionTitle eyebrow="Portfolio" title="Lavori selezionati.">
            Alcuni progetti reali seguiti dall’idea iniziale fino al risultato finale.
          </SectionTitle>
        </Reveal>

        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((p, i) => (
            <Reveal key={p.slug} delay={0.04 * i}>
              <motion.div
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 320, damping: 24 }}
              >
                <Link
                  to={`/case/${p.slug}`}
                  className="group glass rounded-2xl overflow-hidden shadow-card hover:border-white/20 transition block"
                >
                  <div className="aspect-[16/10] bg-gradient-to-br from-white/10 via-white/[0.02] to-transparent p-5">
                    <div className="text-xs uppercase tracking-[.18em] text-white/55">
                      {p.tag}
                    </div>
                    <div className="mt-2 text-lg font-semibold">
                      {p.name}
                    </div>
                    <div className="mt-3 text-sm text-white/70">
                      {p.note}
                    </div>
                  </div>

                  <div className="px-5 py-4 border-t border-white/10 flex items-center justify-between">
                    <span className="text-sm text-white/70">
                      Apri case study
                    </span>
                    <span className="text-white/55 group-hover:text-white transition">
                      →
                    </span>
                  </div>
                </Link>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  )
}