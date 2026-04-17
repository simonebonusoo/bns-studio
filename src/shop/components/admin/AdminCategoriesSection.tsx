import { useState, type FormEvent } from "react"

import { Button, getDangerButtonClassName } from "../../../components/Button"
import { ConfirmActionModal } from "./ConfirmActionModal"

type AdminCategoriesSectionProps = {
  categories: string[]
  newCategoryName: string
  renamingCategory: string | null
  renamedCategoryValue: string
  onStartRenameCategory: (category: string) => void
  onRenamedCategoryValueChange: (value: string) => void
  onRenameCategory: (category: string) => void
  onDeleteCategory: (category: string) => void
  onNewCategoryNameChange: (value: string) => void
  onCreateCategory: (event: FormEvent) => void
}

export function AdminCategoriesSection({
  categories,
  newCategoryName,
  renamingCategory,
  renamedCategoryValue,
  onStartRenameCategory,
  onRenamedCategoryValueChange,
  onRenameCategory,
  onDeleteCategory,
  onNewCategoryNameChange,
  onCreateCategory,
}: AdminCategoriesSectionProps) {
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)

  return (
    <section className="shop-card space-y-5 p-6">
      <div className="max-w-3xl">
        <p className="text-xs uppercase tracking-[0.32em] text-white/45">Categorie</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Gestione categorie</h2>
        <p className="mt-2 text-sm text-white/55">Categorie prodotto separate dalle collezioni editoriali.</p>
      </div>

      <form onSubmit={onCreateCategory} className="flex w-full max-w-[520px] flex-col gap-3 md:flex-row md:items-center">
        <input
          className="shop-input"
          placeholder="Nuova categoria"
          value={newCategoryName}
          onChange={(event) => onNewCategoryNameChange(event.target.value)}
        />
        <Button type="submit" variant="cart" className="h-11">
          Crea categoria
        </Button>
      </form>

      <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {categories.map((category) => (
          <div key={category} className="rounded-lg border border-white/10 px-4 py-3">
            {renamingCategory === category ? (
              <div className="flex flex-col gap-3 md:flex-row">
                <input className="shop-input" value={renamedCategoryValue} onChange={(event) => onRenamedCategoryValueChange(event.target.value)} />
                <Button type="button" variant="cart" text="Salva nome" onClick={() => onRenameCategory(category)}>
                  Salva nome
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-white">{category}</span>
                <div className="flex gap-2">
                  <Button type="button" variant="profile" size="sm" text="Rinomina" onClick={() => onStartRenameCategory(category)}>
                    Rinomina
                  </Button>
                  <Button
                    type="button"
                    variant="profile"
                    size="sm"
                    className={getDangerButtonClassName({ size: "sm" })}
                    text="Elimina"
                    onClick={() => setPendingDelete(category)}
                  >
                    Elimina
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
        {!categories.length ? <p className="rounded-lg border border-dashed border-white/10 px-4 py-8 text-center text-sm text-white/50">Nessuna categoria creata.</p> : null}
      </div>

      <ConfirmActionModal
        open={Boolean(pendingDelete)}
        title="Elimina categoria"
        description="Sei sicuro di voler eliminare questa categoria?"
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
