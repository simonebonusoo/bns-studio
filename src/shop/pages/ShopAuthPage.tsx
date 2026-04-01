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

  const [error, setError] = useState("")
  const [form, setForm] = useState({
    identifier: "",
    password: "",
  })

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError("")

    try {
      await login(form, "login")
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Si e verificato un errore durante l'autenticazione.")
    }
  }

  return (
    <ShopLayout eyebrow="Account" title="Accedi al tuo profilo shop" intro="Login e area account sono parte integrante dello shop e alimentano checkout, ordini e profilo cliente.">
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="shop-card p-6">
          <div className="space-y-3 text-sm text-white/70">
            <p>Demo customer: <span className="text-white">customer@bnsstudio.com</span> / <span className="text-white">customer1234</span></p>
            <p>Demo admin: <span className="text-white">admin@bnsstudio.com</span> / <span className="text-white">admin1234</span></p>
          </div>
          </div>

        <form onSubmit={handleSubmit} className="shop-card space-y-4 p-6 md:p-8">
          <div className="flex gap-3">
            <button type="button" className={getButtonClassName({ variant: "cart", size: "sm" })}>
              Login
            </button>
            <button
              type="button"
              onClick={() => navigate("/shop/account")}
              className={getButtonClassName({ variant: "profile", size: "sm" })}
            >
              Crea account
            </button>
          </div>

          <input className="shop-input" placeholder="Email o username" value={form.identifier} onChange={(event) => setForm({ ...form, identifier: event.target.value })} required />

          <input className="shop-input" type="password" placeholder="Password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} minLength={8} required />
          {error ? <p className="text-sm text-red-300">{error}</p> : null}

          <Button type="submit" variant="cart">
            Accedi
          </Button>
        </form>
      </div>
    </ShopLayout>
  )
}
