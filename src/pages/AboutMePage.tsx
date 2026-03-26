import { FormEvent, useState } from "react"
import { Link } from "react-router-dom"

import { Button } from "../components/Button"
import { Container } from "../components/Container"
import founderPortrait from "../assets/founder/simone-centrale.jpeg"
import { apiFetch } from "../shop/lib/api"

type ContactResponse = {
  message: string
  mailtoUrl: string
  to: string
}

export function AboutMePage() {
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState("")
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })

  async function submitContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFeedback("")
    setError("")

    try {
      setSubmitting(true)
      const data = await apiFetch<ContactResponse>("/store/contact", {
        method: "POST",
        body: JSON.stringify(form),
      })
      setFeedback(data.message)
      window.location.href = data.mailtoUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invio non riuscito.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="pb-20 pt-24 md:pb-28 md:pt-28">
      <Container>
        <div className="mb-6">
          <Link to="/" className="text-sm text-white/55 transition hover:text-white">
            ← Torna alla home
          </Link>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.02fr)_minmax(360px,0.98fr)]">
          <article className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6 md:p-8">
            <div className="grid gap-6 md:grid-cols-[220px_minmax(0,1fr)] md:items-start">
              <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03]">
                <img src={founderPortrait} alt="Founder BNS Studio" className="aspect-[4/5] w-full object-cover" />
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-white/45">Chi sono</p>
                  <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">
                    La persona dietro BNS Studio, tra immaginario visivo e prodotti reali.
                  </h1>
                </div>
                <p className="text-sm leading-7 text-white/70 md:text-base">
                  BNS Studio nasce da una ricerca personale su immagini, testi e oggetti che abbiano un taglio
                  editoriale chiaro. Mi interessa costruire collezioni che non sembrino generiche: pochi pezzi,
                  composti bene, con una presenza visiva netta e facile da ricordare.
                </p>
                <p className="text-sm leading-7 text-white/70 md:text-base">
                  Dietro ogni uscita c&apos;è un lavoro di selezione: capire cosa entra davvero nel catalogo,
                  quali riferimenti restano coerenti tra loro e come trasformare un&apos;idea in un prodotto che
                  funzioni bene sia online sia nello spazio reale di chi lo sceglie.
                </p>
              </div>
            </div>

            <div className="mt-8 rounded-[28px] border border-white/10 bg-black/20 p-5 md:p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">Mission</p>
              <h2 className="mt-3 text-xl font-semibold text-white">Costruire un archivio visivo riconoscibile, non un catalogo casuale.</h2>
              <p className="mt-3 text-sm leading-7 text-white/68 md:text-base">
                La mission di BNS Studio è unire gusto grafico, chiarezza di collezione e prodotti concreti:
                poster, stampe e oggetti pensati per abitare bene uno spazio e raccontare un’identità precisa,
                senza rumore inutile.
              </p>
            </div>
          </article>

          <aside className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6 md:p-8">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">Contatto diretto</p>
              <h2 className="text-2xl font-semibold text-white">Scrivimi via email dal sito.</h2>
              <p className="text-sm leading-7 text-white/65">
                Compila il form e aprirò il tuo client email con destinatario, oggetto e messaggio già pronti.
              </p>
            </div>

            <form onSubmit={submitContact} className="mt-6 grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/45">Nome</label>
                  <input
                    className="shop-input"
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Il tuo nome"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/45">Email</label>
                  <input
                    className="shop-input"
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    placeholder="nome@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/45">Oggetto</label>
                <input
                  className="shop-input"
                  value={form.subject}
                  onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
                  placeholder="Di cosa vuoi parlare"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/45">Messaggio</label>
                <textarea
                  className="shop-textarea min-h-36 resize-none"
                  value={form.message}
                  onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                  placeholder="Scrivi qui il tuo messaggio"
                  required
                />
              </div>

              {feedback ? <p className="text-sm text-emerald-300">{feedback}</p> : null}
              {error ? <p className="text-sm text-red-300">{error}</p> : null}

              <div>
                <Button type="submit" className="sm:min-w-[220px]">
                  {submitting ? "Preparazione email..." : "Invia email"}
                </Button>
              </div>
            </form>
          </aside>
        </div>
      </Container>
    </main>
  )
}
