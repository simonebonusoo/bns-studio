import { useEffect, useMemo, useRef, useState } from "react"
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
import { getAvailableFormats, getDefaultVariant, getOriginalPriceForVariant, getPriceForVariant, getProductBadges, getProductGalleryImages, getProductPrimaryImage, getProductStockLabel, getProductStockStatus, getProductVariants, isProductPurchasable, resolveSelectedVariant } from "../lib/product"
import { ShopLayout } from "../components/ShopLayout"
import { ShopProduct, ShopSettings } from "../types"

const PENDING_NOTIFY_KEY = "bns_pending_back_in_stock"

export function ShopProductPage() {
  const navigate = useNavigate()
  const { slug = "" } = useParams()
  const { user, effectiveRole } = useShopAuth()
  const { addItem, beginCheckout } = useShopCart()
  const [product, setProduct] = useState<ShopProduct | null>(null)
  const [productError, setProductError] = useState("")
  const [relatedProducts, setRelatedProducts] = useState<ShopProduct[]>([])
  const [selectedImage, setSelectedImage] = useState("")
  const [selectedVariantKey, setSelectedVariantKey] = useState("")
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [settings, setSettings] = useState<ShopSettings>({})
  const [notifyInterest, setNotifyInterest] = useState(false)
  const [notifyMessage, setNotifyMessage] = useState("")
  const [variantMenuOpen, setVariantMenuOpen] = useState(false)
  const [openInfoSection, setOpenInfoSection] = useState<"details" | "shipping" | "delivery" | null>(null)
  const purchasePanelRef = useRef<HTMLDivElement | null>(null)
  const [galleryLockedHeight, setGalleryLockedHeight] = useState<number | null>(null)

  useEffect(() => {
    setProduct(null)
    setProductError("")

    apiFetch<ShopProduct>(`/store/products/${slug}`)
      .then((data) => {
        setProduct(data)
        setSelectedImage(getProductPrimaryImage(data))
        setSelectedVariantKey(getDefaultVariant(data)?.key || getDefaultVariant(data)?.title || "")
        setIsLightboxOpen(false)
        setQuantity(1)
        setNotifyInterest(false)
        setNotifyMessage("")
        setVariantMenuOpen(false)
        setOpenInfoSection(null)
      })
      .catch((err) => {
        setProduct(null)
        setProductError(err instanceof Error ? err.message : "Errore durante il caricamento del prodotto.")
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

  const availableFormats = product ? getAvailableFormats(product) : []
  const variants = product ? getProductVariants(product) : []
  const galleryImages = product ? getProductGalleryImages(product) : []
  const primaryCollection = product?.collections?.[0] || null
  const selectedVariant = product ? resolveSelectedVariant(product, { format: selectedVariantKey }) || getDefaultVariant(product) : null
  const originalPrice = product ? getOriginalPriceForVariant(product, selectedVariant?.id) : 0
  const selectedPrice = product ? getPriceForVariant(product, selectedVariant?.id) : 0
  const purchasable = product ? isProductPurchasable(product, selectedVariant?.id) : false
  const badges = product ? getProductBadges(product) : []
  const stockStatus = product ? getProductStockStatus(product, selectedVariant?.id) : "out_of_stock"
  const stockLabel = product ? getProductStockLabel(product, selectedVariant?.id) : "Esaurito"
  const maxQuantity = Math.max(selectedVariant?.stock ?? product?.stock ?? 1, 1)
  const subtotal = selectedPrice * quantity
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
            {product?.tags?.length ? (
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
    [availableFormats, product?.tags, shippingCostLabel, shippingCostValue]
  )

  function updateQuantity(nextValue: number) {
    setQuantity(Math.min(Math.max(nextValue, 1), maxQuantity))
  }

  function openLoginFlow() {
    window.dispatchEvent(new CustomEvent("bns:open-profile", { detail: { step: "login" } }))
  }

  async function createBackInStockSubscription() {
    if (!product) return

    const response = await apiFetch<{ message: string }>("/store/back-in-stock-subscriptions", {
      method: "POST",
      body: JSON.stringify({
        productId: product.id,
        variantId: selectedVariant?.id ?? null,
      }),
    })

    setNotifyInterest(true)
    setNotifyMessage(response.message || "Ti avviseremo via email quando tornera disponibile.")
  }

  function handleBuyNow() {
    if (!user) {
      openLoginFlow()
      return
    }
    if (!product) return
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
    if (!product) return
    navigate(`/shop/admin?editProduct=${product.id}`)
  }

  async function handleNotifyInterest() {
    if (!product) return

    if (!user) {
      localStorage.setItem(
        PENDING_NOTIFY_KEY,
        JSON.stringify({
          slug,
          productId: product.id,
          variantId: selectedVariant?.id ?? null,
        })
      )
      openLoginFlow()
      return
    }

    try {
      await createBackInStockSubscription()
      localStorage.removeItem(PENDING_NOTIFY_KEY)
    } catch (err) {
      setNotifyInterest(true)
      setNotifyMessage(err instanceof Error ? err.message : "Impossibile registrare la notifica disponibilita.")
    }
  }

  function handleAddToCart() {
    if (!product) return

    if (!user) {
      openLoginFlow()
      return
    }

    addItem(product, quantity, {
      variantId: selectedVariant?.id ?? null,
      format: selectedVariant?.title || null,
      variantLabel: selectedVariant?.title || null,
      variantSku: selectedVariant?.sku || null,
    })
  }

  useEffect(() => {
    if (!user || !product) return

    const rawPending = localStorage.getItem(PENDING_NOTIFY_KEY)
    if (!rawPending) return

    try {
      const pending = JSON.parse(rawPending)
      if (pending?.productId !== product.id && pending?.slug !== slug) {
        return
      }

      createBackInStockSubscription()
        .then(() => localStorage.removeItem(PENDING_NOTIFY_KEY))
        .catch(() => {})
    } catch {
      localStorage.removeItem(PENDING_NOTIFY_KEY)
    }
  }, [product, slug, user])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (window.innerWidth < 1024) {
      setGalleryLockedHeight(null)
      return
    }

    const panel = purchasePanelRef.current
    if (!panel || variantMenuOpen) return

    const updateHeight = () => {
      setGalleryLockedHeight(panel.getBoundingClientRect().height)
    }

    updateHeight()

    const observer = new ResizeObserver(() => {
      updateHeight()
    })

    observer.observe(panel)
    return () => observer.disconnect()
  }, [product?.id, quantity, selectedVariantKey, stockStatus, subtotal, variantMenuOpen])

  if (productError) {
    return (
      <div className="px-6 py-20 text-center text-white/60">
        <p className="text-base text-white/80">Impossibile aprire la scheda prodotto.</p>
        <p className="mt-2 text-sm text-white/55">{productError}</p>
      </div>
    )
  }

  if (!product) {
    return <div className="px-6 py-20 text-center text-white/60">Caricamento scheda prodotto...</div>
  }

  return (
    <ShopLayout eyebrow="Product" title={product.title} intro={product.description}>
      <div className="mx-auto w-full max-w-[1380px] space-y-8">
        <div className="grid w-full items-stretch gap-7 lg:grid-cols-[minmax(0,0.98fr)_minmax(0,0.94fr)] xl:gap-8">
          <ProductGallery
            title={product.title}
            images={galleryImages}
            selectedImage={selectedImage}
            lockedHeight={galleryLockedHeight}
            onSelectImage={setSelectedImage}
            onOpenLightbox={() => setIsLightboxOpen(true)}
          />

          <ProductPurchasePanel
            badges={badges}
            originalPrice={originalPrice}
            selectedPrice={selectedPrice}
            subtotal={subtotal}
            stockLabel={stockLabel}
            productCategory={product.category}
            productCollection={primaryCollection}
            panelRef={purchasePanelRef}
            sku={selectedVariant?.sku || product.sku}
            variants={variants}
            selectedVariantKey={selectedVariantKey}
            variantMenuOpen={variantMenuOpen}
            quantity={quantity}
            maxQuantity={maxQuantity}
            purchasable={purchasable}
            purchaseState={purchaseState}
            stockStatus={stockStatus}
            onCategoryClick={() => navigate(`/shop?category=${encodeURIComponent(product.category)}`)}
            onCollectionClick={() => {
              if (!primaryCollection) return
              const params = new URLSearchParams()
              params.set("collectionSlug", primaryCollection.slug)
              params.set("title", primaryCollection.title)
              if (primaryCollection.description) {
                params.set("subtitle", primaryCollection.description)
              }
              navigate(`/shop?${params.toString()}`)
            }}
            onToggleVariantMenu={() => setVariantMenuOpen((current) => !current)}
            onSelectVariant={(variant) => {
              setSelectedVariantKey(variant.key || variant.title)
              setQuantity(1)
              setNotifyInterest(false)
              setNotifyMessage("")
              setVariantMenuOpen(false)
            }}
            onDecreaseQuantity={() => updateQuantity(quantity - 1)}
            onIncreaseQuantity={() => updateQuantity(quantity + 1)}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            onEdit={handleEditProduct}
            onNotify={handleNotifyInterest}
            notifyMessage={notifyMessage}
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

      <ProductLightbox open={isLightboxOpen && Boolean(selectedImage)} image={selectedImage || getProductPrimaryImage(product)} title={product.title} onClose={() => setIsLightboxOpen(false)} />
    </ShopLayout>
  )
}
