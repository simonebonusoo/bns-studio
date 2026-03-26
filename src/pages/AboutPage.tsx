import { Link } from "react-router-dom"

import { Container } from "../components/Container"
import { Button } from "../components/Button"

const DOT = (
  <span aria-hidden className="text-[#e3f503] leading-none translate-y-[2px]">
    •
  </span>
)

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2 text-white/75">
          {DOT}
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export function AboutPage() {
  return (
    <main className="pt-24 pb-20 md:pt-28 md:pb-28">
      <Container>
        <div className="mx-auto max-w-6xl">
          <div className="mb-6">
            <Link to="/" className="text-sm text-white/55 transition hover:text-white">
              ← Torna alla home
            </Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            <article className="glass overflow-hidden rounded-2xl shadow-card">
              <div className="grid gap-8 p-7 md:p-8 lg:grid-cols-[1.05fr_0.95fr]">
                <div>
                  <div className="text-xs uppercase tracking-[0.25em] text-white/45">Chi sono</div>
                  <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">
                    Dietro BNS Studio c&apos;è una ricerca visiva precisa, personale e concreta.
                  </h1>
                  <p className="mt-4 text-white/72 leading-relaxed">
                    BNS Studio nasce dal desiderio di costruire oggetti grafici che non sembrino generici:
                    poster, stampe e collezioni visive pensate per chi vuole portare nello spazio quotidiano
                    un&apos;identità netta, contemporanea e riconoscibile.
                  </p>
                  <p className="mt-4 text-white/72 leading-relaxed">
                    Il progetto tiene insieme due cose: gusto editoriale e cura del dettaglio pratico.
                    Ogni uscita deve funzionare sia come immagine forte sia come prodotto reale, leggibile,
                    acquistabile e adatto a case, studi creativi, scrivanie e ambienti personali.
                  </p>
                </div>

                <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex aspect-[4/5] items-end rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(227,245,3,0.16),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-5">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-white/45">Founder portrait</p>
                      <p className="mt-2 max-w-xs text-sm leading-6 text-white/65">
                        Spazio pronto per una tua immagine personale o uno scatto di studio, così la pagina
                        può diventare ancora più autentica senza cambiare struttura.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10 p-7 md:p-8">
                <div className="grid gap-8 lg:grid-cols-2">
                  <section>
                    <h2 className="text-lg font-semibold text-white/90">Come lavoro</h2>
                    <p className="mt-3 text-white/72 leading-relaxed">
                      Il focus non è produrre tanti elementi diversi, ma costruire pochi pezzi chiari,
                      ben composti e facili da ricordare. Il catalogo BNS Studio cresce con questa logica:
                      collezioni coerenti, ritmo visivo e prodotti pensati per durare.
                    </p>
                    <div className="mt-4">
                      <BulletList
                        items={[
                          "Direzione visiva compatta e riconoscibile.",
                          "Prodotti costruiti per vivere bene nello spazio fisico.",
                          "Attenzione a stampa, impatto visivo e coerenza di collezione.",
                        ]}
                      />
                    </div>
                  </section>

                  <section>
                    <h2 className="text-lg font-semibold text-white/90">Per chi è pensato BNS Studio</h2>
                    <p className="mt-3 text-white/72 leading-relaxed">
                      Per chi ama visual essenziali ma non freddi, per chi cerca un regalo con personalità,
                      per chi vuole appendere o appoggiare nello studio un oggetto che racconti un gusto preciso.
                    </p>
                    <div className="mt-4">
                      <BulletList
                        items={[
                          "Creativi e designer che vogliono pezzi con un linguaggio definito.",
                          "Persone che arredano piccoli spazi con oggetti curati.",
                          "Chi cerca poster e stampe più editoriali che decorative.",
                        ]}
                      />
                    </div>
                  </section>
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link to="/#shop">
                    <Button>Apri lo shop</Button>
                  </Link>
                  <Link to="/#recensioni">
                    <Button variant="ghost">Leggi le recensioni</Button>
                  </Link>
                </div>
              </div>
            </article>

            <aside className="glass rounded-2xl p-6 shadow-card md:p-7">
              <div className="text-xs uppercase tracking-[0.25em] text-white/45">In breve</div>

              <div className="mt-4 space-y-3">
                {[
                  ["Progetto", "BNS Studio"],
                  ["Focus", "Poster, stampe, gadget creativi"],
                  ["Approccio", "Editoriale, minimale, riconoscibile"],
                  ["Obiettivo", "Prodotti visivi con identità forte"],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-start justify-between gap-4">
                    <div className="text-sm text-white/55">{label}</div>
                    <div className="text-right text-sm text-white/85">{value}</div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                <p className="text-sm leading-7 text-white/68">
                  Questa pagina è pensata per essere arricchita facilmente con immagini founder,
                  dettagli del processo e contenuti più personali senza cambiare il layout.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </Container>
    </main>
  )
}
