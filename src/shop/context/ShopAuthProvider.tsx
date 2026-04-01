import { createContext, useContext, useEffect, useState } from "react"
import { apiFetch } from "../lib/api"
import { ShopUser } from "../types"

type AuthContextValue = {
  user: ShopUser | null
  loading: boolean
  effectiveRole: string | null
  isGuestPreview: boolean
  login: (payload: Record<string, string>, mode?: "login" | "register") => Promise<ShopUser>
  updateProfile: (payload: Record<string, string>) => Promise<ShopUser>
  logout: () => Promise<void>
  enableGuestPreview: () => void
  disableGuestPreview: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function ShopAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ShopUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [isGuestPreview, setIsGuestPreview] = useState(localStorage.getItem("bns_shop_guest_preview") === "true")

  useEffect(() => {
    const token = localStorage.getItem("bns_shop_token")
    if (!token) {
      setLoading(false)
      return
    }

    apiFetch<{ user: ShopUser }>("/auth/me")
      .then((data) => setUser(data.user))
      .catch(() => {
        localStorage.removeItem("bns_shop_token")
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  async function login(payload: Record<string, string>, mode: "login" | "register" = "login") {
    const endpoint = mode === "login" ? "/auth/login" : "/auth/register"
    const body =
      mode === "register"
        ? payload
        : {
            identifier: payload.identifier || payload.email,
            password: payload.password,
          }

    const data = await apiFetch<{ token: string; user: ShopUser }>(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    })

    localStorage.setItem("bns_shop_token", data.token)
    setUser(data.user)
    return data.user
  }

  async function updateProfile(payload: Record<string, string>) {
    const data = await apiFetch<{ user: ShopUser }>("/auth/profile", {
      method: "PATCH",
      body: JSON.stringify(payload),
    })

    setUser(data.user)
    return data.user
  }

  async function logout() {
    localStorage.removeItem("bns_shop_token")
    localStorage.removeItem("bns_shop_guest_preview")
    setUser(null)
    setIsGuestPreview(false)
  }

  function enableGuestPreview() {
    if (user?.role !== "admin") return
    localStorage.setItem("bns_shop_guest_preview", "true")
    setIsGuestPreview(true)
  }

  function disableGuestPreview() {
    localStorage.removeItem("bns_shop_guest_preview")
    setIsGuestPreview(false)
  }

  const effectiveRole = user?.role === "admin" && isGuestPreview ? "customer" : user?.role || null

  return (
    <AuthContext.Provider
      value={{ user, loading, effectiveRole, isGuestPreview, login, updateProfile, logout, enableGuestPreview, disableGuestPreview }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useShopAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useShopAuth must be used within ShopAuthProvider")
  }
  return context
}
