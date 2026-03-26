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
    <main className="pb-20 pt-24 md:pb-28 md:pt-28">
      <Container>
        <div className="mb-6">
          <Link to="/" className="text-sm text-white/55 transition hover:text-white">
            ← Torna alla home
          </Link>
        </div>

        <article className="glass overflow-hidden rounded-2xl shadow-card">
          <div className="grid gap-8 border-b border-white/10 p-7 md:p-8 xl:grid-cols-[minmax(0,1.05fr)_420px]">
            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-white/45">Chi sono</div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">
                Dietro BNS Studio c&apos;è una ricerca visiva personale, concreta e molto intenzionale.
              </h1>
              <p className="mt-4 max-w-3xl leading-relaxed text-white/72">
                BNS Studio nasce dal desiderio di costruire oggetti grafici che non sembrino generici:
                poster, stampe e collezioni visive pensate per chi vuole portare nello spazio quotidiano
                un&apos;identità netta, contemporanea e riconoscibile.
              </p>
              <p className="mt-4 max-w-3xl leading-relaxed text-white/72">
                Il progetto tiene insieme due cose: gusto editoriale e attenzione al dettaglio pratico.
                Ogni uscita deve funzionare sia come immagine forte sia come prodotto reale, leggibile
                e ben costruito, pronto a vivere su una parete, una scrivania o nello spazio di chi lo sceglie.
              </p>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4">
              <div className="flex aspect-[4/5] items-end rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(227,245,3,0.16),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-white/45">Founder portrait</p>
                  <p className="mt-2 max-w-xs text-sm leading-6 text-white/65">
                    Blocco immagine pronto per inserire una tua foto personale o uno scatto di studio,
                    mantenendo la composizione editoriale già coerente con la pagina.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-8 p-7 md:p-8 xl:grid-cols-3">
            <section>
              <h2 className="text-lg font-semibold text-white/90">Come lavoro</h2>
              <p className="mt-3 leading-relaxed text-white/72">
                Il focus non è produrre tanti elementi diversi, ma costruire pochi pezzi chiari,
                ben composti e facili da ricordare. Il catalogo BNS Studio cresce con questa logica:
                collezioni coerenti, ritmo visivo e prodotti pensati per durare oltre l&apos;effetto del momento.
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
              <p className="mt-3 leading-relaxed text-white/72">
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

            <section>
              <h2 className="text-lg font-semibold text-white/90">Cosa cerco di costruire con BNS Studio</h2>
              <p className="mt-3 leading-relaxed text-white/72">
                Più che un catalogo indistinto, voglio costruire un archivio di pezzi con carattere:
                prodotti che stiano bene insieme, che abbiano un ritmo comune e che facciano percepire
                subito un immaginario chiaro, senza rumore superfluo.
              </p>
              <p className="mt-4 leading-relaxed text-white/72">
                L&apos;idea è far crescere BNS Studio come un progetto personale ma credibile, dove ogni
                poster, stampa o oggetto entra in collezione solo se regge davvero per qualità visiva,
                presenza e coerenza.
              </p>
            </section>
          </div>

          <div className="border-t border-white/10 p-7 md:p-8">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/#shop">
                <Button>Apri lo shop</Button>
              </Link>
              <Link to="/#recensioni">
                <Button variant="ghost">Leggi le recensioni</Button>
              </Link>
            </div>
          </div>
        </article>
      </Container>
    </main>
  )
}
