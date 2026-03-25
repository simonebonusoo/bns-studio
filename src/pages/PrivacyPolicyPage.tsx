import { Container } from "../components/Container"

export function PrivacyPolicyPage() {
  return (
    <main className="pt-20 pb-28">
      <Container>
        {/* HEADER */}
        <header className="mb-6">
          <div className="text-xs tracking-[.22em] uppercase text-white/45">
            Legal
          </div>

          <h1 className="mt-1 text-3xl md:text-4xl font-semibold text-white tracking-tight">
            Privacy Policy
          </h1>

          <p className="mt-1 text-sm text-white/45">
            Ultimo aggiornamento: Gennaio 2026
          </p>
        </header>

        {/* CONTENT */}
        <section className="glass rounded-2xl p-6 md:p-8 shadow-card">
          <div className="legal">
            <h2>Introduzione</h2>
            <p>
              La presente Privacy Policy spiega in modo chiaro come{" "}
              <strong>BNS Studio</strong> tratta i dati personali degli utenti che
              visitano questo sito web.
            </p>
            <p>
              La navigazione del sito è possibile senza fornire dati personali,
              salvo i casi in cui l’utente decida volontariamente di contattare
              BNS Studio tramite i canali messi a disposizione.
            </p>

            <h2>Tipologia di dati trattati</h2>

            <h3>Dati forniti volontariamente dall’utente</h3>
            <p>
              BNS Studio raccoglie esclusivamente i dati che l’utente sceglie di
              fornire in modo esplicito, ad esempio:
            </p>
            <ul>
              <li>nome e cognome</li>
              <li>indirizzo email</li>
              <li>contenuto dei messaggi inviati tramite i contatti</li>
            </ul>
            <p>
              Questi dati vengono utilizzati unicamente per rispondere alle
              richieste ricevute e non vengono ceduti a terzi.
            </p>

            <h3>Dati di navigazione</h3>
            <p>
              Durante la normale navigazione del sito non vengono raccolti dati
              personali identificativi a fini statistici, di profilazione o di
              marketing.
            </p>

            <h2>Cookie</h2>

            <h3>Utilizzo dei cookie</h3>
            <p>
              Questo sito utilizza esclusivamente{" "}
              <strong>cookie tecnici essenziali</strong>, necessari al corretto
              funzionamento del sito.
            </p>
            <p>
              Non vengono utilizzati cookie di profilazione, marketing o
              tracciamento avanzato.
            </p>

            <h3>Gestione dei cookie</h3>
            <p>
              L’utente può gestire o disabilitare i cookie tramite le impostazioni
              del proprio browser. La disattivazione dei cookie tecnici potrebbe
              compromettere alcune funzionalità del sito.
            </p>

            <h2>Servizi di terze parti</h2>
            <p>
              Attualmente il sito non utilizza servizi di analisi esterni né
              strumenti di monitoraggio del comportamento degli utenti.
            </p>

            <h2>Finalità del trattamento</h2>
            <p>I dati vengono trattati esclusivamente per:</p>
            <ul>
              <li>rispondere alle richieste di informazioni</li>
              <li>gestire contatti professionali</li>
              <li>avviare comunicazioni su richiesta dell’utente</li>
            </ul>

            <h2>Conservazione dei dati</h2>
            <p>
              I dati personali vengono conservati solo per il tempo strettamente
              necessario a gestire la richiesta dell’utente.
            </p>

            <h2>Sicurezza dei dati</h2>
            <p>
              BNS Studio adotta misure tecniche e organizzative adeguate per
              proteggere i dati personali. Tuttavia, nessun sistema informatico è
              sicuro al 100%.
            </p>

            <h2>Diritti dell’utente</h2>
            <p className="muted">
              In conformità al Regolamento UE 2016/679 (GDPR), l’utente ha il
              diritto di:
            </p>
            <ul>
              <li>accedere ai propri dati personali</li>
              <li>richiederne la rettifica</li>
              <li>richiederne la cancellazione</li>
              <li>limitare il trattamento</li>
              <li>opporsi al trattamento</li>
            </ul>

            <h2>Modifiche alla Privacy Policy</h2>
            <p>
              La presente informativa può essere aggiornata in qualsiasi momento.
              Le modifiche saranno pubblicate su questa pagina.
            </p>

            <h2>Contatti</h2>
            <p>
              Per qualsiasi domanda relativa a questa Privacy Policy, è possibile
              contattare BNS Studio tramite il form presente nella sezione
              Contatti del sito.
            </p>
          </div>
        </section>
      </Container>
    </main>
  )
}