import { createContext, useContext, useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("bns_token");
    if (!token) {
      setLoading(false);
      return;
    }
    apiFetch("/auth/me")
      .then((data) => setUser(data.user))
      .catch(() => {
        localStorage.removeItem("bns_token");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(payload, mode = "login") {
    const endpoint = mode === "register" ? "/auth/register" : "/auth/login";
    const data = await apiFetch(endpoint, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    localStorage.setItem("bns_token", data.token);
    setUser(data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem("bns_token");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

