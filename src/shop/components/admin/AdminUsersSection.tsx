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
}

export function AdminUsersSection({ users, usersTotal, containWheel }: AdminUsersSectionProps) {
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

      <div className="min-h-0 max-h-[34rem] space-y-3 overflow-y-auto overscroll-contain pr-1" onWheelCapture={containWheel}>
        {users.map((entry) => (
          <article key={entry.id} className="rounded-[22px] border border-white/10 bg-white/[0.03] px-5 py-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <p className="truncate text-base font-medium text-white">{entry.email}</p>
                <p className="mt-1 text-sm text-white/55">
                  {entry.username || "username non impostato"} · {entry.role}
                </p>
              </div>
              <span className="text-sm text-white/50">{new Date(entry.createdAt).toLocaleDateString("it-IT")}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
