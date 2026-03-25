import { ReactNode } from "react"
import { Link } from "react-router-dom"
import { Container } from "../components/Container"
import { Button } from "../components/Button"

type Stat = { label: string; value: string }

type Props = {
  eyebrow?: string
  title: string
  subtitle?: string
  chips?: string[]
  stats?: Stat[]
  website?: { label: string; href: string }

  // ✅ CTA alternative
  cta?: { label: string; href: string; download?: boolean }
  cta2?: { label: string; href: string; download?: boolean }

  children: ReactNode
}

export function CaseStudyLayout({
  eyebrow = "Caso studio",
  title,
  subtitle,
  chips = [],
  stats = [],
  website,
  cta,
  cta2,
  children,
}: Props) {
  return (
    <section className="pt-24 md:pt-28 pb-20 md:pb-28">
      <Container>
        <div className="max-w-6xl mx-auto">
          {/* breadcrumb */}
          <div className="mb-6">
            <Link
              to="/#portfolio"
              className="text-sm text-white/55 hover:text-white transition"
            >
              ← Torna al Portfolio
            </Link>
          </div>

          <div className="grid lg:grid-cols-[1fr_340px] gap-6 items-start">
            {/* MAIN */}
            <article className="glass rounded-2xl shadow-card overflow-hidden">
              <div className="p-7 md:p-8">
                <div className="text-xs tracking-[0.25em] uppercase text-white/45">
                  {eyebrow}
                </div>

                <h1 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight">
                  {title}
                </h1>

                {subtitle ? (
                  <p className="mt-3 text-white/70 leading-relaxed">{subtitle}</p>
                ) : null}

                {chips.length ? (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {chips.map((c) => (
                      <span
                        key={c}
                        className="px-3 py-1 rounded-full border border-white/12 bg-black/25 text-xs text-white/70"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                ) : null}

                {/* ✅ CONTENUTO CASE STUDY: (NON TOCCATO) */}
                <div
                  className="
                    mt-6 text-white/75 leading-relaxed
                    [&_section+section]:mt-4
                    [&_section]:m-0
                    [&_section]:p-0
                    [&_section]:min-h-0
                    [&_section]:h-auto
                    [&_section]:flex
                    [&_section]:flex-col
                    [&_section]:gap-2
                    [&_section_*]:!mt-0
                    [&_section_*]:!mb-0
                    [&_h2]:text-base
                    [&_h2]:font-semibold
                    [&_h2]:text-white/90
                    [&_p]:text-white/75
                    [&_ul]:mt-0
                    [&_ul]:space-y-1
                    [&_li]:flex
                    [&_li]:gap-2
                    [&_li>span:first-child]:text-white/40
                  "
                >
                  {children}
                </div>

                <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap gap-3">
                  <Link to="/#contatti">
                    <Button size="sm">Parliamo del tuo progetto</Button>
                  </Link>
                  <Link to="/#portfolio">
                    <Button variant="ghost" size="sm">
                      Vedi altri lavori
                    </Button>
                  </Link>
                </div>
              </div>
            </article>

            {/* SIDEBAR */}
            <aside className="glass rounded-2xl shadow-card p-6 md:p-7">
              <div className="text-xs tracking-[0.25em] uppercase text-white/45">
                In breve
              </div>

              <div className="mt-4 space-y-3">
                {stats.map((s) => (
                  <div
                    key={s.label}
                    className="flex items-start justify-between gap-4"
                  >
                    <div className="text-sm text-white/55">{s.label}</div>
                    <div className="text-sm text-white/85 text-right">
                      {s.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* ✅ CTA: prima cta, poi cta2, altrimenti website */}
              {cta ? (
                <a
                  href={cta.href}
                  target="_blank"
                  rel="noreferrer"
                  download={cta.download ? "" : undefined}
                  className="mt-6 block"
                >
                  <Button size="sm" className="w-full">
                    {cta.label}
                  </Button>
                </a>
              ) : website ? (
                <a
                  href={website.href}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 block"
                >
                  <Button size="sm" className="w-full">
                    Visita sito
                  </Button>
                </a>
              ) : null}

              {cta2 ? (
                <a
                  href={cta2.href}
                  target="_blank"
                  rel="noreferrer"
                  download={cta2.download ? "" : undefined}
                  className="mt-3 block"
                >
                  <Button size="sm" className="w-full">
                    {cta2.label}
                  </Button>
                </a>
              ) : null}

              <div className="mt-3">
                <Link to="/#contatti">
                  <Button variant="ghost" size="sm" className="w-full">
                    Richiedi un preventivo
                  </Button>
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </Container>
    </section>
  )
}