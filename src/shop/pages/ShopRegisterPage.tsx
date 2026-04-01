import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import { Button } from "../../components/Button"
import { ShopLayout } from "../components/ShopLayout"
import { useShopAuth } from "../context/ShopAuthProvider"

export function ShopRegisterPage() {
  const { login } = useShopAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    country: "",
    region: "",
    addressLine1: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  async function submitRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")

    if (form.password !== form.confirmPassword) {
      setError("La conferma password non coincide.")
      return
    }

    try {
      setSubmitting(true)
      await login(
        {
          firstName: form.firstName,
          lastName: form.lastName,
          username: form.username,
          email: form.email,
          password: form.password,
        },
        "register",
      )
      navigate("/shop/profile", { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante la registrazione.")
    } finally {
      setSubmitting(false)
    }
  }

  function goNextStep() {
    setError("")
    if (step === 1) {
      if (!form.firstName.trim()) return setError("Inserisci il nome.")
      if (!form.lastName.trim()) return setError("Inserisci il cognome.")
      setStep(2)
      return
    }
    if (!form.country.trim()) return setError("Inserisci il paese.")
    if (!form.region.trim()) return setError("Inserisci la provincia.")
    if (!form.addressLine1.trim()) return setError("Inserisci la via.")
    setStep(3)
  }

  return (
    <ShopLayout
      eyebrow="Account"
      title="Crea un account cliente"
      intro="Registrazione su pagina dedicata, pensata per mobile e stabile anche con form multi-step."
    >
      <div className="mx-auto max-w-2xl">
        <form onSubmit={submitRegister} className="shop-card space-y-5 p-5 md:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/45">
                {step === 1 ? "Dati personali" : step === 2 ? "Indirizzo" : "Account"}
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-white">
                {step === 1 ? "Dati personali" : step === 2 ? "Indirizzo" : "Account"}
              </h2>
            </div>
            <p className="shrink-0 text-xs uppercase tracking-[0.18em] text-[#e3f503]">Pagina {step} di 3</p>
          </div>

          {step === 1 ? (
            <div className="grid gap-3">
              <input
                className="shop-input py-2.5"
                placeholder="Nome"
                value={form.firstName}
                onChange={(event) => setForm({ ...form, firstName: event.target.value })}
                required
              />
              <input
                className="shop-input py-2.5"
                placeholder="Cognome"
                value={form.lastName}
                onChange={(event) => setForm({ ...form, lastName: event.target.value })}
                required
              />
            </div>
          ) : null}

          {step === 2 ? (
            <div className="grid gap-3">
              <input
                className="shop-input py-2.5"
                placeholder="Stato / Paese"
                value={form.country}
                onChange={(event) => setForm({ ...form, country: event.target.value })}
                required
              />
              <input
                className="shop-input py-2.5"
                placeholder="Provincia"
                value={form.region}
                onChange={(event) => setForm({ ...form, region: event.target.value })}
                required
              />
              <input
                className="shop-input py-2.5"
                placeholder="Via"
                value={form.addressLine1}
                onChange={(event) => setForm({ ...form, addressLine1: event.target.value })}
                required
              />
            </div>
          ) : null}

          {step === 3 ? (
            <div className="grid gap-3">
              <input
                className="shop-input py-2.5"
                placeholder="Username"
                value={form.username}
                onChange={(event) => setForm({ ...form, username: event.target.value })}
                required
              />
              <input
                className="shop-input py-2.5"
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                required
              />
              <input
                className="shop-input py-2.5"
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                minLength={8}
                required
              />
              <input
                className="shop-input py-2.5"
                type="password"
                placeholder="Conferma password"
                value={form.confirmPassword}
                onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
                minLength={8}
                required
              />
            </div>
          ) : null}

          {error ? <p className="text-sm text-red-300">{error}</p> : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            {step > 1 ? (
              <Button type="button" variant="ghost" className="w-full sm:w-auto" onClick={() => setStep((current) => (current - 1) as 1 | 2 | 3)}>
                Indietro
              </Button>
            ) : <div />}

            {step < 3 ? (
              <Button type="button" className="w-full sm:w-auto" onClick={goNextStep}>
                Avanti
              </Button>
            ) : (
              <Button type="submit" className="w-full sm:w-auto">
                {submitting ? "Creazione account..." : "Crea account"}
              </Button>
            )}
          </div>

          <p className="text-sm text-white/55">
            Hai già un account?{" "}
            <Link to="/shop/auth" className="text-white underline underline-offset-4">
              Accedi
            </Link>
          </p>
        </form>
      </div>
    </ShopLayout>
  )
}
