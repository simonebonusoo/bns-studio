import { Button } from "../../../components/Button"
import { formatPrice } from "../../lib/format"
import { ProductVisibleBadge, ShopProductVariant } from "../../types"
import { ProductPurchaseState } from "./purchaseState"
import { ProductVariantSelector } from "./ProductVariantSelector"

type ProductPurchasePanelProps = {
  badges: ProductVisibleBadge[]
  selectedPrice: number
  subtotal: number
  stockLabel: string
  productCategory: string
  sku?: string | null
  variants: ShopProductVariant[]
  selectedVariantKey: string
  variantMenuOpen: boolean
  quantity: number
  maxQuantity: number
  purchasable: boolean
  purchaseState: ProductPurchaseState
  stockStatus: string
  onCategoryClick: () => void
  onToggleVariantMenu: () => void
  onSelectVariant: (variant: ShopProductVariant) => void
  onDecreaseQuantity: () => void
  onIncreaseQuantity: () => void
  onAddToCart: () => void
  onBuyNow: () => void
  onEdit: () => void
  onNotify: () => void | Promise<void>
  notifyMessage: string
  getVariantStockLabel: (variantId?: number | null) => string
}

export function ProductPurchasePanel({
  badges,
  selectedPrice,
  subtotal,
  stockLabel,
  productCategory,
  sku,
  variants,
  selectedVariantKey,
  variantMenuOpen,
  quantity,
  maxQuantity,
  purchasable,
  purchaseState,
  stockStatus,
  onCategoryClick,
  onToggleVariantMenu,
  onSelectVariant,
  onDecreaseQuantity,
  onIncreaseQuantity,
  onAddToCart,
  onBuyNow,
  onEdit,
  onNotify,
  notifyMessage,
  getVariantStockLabel,
}: ProductPurchasePanelProps) {
  return (
    <div className="shop-card flex h-full min-w-0 flex-col p-5 md:p-6">
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
            <div className="rounded-[24px] border border-white/10 bg-white/[0.035] px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <span className="block text-3xl font-semibold leading-none text-white md:text-[2.1rem]">{formatPrice(selectedPrice)}</span>
                {subtotal > selectedPrice ? (
                  <div className="pt-1 text-right">
                    <span className="block text-[10px] uppercase tracking-[0.16em] text-white/40">Subtotale</span>
                    <span className="mt-1 block text-sm text-white/68">{formatPrice(subtotal)}</span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
        <div className="grid gap-3 text-sm text-white/65">
          <div className="flex items-center justify-between rounded-2xl border border-white/10 px-4 py-3">
            <span>Disponibilità</span>
            <span>{stockLabel}</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-white/10 px-4 py-3">
            <span>Categoria</span>
            <button type="button" onClick={onCategoryClick} className="text-sm text-white/80 transition hover:text-[#e3f503]">
              {productCategory}
            </button>
          </div>
          {sku ? (
            <div className="flex items-center justify-between rounded-2xl border border-white/10 px-4 py-3">
              <span>SKU</span>
              <span>{sku}</span>
            </div>
          ) : null}
          <ProductVariantSelector
            open={variantMenuOpen}
            variants={variants}
            selectedVariantKey={selectedVariantKey}
            getVariantStockLabel={getVariantStockLabel}
            onToggle={onToggleVariantMenu}
            onSelect={onSelectVariant}
          />
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
            <Button variant="cart" onClick={onAddToCart} className="w-full">
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
