import { Navigate, useParams } from "react-router-dom"

import { Container } from "../components/Container"
import { CASE_STUDIES } from "../data/caseStudies"

export function CaseStudyPage() {
  const { slug = "" } = useParams()
  const caseStudy = CASE_STUDIES.find((entry) => entry.slug === slug)

  if (!caseStudy) {
    return <Navigate to="/" replace />
  }

  return (
    <main className="pt-32 pb-20">
      <Container>
        <article className="mx-auto max-w-4xl space-y-8">
          <header className="space-y-4">
            <p className="text-xs uppercase tracking-[0.32em] text-white/45">{caseStudy.eyebrow}</p>
            <h1 className="text-4xl font-semibold text-white sm:text-5xl">{caseStudy.title}</h1>
            <p className="text-base leading-8 text-white/68 sm:text-lg">{caseStudy.excerpt}</p>
            <div className="flex flex-wrap gap-2">
              {caseStudy.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/65">
                  {tag}
                </span>
              ))}
            </div>
          </header>

          <section className="space-y-6 rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
            {caseStudy.content.map((block, index) => {
              if (block.type === "h2") {
                return (
                  <h2 key={`${block.type}-${index}`} className="text-2xl font-semibold text-white">
                    {block.text}
                  </h2>
                )
              }

              if (block.type === "ul") {
                return (
                  <ul key={`${block.type}-${index}`} className="space-y-3 text-sm leading-7 text-white/65">
                    {block.items.map((item) => (
                      <li key={item} className="flex gap-3">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#e3f503]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )
              }

              return (
                <p key={`${block.type}-${index}`} className="text-sm leading-8 text-white/68 sm:text-base">
                  {block.text}
                </p>
              )
            })}
          </section>
        </article>
      </Container>
    </main>
  )
}
