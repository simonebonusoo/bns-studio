import { formatPrice } from "../../lib/format"
import { ShopProductVariant } from "../../types"

type ProductVariantSelectorProps = {
  open: boolean
  variants: ShopProductVariant[]
  selectedVariantKey: string
  getVariantStockLabel: (variantId?: number | null) => string
  onToggle: () => void
  onSelect: (variant: ShopProductVariant) => void
}

export function ProductVariantSelector({
  open,
  variants,
  selectedVariantKey,
  getVariantStockLabel,
  onToggle,
  onSelect,
}: ProductVariantSelectorProps) {
  const selectedVariant = variants.find((variant) => variant.key === selectedVariantKey) || variants[0] || null

  return (
    <div className="rounded-2xl border border-white/10">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition hover:bg-white/[0.03]"
      >
        <span className="text-white/70">Variante</span>
        <span className="flex items-center gap-3">
          <span className="text-sm text-white">{selectedVariant?.title || "Seleziona"}</span>
          <span className={`text-white/45 transition ${open ? "rotate-180" : ""}`}>⌄</span>
        </span>
      </button>
      {open ? (
        <div className="grid gap-2 border-t border-white/10 px-3 py-3">
          {variants.map((variant) => {
            const isSelected = selectedVariant?.key === variant.key
            return (
              <button
                key={`${variant.id ?? variant.key}-${variant.position}`}
                type="button"
                onClick={() => onSelect(variant)}
                className={`flex items-center justify-between gap-4 rounded-[18px] border px-4 py-3 text-left transition ${
                  isSelected
                    ? "border-[#e3f503] bg-[#e3f503]/8 text-white"
                    : "border-white/10 text-white/78 hover:border-white/25 hover:bg-white/[0.03] hover:text-white"
                }`}
                disabled={variant.isActive === false}
              >
                <div>
                  <span className="block text-sm font-medium text-white">{variant.title}</span>
                  <span className="mt-1 block text-xs text-white/55">{getVariantStockLabel(variant.id)}</span>
                </div>
                <span className={`text-sm font-medium ${isSelected ? "text-[#e3f503]" : "text-white/70"}`}>
                  {formatPrice(variant.price)}
                </span>
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
