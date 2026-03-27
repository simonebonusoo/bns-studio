import { Container } from "../components/Container"

export function PrivacyPolicyPage() {
  return (
    <main className="pt-32 pb-20">
      <Container>
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.32em] text-white/45">Privacy</p>
            <h1 className="text-4xl font-semibold text-white sm:text-5xl">Privacy Policy</h1>
            <p className="text-base leading-8 text-white/68 sm:text-lg">
              Questa pagina riassume in modo semplice i dati trattati dal sito e dallo shop integrato.
            </p>
          </div>

          <section className="space-y-5 rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
            <div>
              <h2 className="text-lg font-semibold text-white">Dati raccolti</h2>
              <p className="mt-2 text-sm leading-7 text-white/65">
                Il sito puo raccogliere dati inviati volontariamente tramite form di contatto, autenticazione shop, ordini e gestione
                account. Nello shop vengono inoltre registrate informazioni necessarie a pagamento, spedizione e storico ordini.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white">Finalita</h2>
              <p className="mt-2 text-sm leading-7 text-white/65">
                I dati sono usati per rispondere alle richieste, gestire il catalogo, completare gli acquisti, emettere ricevute e
                mantenere operativo il servizio.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white">Contatti</h2>
              <p className="mt-2 text-sm leading-7 text-white/65">
                Per richieste relative ai dati personali puoi scrivere a <a className="text-white underline underline-offset-4" href="mailto:bnsstudio@gmail.com">bnsstudio@gmail.com</a>.
              </p>
            </div>
          </section>
        </div>
      </Container>
    </main>
  )
}
