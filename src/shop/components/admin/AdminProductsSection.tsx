import { useEffect, useRef, useState, type Dispatch, type FormEvent, type SetStateAction } from "react"

import { getDangerButtonClassName } from "../../../components/Button"
import { Button } from "../../../components/Button"
import { AdminCollection, ProductManualBadge, ProductStatus, ShopProduct } from "../../types"
import { AdminRenderGuard } from "./AdminRenderGuard"
import { ConfirmActionModal } from "./ConfirmActionModal"
import { ProductFiltersBar } from "./ProductFiltersBar"
import { ProductFormCard } from "./ProductFormCard"
import { ProductListSection } from "./ProductListSection"
import { AdminVisibleProductsSection } from "./AdminVisibleProductsSection"

type ProductFormState = {
  title: string
  sku: string
  description: string
  priceA4: string
  priceA3: string
  discountPriceA4: string
  discountPriceA3: string
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
    discountPrice: string
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
  updatingHomeProductId: number | null
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
  allProducts: ShopProduct[]
  visibleProductSlots: Array<number | null>
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
  onToggleHomeVisibility: (product: ShopProduct, checked: boolean) => Promise<void> | void
  setVisibleProductSlots: Dispatch<SetStateAction<Array<number | null>>>
  onSaveVisibleProducts: () => Promise<void> | void
  onEditProduct: (product: ShopProduct) => void
  onDuplicateProduct: (product: ShopProduct) => void
  onDeleteProduct: (product: ShopProduct) => void
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
  updatingHomeProductId,
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
  allProducts,
  visibleProductSlots,
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
  onToggleHomeVisibility,
  setVisibleProductSlots,
  onSaveVisibleProducts,
  onEditProduct,
  onDuplicateProduct,
  onDeleteProduct,
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
  const formColumnRef = useRef<HTMLDivElement | null>(null)
  const [listColumnHeight, setListColumnHeight] = useState<number | null>(null)
  const [pendingDelete, setPendingDelete] = useState<
    | { type: "category"; category: string }
    | { type: "collection"; collectionId: number; title: string }
    | null
  >(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    const updateHeight = () => {
      if (window.innerWidth < 1280 || !formColumnRef.current) {
        setListColumnHeight(null)
        return
      }

      setListColumnHeight(formColumnRef.current.getBoundingClientRect().height)
    }

    updateHeight()

    const observer = new ResizeObserver(() => {
      updateHeight()
    })

    if (formColumnRef.current) {
      observer.observe(formColumnRef.current)
    }

    window.addEventListener("resize", updateHeight)

    return () => {
      observer.disconnect()
      window.removeEventListener("resize", updateHeight)
    }
  }, [productForm, categories.length, collections.length, editingProductId, hasTouchedFields, isMultiEdit, selectedProductIds.length])

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <div ref={formColumnRef}>
        <AdminRenderGuard title="Form prodotto">
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
        </AdminRenderGuard>
      </div>

      <div
        className="shop-card flex min-h-0 flex-col gap-4 overflow-hidden p-6"
        style={listColumnHeight ? { height: `${listColumnHeight}px` } : undefined}
      >
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
        <div className="min-h-0 flex-1 overflow-hidden">
          <ProductListSection
            products={products}
            selectedIds={selectedProductIds}
            updatingHomeProductId={updatingHomeProductId}
            onToggleSelected={onToggleSelected}
            onToggleHomeVisibility={onToggleHomeVisibility}
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
                      onClick={() => setPendingDelete({ type: "category", category })}
                    >
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
            <Button type="submit" variant="cart" className="h-11">
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
              <Button type="submit" variant="cart" text={editingCollectionId ? "Aggiorna collezione" : "Crea collezione"}>
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
                      <Button type="button" variant="profile" size="sm" text="Modifica" onClick={() => onStartEditCollection(collection)}>
                        Modifica
                      </Button>
                      <Button
                        type="button"
                        variant="profile"
                        size="sm"
                        className={getDangerButtonClassName({ size: "sm" })}
                        text="Elimina"
                        onClick={() => setPendingDelete({ type: "collection", collectionId: collection.id, title: collection.title })}
                      >
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

      <AdminVisibleProductsSection
        products={allProducts}
        visibleProductSlots={visibleProductSlots}
        setVisibleProductSlots={setVisibleProductSlots}
        onSave={onSaveVisibleProducts}
      />

      <ConfirmActionModal
        open={Boolean(pendingDelete)}
        title={pendingDelete?.type === "category" ? "Elimina categoria" : "Elimina collezione"}
        description={
          pendingDelete?.type === "category"
            ? "Sei sicuro di voler eliminare questa categoria?"
            : "Sei sicuro di voler eliminare questa collezione?"
        }
        onCancel={() => setPendingDelete(null)}
        onConfirm={async () => {
          if (!pendingDelete) return
          if (pendingDelete.type === "category") {
            await onDeleteCategory(pendingDelete.category)
          } else {
            await onDeleteCollection(pendingDelete.collectionId)
          }
          setPendingDelete(null)
        }}
      />
    </div>
  )
}
