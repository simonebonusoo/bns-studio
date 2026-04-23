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
import { getAvailableFormats, getDefaultVariant, getProductBadges, getProductEditionOptions, getProductGalleryImages, getProductPrimaryImage, getProductStockLabel, getProductStockStatus, getProductVariants, getSizeOptionsForEdition, isProductPurchasable, resolveSelectedVariant } from "../lib/product"
import { getRelatedProductsPageState, getRecentlyViewedProducts, upsertRecentlyViewedProduct } from "../lib/product-page-discovery.mjs"
import { ShopLayout } from "../components/ShopLayout"
import { ShopProduct, ShopSettings } from "../types"

const PENDING_NOTIFY_KEY = "bns_pending_back_in_stock"
const RECENTLY_VIEWED_KEY = "bns_recently_viewed_products"
const RELATED_PAGE_SIZE = 8

function uniqueImages(images: Array<string | null | undefined>) {
  return images.filter((image): image is string => Boolean(image && image.trim())).filter((image, index, all) => all.indexOf(image) === index)
}

function getImagesForSelectedVariant(product: ShopProduct, variant?: ReturnType<typeof getDefaultVariant> | null) {
  const variantImages = uniqueImages([...(variant?.variantProductImageUrls || []), variant?.variantProductImageUrl])
  if (variant?.variantProductId && variantImages.length) return variantImages
  if (variant?.variantProductId) return []
  return getProductGalleryImages(product)
}

function variantMatchesEditionName(variant: ReturnType<typeof getDefaultVariant>, editionName: string) {
  const normalizedEdition = String(editionName || "").trim().toUpperCase()
  return [
    variant?.editionName,
    variant?.variantProductTitle,
    variant?.variantProductSlug,
    variant?.variantProductId ? String(variant.variantProductId) : "",
  ].some((value) => String(value || "").trim().toUpperCase() === normalizedEdition)
}

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
  const [personalizationImageUrl, setPersonalizationImageUrl] = useState("")
  const [personalizationImageUploading, setPersonalizationImageUploading] = useState(false)
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
        setSelectedEditionName(defaultVariant?.editionName || "Standard")
        setSelectedVariantKey(defaultVariant?.key || defaultVariant?.title || "")
        setSelectedImage(getImagesForSelectedVariant(data, defaultVariant)[0] || getProductPrimaryImage(data))
        setIsLightboxOpen(false)
        setQuantity(1)
        setPersonalizationText("")
        setPersonalizationImageUrl("")
        setPersonalizationImageUploading(false)
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
  const galleryImages = product ? getImagesForSelectedVariant(product, selectedVariant) : []
  const primaryCollection = product?.collections?.[0] || null
  const originalPrice = selectedVariant?.price ?? product?.price ?? 0
  const selectedPrice =
    typeof selectedVariant?.discountPrice === "number" && selectedVariant.discountPrice < originalPrice
      ? selectedVariant.discountPrice
      : originalPrice
  const purchasable = product ? isProductPurchasable(product, selectedVariant?.id) : false
  const badges = product ? getProductBadges(product) : []
  const heroBadge = badges[0] || null
  const stockStatus = product ? getProductStockStatus(product, selectedVariant?.id) : "out_of_stock"
  const stockLabel = product ? getProductStockLabel(product, selectedVariant?.id) : "Esaurito"
  const activeProductTitle = selectedVariant?.variantProductTitle || product?.title || ""
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
  const personalizationConfig = useMemo(
    () => ({
      textEnabled: Boolean(product?.isCustomizable && product?.personalizationTextEnabled),
      textRequired: Boolean(product?.isCustomizable && product?.personalizationTextEnabled && product?.personalizationTextRequired),
      textLabel: product?.personalizationTextLabel?.trim() || "Inserisci il nome o il testo breve da usare per la personalizzazione",
      textMaxChars: Math.max(1, Math.min(200, Number(product?.personalizationTextMaxChars || 50))),
      imageEnabled: Boolean(product?.isCustomizable && product?.personalizationImageEnabled),
      imageRequired: Boolean(product?.isCustomizable && product?.personalizationImageEnabled && product?.personalizationImageRequired),
      imageLabel: product?.personalizationImageLabel?.trim() || "Carica un’immagine da usare per adattare il poster",
      imageInstructions: product?.personalizationImageInstructions?.trim() || "Il prodotto verrà personalizzato in base ai dati caricati o inseriti prima dell’ordine.",
    }),
    [
      product?.isCustomizable,
      product?.personalizationImageEnabled,
      product?.personalizationImageInstructions,
      product?.personalizationImageLabel,
      product?.personalizationImageRequired,
      product?.personalizationTextEnabled,
      product?.personalizationTextLabel,
      product?.personalizationTextMaxChars,
      product?.personalizationTextRequired,
    ],
  )
  const relatedPageState = useMemo(
    () => getRelatedProductsPageState(relatedProducts, visibleRelatedCount, RELATED_PAGE_SIZE),
    [relatedProducts, visibleRelatedCount],
  )

  useEffect(() => {
    if (!product) return
    const nextImage = galleryImages[0] || ""
    if (!galleryImages.includes(selectedImage)) {
      setSelectedImage(nextImage)
    }
  }, [galleryImages, product, selectedImage])

  useEffect(() => {
    if (!product || !variants.length) return
    const currentStillValid = variants.some((variant) => variant.key === selectedVariantKey || variant.title === selectedVariantKey)
    if (!currentStillValid) {
      const nextVariant = variants.find((variant) => variant.isDefault && variant.isActive !== false) || variants.find((variant) => variant.isActive !== false) || variants[0]
      setSelectedVariantKey(nextVariant?.key || nextVariant?.title || "")
      setQuantity(1)
    }
  }, [product, selectedVariantKey, variants])

  function updateQuantity(nextValue: number) {
    setQuantity(Math.min(Math.max(nextValue, 1), maxQuantity))
  }

  function resolvePersonalizationSelection() {
    if (!product?.isCustomizable) {
      setPersonalizationError("")
      return { personalizationText: null, personalizationImageUrl: null }
    }

    const normalizedText = personalizationText.trim()
    const normalizedImageUrl = personalizationImageUrl.trim()

    if (personalizationConfig.textEnabled && personalizationConfig.textRequired && !normalizedText) {
      setPersonalizationError("Inserisci il testo richiesto per la personalizzazione.")
      return undefined
    }

    if (normalizedText && normalizedText.length > personalizationConfig.textMaxChars) {
      setPersonalizationError(`Il testo personalizzato può contenere al massimo ${personalizationConfig.textMaxChars} caratteri.`)
      return undefined
    }

    if (personalizationConfig.imageEnabled && personalizationConfig.imageRequired && !normalizedImageUrl) {
      setPersonalizationError("Carica l’immagine richiesta per completare la personalizzazione.")
      return undefined
    }

    setPersonalizationError("")
    return {
      personalizationText: personalizationConfig.textEnabled ? (normalizedText || null) : null,
      personalizationImageUrl: personalizationConfig.imageEnabled ? (normalizedImageUrl || null) : null,
    }
  }

  async function uploadPersonalizationImage(file: File) {
    const formData = new FormData()
    formData.append("images", file)
    const data = await apiFetch<{ files: { url: string }[] }>("/store/personalization/uploads", {
      method: "POST",
      body: formData,
    })
    return data.files[0]?.url || ""
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
    const resolvedPersonalization = resolvePersonalizationSelection()
    if (!resolvedPersonalization) return
    beginCheckout(product, quantity, {
      variantId: selectedVariant?.id ?? null,
      editionName: selectedVariant?.editionName || selectedEditionName || null,
      size: selectedVariant?.size || null,
      format: selectedVariant?.size || selectedVariant?.title || null,
      variantLabel: selectedVariant?.title || null,
      variantSku: selectedVariant?.sku || null,
      personalizationText: resolvedPersonalization.personalizationText,
      personalizationImageUrl: resolvedPersonalization.personalizationImageUrl,
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
    const resolvedPersonalization = resolvePersonalizationSelection()
    if (!resolvedPersonalization) return

    addItem(product, quantity, {
      variantId: selectedVariant?.id ?? null,
      editionName: selectedVariant?.editionName || selectedEditionName || null,
      size: selectedVariant?.size || null,
      format: selectedVariant?.size || selectedVariant?.title || null,
      variantLabel: selectedVariant?.title || null,
      variantSku: selectedVariant?.sku || null,
      personalizationText: resolvedPersonalization.personalizationText,
      personalizationImageUrl: resolvedPersonalization.personalizationImageUrl,
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
  }, [personalizationError, personalizationImageUrl, personalizationText, product?.id, quantity, selectedEditionName, selectedVariantKey, stockStatus, subtotal])

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
      title={activeProductTitle}
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
            title={activeProductTitle}
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
            personalizationTextEnabled={personalizationConfig.textEnabled}
            personalizationTextLabel={personalizationConfig.textLabel}
            personalizationTextMaxChars={personalizationConfig.textMaxChars}
            personalizationText={personalizationText}
            personalizationImageEnabled={personalizationConfig.imageEnabled}
            personalizationImageLabel={personalizationConfig.imageLabel}
            personalizationImageInstructions={personalizationConfig.imageInstructions}
            personalizationImageUrl={personalizationImageUrl}
            personalizationImageUploading={personalizationImageUploading}
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
                allVariants.find((variant) => variantMatchesEditionName(variant, editionName) && variant.size === selectedVariant?.size) ||
                allVariants.find((variant) => variantMatchesEditionName(variant, editionName) && variant.isActive !== false) ||
                allVariants.find((variant) => variantMatchesEditionName(variant, editionName))
              setSelectedEditionName(editionName)
              setSelectedVariantKey(nextVariant?.key || nextVariant?.title || "")
              setSelectedImage(getImagesForSelectedVariant(product, nextVariant)[0] || "")
              setQuantity(1)
              setNotifyInterest(false)
              setNotifyMessage("")
            }}
            onSelectVariant={(variant) => {
              setSelectedEditionName(variant.editionName || selectedEditionName || "Standard")
              setSelectedVariantKey(variant.key || variant.title)
              setSelectedImage(getImagesForSelectedVariant(product, variant)[0] || "")
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
            onPersonalizationImageChange={async (file) => {
              if (!file) {
                setPersonalizationImageUrl("")
                if (personalizationError) setPersonalizationError("")
                return
              }

              try {
                setPersonalizationImageUploading(true)
                const uploadedUrl = await uploadPersonalizationImage(file)
                if (!uploadedUrl) {
                  throw new Error("Upload immagine non riuscito.")
                }
                setPersonalizationImageUrl(uploadedUrl)
                if (personalizationError) setPersonalizationError("")
              } catch (error) {
                setPersonalizationError(error instanceof Error ? error.message : "Errore durante il caricamento dell’immagine.")
              } finally {
                setPersonalizationImageUploading(false)
              }
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

      <ProductLightbox open={isLightboxOpen && Boolean(selectedImage)} image={selectedImage || galleryImages[0] || getProductPrimaryImage(product)} title={activeProductTitle} onClose={() => setIsLightboxOpen(false)} />
    </ShopLayout>
  )
}
