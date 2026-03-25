import { Link, NavLink } from "react-router-dom"
import { ShoppingBagIcon, UserIcon } from "@heroicons/react/24/outline"

import { Container } from "../../components/Container"
import { Button } from "../../components/Button"
import { useShopCart } from "../context/ShopCartProvider"
import { useShopAuth } from "../context/ShopAuthProvider"

export function ShopLayout({
  eyebrow,
  title,
  intro,
  children,
  actions,
}: {
  eyebrow: string
  title: string
  intro: string
  children: React.ReactNode
  actions?: React.ReactNode
}) {
  const { items } = useShopCart()
  const { user } = useShopAuth()

  return (
    <main className="pb-24 pt-10 md:pt-14">
      <Container>
        <section className="shop-card relative overflow-hidden px-6 py-8 md:px-10 md:py-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(227,245,3,0.12),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.06),transparent_30%)]" />
          <div className="relative flex flex-col gap-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <span className="shop-pill">{eyebrow}</span>
                <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white md:text-5xl">{title}</h1>
                <p className="mt-4 max-w-xl text-sm leading-7 text-white/70 md:text-base">{intro}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <NavLink
                  to="/shop"
                  className={({ isActive }) =>
                    `rounded-full border px-4 py-2 text-sm transition ${
                      isActive ? "border-[#e3f503] text-[#e3f503]" : "border-white/10 text-white/70 hover:border-white/25 hover:text-white"
                    }`
                  }
                >
                  Catalogo
                </NavLink>
                <NavLink
                  to="/shop/cart"
                  className={({ isActive }) =>
                    `inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
                      isActive ? "border-[#e3f503] text-[#e3f503]" : "border-white/10 text-white/70 hover:border-white/25 hover:text-white"
                    }`
                  }
                >
                  <ShoppingBagIcon className="h-4 w-4" />
                  Cart ({items.reduce((sum, item) => sum + item.quantity, 0)})
                </NavLink>
                <NavLink
                  to={user ? "/shop/profile" : "/shop/auth"}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
                      isActive ? "border-[#e3f503] text-[#e3f503]" : "border-white/10 text-white/70 hover:border-white/25 hover:text-white"
                    }`
                  }
                >
                  <UserIcon className="h-4 w-4" />
                  {user ? "Profilo" : "Accedi"}
                </NavLink>
                {actions}
              </div>
            </div>

            {!user ? (
              <div className="flex flex-col gap-3 rounded-[20px] border border-white/10 bg-black/20 px-5 py-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Accesso cliente richiesto per il checkout</p>
                  <p className="mt-1 text-sm text-white/60">Registrazione e storico ordini sono gestiti direttamente nello shop integrato.</p>
                </div>
                <Link to="/shop/auth">
                  <Button size="sm">Login / Register</Button>
                </Link>
              </div>
            ) : null}

            {children}
          </div>
        </section>
      </Container>
    </main>
  )
}
