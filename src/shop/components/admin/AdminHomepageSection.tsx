import { useState, type Dispatch, type SetStateAction } from "react"

import { Button, getButtonClassName, getDangerButtonClassName } from "../../../components/Button"
import { ConfirmActionModal } from "./ConfirmActionModal"

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
  collectionSlug?: string
  imageUrl?: string
  ctaLabel: string
}

type AdminHomepageSectionProps = {
  homepageShowcases: HomepageShowcase[]
  homepagePopularCategories: HomepagePopularCategory[]
  categories: string[]
  collections: Array<{
    title: string
    slug: string
    description?: string
  }>
  homepageFocus: { section: "showcases" | "popular-categories"; item: number | null }
  setHomepageFocus: Dispatch<SetStateAction<{ section: "showcases" | "popular-categories"; item: number | null }>>
  setHomepageShowcases: Dispatch<SetStateAction<HomepageShowcase[]>>
  setHomepagePopularCategories: Dispatch<SetStateAction<HomepagePopularCategory[]>>
  saveHomepageContent: (overrides?: {
    showcases?: HomepageShowcase[]
    popularCategories?: HomepagePopularCategory[]
  }) => Promise<void> | void
  onUploadShowcaseImage: (index: number, files: FileList | null) => Promise<void> | void
  onUploadPopularCategoryImage: (index: number, files: FileList | null) => Promise<void> | void
}

export function AdminHomepageSection({
  homepageShowcases,
  homepagePopularCategories,
  categories,
  collections,
  homepageFocus,
  setHomepageFocus,
  setHomepageShowcases,
  setHomepagePopularCategories,
  saveHomepageContent,
  onUploadShowcaseImage,
  onUploadPopularCategoryImage,
}: AdminHomepageSectionProps) {
  const [popularCategoriesSnapshot, setPopularCategoriesSnapshot] = useState<HomepagePopularCategory[] | null>(null)
  const [showcasesSnapshot, setShowcasesSnapshot] = useState<HomepageShowcase[] | null>(null)
  const [pendingDelete, setPendingDelete] = useState<
    | { type: "showcase"; index: number }
    | { type: "popular-category"; index: number }
    | null
  >(null)

  function isFocused(section: "showcases" | "popular-categories", item: number) {
    return homepageFocus.section === section && homepageFocus.item === item
  }

  function cloneShowcases(entries: HomepageShowcase[]) {
    return entries.map((entry) => ({ ...entry }))
  }

  function clonePopularCategories(entries: HomepagePopularCategory[]) {
    return entries.map((entry) => ({ ...entry }))
  }

  function moveItem<T>(items: T[], fromIndex: number, toIndex: number) {
    if (toIndex < 0 || toIndex >= items.length || fromIndex === toIndex) return items
    const next = [...items]
    const [moved] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, moved)
    return next
  }

  function startEditShowcase(index: number) {
    setShowcasesSnapshot(cloneShowcases(homepageShowcases))
    setHomepageFocus({ section: "showcases", item: index })
  }

  function startEditPopularCategory(index: number) {
    setPopularCategoriesSnapshot(clonePopularCategories(homepagePopularCategories))
    setHomepageFocus({ section: "popular-categories", item: index })
  }

  async function saveShowcase() {
    await saveHomepageContent({ showcases: homepageShowcases })
    setShowcasesSnapshot(null)
  }

  async function savePopularCategory() {
    await saveHomepageContent({ popularCategories: homepagePopularCategories })
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

  async function deleteShowcase(index: number) {
    const next = homepageShowcases.filter((_, itemIndex) => itemIndex !== index)
    setHomepageShowcases(next)
    setShowcasesSnapshot(null)
    setHomepageFocus({ section: "showcases", item: null })
    await saveHomepageContent({ showcases: next })
  }

  async function deletePopularCategory(index: number) {
    const next = homepagePopularCategories.filter((_, itemIndex) => itemIndex !== index)
    setHomepagePopularCategories(next)
    setPopularCategoriesSnapshot(null)
    setHomepageFocus({ section: "popular-categories", item: null })
    await saveHomepageContent({ popularCategories: next })
  }

  async function movePopularCategory(index: number, direction: -1 | 1) {
    const next = moveItem(homepagePopularCategories, index, index + direction)
    if (next === homepagePopularCategories) return
    setHomepagePopularCategories(next)
    setPopularCategoriesSnapshot(null)
    setHomepageFocus({ section: "popular-categories", item: null })
    await saveHomepageContent({ popularCategories: next })
  }

  return (
    <div className="space-y-6">
      <section className="shop-card space-y-5 p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Selezioni in evidenza</h2>
            <p className="mt-1 text-sm text-white/55">Modifica i blocchi editoriali mostrati nella homepage dello shop.</p>
          </div>
          <Button
            type="button"
            variant="cart"
            onClick={() => {
              const fallbackCollection = collections[0] || null
              setShowcasesSnapshot(cloneShowcases(homepageShowcases))
              setHomepageShowcases((current) => [
                ...current,
                {
                  eyebrow: "Selezione in evidenza",
                  title: fallbackCollection?.title || `Nuova selezione ${current.length + 1}`,
                  description: fallbackCollection?.description || "",
                  href: fallbackCollection ? `/shop?collectionSlug=${fallbackCollection.slug}` : "/shop",
                  query: "",
                  collectionSlug: fallbackCollection?.slug || "",
                  imageUrl: "",
                  ctaLabel: "Esplora la collezione",
                },
              ])
              setHomepageFocus({ section: "showcases", item: homepageShowcases.length })
            }}
          >
            Aggiungi nuova selezione in evidenza
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
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => startEditShowcase(index)} className={getButtonClassName({ variant: "profile", size: "sm" })}>
                      Modifica
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowcasesSnapshot(cloneShowcases(homepageShowcases))
                        setHomepageShowcases((current) => {
                          const duplicate = { ...current[index], title: `${current[index].title} copia` }
                          return [...current.slice(0, index + 1), duplicate, ...current.slice(index + 1)]
                        })
                        setHomepageFocus({ section: "showcases", item: index + 1 })
                      }}
                      className={getButtonClassName({ variant: "profile", size: "sm" })}
                    >
                      Duplica
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDelete({ type: "showcase", index })}
                      className={getDangerButtonClassName({ size: "sm" })}
                    >
                      Elimina
                    </button>
                  </div>
                )}
              </div>
              <fieldset disabled={!isFocused("showcases", index)} className="space-y-4 disabled:pointer-events-none disabled:opacity-70">
                <div className="grid gap-4 md:grid-cols-2">
                  <input className="shop-input" placeholder="Eyebrow" value={item.eyebrow} onChange={(event) => setHomepageShowcases((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, eyebrow: event.target.value } : entry))} />
                  <input className="shop-input" placeholder="Titolo" value={item.title} onChange={(event) => setHomepageShowcases((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, title: event.target.value } : entry))} />
                  <select
                    className="shop-select"
                    value={item.collectionSlug || ""}
                    onChange={(event) =>
                      setHomepageShowcases((current) =>
                        current.map((entry, itemIndex) => {
                          if (itemIndex !== index) return entry
                          const nextCollection = collections.find((collection) => collection.slug === event.target.value)
                          return {
                            ...entry,
                            collectionSlug: event.target.value,
                            href: nextCollection ? `/shop?collectionSlug=${nextCollection.slug}` : entry.href,
                            title: nextCollection ? nextCollection.title : entry.title,
                            description: nextCollection?.description || entry.description,
                            query: "",
                          }
                        }),
                      )
                    }
                  >
                    <option value="">Collezione collegata</option>
                    {collections.map((collection) => (
                      <option key={collection.slug} value={collection.slug}>
                        {collection.title}
                      </option>
                    ))}
                  </select>
                  <input className="shop-input" placeholder="Etichetta CTA" value={item.ctaLabel} onChange={(event) => setHomepageShowcases((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, ctaLabel: event.target.value } : entry))} />
                </div>
                <textarea className="shop-textarea min-h-24 resize-none" placeholder="Descrizione" value={item.description} onChange={(event) => setHomepageShowcases((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, description: event.target.value } : entry))} />
                <div className="rounded-2xl border border-white/10 p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">Immagine selezione</p>
                      <p className="mt-1 text-xs text-white/55">Usata come cover del blocco editoriale pubblico.</p>
                    </div>
                    <label
                      htmlFor={`homepage-showcase-image-${index}`}
                      className={getButtonClassName({ variant: "cart", size: "sm" })}
                    >
                      Carica immagine
                    </label>
                    <input
                      id={`homepage-showcase-image-${index}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        void onUploadShowcaseImage(index, event.target.files)
                        event.currentTarget.value = ""
                      }}
                    />
                  </div>
                  {item.imageUrl ? (
                    <div className="mt-4 overflow-hidden rounded-[18px] border border-white/10 bg-black/10">
                      <img src={item.imageUrl} alt={item.title} className="h-48 w-full object-cover" />
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-white/45">Nessuna immagine caricata per questa selezione.</p>
                  )}
                </div>
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
              setPopularCategoriesSnapshot(clonePopularCategories(homepagePopularCategories))
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
                      onClick={() => {
                        setPopularCategoriesSnapshot(clonePopularCategories(homepagePopularCategories))
                        setHomepagePopularCategories((current) => {
                          const duplicate = { ...current[index], title: `${current[index].title} copia` }
                          return [...current.slice(0, index + 1), duplicate, ...current.slice(index + 1)]
                        })
                        setHomepageFocus({ section: "popular-categories", item: index + 1 })
                      }}
                      className={getButtonClassName({ variant: "profile", size: "sm" })}
                    >
                      Duplica
                    </button>
                    <button
                      type="button"
                      onClick={() => void movePopularCategory(index, -1)}
                      disabled={index === 0}
                      className={getButtonClassName({ variant: "profile", size: "sm", disabled: index === 0 })}
                    >
                      Su
                    </button>
                    <button
                      type="button"
                      onClick={() => void movePopularCategory(index, 1)}
                      disabled={index === homepagePopularCategories.length - 1}
                      className={getButtonClassName({ variant: "profile", size: "sm", disabled: index === homepagePopularCategories.length - 1 })}
                    >
                      Giu
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDelete({ type: "popular-category", index })}
                      className={getDangerButtonClassName({ size: "sm" })}
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
                    <label
                      htmlFor={`homepage-popular-category-image-${index}`}
                      className={getButtonClassName({ variant: "cart", size: "sm" })}
                    >
                      Carica immagine
                    </label>
                    <input
                      id={`homepage-popular-category-image-${index}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        void onUploadPopularCategoryImage(index, event.target.files)
                        event.currentTarget.value = ""
                      }}
                    />
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
      <ConfirmActionModal
        open={Boolean(pendingDelete)}
        title={pendingDelete?.type === "showcase" ? "Elimina selezione" : "Elimina categoria popolare"}
        description={
          pendingDelete?.type === "showcase"
            ? "Sei sicuro di voler eliminare questa selezione in evidenza?"
            : "Sei sicuro di voler eliminare questa categoria popolare?"
        }
        onCancel={() => setPendingDelete(null)}
        onConfirm={async () => {
          if (!pendingDelete) return
          if (pendingDelete.type === "showcase") {
            await deleteShowcase(pendingDelete.index)
          } else {
            await deletePopularCategory(pendingDelete.index)
          }
          setPendingDelete(null)
        }}
      />
    </div>
  )
}
