import { useState, type FormEvent } from "react"

import { Button, getDangerButtonClassName } from "../../../components/Button"
import { AdminCategory } from "../../types"
import { ConfirmActionModal } from "./ConfirmActionModal"

type CategoryFormState = {
  name: string
  slug: string
  description: string
  imageUrl: string
  secondaryText: string
  position: number
  active: boolean
}

type AdminCategoriesSectionProps = {
  categories: AdminCategory[]
  categoryForm: CategoryFormState
  editingCategorySlug: string | null
  coverPreviewUrl: string
  onCategoryFormChange: (next: CategoryFormState) => void
  onCoverFileChange: (files: FileList | null) => void
  onSaveCategory: (event: FormEvent) => void
  onResetCategoryForm: () => void
  onStartEditCategory: (category: AdminCategory) => void
  onDeleteCategory: (category: AdminCategory) => void
}

export function AdminCategoriesSection({
  categories,
  categoryForm,
  editingCategorySlug,
  coverPreviewUrl,
  onCategoryFormChange,
  onCoverFileChange,
  onSaveCategory,
  onResetCategoryForm,
  onStartEditCategory,
  onDeleteCategory,
}: AdminCategoriesSectionProps) {
  const [pendingDelete, setPendingDelete] = useState<AdminCategory | null>(null)
  const coverImage = coverPreviewUrl || categoryForm.imageUrl

  return (
    <section className="grid items-start gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div className="shop-card space-y-5 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-white/45">Categorie</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">{editingCategorySlug ? "Modifica categoria" : "Nuova categoria"}</h2>
            <p className="mt-2 text-sm leading-6 text-white/55">
              Gestisci categorie reali con descrizione, cover, ordine e visibilita.
            </p>
          </div>
          {editingCategorySlug ? (
            <button type="button" onClick={onResetCategoryForm} className="text-sm text-white/60 transition hover:text-white">
              Annulla
            </button>
          ) : null}
        </div>

        <form onSubmit={onSaveCategory} className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <input className="shop-input" placeholder="Nome categoria" value={categoryForm.name} onChange={(event) => onCategoryFormChange({ ...categoryForm, name: event.target.value })} />
            <input className="shop-input" placeholder="Slug" value={categoryForm.slug} onChange={(event) => onCategoryFormChange({ ...categoryForm, slug: event.target.value })} />
          </div>
          <textarea className="shop-textarea min-h-24 resize-none" placeholder="Descrizione categoria" value={categoryForm.description} onChange={(event) => onCategoryFormChange({ ...categoryForm, description: event.target.value })} />
          <textarea className="shop-textarea min-h-20 resize-none" placeholder="Testo secondario / sottotitolo" value={categoryForm.secondaryText} onChange={(event) => onCategoryFormChange({ ...categoryForm, secondaryText: event.target.value })} />

          <div className="grid gap-3 md:grid-cols-2">
            <input className="shop-input" type="number" min={0} placeholder="Ordine" value={categoryForm.position} onChange={(event) => onCategoryFormChange({ ...categoryForm, position: Number(event.target.value || 0) })} />
            <label className="flex items-center gap-3 rounded-lg border border-white/10 px-4 py-3 text-sm text-white/70">
              <input type="checkbox" checked={categoryForm.active} onChange={(event) => onCategoryFormChange({ ...categoryForm, active: event.target.checked })} />
              Categoria visibile/attiva
            </label>
          </div>

          <div className="rounded-lg border border-white/10 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-white">Cover categoria</p>
                <p className="mt-1 text-xs text-white/55">Immagine usata per presentare la categoria.</p>
              </div>
              <label className="cursor-pointer rounded-lg border border-white/10 px-3 py-2 text-xs text-white/70 transition hover:border-white/25 hover:text-white">
                Carica immagine
                <input type="file" accept="image/*" className="sr-only" onChange={(event) => onCoverFileChange(event.target.files)} />
              </label>
            </div>
            {coverImage ? <img src={coverImage} alt="" className="mt-4 aspect-[16/9] w-full rounded-lg object-cover" /> : null}
          </div>

          <Button type="submit" variant="cart">
            {editingCategorySlug ? "Aggiorna categoria" : "Crea categoria"}
          </Button>
        </form>
      </div>

      <div className="shop-card space-y-4 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Categorie esistenti</h2>
            <p className="mt-1 text-sm text-white/55">Ordine, visibilita e contenuto editoriale.</p>
          </div>
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60">{categories.length} categorie</span>
        </div>

        <div className="space-y-3">
          {categories.map((category) => (
            <article key={category.slug} className="rounded-lg border border-white/10 bg-white/[0.025] p-4">
              <div className="flex gap-4">
                {category.imageUrl ? <img src={category.imageUrl} alt="" className="h-20 w-20 rounded-lg object-cover" /> : <div className="h-20 w-20 rounded-lg bg-white/8" />}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate font-semibold text-white">{category.name}</h3>
                    <span className="rounded-full border border-white/10 px-2 py-1 text-[11px] uppercase tracking-[0.18em] text-white/55">
                      {category.active ? "Attiva" : "Nascosta"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-white/45">/{category.slug} · ordine {category.position}</p>
                  {category.description ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/58">{category.description}</p> : null}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <Button type="button" variant="profile" size="sm" onClick={() => onStartEditCategory(category)}>
                  Modifica
                </Button>
                <Button type="button" variant="profile" size="sm" className={getDangerButtonClassName({ size: "sm" })} onClick={() => setPendingDelete(category)}>
                  Elimina
                </Button>
              </div>
            </article>
          ))}
          {!categories.length ? <p className="rounded-lg border border-dashed border-white/10 px-4 py-8 text-center text-sm text-white/50">Nessuna categoria creata.</p> : null}
        </div>
      </div>

      <ConfirmActionModal
        open={Boolean(pendingDelete)}
        title="Elimina categoria"
        description="La categoria puo essere eliminata solo se non e assegnata a prodotti esistenti."
        onCancel={() => setPendingDelete(null)}
        onConfirm={async () => {
          if (!pendingDelete) return
          await onDeleteCategory(pendingDelete)
          setPendingDelete(null)
        }}
      />
    </section>
  )
}
