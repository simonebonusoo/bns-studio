import { useEffect, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"

import { apiFetch } from "../lib/api"

export function ShopPaypalReturnPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [error, setError] = useState("")
  const orderReference = searchParams.get("orderRef") || ""

  useEffect(() => {
    if (!orderReference) {
      setError("Riferimento ordine non valido.")
      return
    }

    apiFetch<{ order: { orderReference: string } }>(`/orders/payment-complete/${orderReference}`, {
      method: "POST",
    })
      .then((data) => {
        navigate(`/shop/orders/${data.order.orderReference}`, { replace: true })
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Pagamento PayPal non disponibile.")
      })
  }, [navigate, orderReference])

  if (error) {
    return (
      <div className="px-6 py-20 text-center text-white/60">
        <p>{error}</p>
        <Link to="/shop/profile" className="mt-4 inline-block text-white underline underline-offset-4">
          Torna al profilo
        </Link>
      </div>
    )
  }

  return <div className="px-6 py-20 text-center text-white/60">Conferma del pagamento in corso...</div>
}
