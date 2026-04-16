import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "../../components/Button"
import { useIsMobileViewport } from "../../hooks/useIsMobileViewport"
import { HorizontalScrollRail } from "../../components/HorizontalScrollRail"
import { ProductCard } from "../components/ProductCard"
import { ProductGallery } from "../components/product/ProductGallery"
import { ProductInfoAccordions } from "../components/product/ProductInfoAccordions"
import { ProductLightbox } from "../components/product/ProductLightbox"
import { ProductPurchasePanel } from "../components/product/ProductPurchasePanel"
import { getProductPurchaseState } from "../components/product/purchaseState"
import { useShopCart } from "../context/ShopCartProvider"
import { useShopAuth } from "../context/ShopAuthProvider"
import { apiFetch } from "../lib/api"
import { readCatalogReturnState } from "../lib/catalog-return.mjs"
import { readHomeReturnState } from "../lib/home-return.mjs"
import { consumePreviousProductReturnEntry, pushProductReturnEntry } from "../lib/product-return-stack.mjs"
import { getAvailableFormats, getDefaultVariant, getOriginalPriceForVariant, getPriceForVariant, getProductBadges, getProductEditionOptions, getProductGalleryImages, getProductPrimaryImage, getProductStockLabel, getProductStockStatus, getProductVariants, getSizeOptionsForEdition, isProductPurchasable, resolveSelectedVariant } from "../lib/product"
import { getRelatedProductsPageState, getRecentlyViewedProducts, upsertRecentlyViewedProduct } from "../lib/product-page-discovery.mjs"
import { ShopLayout } from "../components/ShopLayout"
import { ShopProduct, ShopSettings } from "../types"

const PENDING_NOTIFY_KEY = "bns_pending_back_in_stock"
const RECENTLY_VIEWED_KEY = "bns_recently_viewed_products"
const RELATED_PAGE_SIZE = 8

export function ShopProductPage() {
  const navigate = useNavigate()
  const { slug = "" } = useParams()
  const isMobileViewport = useIsMobileViewport()
  const { user, effectiveRole } = useShopAuth()
  const { addItem, beginCheckout } = useShopCart()
  const [product, setProduct] = useState<ShopProduct | null>(null)
  const [productError, setProductError] = useState("")
  const [relatedProducts, setRelatedProducts] = useState<ShopProduct[]>([])
  const [visibleRelatedCount, setVisibleRelatedCount] = useState(RELATED_PAGE_SIZE)
  const [recentlyViewedProducts, setRecentlyViewedProducts] = useState<ShopProduct[]>([])
  const [selectedImage, setSelectedImage] = useState("")
  const [selectedEditionName, setSelectedEditionName] = useState("")
  const [selectedVariantKey, setSelectedVariantKey] = useState("")
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [personalizationText, setPersonalizationText] = useState("")
  const [personalizationError, setPersonalizationError] = useState("")
  const [settings, setSettings] = useState<ShopSettings>({})
  const [notifyInterest, setNotifyInterest] = useState(false)
  const [notifyMessage, setNotifyMessage] = useState("")
  const [openInfoSection, setOpenInfoSection] = useState<"details" | "shipping" | "delivery" | null>(null)
  const purchasePanelRef = useRef<HTMLDivElement | null>(null)
  const [galleryLockedHeight, setGalleryLockedHeight] = useState<number | null>(null)

  useEffect(() => {
    setProduct(null)
    setProductError("")

    apiFetch<ShopProduct>(`/store/products/${slug}`)
      .then((data) => {
        setProduct(data)
        const defaultVariant = getDefaultVariant(data)
        setSelectedImage(getProductPrimaryImage(data))
        setSelectedEditionName(defaultVariant?.editionName || "Standard")
        setSelectedVariantKey(defaultVariant?.key || defaultVariant?.title || "")
        setIsLightboxOpen(false)
        setQuantity(1)
        setPersonalizationText("")
        setPersonalizationError("")
        setNotifyInterest(false)
        setNotifyMessage("")
        setOpenInfoSection(null)
      })
      .catch((err) => {
        setProduct(null)
        setProductError(err instanceof Error ? err.message : "Errore durante il caricamento del prodotto.")
      })
  }, [slug])

  useEffect(() => {
    if (!slug) return
    setVisibleRelatedCount(RELATED_PAGE_SIZE)
    apiFetch<ShopProduct[]>(`/store/products/${slug}/related`)
      .then(setRelatedProducts)
      .catch(() => setRelatedProducts([]))
  }, [slug])

  useEffect(() => {
    apiFetch<ShopSettings>("/store/settings").then(setSettings).catch(() => setSettings({}))
  }, [])

  useEffect(() => {
    if (!product || typeof window === "undefined") return

    try {
      const rawHistory = window.localStorage.getItem(RECENTLY_VIEWED_KEY)
      const parsedHistory = rawHistory ? JSON.parse(rawHistory) : []
      const nextHistory = upsertRecentlyViewedProduct(parsedHistory, product)
      window.localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(nextHistory))
      setRecentlyViewedProducts(getRecentlyViewedProducts(nextHistory, product.slug, 8))
    } catch {
      setRecentlyViewedProducts([])
    }
  }, [product])

  const availableFormats = product ? getAvailableFormats(product) : []
  const allVariants = product ? getProductVariants(product) : []
  const editionOptions = product ? getProductEditionOptions(product) : []
  const variants = product ? getSizeOptionsForEdition(product, selectedEditionName) : []
  const selectedVariant = product
    ? resolveSelectedVariant(product, {
        format: selectedVariantKey,
        editionName: selectedEditionName,
      }) || getDefaultVariant(product)
    : null
  const galleryImages = product
    ? [
        selectedVariant?.variantProductImageUrl || "",
        ...getProductGalleryImages(product),
      ].filter((image, index, images) => image && images.indexOf(image) === index)
    : []
  const primaryCollection = product?.collections?.[0] || null
  const originalPrice = product ? getOriginalPriceForVariant(product, selectedVariant?.id) : 0
  const selectedPrice = product ? getPriceForVariant(product, selectedVariant?.id) : 0
  const purchasable = product ? isProductPurchasable(product, selectedVariant?.id) : false
  const badges = product ? getProductBadges(product) : []
  const heroBadge = badges[0] || null
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
    () =>
      [
        {
          key: "details" as const,
          title: "Descrizione",
          content: (
            <div className="grid gap-3">
              {product?.description ? <p>{product.description}</p> : null}
              {availableFormats.length ? <p>Prodotto disponibile nelle varianti {availableFormats.join(" / ")}.</p> : null}
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
          visible: Boolean(product?.description || availableFormats.length || product?.tags?.length),
        },
        {
          key: "shipping" as const,
          title: "Spedizione",
          content:
            "Il checkout conserva variante selezionata, prezzo applicato e disponibilità verificata lato server prima della conferma ordine.",
          visible: true,
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
          visible: true,
        },
      ].filter((section) => section.visible),
    [availableFormats, product?.description, product?.tags, shippingCostLabel, shippingCostValue]
  )
  const relatedPageState = useMemo(
    () => getRelatedProductsPageState(relatedProducts, visibleRelatedCount, RELATED_PAGE_SIZE),
    [relatedProducts, visibleRelatedCount],
  )

  function updateQuantity(nextValue: number) {
    setQuantity(Math.min(Math.max(nextValue, 1), maxQuantity))
  }

  function resolvePersonalizationText() {
    if (!product?.isCustomizable) return null

    const normalized = personalizationText.trim()
    if (!normalized) {
      setPersonalizationError("Inserisci il nome da usare per la personalizzazione.")
      return undefined
    }

    if (normalized.length > 50) {
      setPersonalizationError("Il testo personalizzato può contenere al massimo 50 caratteri.")
      return undefined
    }

    setPersonalizationError("")
    return normalized
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
    const resolvedPersonalizationText = resolvePersonalizationText()
    if (resolvedPersonalizationText === undefined) return
    beginCheckout(product, quantity, {
      variantId: selectedVariant?.id ?? null,
      editionName: selectedVariant?.editionName || selectedEditionName || null,
      size: selectedVariant?.size || null,
      format: selectedVariant?.size || selectedVariant?.title || null,
      variantLabel: selectedVariant?.title || null,
      variantSku: selectedVariant?.sku || null,
      personalizationText: resolvedPersonalizationText,
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

  function handleBackNavigation() {
    const previousProduct = consumePreviousProductReturnEntry(`/shop/${slug}`)
    if (previousProduct?.pathname && previousProduct.pathname !== `/shop/${slug}`) {
      navigate(previousProduct.pathname)
      return
    }

    const storedCatalogReturn = readCatalogReturnState()
    if (storedCatalogReturn) {
      navigate(storedCatalogReturn.pathnameSearch || "/shop", {
        state: {
          restoreCatalogFromProduct: true,
          restoreCatalogScrollY: storedCatalogReturn.scrollY,
          restoreCatalogView: storedCatalogReturn.view,
        },
      })
      return
    }

    const storedHomeReturn = readHomeReturnState()
    if (storedHomeReturn) {
      navigate(storedHomeReturn.homePathname || "/", {
        state: {
          restoreHomeFromShop: true,
          restoreHomeScrollY: storedHomeReturn.homeScrollY,
        },
      })
      return
    }

    if (typeof window !== "undefined" && window.history.length > 1) {
      navigate(-1)
      return
    }

    navigate("/")
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
    const resolvedPersonalizationText = resolvePersonalizationText()
    if (resolvedPersonalizationText === undefined) return

    addItem(product, quantity, {
      variantId: selectedVariant?.id ?? null,
      editionName: selectedVariant?.editionName || selectedEditionName || null,
      size: selectedVariant?.size || null,
      format: selectedVariant?.size || selectedVariant?.title || null,
      variantLabel: selectedVariant?.title || null,
      variantSku: selectedVariant?.sku || null,
      personalizationText: resolvedPersonalizationText,
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
    if (!panel) return

    const updateHeight = () => {
      setGalleryLockedHeight(panel.getBoundingClientRect().height)
    }

    updateHeight()

    const observer = new ResizeObserver(() => {
      updateHeight()
    })

    observer.observe(panel)
    return () => observer.disconnect()
  }, [personalizationError, personalizationText, product?.id, quantity, selectedEditionName, selectedVariantKey, stockStatus, subtotal])

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
    <ShopLayout
      compact
      eyebrowMode="raw"
      eyebrow={
        heroBadge ? (
          <span className="inline-flex rounded-full border border-[#e3f503]/30 bg-[#e3f503]/12 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-[#eef879]">
            {heroBadge.label}
          </span>
        ) : undefined
      }
      title={product.title}
      intro=""
      actions={
        <Button
          variant="profile"
          size="sm"
          onClick={handleBackNavigation}
          icon={
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8">
              <path d="M18 12H6" />
              <path d="m11 17-5-5 5-5" />
            </svg>
          }
        >
          Torna indietro
        </Button>
      }
    >
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
            badges={[]}
            originalPrice={originalPrice}
            selectedPrice={selectedPrice}
            subtotal={subtotal}
            stockLabel={stockLabel}
            productCategory={product.category}
            productCollection={primaryCollection}
            panelRef={purchasePanelRef}
            sku={selectedVariant?.sku || product.sku}
            variants={variants}
            editions={editionOptions}
            selectedEditionName={selectedEditionName}
            selectedVariantKey={selectedVariantKey}
            quantity={quantity}
            maxQuantity={maxQuantity}
            isCustomizable={Boolean(product.isCustomizable)}
            personalizationText={personalizationText}
            personalizationError={personalizationError}
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
            onSelectEdition={(editionName) => {
              const nextVariant =
                allVariants.find((variant) => variant.editionName === editionName && variant.size === selectedVariant?.size) ||
                allVariants.find((variant) => variant.editionName === editionName && variant.isActive !== false) ||
                allVariants.find((variant) => variant.editionName === editionName)
              setSelectedEditionName(editionName)
              setSelectedVariantKey(nextVariant?.key || nextVariant?.title || "")
              setSelectedImage(nextVariant?.variantProductImageUrl || getProductPrimaryImage(product))
              setQuantity(1)
              setNotifyInterest(false)
              setNotifyMessage("")
            }}
            onSelectVariant={(variant) => {
              setSelectedEditionName(variant.editionName || selectedEditionName || "Standard")
              setSelectedVariantKey(variant.key || variant.title)
              setSelectedImage(variant.variantProductImageUrl || getProductPrimaryImage(product))
              setQuantity(1)
              setNotifyInterest(false)
              setNotifyMessage("")
            }}
            onDecreaseQuantity={() => updateQuantity(quantity - 1)}
            onIncreaseQuantity={() => updateQuantity(quantity + 1)}
            onPersonalizationTextChange={(value) => {
              setPersonalizationText(value)
              if (personalizationError) setPersonalizationError("")
            }}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            onEdit={handleEditProduct}
            onNotify={handleNotifyInterest}
            notifyMessage={notifyMessage}
            getVariantStockLabel={(variantId) => getProductStockLabel(product, variantId)}
          />
        </div>

        {infoSections.length ? (
          <ProductInfoAccordions
            openSection={openInfoSection}
            onToggle={(section) => setOpenInfoSection((current) => (current === section ? null : section))}
            sections={infoSections}
            mobileOnly={isMobileViewport}
          />
        ) : null}
      </div>

      {relatedProducts.length ? (
        <div className="mt-14 space-y-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.32em] text-white/45">Correlati</p>
            <h3 className="text-2xl font-semibold text-white">Prodotti collegati per categoria, tag o collezione</h3>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
            {relatedPageState.visibleItems.map((related) => (
              <div
                key={related.id}
                onClickCapture={() => {
                  pushProductReturnEntry({ pathname: `/shop/${slug}` })
                }}
              >
                <ProductCard product={related} />
              </div>
            ))}
          </div>
          {relatedPageState.canLoadMore ? (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => setVisibleRelatedCount(relatedPageState.nextVisibleCount)}
                className="rounded-full border border-white/12 px-5 py-2 text-sm uppercase tracking-[0.18em] text-white/72 transition hover:border-white/24 hover:text-white"
              >
                Altro
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {recentlyViewedProducts.length ? (
        <div className="mt-14 space-y-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.32em] text-white/45">Stavi guardando</p>
            <h3 className="text-2xl font-semibold text-white">Stavi guardando</h3>
            <p className="text-sm leading-6 text-white/62">Altri poster che hai visitato di recente.</p>
          </div>
          <HorizontalScrollRail
            className="-mx-4 px-4 pb-3 pt-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
            contentClassName="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            ariaLabel="Scorri a destra i prodotti visti di recente"
          >
            <div className="flex min-w-full gap-6 pr-14">
              {recentlyViewedProducts.map((recentProduct) => (
                <div key={recentProduct.slug} className="w-[18.5rem] flex-none sm:w-[20rem]">
                  <ProductCard product={recentProduct} />
                </div>
              ))}
            </div>
          </HorizontalScrollRail>
        </div>
      ) : null}

      <ProductLightbox open={isLightboxOpen && Boolean(selectedImage)} image={selectedImage || getProductPrimaryImage(product)} title={product.title} onClose={() => setIsLightboxOpen(false)} />
    </ShopLayout>
  )
}
