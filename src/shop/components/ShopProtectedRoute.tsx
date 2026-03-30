import { Navigate, useLocation } from "react-router-dom"
import { useShopAuth } from "../context/ShopAuthProvider"
import { canAccessCustomerCheckout } from "../lib/route-access.mjs"

export function ShopProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useShopAuth()
  const location = useLocation()

  if (loading) {
    return <div className="px-6 py-20 text-center text-white/60">Caricamento area cliente...</div>
  }

  if (!user) {
    return <Navigate to={{ pathname: "/", search: "?profile=open" }} replace state={{ redirectTo: location.pathname }} />
  }

  return children
}

export function ShopAdminRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useShopAuth()

  if (loading) {
    return <div className="px-6 py-20 text-center text-white/60">Caricamento area admin...</div>
  }

  if (!user) {
    return <Navigate to={{ pathname: "/", search: "?profile=open" }} replace state={{ redirectTo: "/shop/admin" }} />
  }

  if (user.role !== "admin") {
    return <Navigate to="/shop/profile" replace />
  }

  return children
}

export function ShopCustomerRoute({ children }: { children: JSX.Element }) {
  const { user, loading, effectiveRole } = useShopAuth()
  const location = useLocation()

  if (loading) {
    return <div className="px-6 py-20 text-center text-white/60">Caricamento checkout...</div>
  }

  if (!user) {
    return <Navigate to={{ pathname: "/", search: "?profile=open" }} replace state={{ redirectTo: location.pathname }} />
  }

  const access = canAccessCustomerCheckout({ user, effectiveRole })

  if (!access.allowed && access.reason === "not_customer") {
    return <Navigate to="/shop/cart" replace />
  }

  return children
}
