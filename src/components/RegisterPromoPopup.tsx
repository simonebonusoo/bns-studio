import { useEffect, useState, type FormEvent } from "react"

import { Button, getButtonClassName } from "./Button"
import { useShopAuth } from "../shop/context/ShopAuthProvider"

const DISMISSED_UNTIL_KEY = "bns_register_promo_dismissed_until"
const SESSION_SEEN_KEY = "bns_register_promo_seen_session"
const COMPLETED_KEY = "bns_register_promo_completed"
const DISMISS_DAYS = 3
const SHOW_DELAY_MS = 12_000

type RegisterPromoForm = {
  firstName: string
  lastName: string
  username: string
  email: string
  password: string
  confirmPassword: string
  shippingCountry: string
  shippingRegion: string
  shippingCity: string
  shippingAddressLine1: string
  shippingStreetNumber: string
  shippingPostalCode: string
}

const emptyForm: RegisterPromoForm = {
  firstName: "",
  lastName: "",
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  shippingCountry: "",
  shippingRegion: "",
  shippingCity: "",
  shippingAddressLine1: "",
  shippingStreetNumber: "",
  shippingPostalCode: "",
}

function isDismissed() {
  const completed = localStorage.getItem(COMPLETED_KEY) === "true"
  if (completed) return true

  const dismissedUntil = Number(localStorage.getItem(DISMISSED_UNTIL_KEY) || 0)
  return Number.isFinite(dismissedUntil) && dismissedUntil > Date.now()
}

function persistDismissal() {
  const dismissedUntil = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000
  localStorage.setItem(DISMISSED_UNTIL_KEY, String(dismissedUntil))
  sessionStorage.setItem(SESSION_SEEN_KEY, "true")
}

export function RegisterPromoPopup() {
  const { user, loading, registerFromPromo } = useShopAuth()
  const [open, setOpen] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)
  const [couponCode, setCouponCode] = useState<string | null>(null)
  const [couponAmount, setCouponAmount] = useState<number | null>(null)
  const [form, setForm] = useState<RegisterPromoForm>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (loading || user) {
      setOpen(false)
      return
    }

    if (sessionStorage.getItem(SESSION_SEEN_KEY) === "true" || isDismissed()) {
      return
    }

    const timer = window.setTimeout(() => {
      if (!localStorage.getItem("bns_shop_token") && !isDismissed()) {
        sessionStorage.setItem(SESSION_SEEN_KEY, "true")
        setOpen(true)
      }
    }, SHOW_DELAY_MS)

    return () => window.clearTimeout(timer)
  }, [loading, user])

  function closeRegisterPopup() {
    persistDismissal()
    setOpen(false)
  }

  async function submitRegister(event: FormEvent) {
    event.preventDefault()
    setError("")

    if (form.password !== form.confirmPassword) {
      setError("Le password non coincidono.")
      return
    }

    setSubmitting(true)
    try {
      const { couponCode: nextCouponCode, couponAmount: nextCouponAmount } = await registerFromPromo(form)
      localStorage.setItem(COMPLETED_KEY, "true")
      localStorage.removeItem(DISMISSED_UNTIL_KEY)
      setCouponCode(nextCouponCode)
      setCouponAmount(nextCouponAmount)
      setOpen(false)
      setSuccessOpen(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registrazione non completata. Controlla i dati e riprova.")
    } finally {
      setSubmitting(false)
    }
  }

  async function copyCode() {
    if (!couponCode) return
    await navigator.clipboard?.writeText(couponCode)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1400)
  }

  if (!open && !successOpen) return null

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm">
      {open ? (
        <div className="w-full max-w-2xl overflow-hidden rounded-[28px] border border-white/10 bg-[#0b0b0c] shadow-2xl">
          <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4 md:px-6">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-lime-200/80">Welcome offer</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Registrati e sblocca il tuo 10%</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/60">
                Crea il tuo account BNS Studio per salvare ordini, dati di spedizione e ricevere il codice dedicato alla prima registrazione.
              </p>
            </div>
            <button type="button" onClick={closeRegisterPopup} className="rounded-full border border-white/10 px-3 py-1 text-sm text-white/60 transition hover:text-white">
              Chiudi
            </button>
          </div>

          <form onSubmit={submitRegister} className="max-h-[72vh] space-y-4 overflow-y-auto overscroll-contain px-5 py-5 md:px-6">
            <div className="grid gap-3 md:grid-cols-2">
              <input className="shop-input" placeholder="Nome" value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} required />
              <input className="shop-input" placeholder="Cognome" value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} required />
              <input className="shop-input" placeholder="Username" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} required />
              <input className="shop-input" type="email" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
              <input className="shop-input" type="password" placeholder="Password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required minLength={8} />
              <input className="shop-input" type="password" placeholder="Conferma password" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} required minLength={8} />
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm font-medium text-white">Dati spedizione</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <input className="shop-input" placeholder="Paese" value={form.shippingCountry} onChange={(event) => setForm({ ...form, shippingCountry: event.target.value })} required />
                <input className="shop-input" placeholder="Provincia / Regione" value={form.shippingRegion} onChange={(event) => setForm({ ...form, shippingRegion: event.target.value })} required />
                <input className="shop-input" placeholder="Città" value={form.shippingCity} onChange={(event) => setForm({ ...form, shippingCity: event.target.value })} required />
                <input className="shop-input" placeholder="CAP" value={form.shippingPostalCode} onChange={(event) => setForm({ ...form, shippingPostalCode: event.target.value })} required />
                <input className="shop-input md:col-span-1" placeholder="Indirizzo" value={form.shippingAddressLine1} onChange={(event) => setForm({ ...form, shippingAddressLine1: event.target.value })} required />
                <input className="shop-input" placeholder="Numero civico" value={form.shippingStreetNumber} onChange={(event) => setForm({ ...form, shippingStreetNumber: event.target.value })} required />
              </div>
            </div>

            {error ? <p className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</p> : null}

            <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
              <button type="button" onClick={closeRegisterPopup} className={getButtonClassName({ variant: "profile" })}>
                Non ora
              </button>
              <Button type="submit" variant="cart" disabled={submitting}>
                {submitting ? "Creazione account..." : "Crea account"}
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      {successOpen ? (
        <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#0b0b0c] p-6 text-center shadow-2xl">
          <p className="text-[11px] uppercase tracking-[0.24em] text-lime-200/80">Account creato</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
            {couponCode ? `Ecco il tuo codice sconto del ${couponAmount || 10}%` : "Registrazione completata"}
          </h2>
          <p className="mt-3 text-sm leading-6 text-white/60">
            {couponCode
              ? "Usalo nel carrello quando vuoi completare il tuo primo ordine."
              : "Non c'e un coupon prima registrazione attivo in questo momento, ma il tuo account e pronto."}
          </p>

          {couponCode ? (
            <div className="mt-5 rounded-2xl border border-lime-200/30 bg-lime-200/10 px-5 py-4 text-2xl font-semibold tracking-[0.18em] text-lime-100">
              {couponCode}
            </div>
          ) : null}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
            {couponCode ? (
              <button type="button" onClick={copyCode} className={getButtonClassName({ variant: "profile" })}>
                {copied ? "Copiato" : "Copia codice"}
              </button>
            ) : null}
            <Button type="button" variant="cart" onClick={() => setSuccessOpen(false)}>
              Continua allo shop
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
