import type { Dispatch, SetStateAction } from "react"

import { Button, getButtonClassName } from "../../../components/Button"

type HomepagePopularCategory = {
  title: string
  description: string
  href: string
  query: string
  imageUrl?: string
}

type HomepageShowcase = {
  eyebrow: string
  title: string
  description: string
  href: string
  query: string
  imageUrl?: string
  ctaLabel: string
}

type AdminHomepageSectionProps = {
  homepageShowcases: HomepageShowcase[]
  homepagePopularCategories: HomepagePopularCategory[]
  homepageFocus: { section: "showcases" | "popular-categories"; item: number | null }
  setHomepageFocus: Dispatch<SetStateAction<{ section: "showcases" | "popular-categories"; item: number | null }>>
  setHomepageShowcases: Dispatch<SetStateAction<HomepageShowcase[]>>
  setHomepagePopularCategories: Dispatch<SetStateAction<HomepagePopularCategory[]>>
  saveHomepageContent: () => void
}

export function AdminHomepageSection({
  homepageShowcases,
  homepagePopularCategories,
  homepageFocus,
  setHomepageFocus,
  setHomepageShowcases,
  setHomepagePopularCategories,
  saveHomepageContent,
}: AdminHomepageSectionProps) {
  function isFocused(section: "showcases" | "popular-categories", item: number) {
    return homepageFocus.section === section && homepageFocus.item === item
  }

  return (
    <div className="space-y-6">
      <section className="shop-card space-y-5 p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Selezioni in evidenza</h2>
            <p className="mt-1 text-sm text-white/55">Modifica i blocchi editoriali mostrati nella homepage dello shop.</p>
          </div>
          <Button type="button" variant="cart" onClick={saveHomepageContent}>
            Salva contenuti homepage
          </Button>
        </div>

        <div className="space-y-4">
          {homepageShowcases.map((item, index) => (
            <div
              key={`${item.title}-${index}`}
              className={`rounded-[24px] border p-5 ${isFocused("showcases", index) ? "border-[#e3f503]/45 bg-white/[0.05]" : "border-white/10 bg-white/[0.03]"}`}
            >
              <div className="mb-4 flex items-center justify-between gap-4">
                <p className="text-sm font-medium text-white">Blocco {index + 1}</p>
                {isFocused("showcases", index) ? (
                  <div className="flex gap-2">
                    <button type="button" onClick={() => saveHomepageContent()} className={getButtonClassName({ variant: "cart", size: "sm" })}>
                      Salva
                    </button>
                    <button type="button" onClick={() => setHomepageFocus({ section: "showcases", item: null })} className={getButtonClassName({ variant: "profile", size: "sm" })}>
                      Annulla
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setHomepageFocus({ section: "showcases", item: index })} className={getButtonClassName({ variant: "profile", size: "sm" })}>
                    Modifica
                  </button>
                )}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <input className="shop-input" placeholder="Eyebrow" value={item.eyebrow} onChange={(event) => setHomepageShowcases((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, eyebrow: event.target.value } : entry))} />
                <input className="shop-input" placeholder="Titolo" value={item.title} onChange={(event) => setHomepageShowcases((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, title: event.target.value } : entry))} />
                <input className="shop-input" placeholder="Query collegata" value={item.query} onChange={(event) => setHomepageShowcases((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, query: event.target.value } : entry))} />
                <input className="shop-input" placeholder="Link destinazione" value={item.href} onChange={(event) => setHomepageShowcases((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, href: event.target.value } : entry))} />
                <input className="shop-input" placeholder="Etichetta CTA" value={item.ctaLabel} onChange={(event) => setHomepageShowcases((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, ctaLabel: event.target.value } : entry))} />
                <input className="shop-input" placeholder="URL immagine (opzionale)" value={item.imageUrl || ""} onChange={(event) => setHomepageShowcases((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, imageUrl: event.target.value } : entry))} />
              </div>
              <textarea className="shop-textarea mt-4 min-h-24 resize-none" placeholder="Descrizione" value={item.description} onChange={(event) => setHomepageShowcases((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, description: event.target.value } : entry))} />
            </div>
          ))}
        </div>
      </section>

      <section className="shop-card space-y-5 p-6">
        <div>
          <h2 className="text-xl font-semibold text-white">Categorie popolari</h2>
          <p className="mt-1 text-sm text-white/55">Modifica le card scrollabili usate nella homepage dello shop.</p>
        </div>

        <div className="space-y-4">
          {homepagePopularCategories.map((item, index) => (
            <div
              key={`${item.title}-${index}`}
              className={`rounded-[24px] border p-5 ${isFocused("popular-categories", index) ? "border-[#e3f503]/45 bg-white/[0.05]" : "border-white/10 bg-white/[0.03]"}`}
            >
              <div className="mb-4 flex items-center justify-between gap-4">
                <p className="text-sm font-medium text-white">Categoria {index + 1}</p>
                {isFocused("popular-categories", index) ? (
                  <div className="flex gap-2">
                    <button type="button" onClick={() => saveHomepageContent()} className={getButtonClassName({ variant: "cart", size: "sm" })}>
                      Salva
                    </button>
                    <button type="button" onClick={() => setHomepageFocus({ section: "popular-categories", item: null })} className={getButtonClassName({ variant: "profile", size: "sm" })}>
                      Annulla
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setHomepageFocus({ section: "popular-categories", item: index })} className={getButtonClassName({ variant: "profile", size: "sm" })}>
                    Modifica
                  </button>
                )}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <input className="shop-input" placeholder="Titolo categoria" value={item.title} onChange={(event) => setHomepagePopularCategories((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, title: event.target.value } : entry))} />
                <input className="shop-input" placeholder="Query collegata" value={item.query} onChange={(event) => setHomepagePopularCategories((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, query: event.target.value } : entry))} />
                <input className="shop-input" placeholder="Link destinazione" value={item.href} onChange={(event) => setHomepagePopularCategories((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, href: event.target.value } : entry))} />
                <input className="shop-input" placeholder="URL immagine (opzionale)" value={item.imageUrl || ""} onChange={(event) => setHomepagePopularCategories((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, imageUrl: event.target.value } : entry))} />
              </div>
              <textarea className="shop-textarea mt-4 min-h-24 resize-none" placeholder="Descrizione breve" value={item.description} onChange={(event) => setHomepagePopularCategories((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, description: event.target.value } : entry))} />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
