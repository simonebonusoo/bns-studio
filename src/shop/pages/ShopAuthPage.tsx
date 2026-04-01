import { useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"

import { ShopLayout } from "../components/ShopLayout"

export function ShopAuthPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = (location.state as { redirectTo?: string } | null)?.redirectTo || "/shop/profile"

  useEffect(() => {
    navigate(
      {
        pathname: "/",
        search: "?profile=open&step=login",
      },
      {
        replace: true,
        state: { redirectTo },
      },
    )
  }, [navigate, redirectTo])

  return (
    <ShopLayout eyebrow="Account" title="Reindirizzamento login" intro="Ti stiamo riportando al pannello di accesso corretto.">
      <div className="mx-auto max-w-xl">
        <div className="shop-card p-6 text-sm text-white/65">Apertura del pannello di accesso in corso...</div>
      </div>
    </ShopLayout>
  )
}
