import { ReactNode, useEffect, useRef, useState } from "react"
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

type DropdownOption = {
  key: string
  label: string
  meta?: ReactNode
  image?: string
  selected?: boolean
  disabled?: boolean
  tone?: "price"
  onSelect: () => void
}

function getValidDiscountPrice(price?: number | null, discountPrice?: number | null) {
  if (typeof price !== "number" || !Number.isFinite(price) || price < 0) return null
  if (typeof discountPrice !== "number" || !Number.isFinite(discountPrice) || discountPrice < 0) return null
  return discountPrice < price ? discountPrice : null
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} aria-hidden="true">
      <path d="m5 8 5 5 5-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CompactDropdown({
  label,
  value,
  selectedImage,
  options,
  emptyLabel,
}: {
  label: string
  value: string
  selectedImage?: string
  options: DropdownOption[]
  emptyLabel: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false)
    }

    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [open])

  return (
    <div ref={ref} className="relative rounded-2xl border border-white/10 px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">{label}</p>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="mt-2 flex min-h-[46px] w-full items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.025] px-4 py-2 text-left text-white transition hover:border-white/24 hover:bg-white/[0.045]"
        aria-expanded={open}
      >
        <span className="flex min-w-0 items-center gap-3">
          {selectedImage ? <img src={selectedImage} alt="" className="h-8 w-8 rounded-md object-cover" /> : null}
          <span className="min-w-0 truncate text-sm font-medium">{value || emptyLabel}</span>
        </span>
        <span className="shrink-0 text-white/55">
          <ChevronIcon open={open} />
        </span>
      </button>

      {open ? (
        <div className="absolute left-4 right-4 top-[calc(100%-6px)] z-30 max-h-72 overflow-y-auto rounded-lg border border-white/12 bg-[#101012] p-2 shadow-2xl">
          {options.length ? (
            options.map((option) => (
              <button
                key={option.key}
                type="button"
                disabled={option.disabled}
                onClick={() => {
                  option.onSelect()
                  setOpen(false)
                }}
                className={`flex min-h-[50px] w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition disabled:cursor-not-allowed disabled:opacity-45 ${
                  option.selected
                    ? "bg-[#e3f503]/10 text-white"
                    : "text-white/78 hover:bg-white/[0.055] hover:text-white"
                }`}
              >
                <span className="flex min-w-0 items-center gap-3">
                  {option.image ? (
                    <img src={option.image} alt="" className="h-9 w-9 rounded-md object-cover" />
                  ) : (
                    <span className="h-9 w-9 rounded-md border border-white/10 bg-white/[0.04]" />
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{option.label}</span>
                    {option.meta ? <span className="mt-0.5 block text-xs text-white/45">{option.meta}</span> : null}
                  </span>
                </span>
                {option.tone === "price" ? <span className="shrink-0 text-sm font-medium text-[#e3f503]">{option.meta}</span> : null}
              </button>
            ))
          ) : (
            <div className="px-3 py-3 text-sm text-white/45">{emptyLabel}</div>
          )}
        </div>
      ) : null}
    </div>
  )
}

export function ProductEditionSelector({ editions, selectedEditionName, onSelect }: ProductEditionSelectorProps) {
  const selectedEdition = editions.find((edition) => edition.name === selectedEditionName) || editions[0] || null

  return (
    <CompactDropdown
      label="Variante"
      value={selectedEdition?.name || selectedEditionName || "Variante"}
      selectedImage={selectedEdition?.previewImage}
      emptyLabel="Nessuna variante disponibile"
      options={editions.map((edition) => ({
        key: edition.name,
        label: edition.name,
        image: edition.previewImage,
        selected: edition.name === selectedEdition?.name,
        onSelect: () => onSelect(edition.name),
      }))}
    />
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
    <CompactDropdown
      label="Misura"
      value={selectedVariant?.size || selectedVariant?.title || ""}
      emptyLabel="Nessuna misura disponibile"
      options={variants.map((variant) => ({
        key: `${variant.id ?? variant.key}-${variant.position}`,
        label: variant.size || variant.title,
        disabled: variant.isActive === false,
        meta: (() => {
          const validDiscountPrice = getValidDiscountPrice(variant.price, variant.discountPrice)
          return (
            <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
              <span>{getVariantStockLabel(variant.id)}</span>
              <span aria-hidden="true">·</span>
              {validDiscountPrice ? (
                <>
                  <span className="line-through">{formatPrice(variant.price)}</span>
                  <span className="font-medium text-[#e3f503]">{formatPrice(validDiscountPrice)}</span>
                </>
              ) : (
                <span>{formatPrice(variant.price)}</span>
              )}
            </span>
          )
        })(),
        onSelect: () => onSelect(variant),
      }))}
    />
  )
}
