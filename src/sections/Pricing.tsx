import { Container } from "../components/Container"
import { SectionTitle } from "../components/SectionTitle"
import { Reveal } from "../components/Reveal"
import { Button } from "../components/Button"
import clsx from "clsx"

const plans = [
  { name: "Starter", price: "da €490", note: "Per landing semplici e brand set essenziale.",
    features: ["1 pagina (landing)","UI kit base","Animazioni leggere","SEO base","Consegna rapida"] },
  { name: "Studio", price: "da €1.490", note: "Il migliore per aziende e creator che vogliono qualità.",
    features: ["Sito 4–6 pagine","Brand kit completo","Componenti riutilizzabili","Analytics + SEO","Supporto 30 giorni"], highlight: true },
  { name: "Custom", price: "su preventivo", note: "Progetti complessi: e‑commerce, CMS, automazioni.",
    features: ["Architettura su misura","CMS / e‑commerce","Motion avanzato","Integrazioni/API","Maintenance"] },
]

export function Pricing(){
  return (
    <section id="prezzi" className="py-20 md:py-28">
      <Container>
        <Reveal>
          <SectionTitle eyebrow="Prezzi" title="Trasparenza, prima di tutto.">
            Prezzi indicativi: il preventivo finale dipende da contenuti, numero pagine e integrazioni. Nessuna sorpresa.
          </SectionTitle>
        </Reveal>

        <div className="mt-10 grid lg:grid-cols-3 gap-5">
          {plans.map((p, idx) => (
            <Reveal key={p.name} delay={0.05 * idx}>
              <div className={clsx("rounded-2xl p-6 shadow-card border", p.highlight ? "bg-white/[0.06] border-white/25" : "glass border-white/10")}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-lg font-semibold">{p.name}</div>
                    <div className="mt-2 text-3xl font-semibold tracking-tight">{p.price}</div>
                  </div>
                  {p.highlight ? <div className="text-xs px-2.5 py-1 rounded-full bg-white text-black font-medium">Consigliato</div> : null}
                </div>
                <p className="mt-3 text-white/70">{p.note}</p>

                <ul className="mt-6 space-y-2 text-sm text-white/70">
                  {p.features.map(f => (
                    <li key={f} className="flex gap-2"><span className="text-white/55">✓</span><span>{f}</span></li>
                  ))}
                </ul>

                <div className="mt-7">
                  <Button href="#contatti" variant={p.highlight ? "primary" : "ghost"} className="w-full">Parliamone</Button>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  )
}
