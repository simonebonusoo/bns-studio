import { Container } from "../components/Container"

export function AboutMePage() {
  return (
    <main className="pt-32 pb-20">
      <Container>
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.32em] text-white/45">Chi sono</p>
            <h1 className="text-4xl font-semibold text-white sm:text-5xl">Simone Bonuso</h1>
            <p className="max-w-3xl text-base leading-8 text-white/68 sm:text-lg">
              Mi occupo di design visivo, struttura dei contenuti e progetti digitali che devono essere belli, leggibili e concreti da
              usare. Lavoro per ridurre rumore e aumentare chiarezza, sia nei siti sia nei prodotti editoriali.
            </p>
          </div>

          <section className="space-y-4 rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-xl font-semibold text-white">Approccio</h2>
            <p className="text-sm leading-7 text-white/65">
              Preferisco sistemi semplici ma solidi: pochi elementi, gerarchie nette, testo leggibile, immagini che servono davvero e
              una parte tecnica abbastanza ordinata da restare mantenibile nel tempo.
            </p>
            <p className="text-sm leading-7 text-white/65">
              Il risultato che cerco e sempre lo stesso: un progetto chiaro per chi lo guarda e sostenibile per chi lo deve aggiornare.
            </p>
          </section>
        </div>
      </Container>
    </main>
  )
}
