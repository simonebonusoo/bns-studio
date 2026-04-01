import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import { Button } from "../../components/Button"
import { ShopLayout } from "../components/ShopLayout"
import { useShopAuth } from "../context/ShopAuthProvider"

export function ShopRegisterPage() {
  const { user, login, updateProfile } = useShopAuth()
  const navigate = useNavigate()
  const isEditMode = Boolean(user)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    shippingCountry: "",
    shippingRegion: "",
    shippingCity: "",
    shippingAddressLine1: "",
    shippingStreetNumber: "",
    shippingPostalCode: "",
    currentPassword: "",
    password: "",
    confirmPassword: "",
  })

  useEffect(() => {
    if (!user) return
    setForm((current) => ({
      ...current,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      username: user.username || "",
      shippingCountry: user.shippingCountry || "",
      shippingRegion: user.shippingRegion || "",
      shippingCity: user.shippingCity || "",
      shippingAddressLine1: user.shippingAddressLine1 || "",
      shippingStreetNumber: user.shippingStreetNumber || "",
      shippingPostalCode: user.shippingPostalCode || "",
      currentPassword: "",
      password: "",
      confirmPassword: "",
    }))
  }, [user])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")

    if (form.password !== form.confirmPassword) {
      setError("La conferma password non coincide.")
      return
    }

    try {
      setSubmitting(true)

      if (isEditMode) {
        const isChangingEmail = form.email.trim().toLowerCase() !== user?.email.toLowerCase()
        const isChangingPassword = Boolean(form.password.trim())
        if (isChangingEmail && !form.currentPassword.trim()) {
          setError("Inserisci la password attuale per modificare l'email.")
          return
        }
        if (isChangingPassword && !form.currentPassword.trim()) {
          setError("Inserisci la password attuale per cambiare la password.")
          return
        }

        await updateProfile({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          username: form.username,
          shippingCountry: form.shippingCountry,
          shippingRegion: form.shippingRegion,
          shippingCity: form.shippingCity,
          shippingAddressLine1: form.shippingAddressLine1,
          shippingStreetNumber: form.shippingStreetNumber,
          shippingPostalCode: form.shippingPostalCode,
          ...(isChangingPassword ? { newPassword: form.password } : {}),
          ...(isChangingEmail ? { currentPassword: form.currentPassword } : {}),
          ...(!isChangingEmail && isChangingPassword ? { currentPassword: form.currentPassword } : {}),
        })
      } else {
        await login(
          {
            firstName: form.firstName,
            lastName: form.lastName,
            email: form.email,
            username: form.username,
            shippingCountry: form.shippingCountry,
            shippingRegion: form.shippingRegion,
            shippingCity: form.shippingCity,
            shippingAddressLine1: form.shippingAddressLine1,
            shippingStreetNumber: form.shippingStreetNumber,
            shippingPostalCode: form.shippingPostalCode,
            password: form.password,
          },
          "register",
        )
      }

      navigate("/shop/profile", { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : isEditMode ? "Errore durante il salvataggio del profilo." : "Errore durante la registrazione.")
    } finally {
      setSubmitting(false)
    }
  }

  function goNextStep() {
    setError("")
    if (step === 1) {
      if (!form.firstName.trim()) return setError("Inserisci il nome.")
      if (!form.lastName.trim()) return setError("Inserisci il cognome.")
      if (!form.email.trim()) return setError("Inserisci l'email.")
      if (!form.username.trim()) return setError("Inserisci lo username.")
      setStep(2)
      return
    }

    if (!form.shippingCountry.trim()) return setError("Inserisci lo stato.")
    if (!form.shippingRegion.trim()) return setError("Inserisci la provincia.")
    if (!form.shippingCity.trim()) return setError("Inserisci paese o citta.")
    if (!form.shippingAddressLine1.trim()) return setError("Inserisci la via.")
    if (!form.shippingStreetNumber.trim()) return setError("Inserisci il numero civico.")
    if (!form.shippingPostalCode.trim()) return setError("Inserisci il CAP.")
    setStep(3)
  }

  return (
    <ShopLayout
      eyebrow="Account"
      title={isEditMode ? "Modifica profilo" : "Crea un account cliente"}
      intro={
        isEditMode
          ? "Gestisci i tuoi dati da una pagina dedicata, con la stessa esperienza chiara e stabile della registrazione."
          : "Registrazione su pagina dedicata, pensata per mobile e stabile anche con form multi-step."
      }
    >
      <div className="mx-auto max-w-2xl">
        <form onSubmit={handleSubmit} className="shop-card space-y-5 p-5 md:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/45">
                {step === 1 ? "Dati personali" : step === 2 ? "Indirizzo spedizione" : "Sicurezza account"}
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-white">
                {step === 1 ? "Dati personali" : step === 2 ? "Indirizzo spedizione" : "Sicurezza account"}
              </h2>
              <p className="mt-2 text-sm text-white/60">
                {step === 1
                  ? "Imposta i dati principali dell'account e del profilo cliente."
                  : step === 2
                    ? "Salva i dati base da riutilizzare come spedizione iniziale nei prossimi ordini."
                    : isEditMode
                      ? "Aggiorna email e sicurezza. La password resta opzionale se non devi cambiarla."
                      : "Scegli le credenziali del nuovo account."}
              </p>
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
                placeholder="Username"
                value={form.username}
                onChange={(event) => setForm({ ...form, username: event.target.value })}
                required
              />
            </div>
          ) : null}

          {step === 2 ? (
            <div className="grid gap-3">
              <input
                className="shop-input py-2.5"
                placeholder="Stato"
                value={form.shippingCountry}
                onChange={(event) => setForm({ ...form, shippingCountry: event.target.value })}
                required
              />
              <input
                className="shop-input py-2.5"
                placeholder="Provincia"
                value={form.shippingRegion}
                onChange={(event) => setForm({ ...form, shippingRegion: event.target.value })}
                required
              />
              <input
                className="shop-input py-2.5"
                placeholder="Paese o citta"
                value={form.shippingCity}
                onChange={(event) => setForm({ ...form, shippingCity: event.target.value })}
                required
              />
              <input
                className="shop-input py-2.5"
                placeholder="Via"
                value={form.shippingAddressLine1}
                onChange={(event) => setForm({ ...form, shippingAddressLine1: event.target.value })}
                required
              />
              <input
                className="shop-input py-2.5"
                placeholder="Numero civico"
                value={form.shippingStreetNumber}
                onChange={(event) => setForm({ ...form, shippingStreetNumber: event.target.value })}
                required
              />
              <input
                className="shop-input py-2.5"
                placeholder="CAP"
                value={form.shippingPostalCode}
                onChange={(event) => setForm({ ...form, shippingPostalCode: event.target.value })}
                required
              />
            </div>
          ) : null}

          {step === 3 ? (
            <div className="grid gap-3">
              {isEditMode ? (
                <>
                  <input
                    className="shop-input py-2.5"
                    type="password"
                    placeholder="Nuova password (opzionale)"
                    value={form.password}
                    onChange={(event) => setForm({ ...form, password: event.target.value })}
                    minLength={8}
                  />
                  <input
                    className="shop-input py-2.5"
                    type="password"
                    placeholder="Conferma password"
                    value={form.confirmPassword}
                    onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
                    minLength={8}
                  />
                  <input
                    className="shop-input py-2.5"
                    type="password"
                    placeholder="Password attuale (solo se cambi email o password)"
                    value={form.currentPassword}
                    onChange={(event) => setForm({ ...form, currentPassword: event.target.value })}
                  />
                </>
              ) : (
                <>
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
                </>
              )}
            </div>
          ) : null}

          {error ? <p className="text-sm text-red-300">{error}</p> : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            {step > 1 ? (
              <Button type="button" variant="ghost" className="w-full sm:w-auto" onClick={() => setStep((current) => (current - 1) as 1 | 2 | 3)}>
                Indietro
              </Button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <Button type="button" className="w-full sm:w-auto" onClick={goNextStep}>
                Avanti
              </Button>
            ) : (
              <Button type="submit" className="w-full sm:w-auto">
                {submitting ? (isEditMode ? "Salvataggio..." : "Creazione account...") : isEditMode ? "Salva modifiche" : "Crea account"}
              </Button>
            )}
          </div>

          {!isEditMode ? (
            <p className="text-sm text-white/55">
              Hai già un account?{" "}
              <Link to="/shop/auth" className="text-white underline underline-offset-4">
                Accedi
              </Link>
            </p>
          ) : null}
        </form>
      </div>
    </ShopLayout>
  )
}
