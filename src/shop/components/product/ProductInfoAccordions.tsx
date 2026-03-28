import { ReactNode } from "react"

type AccordionSection = {
  key: "details" | "shipping" | "delivery"
  title: string
  content: ReactNode
}

type ProductInfoAccordionsProps = {
  openSection: AccordionSection["key"] | null
  onToggle: (key: AccordionSection["key"]) => void
  sections: AccordionSection[]
}

function ProductInfoAccordion({
  title,
  open,
  onToggle,
  children,
}: {
  title: string
  open: boolean
  onToggle: () => void
  children: ReactNode
}) {
  return (
    <div className="min-w-0 w-full rounded-2xl border border-white/10">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left text-sm text-white/80 transition hover:bg-white/[0.03]"
      >
        <span>{title}</span>
        <span className={`text-white/45 transition ${open ? "rotate-180" : ""}`}>⌄</span>
      </button>
      {open ? <div className="min-w-0 border-t border-white/10 px-4 py-3 text-sm leading-6 text-white/68">{children}</div> : null}
    </div>
  )
}

export function ProductInfoAccordions({
  openSection,
  onToggle,
  sections,
}: ProductInfoAccordionsProps) {
  return (
    <div className="grid w-full items-start gap-3 lg:grid-cols-[repeat(3,minmax(0,1fr))]">
      {sections.map((section) => (
        <ProductInfoAccordion
          key={section.key}
          title={section.title}
          open={openSection === section.key}
          onToggle={() => onToggle(section.key)}
        >
          {section.content}
        </ProductInfoAccordion>
      ))}
    </div>
  )
}
