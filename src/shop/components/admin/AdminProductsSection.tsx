import type { FormEvent } from "react"

import { Button } from "../../../components/Button"
import { AdminCollection, ProductManualBadge, ProductStatus, ShopProduct } from "../../types"
import { ProductFiltersBar } from "./ProductFiltersBar"
import { ProductFormCard } from "./ProductFormCard"
import { ProductListSection } from "./ProductListSection"

type ProductFormState = {
  title: string
  sku: string
  description: string
  priceA4: string
  priceA3: string
  costPrice: string
  hasA4: boolean
  hasA3: boolean
  category: string
  tags: string
  collectionIds: number[]
  manualBadges: ProductManualBadge[]
  featured: boolean
  stock: number
  lowStockThreshold: number
  status: ProductStatus
  existingImageUrls: string[]
  variants: Array<{
    id: number | null
    title: string
    key: string
    sku: string
    price: string
    costPrice: string
    stock: number
    lowStockThreshold: number
    isDefault: boolean
    isActive: boolean
  }>
}

type CollectionFormState = {
  title: string
  slug: string
  description: string
  active: boolean
}

type AdminProductsSectionProps = {
  editingProductId: number | null
  selectedProductIds: number[]
  isMultiEdit: boolean
  hasTouchedFields: boolean
  productForm: ProductFormState
  categories: string[]
  collections: AdminCollection[]
  productImages: string[]
  productSearch: string
  productCategoryFilter: string
  productStatusFilter: "all" | ProductStatus
  products: ShopProduct[]
  newCategoryName: string
  renamingCategory: string | null
  renamedCategoryValue: string
  collectionForm: CollectionFormState
  editingCollectionId: number | null
  onSubmitProduct: (event: FormEvent) => void
  onCancelProduct: () => void
  onChangeProductForm: (next: ProductFormState) => void
  onProductFileChange: (files: FileList | null) => void
  onReorderProductImages: (nextImages: string[]) => void
  onRemoveProductImage: (imageUrl: string) => void
  onProductSearchChange: (value: string) => void
  onProductCategoryFilterChange: (value: string) => void
  onProductStatusFilterChange: (value: "all" | ProductStatus) => void
  onToggleSelected: (productId: number, checked: boolean) => void
  onEditProduct: (product: ShopProduct) => void
  onDuplicateProduct: (product: ShopProduct) => void
  onDeleteProduct: (product: ShopProduct) => void
  containWheel: (event: React.WheelEvent<HTMLElement>) => void
  onStartRenameCategory: (category: string) => void
  onRenamedCategoryValueChange: (value: string) => void
  onRenameCategory: (category: string) => void
  onDeleteCategory: (category: string) => void
  onNewCategoryNameChange: (value: string) => void
  onCreateCategory: (event: FormEvent) => void
  onCollectionFormChange: (next: CollectionFormState) => void
  onSaveCollection: (event: FormEvent) => void
  onResetCollectionForm: () => void
  onStartEditCollection: (collection: AdminCollection) => void
  onDeleteCollection: (collectionId: number) => void
}

export function AdminProductsSection({
  editingProductId,
  selectedProductIds,
  isMultiEdit,
  hasTouchedFields,
  productForm,
  categories,
  collections,
  productImages,
  productSearch,
  productCategoryFilter,
  productStatusFilter,
  products,
  newCategoryName,
  renamingCategory,
  renamedCategoryValue,
  collectionForm,
  editingCollectionId,
  onSubmitProduct,
  onCancelProduct,
  onChangeProductForm,
  onProductFileChange,
  onReorderProductImages,
  onRemoveProductImage,
  onProductSearchChange,
  onProductCategoryFilterChange,
  onProductStatusFilterChange,
  onToggleSelected,
  onEditProduct,
  onDuplicateProduct,
  onDeleteProduct,
  containWheel,
  onStartRenameCategory,
  onRenamedCategoryValueChange,
  onRenameCategory,
  onDeleteCategory,
  onNewCategoryNameChange,
  onCreateCategory,
  onCollectionFormChange,
  onSaveCollection,
  onResetCollectionForm,
  onStartEditCollection,
  onDeleteCollection,
}: AdminProductsSectionProps) {
  return (
    <div className="grid items-stretch gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <ProductFormCard
        editingProductId={editingProductId}
        selectedCount={selectedProductIds.length}
        isMultiEdit={isMultiEdit}
        canSubmit={isMultiEdit ? hasTouchedFields : true}
        productForm={productForm}
        categories={categories}
        collections={collections}
        productImages={productImages}
        onSubmit={onSubmitProduct}
        onCancel={onCancelProduct}
        onChange={onChangeProductForm}
        onFileChange={onProductFileChange}
        onReorderImages={onReorderProductImages}
        onRemoveImage={onRemoveProductImage}
      />

      <div className="shop-card flex h-full min-h-0 flex-col gap-4 p-6">
        <ProductFiltersBar
          search={productSearch}
          category={productCategoryFilter}
          status={productStatusFilter}
          categories={categories}
          total={products.length}
          onSearchChange={onProductSearchChange}
          onCategoryChange={onProductCategoryFilterChange}
          onStatusChange={onProductStatusFilterChange}
        />
        <div onWheelCapture={containWheel} className="min-h-0 flex-1">
          <ProductListSection
            products={products}
            selectedIds={selectedProductIds}
            onToggleSelected={onToggleSelected}
            onEdit={onEditProduct}
            onDuplicate={onDuplicateProduct}
            onDelete={onDeleteProduct}
          />
        </div>
      </div>

      <section className="shop-card space-y-4 p-6 xl:col-span-2">
        <div className="max-w-3xl">
          <h2 className="text-xl font-semibold text-white">Gestione categorie</h2>
          <p className="mt-1 text-sm text-white/55">Organizza le categorie prodotto in un unico pannello largo e compatto.</p>
        </div>
        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => (
            <div key={category} className="rounded-2xl border border-white/10 px-4 py-3">
              {renamingCategory === category ? (
                <div className="flex flex-col gap-3 md:flex-row">
                  <input className="shop-input" value={renamedCategoryValue} onChange={(event) => onRenamedCategoryValueChange(event.target.value)} />
                  <Button type="button" text="Salva nome" onClick={() => onRenameCategory(category)}>
                    Salva nome
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-white">{category}</span>
                  <div className="flex gap-2">
                    <Button type="button" variant="ghost" size="sm" text="Rinomina" onClick={() => onStartRenameCategory(category)}>
                      Rinomina
                    </Button>
                    <Button type="button" size="sm" text="Elimina" onClick={() => onDeleteCategory(category)}>
                      Elimina
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <form onSubmit={onCreateCategory} className="flex w-full max-w-[420px] flex-col gap-3 md:flex-row md:items-center">
            <input
              className="h-11 flex-1 rounded-lg border border-white/12 bg-white/[0.03] px-4 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-white/25"
              placeholder="Nuova categoria"
              value={newCategoryName}
              onChange={(event) => onNewCategoryNameChange(event.target.value)}
            />
            <Button type="submit" className="h-11">
              Crea
            </Button>
          </form>
        </div>
      </section>

      <section className="shop-card space-y-4 p-6 xl:col-span-2">
        <div className="max-w-4xl space-y-2">
          <h2 className="text-xl font-semibold text-white">Gestione collezioni</h2>
          <p className="text-sm leading-6 text-white/60">
            Le collezioni servono a raggruppare prodotti in temi o percorsi editoriali trasversali, diversi dalle categorie principali.
            Esempio: categoria = Print, collezione = Cantanti famosi.
          </p>
        </div>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <form onSubmit={onSaveCollection} className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">Nuova collezione</h3>
                  <p className="mt-1 text-sm text-white/55">Crea o aggiorna una collezione da riutilizzare nel catalogo e nella homepage.</p>
                </div>
                {editingCollectionId ? (
                  <button type="button" onClick={onResetCollectionForm} className="text-sm text-white/60 transition hover:text-white">
                    Annulla modifica
                  </button>
                ) : null}
              </div>
              <input className="shop-input" placeholder="Titolo collezione" value={collectionForm.title} onChange={(event) => onCollectionFormChange({ ...collectionForm, title: event.target.value })} />
              <input className="shop-input" placeholder="Slug (opzionale)" value={collectionForm.slug} onChange={(event) => onCollectionFormChange({ ...collectionForm, slug: event.target.value })} />
              <textarea className="shop-textarea min-h-28 resize-none" placeholder="Descrizione collezione" value={collectionForm.description} onChange={(event) => onCollectionFormChange({ ...collectionForm, description: event.target.value })} />
              <label className="flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/70">
                <input type="checkbox" checked={collectionForm.active} onChange={(event) => onCollectionFormChange({ ...collectionForm, active: event.target.checked })} />
                Collezione attiva nel catalogo pubblico
              </label>
              <Button type="submit" text={editingCollectionId ? "Aggiorna collezione" : "Crea collezione"}>
                {editingCollectionId ? "Aggiorna collezione" : "Crea collezione"}
              </Button>
            </form>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white">Collezioni esistenti</h3>
              <p className="mt-1 text-sm text-white/55">Lista delle collezioni già create e del numero di prodotti collegati.</p>
            </div>
            <div className="space-y-3">
              {collections.map((collection) => (
                <div key={collection.id} className="rounded-2xl border border-white/10 px-4 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-white">{collection.title}</p>
                        <span className="rounded-full border border-white/10 px-2 py-1 text-[11px] uppercase tracking-[0.18em] text-white/55">
                          {collection.active ? "Active" : "Hidden"}
                        </span>
                      </div>
                      <p className="text-xs text-white/45">/{collection.slug} · {collection._count?.products || 0} prodotti</p>
                      {collection.description ? <p className="text-sm text-white/60">{collection.description}</p> : null}
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" variant="ghost" size="sm" text="Modifica" onClick={() => onStartEditCollection(collection)}>
                        Modifica
                      </Button>
                      <Button type="button" size="sm" text="Elimina" onClick={() => onDeleteCollection(collection.id)}>
                        Elimina
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {!collections.length ? <p className="text-sm text-white/50">Nessuna collezione creata.</p> : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
