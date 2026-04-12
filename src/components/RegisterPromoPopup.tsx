import { useEffect, useState, type FormEvent } from "react"

import { Button, getButtonClassName } from "./Button"
import { useShopAuth } from "../shop/context/ShopAuthProvider"

const DISMISSED_UNTIL_KEY = "bns_register_promo_dismissed_until"
const SESSION_SEEN_KEY = "bns_register_promo_seen_session"
const COMPLETED_KEY = "bns_register_promo_completed"
const DISMISS_DAYS = 3
const SHOW_DELAY_MS = 12_000

type RegisterPromoForm = {
  username: string
  email: string
  password: string
}

const emptyForm: RegisterPromoForm = {
  username: "",
  email: "",
  password: "",
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
  const [touched, setTouched] = useState<Partial<Record<keyof RegisterPromoForm, boolean>>>({})

  const fieldErrors = {
    email:
      form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
        ? "Inserisci un'email valida."
        : "",
    username:
      form.username.trim() && !/^[a-zA-Z0-9._-]{3,32}$/.test(form.username.trim())
        ? "Usa 3-32 caratteri: lettere, numeri, punto, trattino o underscore."
        : "",
    password:
      form.password && form.password.length < 8
        ? "La password deve contenere almeno 8 caratteri."
        : "",
  }
  const hasEmptyFields = !form.email.trim() || !form.username.trim() || !form.password
  const hasFieldErrors = Boolean(fieldErrors.email || fieldErrors.username || fieldErrors.password)
  const canSubmit = !hasEmptyFields && !hasFieldErrors && !submitting

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

    setTouched({ email: true, username: true, password: true })
    if (!canSubmit) {
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
        <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#0b0b0c] p-5 shadow-2xl md:p-6">
          <div className="text-center">
            <p className="text-[11px] uppercase tracking-[0.24em] text-lime-200/80">Welcome offer</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">Sblocca il 10% di sconto</h2>
            <p className="mt-3 text-sm leading-6 text-white/60">
              Crea il tuo account e ricevi il codice per il primo ordine
            </p>
          </div>

          <form onSubmit={submitRegister} className="mt-6 space-y-4">
            <div>
              <input
                className="shop-input w-full"
                type="email"
                placeholder="Email"
                value={form.email}
                onBlur={() => setTouched((current) => ({ ...current, email: true }))}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                required
              />
              {touched.email && fieldErrors.email ? <p className="mt-2 text-xs text-red-200">{fieldErrors.email}</p> : null}
            </div>

            <div>
              <input
                className="shop-input w-full"
                placeholder="Username"
                value={form.username}
                onBlur={() => setTouched((current) => ({ ...current, username: true }))}
                onChange={(event) => setForm({ ...form, username: event.target.value })}
                required
              />
              {touched.username && fieldErrors.username ? <p className="mt-2 text-xs text-red-200">{fieldErrors.username}</p> : null}
            </div>

            <div>
              <input
                className="shop-input w-full"
                type="password"
                placeholder="Password"
                value={form.password}
                onBlur={() => setTouched((current) => ({ ...current, password: true }))}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                required
                minLength={8}
              />
              {touched.password && fieldErrors.password ? <p className="mt-2 text-xs text-red-200">{fieldErrors.password}</p> : null}
            </div>

            {error ? <p className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</p> : null}

            <div className="space-y-3 pt-1">
              <Button type="submit" variant="cart" disabled={!canSubmit} className="w-full">
                {submitting ? "Creazione account..." : "Ottieni codice"}
              </Button>
              <button type="button" onClick={closeRegisterPopup} className="mx-auto block text-sm text-white/50 transition hover:text-white">
                Non ora
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {successOpen ? (
        <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#0b0b0c] p-6 text-center shadow-2xl">
          <p className="text-[11px] uppercase tracking-[0.24em] text-lime-200/80">Account creato</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">{couponCode ? "Ecco il tuo sconto" : "Registrazione completata"}</h2>
          <p className="mt-3 text-sm leading-6 text-white/60">
            {couponCode
              ? `Usa questo codice al checkout${couponAmount ? ` per il ${couponAmount}% di sconto.` : "."}`
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
              Vai allo shop
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
