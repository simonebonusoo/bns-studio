import { RefObject } from "react"
import { ProductCollection, ProductVisibleBadge, ShopProductVariant } from "../../types"
import { Button } from "../../../components/Button"
import { formatPrice } from "../../lib/format"
import { ProductPurchaseState } from "./purchaseState"
import { ProductEditionSelector, ProductVariantSelector } from "./ProductVariantSelector"

type ProductPurchasePanelProps = {
  badges: ProductVisibleBadge[]
  originalPrice: number
  selectedPrice: number
  subtotal: number
  stockLabel: string
  productCategory: string
  productCollection?: ProductCollection | null
  panelRef?: RefObject<HTMLDivElement | null>
  sku?: string | null
  variants: ShopProductVariant[]
  editions: Array<{ name: string; previewVariant?: ShopProductVariant | null; previewImage?: string }>
  selectedEditionName: string
  selectedVariantKey: string
  quantity: number
  maxQuantity: number
  isCustomizable?: boolean
  personalizationTextEnabled?: boolean
  personalizationTextLabel?: string
  personalizationTextMaxChars?: number
  personalizationText: string
  personalizationImageEnabled?: boolean
  personalizationImageLabel?: string
  personalizationImageInstructions?: string
  personalizationImageUrl?: string
  personalizationImageUploading?: boolean
  personalizationError: string
  purchasable: boolean
  purchaseState: ProductPurchaseState
  stockStatus: string
  onCategoryClick: () => void
  onCollectionClick: () => void
  onSelectEdition: (editionName: string) => void
  onSelectVariant: (variant: ShopProductVariant) => void
  onDecreaseQuantity: () => void
  onIncreaseQuantity: () => void
  onPersonalizationTextChange: (value: string) => void
  onPersonalizationImageChange: (file: File | null) => void | Promise<void>
  onAddToCart: () => void
  onBuyNow: () => void
  onEdit: () => void
  onNotify: () => void | Promise<void>
  notifyMessage: string
  getVariantStockLabel: (variantId?: number | null) => string
}

export function ProductPurchasePanel({
  badges,
  originalPrice,
  selectedPrice,
  subtotal,
  stockLabel,
  productCategory,
  productCollection,
  panelRef,
  sku,
  variants,
  editions,
  selectedEditionName,
  selectedVariantKey,
  quantity,
  maxQuantity,
  isCustomizable = false,
  personalizationTextEnabled = false,
  personalizationTextLabel = "",
  personalizationTextMaxChars = 50,
  personalizationText,
  personalizationImageEnabled = false,
  personalizationImageLabel = "",
  personalizationImageInstructions = "",
  personalizationImageUrl = "",
  personalizationImageUploading = false,
  personalizationError,
  purchasable,
  purchaseState,
  stockStatus,
  onCategoryClick,
  onCollectionClick,
  onSelectEdition,
  onSelectVariant,
  onDecreaseQuantity,
  onIncreaseQuantity,
  onPersonalizationTextChange,
  onPersonalizationImageChange,
  onAddToCart,
  onBuyNow,
  onEdit,
  onNotify,
  notifyMessage,
  getVariantStockLabel,
}: ProductPurchasePanelProps) {
  const subtotalVisible = subtotal > selectedPrice
  const hasDiscount = selectedPrice < originalPrice

  return (
    <div ref={panelRef} className="shop-card flex h-full min-w-0 flex-col p-5 md:p-6 lg:min-h-[630px]">
      <div className="space-y-4">
        <div className="space-y-3 border-b border-white/10 pb-4">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-4">
              <p className="pt-1 text-[11px] uppercase tracking-[0.2em] text-white/45">Prezzo</p>
              {badges.length ? (
                <div className="flex flex-wrap justify-end gap-2">
                  {badges.map((badge) => (
                    <span key={badge.key} className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/75">
                      {badge.label}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/[0.035] px-5 py-3">
              <div className="flex h-[48px] items-center justify-between gap-4">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {hasDiscount ? <span className="text-sm text-white/35 line-through">{formatPrice(originalPrice)}</span> : null}
                  <span className="block text-3xl font-semibold leading-none text-white md:text-[2.1rem]">{formatPrice(selectedPrice)}</span>
                </div>
                <div className={`flex w-[92px] flex-col items-end justify-center text-right transition-opacity ${subtotalVisible ? "opacity-100" : "opacity-0"}`}>
                  <span className="block text-[9px] uppercase tracking-[0.14em] text-white/35">Subtotale</span>
                  <span className="mt-0.5 block text-xs text-white/62 md:text-[13px]">{formatPrice(subtotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="grid min-w-0 gap-3 text-sm text-white/65">
          <div className="flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-white/10 px-4 py-3">
            <span className="shrink-0">Disponibilità</span>
            <span className="min-w-0 max-w-full truncate text-right">{stockLabel}</span>
          </div>
          <div className="flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-white/10 px-4 py-3">
            <span className="shrink-0">Categoria</span>
            <button
              type="button"
              onClick={onCategoryClick}
              className="min-w-0 max-w-full truncate text-right text-sm text-white/80 transition hover:text-[#e3f503]"
            >
              {productCategory}
            </button>
          </div>
          {productCollection ? (
            <div className="flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-white/10 px-4 py-3">
              <span className="shrink-0">Collezione</span>
              <button
                type="button"
                onClick={onCollectionClick}
                className="min-w-0 max-w-full truncate text-right text-sm text-white/80 transition hover:text-[#e3f503]"
              >
                {productCollection.title}
              </button>
            </div>
          ) : null}
          {sku ? (
            <div className="flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-white/10 px-4 py-3">
              <span className="shrink-0">SKU</span>
              <span className="min-w-0 max-w-full truncate text-right">{sku}</span>
            </div>
          ) : null}
          <ProductEditionSelector
            editions={editions}
            selectedEditionName={selectedEditionName}
            onSelect={onSelectEdition}
          />
          <ProductVariantSelector
            variants={variants}
            selectedVariantKey={selectedVariantKey}
            getVariantStockLabel={getVariantStockLabel}
            onSelect={onSelectVariant}
          />
          {isCustomizable ? (
            <div className="rounded-2xl border border-white/10 px-4 py-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Personalizzazione</p>
              {personalizationTextEnabled ? (
                <>
                  <label htmlFor="product-personalization" className="mt-3 block text-sm text-white/75">
                    {personalizationTextLabel}
                  </label>
                  <textarea
                    id="product-personalization"
                    className="shop-textarea mt-3 min-h-24 resize-none"
                    value={personalizationText}
                    maxLength={personalizationTextMaxChars}
                    onChange={(event) => onPersonalizationTextChange(event.target.value)}
                    placeholder={personalizationTextLabel}
                  />
                  <p className="mt-2 text-xs leading-5 text-white/45">Massimo {personalizationTextMaxChars} caratteri. Il testo resta associato a questa riga ordine.</p>
                </>
              ) : null}
              {personalizationImageEnabled ? (
                <div className={personalizationTextEnabled ? "mt-4 border-t border-white/10 pt-4" : "mt-3"}>
                  <p className="text-sm text-white/75">{personalizationImageLabel}</p>
                  <label className="mt-3 inline-flex cursor-pointer items-center rounded-full border border-white/12 px-4 py-2 text-sm text-white/75 transition hover:border-white/25 hover:text-white">
                    {personalizationImageUploading ? "Caricamento..." : "Carica immagine"}
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      disabled={personalizationImageUploading}
                      onChange={(event) => {
                        const file = event.target.files?.[0] || null
                        void onPersonalizationImageChange(file)
                        event.currentTarget.value = ""
                      }}
                    />
                  </label>
                  {personalizationImageUrl ? (
                    <div className="mt-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                      <img src={personalizationImageUrl} alt="" className="h-16 w-16 rounded-xl object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-white/72">Immagine caricata e pronta per l’ordine.</p>
                        <button type="button" className="mt-2 text-xs text-white/55 transition hover:text-white" onClick={() => void onPersonalizationImageChange(null)}>
                          Rimuovi immagine
                        </button>
                      </div>
                    </div>
                  ) : null}
                  <p className="mt-2 text-xs leading-5 text-white/45">{personalizationImageInstructions}</p>
                </div>
              ) : null}
              {personalizationError ? <p className="mt-2 text-sm text-red-300">{personalizationError}</p> : null}
            </div>
          ) : null}
          <div className="rounded-2xl border border-white/10 px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Quantità</p>
                <p className="mt-1 text-sm text-white/70">Scegli quante copie aggiungere al carrello.</p>
              </div>
              <div className="inline-flex items-center overflow-hidden rounded-full border border-white/12 bg-white/[0.03]">
                <button
                  type="button"
                  onClick={onDecreaseQuantity}
                  disabled={quantity <= 1}
                  className="h-11 w-11 text-lg text-white/75 transition hover:bg-white/8 hover:text-white disabled:cursor-not-allowed disabled:text-white/25"
                >
                  -
                </button>
                <span className="min-w-[52px] px-3 text-center text-base font-medium text-white">{quantity}</span>
                <button
                  type="button"
                  onClick={onIncreaseQuantity}
                  disabled={!purchasable || quantity >= maxQuantity}
                  className="h-11 w-11 text-lg text-white/75 transition hover:bg-white/8 hover:text-white disabled:cursor-not-allowed disabled:text-white/25"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
        {!purchasable ? (
          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            {stockStatus === "out_of_stock"
              ? "Prodotto esaurito, torna presto disponibile."
              : "Al momento non disponibile per l'acquisto."}
          </div>
        ) : null}
        {purchaseState.showNotifyAction ? (
          <div className="space-y-3">
            <Button type="button" variant="cart" onClick={onNotify} className="w-full">
              Notificami quando disponibile
            </Button>
            {purchaseState.showNotifyFeedback && notifyMessage ? (
              <p className="text-sm text-white/55">
                {notifyMessage}
              </p>
            ) : null}
            {purchaseState.showEditAction ? (
              <Button type="button" variant="ghost" onClick={onEdit} className="w-full">
                Modifica
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <Button variant="profile" onClick={onAddToCart} className="w-full">
              Aggiungi al carrello
            </Button>
            <Button type="button" variant="cart" onClick={onBuyNow} className="w-full">
              Acquista ora
            </Button>
            {purchaseState.showEditAction ? (
              <Button type="button" variant="ghost" onClick={onEdit} className="w-full">
                Modifica
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
