import { useState, type FormEvent } from "react"

import { Button, getButtonClassName } from "./Button"
import { apiFetch } from "../shop/lib/api"

const CALENDLY_URL = String(import.meta.env.VITE_CALENDLY_URL || "https://calendly.com/bnsstudio/30min")

type ProjectContactFormProps = {
  className?: string
  title?: string
  description?: string
}

type ContactFormState = {
  firstName: string
  lastName: string
  email: string
  message: string
}

const emptyForm: ContactFormState = {
  firstName: "",
  lastName: "",
  email: "",
  message: "",
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export function ProjectContactForm({
  className = "",
  title = "Parliamo del tuo progetto",
  description = "Se vuoi sviluppare un brand, un sito, una produzione visuale o un progetto creativo, scrivici qui oppure prenota direttamente una call.",
}: ProjectContactFormProps) {
  const [form, setForm] = useState<ContactFormState>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState("")
  const [error, setError] = useState("")

  const canSubmit =
    form.firstName.trim().length >= 2 &&
    form.lastName.trim().length >= 2 &&
    isValidEmail(form.email) &&
    form.message.trim().length >= 10 &&
    !submitting

  async function submitContact(event: FormEvent) {
    event.preventDefault()
    setFeedback("")
    setError("")

    if (!canSubmit) {
      setError("Compila tutti i campi con dati validi prima di inviare.")
      return
    }

    try {
      setSubmitting(true)
      const response = await apiFetch<{ message: string; mailtoUrl?: string }>("/store/contact", {
        method: "POST",
        body: JSON.stringify({
          name: `${form.firstName.trim()} ${form.lastName.trim()}`,
          email: form.email.trim(),
          subject: "Nuova richiesta progetto",
          message: form.message.trim(),
        }),
      })

      if (response.mailtoUrl) {
        window.location.href = response.mailtoUrl
      }
      setFeedback(response.message || "Richiesta preparata correttamente.")
      setForm(emptyForm)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Non siamo riusciti a inviare la richiesta. Riprova tra poco.")
    } finally {
      setSubmitting(false)
    }
  }

  function openCalendly() {
    window.open(CALENDLY_URL, "_blank", "noopener,noreferrer")
  }

  return (
    <section className={`w-full ${className}`}>
      <div className="rounded-[34px] border border-white/10 bg-white/[0.03] p-5 shadow-card md:p-8">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">Contatti</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-5xl">{title}</h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-white/64">{description}</p>
          </div>

          <form onSubmit={submitContact} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm text-white/68">
                Nome
                <input
                  className="shop-input mt-2 w-full"
                  value={form.firstName}
                  onChange={(event) => setForm({ ...form, firstName: event.target.value })}
                  placeholder="Il tuo nome"
                  autoComplete="given-name"
                  required
                />
              </label>
              <label className="block text-sm text-white/68">
                Cognome
                <input
                  className="shop-input mt-2 w-full"
                  value={form.lastName}
                  onChange={(event) => setForm({ ...form, lastName: event.target.value })}
                  placeholder="Il tuo cognome"
                  autoComplete="family-name"
                  required
                />
              </label>
            </div>

            <label className="block text-sm text-white/68">
              Email
              <input
                className="shop-input mt-2 w-full"
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                placeholder="nome@email.com"
                autoComplete="email"
                required
              />
            </label>

            <label className="block text-sm text-white/68">
              Messaggio
              <textarea
                className="shop-textarea mt-2 min-h-36 w-full resize-none"
                value={form.message}
                onChange={(event) => setForm({ ...form, message: event.target.value })}
                placeholder="Raccontaci cosa vuoi costruire, obiettivi, tempi e riferimenti utili."
                required
              />
            </label>

            {feedback ? <p className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">{feedback}</p> : null}
            {error ? <p className="rounded-2xl border border-red-300/20 bg-red-300/10 px-4 py-3 text-sm text-red-100">{error}</p> : null}

            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
              <Button type="submit" variant="cart" disabled={!canSubmit} className="w-full sm:w-auto">
                {submitting ? "Invio..." : "Invia"}
              </Button>
              <button type="button" onClick={openCalendly} className={getButtonClassName({ variant: "profile", className: "w-full sm:w-auto" })}>
                Prenota call
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}
