import { Container } from "../../components/Container"

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
  return (
    <main className="pb-24 pt-6 md:pt-10">
      <Container>
        <section className="px-0 py-8 md:py-12">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="min-w-0 flex-1 max-w-6xl">
                <span className="shop-pill">{eyebrow}</span>
                <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white md:text-5xl">{title}</h1>
                <p className="mt-4 max-w-none text-sm leading-7 text-white/70 md:text-base">{intro}</p>
              </div>

              {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
            </div>

            {children}
          </div>
        </section>
      </Container>
    </main>
  )
}
