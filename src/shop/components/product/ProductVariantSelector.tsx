import { formatPrice } from "../../lib/format"
import { ShopProductVariant } from "../../types"

type ProductEditionSelectorProps = {
  editions: Array<{
    name: string
    previewVariant?: ShopProductVariant | null
    previewImage?: string
  }>
  selectedEditionName: string
  onSelect: (editionName: string) => void
}

type ProductVariantSelectorProps = {
  variants: ShopProductVariant[]
  selectedVariantKey: string
  getVariantStockLabel: (variantId?: number | null) => string
  onSelect: (variant: ShopProductVariant) => void
}

export function ProductEditionSelector({ editions, selectedEditionName, onSelect }: ProductEditionSelectorProps) {
  if (editions.length <= 1) {
    return (
      <div className="rounded-2xl border border-white/10 px-4 py-3">
        <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Variante</p>
        <p className="mt-2 text-sm font-medium text-white">{editions[0]?.name || selectedEditionName || "Standard"}</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-white/10 px-4 py-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Variante</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {editions.map((edition) => {
          const isSelected = edition.name === selectedEditionName
          return (
            <button
              key={edition.name}
              type="button"
              onClick={() => onSelect(edition.name)}
              className={`flex min-h-[72px] items-center gap-3 rounded-lg border p-3 text-left transition ${
                isSelected
                  ? "border-[#e3f503]/70 bg-[#e3f503]/10 text-white"
                  : "border-white/10 bg-white/[0.02] text-white/75 hover:border-white/25 hover:text-white"
              }`}
            >
              {edition.previewImage ? (
                <img src={edition.previewImage} alt="" className="h-12 w-12 rounded-md object-cover" />
              ) : (
                <span className={`h-12 w-12 rounded-md border ${isSelected ? "border-[#e3f503]/50 bg-[#e3f503]/14" : "border-white/10 bg-white/[0.04]"}`} />
              )}
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{edition.name}</span>
                <span className="mt-1 block text-xs text-white/45">Edizione prodotto</span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function ProductVariantSelector({
  variants,
  selectedVariantKey,
  getVariantStockLabel,
  onSelect,
}: ProductVariantSelectorProps) {
  const selectedVariant = variants.find((variant) => variant.key === selectedVariantKey) || variants[0] || null

  return (
    <div className="rounded-2xl border border-white/10 px-4 py-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Misura</p>
        {selectedVariant ? <p className="text-sm text-white/65">{selectedVariant.size || selectedVariant.title}</p> : null}
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {variants.length ? variants.map((variant) => {
            const isSelected = selectedVariant?.key === variant.key
            return (
              <button
                key={`${variant.id ?? variant.key}-${variant.position}`}
                type="button"
                onClick={() => onSelect(variant)}
                className={`flex min-h-[76px] items-center justify-between gap-4 rounded-lg border px-4 py-3 text-left transition ${
                  isSelected
                    ? "border-[#e3f503] bg-[#e3f503]/8 text-white"
                    : "border-white/10 text-white/78 hover:border-white/25 hover:bg-white/[0.03] hover:text-white"
                }`}
                disabled={variant.isActive === false}
              >
                <div>
                  <span className="block text-sm font-medium text-white">{variant.size || variant.title}</span>
                  <span className="mt-1 block text-xs text-white/55">{getVariantStockLabel(variant.id)}</span>
                </div>
                <span className={`text-sm font-medium ${isSelected ? "text-[#e3f503]" : "text-white/70"}`}>
                  {formatPrice(variant.price)}
                </span>
              </button>
            )
        }) : <div className="px-2 py-2 text-sm text-white/45">Nessuna misura disponibile</div>}
      </div>
    </div>
  )
}
