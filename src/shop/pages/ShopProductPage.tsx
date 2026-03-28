import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ProductCard } from "../components/ProductCard"
import { ProductGallery } from "../components/product/ProductGallery"
import { ProductInfoAccordions } from "../components/product/ProductInfoAccordions"
import { ProductLightbox } from "../components/product/ProductLightbox"
import { ProductPurchasePanel } from "../components/product/ProductPurchasePanel"
import { getProductPurchaseState } from "../components/product/purchaseState"
import { useShopCart } from "../context/ShopCartProvider"
import { useShopAuth } from "../context/ShopAuthProvider"
import { apiFetch } from "../lib/api"
import { getAvailableFormats, getDefaultVariant, getPriceForVariant, getProductBadges, getProductGalleryImages, getProductPrimaryImage, getProductStockLabel, getProductStockStatus, getProductVariants, isProductPurchasable, resolveSelectedVariant } from "../lib/product"
import { ShopLayout } from "../components/ShopLayout"
import { ShopProduct, ShopSettings } from "../types"

export function ShopProductPage() {
  const navigate = useNavigate()
  const { slug = "" } = useParams()
  const { user, effectiveRole } = useShopAuth()
  const { addItem, beginCheckout } = useShopCart()
  const [product, setProduct] = useState<ShopProduct | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<ShopProduct[]>([])
  const [selectedImage, setSelectedImage] = useState("")
  const [selectedVariantKey, setSelectedVariantKey] = useState("")
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [settings, setSettings] = useState<ShopSettings>({})
  const [notifyInterest, setNotifyInterest] = useState(false)
  const [variantMenuOpen, setVariantMenuOpen] = useState(false)
  const [openInfoSection, setOpenInfoSection] = useState<"details" | "shipping" | "delivery" | null>(null)

  useEffect(() => {
    apiFetch<ShopProduct>(`/store/products/${slug}`).then((data) => {
      setProduct(data)
      setSelectedImage(getProductPrimaryImage(data))
      setSelectedVariantKey(getDefaultVariant(data)?.key || getDefaultVariant(data)?.title || "")
      setIsLightboxOpen(false)
      setQuantity(1)
      setNotifyInterest(false)
      setVariantMenuOpen(false)
      setOpenInfoSection(null)
    })
  }, [slug])

  useEffect(() => {
    if (!slug) return
    apiFetch<ShopProduct[]>(`/store/products/${slug}/related`)
      .then(setRelatedProducts)
      .catch(() => setRelatedProducts([]))
  }, [slug])

  useEffect(() => {
    apiFetch<ShopSettings>("/store/settings").then(setSettings).catch(() => setSettings({}))
  }, [])

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
  const maxQuantity = Math.max(selectedVariant?.stock ?? product.stock ?? 1, 1)
  const shippingCostValue = Number(settings.shippingCost || 0)
  const shippingCostLabel = shippingCostValue > 0 ? new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(shippingCostValue) : "calcolata al checkout"
  const purchaseState = getProductPurchaseState({
    effectiveRole,
    purchasable,
    notifyInterest,
  })
  const infoSections = useMemo(
    () => [
      {
        key: "details" as const,
        title: "Dettagli prodotto",
        content: (
          <div className="grid gap-2">
            <p>Prodotto disponibile nelle varianti {availableFormats.join(" / ")} con badge, collezioni e stock sincronizzati lato catalogo.</p>
            {product.tags?.length ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {product.tags.map((tag) => (
                  <span key={tag.slug} className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70">
                    #{tag.name}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ),
      },
      {
        key: "shipping" as const,
        title: "Spedizione e acquisto",
        content:
          "Il checkout conserva variante selezionata, prezzo applicato e disponibilità verificata lato server prima della conferma ordine.",
      },
      {
        key: "delivery" as const,
        title: "Consegna",
        content: (
          <div className="grid gap-2">
            <p>Consegna in 3-5 giorni lavorativi.</p>
            <p>Spedizione {shippingCostValue > 0 ? `da ${shippingCostLabel}` : shippingCostLabel}.</p>
          </div>
        ),
      },
    ],
    [availableFormats, product.tags, shippingCostLabel, shippingCostValue]
  )

  function updateQuantity(nextValue: number) {
    setQuantity(Math.min(Math.max(nextValue, 1), maxQuantity))
  }

  function handleBuyNow() {
    if (!purchasable) return
    beginCheckout(product, quantity, {
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
      <div className="mx-auto w-full max-w-[1380px] space-y-8">
        <div className="grid w-full items-stretch gap-8 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.88fr)]">
          <ProductGallery
            title={product.title}
            images={galleryImages}
            selectedImage={selectedImage}
            onSelectImage={setSelectedImage}
            onOpenLightbox={() => setIsLightboxOpen(true)}
          />

          <ProductPurchasePanel
            badges={badges}
            selectedPrice={selectedPrice}
            stockLabel={stockLabel}
            productCategory={product.category}
            sku={selectedVariant?.sku || product.sku}
            variants={variants}
            selectedVariantKey={selectedVariantKey}
            variantMenuOpen={variantMenuOpen}
            quantity={quantity}
            maxQuantity={maxQuantity}
            purchasable={purchasable}
            purchaseState={purchaseState}
            stockStatus={stockStatus}
            notifyInterest={notifyInterest}
            onCategoryClick={() => navigate(`/shop?category=${encodeURIComponent(product.category)}`)}
            onToggleVariantMenu={() => setVariantMenuOpen((current) => !current)}
            onSelectVariant={(variant) => {
              setSelectedVariantKey(variant.key || variant.title)
              setQuantity(1)
              setNotifyInterest(false)
              setVariantMenuOpen(false)
            }}
            onDecreaseQuantity={() => updateQuantity(quantity - 1)}
            onIncreaseQuantity={() => updateQuantity(quantity + 1)}
            onAddToCart={() =>
              addItem(product, quantity, {
                variantId: selectedVariant?.id ?? null,
                format: selectedVariant?.title || null,
                variantLabel: selectedVariant?.title || null,
                variantSku: selectedVariant?.sku || null,
              })
            }
            onBuyNow={handleBuyNow}
            onEdit={handleEditProduct}
            onNotify={() => setNotifyInterest(true)}
            getVariantStockLabel={(variantId) => getProductStockLabel(product, variantId)}
          />
        </div>

        <ProductInfoAccordions
          openSection={openInfoSection}
          onToggle={(section) => setOpenInfoSection((current) => (current === section ? null : section))}
          sections={infoSections}
        />
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

      <ProductLightbox open={isLightboxOpen} image={selectedImage} title={product.title} onClose={() => setIsLightboxOpen(false)} />
    </ShopLayout>
  )
}
