import { useState, type Dispatch, type SetStateAction } from "react"

import { Button, getButtonClassName } from "../../../components/Button"

type HomepagePopularCategory = {
  title: string
  description: string
  category: string
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
  categories: string[]
  homepageFocus: { section: "showcases" | "popular-categories"; item: number | null }
  setHomepageFocus: Dispatch<SetStateAction<{ section: "showcases" | "popular-categories"; item: number | null }>>
  setHomepageShowcases: Dispatch<SetStateAction<HomepageShowcase[]>>
  setHomepagePopularCategories: Dispatch<SetStateAction<HomepagePopularCategory[]>>
  saveHomepageContent: () => Promise<void> | void
  onUploadPopularCategoryImage: (index: number, files: FileList | null) => Promise<void> | void
}

export function AdminHomepageSection({
  homepageShowcases,
  homepagePopularCategories,
  categories,
  homepageFocus,
  setHomepageFocus,
  setHomepageShowcases,
  setHomepagePopularCategories,
  saveHomepageContent,
  onUploadPopularCategoryImage,
}: AdminHomepageSectionProps) {
  const [popularCategoriesSnapshot, setPopularCategoriesSnapshot] = useState<HomepagePopularCategory[] | null>(null)
  const [showcasesSnapshot, setShowcasesSnapshot] = useState<HomepageShowcase[] | null>(null)

  function isFocused(section: "showcases" | "popular-categories", item: number) {
    return homepageFocus.section === section && homepageFocus.item === item
  }

  function startEditShowcase(index: number) {
    setShowcasesSnapshot(homepageShowcases.map((entry) => ({ ...entry })))
    setHomepageFocus({ section: "showcases", item: index })
  }

  function startEditPopularCategory(index: number) {
    setPopularCategoriesSnapshot(homepagePopularCategories.map((entry) => ({ ...entry })))
    setHomepageFocus({ section: "popular-categories", item: index })
  }

  async function saveShowcase() {
    await saveHomepageContent()
    setShowcasesSnapshot(null)
  }

  async function savePopularCategory() {
    await saveHomepageContent()
    setPopularCategoriesSnapshot(null)
  }

  function cancelShowcaseEdit() {
    if (showcasesSnapshot) {
      setHomepageShowcases(showcasesSnapshot)
      setShowcasesSnapshot(null)
    }
    setHomepageFocus({ section: "showcases", item: null })
  }

  function cancelPopularCategoryEdit() {
    if (popularCategoriesSnapshot) {
      setHomepagePopularCategories(popularCategoriesSnapshot)
      setPopularCategoriesSnapshot(null)
    }
    setHomepageFocus({ section: "popular-categories", item: null })
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
                    <button type="button" onClick={() => void saveShowcase()} className={getButtonClassName({ variant: "cart", size: "sm" })}>
                      Salva
                    </button>
                    <button type="button" onClick={cancelShowcaseEdit} className={getButtonClassName({ variant: "profile", size: "sm" })}>
                      Annulla
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => startEditShowcase(index)} className={getButtonClassName({ variant: "profile", size: "sm" })}>
                    Modifica
                  </button>
                )}
              </div>
              <fieldset disabled={!isFocused("showcases", index)} className="space-y-4 disabled:pointer-events-none disabled:opacity-70">
                <div className="grid gap-4 md:grid-cols-2">
                  <input className="shop-input" placeholder="Eyebrow" value={item.eyebrow} onChange={(event) => setHomepageShowcases((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, eyebrow: event.target.value } : entry))} />
                  <input className="shop-input" placeholder="Titolo" value={item.title} onChange={(event) => setHomepageShowcases((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, title: event.target.value } : entry))} />
                  <input className="shop-input" placeholder="Query collegata" value={item.query} onChange={(event) => setHomepageShowcases((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, query: event.target.value } : entry))} />
                  <input className="shop-input" placeholder="Link destinazione" value={item.href} onChange={(event) => setHomepageShowcases((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, href: event.target.value } : entry))} />
                  <input className="shop-input" placeholder="Etichetta CTA" value={item.ctaLabel} onChange={(event) => setHomepageShowcases((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, ctaLabel: event.target.value } : entry))} />
                  <input className="shop-input" placeholder="URL immagine (opzionale)" value={item.imageUrl || ""} onChange={(event) => setHomepageShowcases((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, imageUrl: event.target.value } : entry))} />
                </div>
                <textarea className="shop-textarea min-h-24 resize-none" placeholder="Descrizione" value={item.description} onChange={(event) => setHomepageShowcases((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, description: event.target.value } : entry))} />
              </fieldset>
            </div>
          ))}
        </div>
      </section>

      <section className="shop-card space-y-5 p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Categorie popolari</h2>
            <p className="mt-1 text-sm text-white/55">Categorie reali, sottotitolo editoriale e immagine gestita direttamente dal pannello admin.</p>
          </div>
          <Button
            type="button"
            variant="cart"
            onClick={() => {
              const fallbackCategory = categories[0] || ""
              setPopularCategoriesSnapshot(homepagePopularCategories.map((entry) => ({ ...entry })))
              setHomepagePopularCategories((current) => [
                ...current,
                {
                  title: fallbackCategory || `Nuova categoria ${current.length + 1}`,
                  category: fallbackCategory,
                  description: "",
                  imageUrl: "",
                },
              ])
              setHomepageFocus({ section: "popular-categories", item: homepagePopularCategories.length })
            }}
          >
            Aggiungi nuova categoria popolare
          </Button>
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
                    <button type="button" onClick={() => void savePopularCategory()} className={getButtonClassName({ variant: "cart", size: "sm" })}>
                      Salva
                    </button>
                    <button type="button" onClick={cancelPopularCategoryEdit} className={getButtonClassName({ variant: "profile", size: "sm" })}>
                      Annulla
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => startEditPopularCategory(index)} className={getButtonClassName({ variant: "profile", size: "sm" })}>
                      Modifica
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setHomepagePopularCategories((current) => {
                          const duplicate = { ...current[index], title: `${current[index].title} copia` }
                          return [...current.slice(0, index + 1), duplicate, ...current.slice(index + 1)]
                        })
                      }
                      className={getButtonClassName({ variant: "profile", size: "sm" })}
                    >
                      Duplica
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setHomepagePopularCategories((current) => current.filter((_, itemIndex) => itemIndex !== index))
                      }
                      className={getButtonClassName({ variant: "cart", size: "sm" })}
                    >
                      Elimina
                    </button>
                  </div>
                )}
              </div>
              <fieldset disabled={!isFocused("popular-categories", index)} className="space-y-4 disabled:pointer-events-none disabled:opacity-70">
                <div className="grid gap-4 md:grid-cols-2">
                  <input className="shop-input" placeholder="Titolo categoria" value={item.title} onChange={(event) => setHomepagePopularCategories((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, title: event.target.value } : entry))} />
                  <select className="shop-select" value={item.category} onChange={(event) => setHomepagePopularCategories((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, category: event.target.value } : entry))}>
                    <option value="">Categoria</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                <textarea className="shop-textarea min-h-24 resize-none" placeholder="Sottotitolo editoriale" value={item.description} onChange={(event) => setHomepagePopularCategories((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, description: event.target.value } : entry))} />
                <div className="rounded-2xl border border-white/10 p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">Immagine categoria</p>
                      <p className="mt-1 text-xs text-white/55">Usata come cover visiva della card pubblica in homepage.</p>
                    </div>
                    <label>
                      <Button type="button" variant="cart" size="sm" className="pointer-events-none">
                        Carica immagine
                      </Button>
                      <input type="file" accept="image/*" className="hidden" onChange={(event) => void onUploadPopularCategoryImage(index, event.target.files)} />
                    </label>
                  </div>
                  {item.imageUrl ? (
                    <div className="mt-4 overflow-hidden rounded-[18px] border border-white/10 bg-black/10">
                      <img src={item.imageUrl} alt={item.title} className="h-48 w-full object-cover" />
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-white/45">Nessuna immagine caricata per questa categoria.</p>
                  )}
                </div>
              </fieldset>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
