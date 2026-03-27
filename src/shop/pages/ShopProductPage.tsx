import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "../../components/Button"
import { ProductCard } from "../components/ProductCard"
import { useShopCart } from "../context/ShopCartProvider"
import { useShopAuth } from "../context/ShopAuthProvider"
import { apiFetch } from "../lib/api"
import { formatPrice } from "../lib/format"
import { getAvailableFormats, getDefaultVariant, getPriceForVariant, getProductBadges, getProductGalleryImages, getProductPrimaryImage, getProductStockLabel, getProductStockStatus, getProductVariants, isProductPurchasable, resolveSelectedVariant } from "../lib/product"
import { ShopLayout } from "../components/ShopLayout"
import { ShopProduct } from "../types"

export function ShopProductPage() {
  const navigate = useNavigate()
  const { slug = "" } = useParams()
  const { user } = useShopAuth()
  const { addItem, beginCheckout } = useShopCart()
  const [product, setProduct] = useState<ShopProduct | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<ShopProduct[]>([])
  const [selectedImage, setSelectedImage] = useState("")
  const [selectedVariantKey, setSelectedVariantKey] = useState("")
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)

  useEffect(() => {
    apiFetch<ShopProduct>(`/store/products/${slug}`).then((data) => {
      setProduct(data)
      setSelectedImage(getProductPrimaryImage(data))
      setSelectedVariantKey(getDefaultVariant(data)?.key || getDefaultVariant(data)?.title || "")
      setIsLightboxOpen(false)
    })
  }, [slug])

  useEffect(() => {
    if (!slug) return
    apiFetch<ShopProduct[]>(`/store/products/${slug}/related`)
      .then(setRelatedProducts)
      .catch(() => setRelatedProducts([]))
  }, [slug])

  if (!product) {
    return <div className="px-6 py-20 text-center text-white/60">Caricamento scheda prodotto...</div>
  }

  const availableFormats = getAvailableFormats(product)
  const variants = getProductVariants(product)
  const galleryImages = getProductGalleryImages(product)
  const selectedVariant = resolveSelectedVariant(product, { format: selectedVariantKey }) || getDefaultVariant(product)
  const selectedPrice = getPriceForVariant(product, selectedVariant?.id)
  const purchasable = isProductPurchasable(product, selectedVariant?.id)
  const badges = getProductBadges(product)
  const stockStatus = getProductStockStatus(product, selectedVariant?.id)
  const stockLabel = getProductStockLabel(product, selectedVariant?.id)

  function handleBuyNow() {
    if (!purchasable) return
    beginCheckout(product, 1, {
      variantId: selectedVariant?.id ?? null,
      format: selectedVariant?.title || null,
      variantLabel: selectedVariant?.title || null,
      variantSku: selectedVariant?.sku || null,
    })
    if (!user) {
      window.dispatchEvent(new CustomEvent("bns:open-profile"))
      return
    }

    navigate("/shop/checkout", {
      state: { redirectTo: "/shop/checkout" },
    })
  }

  function handleEditProduct() {
    navigate(`/shop/admin?editProduct=${product.id}`)
  }

  return (
    <ShopLayout eyebrow="Product" title={product.title} intro={product.description}>
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setIsLightboxOpen(true)}
            className="shop-card block overflow-hidden text-left transition hover:border-white/20"
          >
            <img src={selectedImage} alt={product.title} className="aspect-[4/5] w-full object-cover" />
          </button>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {galleryImages.map((image, index) => (
              <button
                key={image}
                type="button"
                onClick={() => setSelectedImage(image)}
                className={`overflow-hidden rounded-[20px] border text-left ${selectedImage === image ? "border-[#e3f503]" : "border-white/10"}`}
              >
                <img src={image} alt={product.title} className="aspect-square w-full object-cover" />
                <div className="border-t border-white/10 px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-white/60">
                  {index === 0 ? "Cover" : `Gallery ${index}`}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="shop-card flex flex-col justify-between gap-8 p-6 md:p-8">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="shop-pill">{product.category}</span>
              <span
                className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em] ${
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
            {badges.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {badges.map((badge) => (
                  <span key={badge.key} className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/75">
                    {badge.label}
                  </span>
                ))}
              </div>
            ) : null}
            <div className="mt-5 space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-3">
                  <h2 className="text-3xl font-semibold text-white">{product.title}</h2>
                  <div className="flex flex-wrap gap-2">
                    {product.collections?.map((collection) => (
                      <button
                        key={collection.id}
                        type="button"
                        onClick={() => navigate(`/shop?collectionSlug=${collection.slug}`)}
                        className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70 transition hover:border-white/25 hover:text-white"
                      >
                        {collection.title}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="rounded-[24px] border border-[#e3f503]/20 bg-[#e3f503]/10 px-5 py-4 text-right">
                  <span className="block text-3xl font-semibold text-[#e3f503]">{formatPrice(selectedPrice)}</span>
                </div>
              </div>
              <p className="text-sm leading-7 text-white/70">{product.description}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid gap-3 text-sm text-white/65">
              <div className="rounded-2xl border border-white/10 px-4 py-3">
                <span className="text-white">Varianti disponibili</span>
                <div className="mt-3 flex flex-wrap gap-2">
                  {variants.map((variant) => (
                    <button
                      key={`${variant.id ?? variant.key}-${variant.position}`}
                      type="button"
                      onClick={() => setSelectedVariantKey(variant.key || variant.title)}
                      className={`rounded-full border px-4 py-2 text-sm transition ${
                        selectedVariant?.key === variant.key ? "border-[#e3f503] text-[#e3f503]" : "border-white/10 text-white/70 hover:border-white/25 hover:text-white"
                      }`}
                      disabled={!variant.isActive}
                    >
                      {variant.title}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/10 px-4 py-3">
                <span>Disponibilità</span>
                <span>{stockLabel}</span>
              </div>
              {product.sku || selectedVariant?.sku ? (
                <div className="flex items-center justify-between rounded-2xl border border-white/10 px-4 py-3">
                  <span>SKU</span>
                  <span>{selectedVariant?.sku || product.sku}</span>
                </div>
              ) : null}
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Dettagli prodotto</p>
                  <p className="mt-2 text-sm leading-6 text-white/70">
                    Prodotto disponibile nelle varianti {availableFormats.join(" / ")} con badge, collezioni e stock sincronizzati lato catalogo.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Spedizione e acquisto</p>
                  <p className="mt-2 text-sm leading-6 text-white/70">
                    Il checkout conserva variante selezionata, prezzo applicato e disponibilità verificata lato server prima della conferma ordine.
                  </p>
                </div>
              </div>
            </div>
            {product.tags?.length ? (
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <span key={tag.slug} className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70">
                    #{tag.name}
                  </span>
                ))}
              </div>
            ) : null}
            {!purchasable ? (
              <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                {stockStatus === "out_of_stock"
                  ? "Questo prodotto e visibile ma attualmente non acquistabile."
                  : "Questo prodotto non e disponibile per l'acquisto in questo momento."}
              </div>
            ) : null}
            <div className="flex flex-col gap-3 md:flex-row md:flex-nowrap md:items-center">
              <Button
                onClick={() =>
                  addItem(product, 1, {
                    variantId: selectedVariant?.id ?? null,
                    format: selectedVariant?.title || null,
                    variantLabel: selectedVariant?.title || null,
                    variantSku: selectedVariant?.sku || null,
                  })
                }
                disabled={!purchasable}
                className="w-full md:min-w-0 md:flex-1"
              >
                Aggiungi al carrello
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={handleBuyNow}
                disabled={!purchasable}
                className="w-full md:min-w-0 md:flex-1"
              >
                Acquista ora
              </Button>
              {user?.role === "admin" ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleEditProduct}
                  className="w-full md:min-w-0 md:flex-1"
                >
                  Modifica
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {relatedProducts.length ? (
        <div className="mt-14 space-y-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.32em] text-white/45">Correlati</p>
            <h3 className="text-2xl font-semibold text-white">Prodotti collegati per categoria, tag o collezione</h3>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
            {relatedProducts.map((related) => (
              <ProductCard key={related.id} product={related} />
            ))}
          </div>
        </div>
      ) : null}

      {isLightboxOpen ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/85 px-4 py-6 backdrop-blur-sm"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            type="button"
            aria-label="Chiudi anteprima immagine"
            onClick={() => setIsLightboxOpen(false)}
            className="absolute right-5 top-5 rounded-full border border-white/15 px-4 py-2 text-sm text-white/75 transition hover:border-white/30 hover:text-white"
          >
            Chiudi
          </button>
          <img
            src={selectedImage}
            alt={product.title}
            onClick={(event) => event.stopPropagation()}
            className="max-h-[88vh] max-w-[92vw] object-contain shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
          />
        </div>
      ) : null}
    </ShopLayout>
  )
}
