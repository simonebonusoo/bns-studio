import { createContext, useContext, useEffect, useState } from "react"
import { apiFetch } from "../lib/api"
import { ShopUser } from "../types"

type AuthContextValue = {
  user: ShopUser | null
  loading: boolean
  login: (payload: Record<string, string>, mode?: "login" | "register") => Promise<ShopUser>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function ShopAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ShopUser | null>(null)
  const [loading, setLoading] = useState(true)

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
            email: payload.email,
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

  function logout() {
    localStorage.removeItem("bns_shop_token")
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
}

export function useShopAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useShopAuth must be used within ShopAuthProvider")
  }
  return context
}
