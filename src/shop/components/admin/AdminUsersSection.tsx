import { useMemo, useState } from "react"

import { getButtonClassName } from "../../../components/Button"
import { ConfirmActionModal } from "./ConfirmActionModal"

type AdminUser = {
  id: number
  email: string
  username?: string | null
  role: string
  createdAt: string
}

type AdminUsersSectionProps = {
  users: AdminUser[]
  usersTotal: number
  containWheel: (event: React.WheelEvent<HTMLElement>) => void
  onToggleRole: (user: AdminUser, nextRole: "admin" | "customer") => Promise<void>
  roleUpdateLoadingId?: number | null
}

export function AdminUsersSection({ users, usersTotal, containWheel, onToggleRole, roleUpdateLoadingId = null }: AdminUsersSectionProps) {
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState<"username-asc" | "created-asc" | "created-desc">("created-desc")
  const [pendingRoleChange, setPendingRoleChange] = useState<null | { user: AdminUser; nextRole: "admin" | "customer" }>(null)

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    if (!normalizedSearch) return users

    return users.filter((entry) => {
      const username = String(entry.username || "").toLowerCase()
      const email = String(entry.email || "").toLowerCase()
      return username.includes(normalizedSearch) || email.includes(normalizedSearch)
    })
  }, [search, users])

  const visibleUsers = useMemo(() => {
    const entries = [...filteredUsers]

    entries.sort((left, right) => {
      if (sortBy === "username-asc") {
        const leftUsername = String(left.username || left.email || "").trim().toLowerCase()
        const rightUsername = String(right.username || right.email || "").trim().toLowerCase()
        return leftUsername.localeCompare(rightUsername, "it")
      }

      const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0
      const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0

      if (sortBy === "created-asc") {
        return leftTime - rightTime
      }

      return rightTime - leftTime
    })

    return entries
  }, [filteredUsers, sortBy])

  return (
    <section className="shop-card space-y-6 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Utenti</h2>
          <p className="mt-1 text-sm text-white/55">
            Elenco reale degli account registrati nello shop, visibile solo lato admin.
          </p>
        </div>
        <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-5 py-4 text-right">
          <p className="text-xs uppercase tracking-[0.2em] text-white/45">Totale registrati</p>
          <p className="mt-2 text-3xl font-semibold text-white">{usersTotal}</p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-3">
          <input
            className="shop-input"
            type="search"
            placeholder="Cerca per username o email"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-3">
          <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/45">Ordina per</label>
          <select className="shop-input" value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)}>
            <option value="username-asc">Username A-Z</option>
            <option value="created-asc">Data creazione crescente</option>
            <option value="created-desc">Data creazione decrescente</option>
          </select>
        </div>
      </div>

      <div className="min-h-0 max-h-[34rem] space-y-3 overflow-y-auto overscroll-contain pr-1" onWheelCapture={containWheel}>
        {visibleUsers.map((entry) => {
          const nextRole = entry.role === "admin" ? "customer" : "admin"
          const actionLabel = entry.role === "admin" ? "Rendi cliente" : "Rendi admin"
          const isUpdating = roleUpdateLoadingId === entry.id

          return (
          <article key={entry.id} className="rounded-[22px] border border-white/10 bg-white/[0.03] px-5 py-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <p className="truncate text-base font-medium text-white">{entry.email}</p>
                <p className="mt-1 text-sm text-white/55">
                  {entry.username || "username non impostato"} · {entry.role}
                </p>
              </div>
              <div className="flex flex-col items-start gap-3 md:items-end">
                <span className="text-sm text-white/50">{new Date(entry.createdAt).toLocaleDateString("it-IT")}</span>
                <button
                  type="button"
                  className={getButtonClassName({ variant: "cart", size: "sm" })}
                  onClick={() => setPendingRoleChange({ user: entry, nextRole })}
                  disabled={isUpdating}
                >
                  {isUpdating ? "Aggiornamento..." : actionLabel}
                </button>
              </div>
            </div>
          </article>
          )
        })}
        {!visibleUsers.length ? <p className="px-2 py-4 text-sm text-white/45">Nessun utente trovato con questi criteri.</p> : null}
      </div>

      <ConfirmActionModal
        open={Boolean(pendingRoleChange)}
        title="Conferma ruolo"
        description={
          pendingRoleChange?.nextRole === "admin"
            ? "Sei sicuro di voler rendere admin questo utente?"
            : "Sei sicuro di voler rendere cliente questo utente?"
        }
        confirmLabel={pendingRoleChange?.nextRole === "admin" ? "Rendi admin" : "Rendi cliente"}
        cancelLabel="Annulla"
        loading={roleUpdateLoadingId === pendingRoleChange?.user.id}
        loadingLabel="In corso..."
        confirmVariant="cart"
        onCancel={() => setPendingRoleChange(null)}
        onConfirm={async () => {
          if (!pendingRoleChange) return
          await onToggleRole(pendingRoleChange.user, pendingRoleChange.nextRole)
          setPendingRoleChange(null)
        }}
      />
    </section>
  )
}
