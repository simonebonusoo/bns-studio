import { PropsWithChildren } from "react"
export function SectionTitle({ eyebrow, title, children }: PropsWithChildren<{ eyebrow: string, title: string }>){
  return (
    <div className="max-w-4xl">
      <div className="text-xs uppercase tracking-[.22em] text-white/55">{eyebrow}</div>
      <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight">{title}</h2>
      {children ? <p className="mt-4 max-w-3xl text-white/70 leading-relaxed">{children}</p> : null}
    </div>
  )
}
