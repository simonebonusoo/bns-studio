import { Container } from "../components/Container"

export function AboutPage() {
  return (
    <main className="pt-32 pb-20">
      <Container>
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.32em] text-white/45">Chi siamo</p>
            <h1 className="text-4xl font-semibold text-white sm:text-5xl">BNS Studio</h1>
            <p className="max-w-3xl text-base leading-8 text-white/68 sm:text-lg">
              BNS Studio sviluppa identita visive, pagine editoriali e prodotti digitali con una direzione chiara: mettere ordine,
              carattere e coerenza tra brand, contenuti e presenza online.
            </p>
          </div>

          <section className="grid gap-6 md:grid-cols-2">
            <article className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-xl font-semibold text-white">Come lavoriamo</h2>
              <p className="mt-3 text-sm leading-7 text-white/65">
                Ogni progetto parte da struttura, priorita e tono visivo. Prima definiamo il messaggio, poi costruiamo il sistema:
                layout, gerarchia, immagini, testi e strumenti pratici da usare davvero nel lavoro quotidiano.
              </p>
            </article>

            <article className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-xl font-semibold text-white">Cosa seguiamo oggi</h2>
              <p className="mt-3 text-sm leading-7 text-white/65">
                Siti vetrina, landing page, contenuti editoriali, identita coordinate e il catalogo shop integrato, con attenzione alla
                parte operativa: aggiornamento contenuti, immagini, vendita e gestione amministrativa.
              </p>
            </article>
          </section>
        </div>
      </Container>
    </main>
  )
}
