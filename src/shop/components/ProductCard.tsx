import { Link, useNavigate } from "react-router-dom"
import { Button } from "../../components/Button"
import { useCanHover } from "../../hooks/useCanHover"
import { useShopCart } from "../context/ShopCartProvider"
import { useShopAuth } from "../context/ShopAuthProvider"
import { formatPrice } from "../lib/format"
import { getAvailableFormats, getDefaultVariant, getProductBadges, getProductPrimaryImage, getProductStockLabel, getProductStockStatus, getVariantPricing, isProductPurchasable } from "../lib/product"
import { ShopProduct } from "../types"

export function ProductCard({ product }: { product: ShopProduct }) {
  if (!product) {
    console.error("DEBUG ProductCard missing product:", product)
    return <div className="min-h-screen bg-black" />
  }

  const navigate = useNavigate()
  const { user } = useShopAuth()
  const { addItem, beginCheckout } = useShopCart()
  const canHover = useCanHover()
  const primaryImage = getProductPrimaryImage(product)
  const secondaryImage = product?.imageUrls?.[1] || ""
  const hasHoverImage = Boolean(canHover && primaryImage && secondaryImage && secondaryImage !== primaryImage)
  const defaultVariant = getDefaultVariant(product)
  const availableFormats = getAvailableFormats(product) || []
  const purchasable = isProductPurchasable(product, defaultVariant?.id)
  const badges = getProductBadges(product) || []
  const stockStatus = getProductStockStatus(product)
  const stockLabel = getProductStockLabel(product)
  const pricing = getVariantPricing(product, defaultVariant?.id)
  const hasDiscount = pricing.hasDiscount
  const currentPriceLabel = availableFormats.length > 1 ? `da ${formatPrice(pricing.currentPrice)}` : formatPrice(pricing.currentPrice)
  const originalPriceLabel = availableFormats.length > 1 ? `da ${formatPrice(pricing.originalPrice)}` : formatPrice(pricing.originalPrice)

  function handleBuyNow() {
    if (!purchasable) return
    beginCheckout(product, 1, {
      variantId: defaultVariant?.id ?? null,
      format: defaultVariant?.title || null,
      variantLabel: defaultVariant?.title || null,
      variantSku: defaultVariant?.sku || null,
    })
    if (!user) {
      window.dispatchEvent(new CustomEvent("bns:open-profile"))
      return
    }

    navigate("/shop/checkout", {
      state: { redirectTo: "/shop/checkout" },
    })
  }

  return (
    <article className="shop-card flex h-full flex-col overflow-hidden">
      <Link to={`/shop/${product.slug}`} className="block">
        <div className="group relative h-[300px] overflow-hidden bg-white/5 sm:h-[320px]">
          {primaryImage ? (
            <>
              <img
                src={primaryImage}
                alt={product.title}
                className={`absolute inset-0 h-[300px] w-full object-cover transition duration-500 sm:h-[320px] ${
                  hasHoverImage ? "opacity-100 group-hover:opacity-0" : ""
                }`}
              />
              {hasHoverImage ? (
                <img
                  src={secondaryImage}
                  alt={product.title}
                  className="absolute inset-0 h-[300px] w-full object-cover opacity-0 transition duration-500 group-hover:opacity-100 sm:h-[320px]"
                />
              ) : null}
            </>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-sm text-white/45 sm:h-[320px]">
              Nessuna immagine disponibile
            </div>
          )}
          {badges.length ? (
            <div className="absolute left-3 top-3 flex flex-wrap gap-2">
              {badges.slice(0, 3).map((badge) => (
                <span key={badge.key} className="rounded-full border border-white/10 bg-black/55 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/85 backdrop-blur">
                  {badge.label}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5 pt-4">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="shop-pill">{product.category}</span>
            {product.collections?.[0] ? (
              <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-white/55">
                {product?.collections?.[0]?.title}
              </span>
            ) : null}
          </div>
            <h2 className="overflow-hidden text-xl font-semibold text-white [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
              {product?.title || ""}
            </h2>
          <p className="text-xs uppercase tracking-[0.18em] text-white/45">{(availableFormats || []).join(" · ")}</p>
        </div>

        <div className="mt-auto pt-5">
          <div className="flex items-center justify-between gap-4 pb-3">
            <div className="flex min-h-[28px] items-center text-[11px] uppercase tracking-[0.18em]">
              <span
                className={`rounded-full border px-3 py-1 ${
                  stockStatus === "out_of_stock"
                    ? "border-red-400/20 text-red-100/85"
                    : stockStatus === "low_stock"
                      ? "border-amber-300/20 text-amber-100/85"
                      : "border-emerald-300/20 text-emerald-100/85"
                }`}
              >
                {stockLabel}
              </span>
            </div>
            <div className="text-right">
              {hasDiscount ? (
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs text-white/40 line-through">{originalPriceLabel}</span>
                  <span className="text-sm font-medium text-[#e3f503]">{currentPriceLabel}</span>
                </div>
              ) : (
                <div className="text-sm font-medium text-[#e3f503]">{currentPriceLabel}</div>
              )}
            </div>
          </div>
          {!purchasable ? (
            <div className="pb-3 text-xs uppercase tracking-[0.18em] text-amber-200/75">
              {stockStatus === "out_of_stock" ? "Esaurito" : "Non disponibile"}
            </div>
          ) : null}
          <div className="flex flex-col gap-3">
            <Button
              type="button"
              variant="profile"
              onClick={() =>
                addItem(product, 1, {
                  variantId: defaultVariant?.id ?? null,
                  format: defaultVariant?.title || null,
                  variantLabel: defaultVariant?.title || null,
                  variantSku: defaultVariant?.sku || null,
                })
              }
              className="w-full"
              disabled={!purchasable}
            >
              Aggiungi al carrello
            </Button>
            <Button
              type="button"
              variant="cart"
              onClick={handleBuyNow}
              className="w-full"
              disabled={!purchasable}
            >
              Acquista ora
            </Button>
          </div>
        </div>
      </div>
    </article>
  )
}
