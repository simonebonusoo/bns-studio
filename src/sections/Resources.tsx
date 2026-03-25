import { Container } from "../components/Container"
import { SectionTitle } from "../components/SectionTitle"
import { Reveal } from "../components/Reveal"
import { motion } from "framer-motion"

const resources = [
  {
    title: "Curriculum vitae",
    desc: "CV personale aggiornato a Gennaio 2026.",
    cta: "Scarica",
    href: "/downloads/cv.pdf",
    download: true,
  },
  {
    title: "Portfolio",
    desc: "Selezione di lavori e case study in formato PDF.",
    cta: "Scarica",
    href: "/downloads/portfolio.pdf",
    download: true,
  },
]

export function Resources() {
  return (
    <section id="risorse" className="py-20 md:py-28">
      <Container>
        <Reveal>
          <SectionTitle eyebrow="Risorse" title="Materiali da scaricare.">
            CV e Portfolio pronti da scaricare per presentazioni e contatti professionali.
          </SectionTitle>
        </Reveal>

        <div className="mt-10 grid md:grid-cols-2 gap-5">
          {resources.map((r, i) => (
            <Reveal key={r.title} delay={0.05 * i}>
              <motion.a
                href={r.href}
                download={r.download}
                target="_blank"
                rel="noreferrer"
                className="glass rounded-2xl p-6 shadow-card hover:border-white/20 transition block"
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 320, damping: 24 }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-lg font-semibold">
                      {r.title}
                    </div>
                    <p className="mt-2 text-white/70">
                      {r.desc}
                    </p>
                  </div>

                  <span className="text-sm text-white/70 whitespace-nowrap">
                    {r.cta} →
                  </span>
                </div>
              </motion.a>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  )
}