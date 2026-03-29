import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"

import { Button, getButtonClassName } from "../../components/Button"
import { ShopLayout } from "../components/ShopLayout"
import { useShopAuth } from "../context/ShopAuthProvider"

export function ShopAuthPage() {
  const { login } = useShopAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = (location.state as { redirectTo?: string } | null)?.redirectTo || "/shop/profile"

  const [mode, setMode] = useState<"login" | "register">("login")
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    username: "",
    firstName: "",
    lastName: "",
    identifier: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError("")

    if (mode === "register" && form.password !== form.confirmPassword) {
      setError("La conferma password non coincide.")
      return
    }

    try {
      await login(form, mode)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Si e verificato un errore durante l'autenticazione.")
    }
  }

  return (
    <ShopLayout eyebrow="Account" title={mode === "login" ? "Accedi al tuo profilo shop" : "Crea un account cliente"} intro="Login e registrazione sono ora parte integrante del sito principale e alimentano carrello, checkout, storico ordini e area admin.">
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="shop-card p-6">
          <div className="space-y-3 text-sm text-white/70">
            <p>Demo customer: <span className="text-white">customer@bnsstudio.com</span> / <span className="text-white">customer1234</span></p>
            <p>Demo admin: <span className="text-white">admin@bnsstudio.com</span> / <span className="text-white">admin1234</span></p>
          </div>
          </div>

        <form onSubmit={handleSubmit} className="shop-card space-y-4 p-6 md:p-8">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={getButtonClassName({ variant: mode === "login" ? "cart" : "profile", size: "sm" })}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={getButtonClassName({ variant: mode === "register" ? "cart" : "profile", size: "sm" })}
            >
              Register
            </button>
          </div>

          {mode === "register" ? (
            <>
              <input className="shop-input" placeholder="Username" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} required />
              <div className="grid gap-4 md:grid-cols-2">
                <input className="shop-input" placeholder="Nome" value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} required />
                <input className="shop-input" placeholder="Cognome" value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} required />
              </div>
              <input className="shop-input" type="email" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
            </>
          ) : (
            <>
              <input className="shop-input" placeholder="Email o username" value={form.identifier} onChange={(event) => setForm({ ...form, identifier: event.target.value })} required />
            </>
          )}

          <input className="shop-input" type="password" placeholder="Password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} minLength={8} required />
          {mode === "register" ? (
            <input className="shop-input" type="password" placeholder="Conferma password" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} minLength={8} required />
          ) : null}
          {error ? <p className="text-sm text-red-300">{error}</p> : null}

          <Button type="submit" variant="cart">
            {mode === "login" ? "Accedi" : "Crea account"}
          </Button>
        </form>
      </div>
    </ShopLayout>
  )
}
