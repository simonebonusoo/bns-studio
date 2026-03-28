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
import { ShopProduct, ShopSettings } from "../types"

function ProductInfoAccordion({
  title,
  open,
  onToggle,
  children,
}: {
  title: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-white/10">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left text-sm text-white/80 transition hover:bg-white/[0.03]"
      >
        <span>{title}</span>
        <span className={`text-white/45 transition ${open ? "rotate-180" : ""}`}>⌄</span>
      </button>
      {open ? <div className="border-t border-white/10 px-4 py-3 text-sm leading-6 text-white/68">{children}</div> : null}
    </div>
  )
}

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
  const shippingCostLabel = shippingCostValue > 0 ? formatPrice(shippingCostValue) : "calcolata al checkout"

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
      <div className="mx-auto max-w-[1380px] space-y-8">
        <div className="grid items-stretch gap-8 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.88fr)]">
          <div className="min-w-0 grid gap-4 md:grid-cols-[minmax(0,1fr)_92px] md:items-start">
            <button
              type="button"
              onClick={() => setIsLightboxOpen(true)}
              className="shop-card block overflow-hidden text-left transition hover:border-white/20"
            >
              <div className="flex min-h-[360px] items-center justify-center bg-white/[0.02] p-4 md:min-h-[460px]">
                <img src={selectedImage} alt={product.title} className="max-h-[420px] w-full object-contain md:max-h-[520px]" />
              </div>
            </button>
            <div className="grid grid-cols-4 gap-3 md:grid-cols-1">
              {galleryImages.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  onClick={() => setSelectedImage(image)}
                  className={`overflow-hidden rounded-[20px] border text-left ${selectedImage === image ? "border-[#e3f503]" : "border-white/10"}`}
                >
                  <img src={image} alt={product.title} className="aspect-square w-full object-cover" />
                  <div className="border-t border-white/10 px-2 py-2 text-[10px] uppercase tracking-[0.16em] text-white/55">
                    {index === 0 ? "Cover" : `${index + 1}`}
                  </div>
                </button>
              ))}
            </div>
          </div>

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
                    <span className="block text-3xl font-semibold leading-none text-white md:text-[2.1rem]">{formatPrice(selectedPrice)}</span>
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
                  <button
                    type="button"
                    onClick={() => navigate(`/shop?category=${encodeURIComponent(product.category)}`)}
                    className="text-sm text-white/80 transition hover:text-[#e3f503]"
                  >
                    {product.category}
                  </button>
                </div>
                {product.sku || selectedVariant?.sku ? (
                  <div className="flex items-center justify-between rounded-2xl border border-white/10 px-4 py-3">
                    <span>SKU</span>
                    <span>{selectedVariant?.sku || product.sku}</span>
                  </div>
                ) : null}
                <div className="rounded-2xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => setVariantMenuOpen((current) => !current)}
                    className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition hover:bg-white/[0.03]"
                  >
                    <span className="text-white/70">Variante</span>
                    <span className="flex items-center gap-3">
                      <span className="text-sm text-white">{selectedVariant?.title || "Seleziona"}</span>
                      <span className={`text-white/45 transition ${variantMenuOpen ? "rotate-180" : ""}`}>⌄</span>
                    </span>
                  </button>
                  {variantMenuOpen ? (
                    <div className="grid gap-2 border-t border-white/10 px-3 py-3">
                      {variants.map((variant) => {
                        const isSelected = selectedVariant?.key === variant.key
                        const variantLabel = getProductStockLabel(product, variant.id)
                        return (
                          <button
                            key={`${variant.id ?? variant.key}-${variant.position}`}
                            type="button"
                            onClick={() => {
                              setSelectedVariantKey(variant.key || variant.title)
                              setQuantity(1)
                              setNotifyInterest(false)
                              setVariantMenuOpen(false)
                            }}
                            className={`flex items-center justify-between gap-4 rounded-[18px] border px-4 py-3 text-left transition ${
                              isSelected
                                ? "border-[#e3f503] bg-[#e3f503]/8 text-white"
                                : "border-white/10 text-white/78 hover:border-white/25 hover:bg-white/[0.03] hover:text-white"
                            }`}
                            disabled={variant.isActive === false}
                          >
                            <div>
                              <span className="block text-sm font-medium text-white">{variant.title}</span>
                              <span className="mt-1 block text-xs text-white/55">{variantLabel}</span>
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
                <div className="rounded-2xl border border-white/10 px-4 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Quantità</p>
                      <p className="mt-1 text-sm text-white/70">Scegli quante copie aggiungere al carrello.</p>
                    </div>
                    <div className="inline-flex items-center overflow-hidden rounded-full border border-white/12 bg-white/[0.03]">
                      <button
                        type="button"
                        onClick={() => updateQuantity(quantity - 1)}
                        disabled={quantity <= 1}
                        className="h-11 w-11 text-lg text-white/75 transition hover:bg-white/8 hover:text-white disabled:cursor-not-allowed disabled:text-white/25"
                      >
                        -
                      </button>
                      <span className="min-w-[52px] px-3 text-center text-base font-medium text-white">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(quantity + 1)}
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
                    ? "Questo prodotto e visibile ma attualmente non acquistabile."
                    : "Questo prodotto non e disponibile per l'acquisto in questo momento."}
                </div>
              ) : null}
              {!purchasable ? (
                <div className="space-y-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setNotifyInterest(true)}
                    className="w-full"
                  >
                    Notificami quando disponibile
                  </Button>
                  {notifyInterest ? (
                    <p className="text-sm text-white/55">
                      Registriamo il tuo interesse per questa variante. Possiamo collegare le notifiche reali in un passaggio successivo.
                    </p>
                  ) : null}
                  {effectiveRole === "admin" ? (
                    <Button type="button" variant="ghost" onClick={handleEditProduct} className="w-full">
                      Modifica
                    </Button>
                  ) : null}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <Button
                    onClick={() =>
                      addItem(product, quantity, {
                        variantId: selectedVariant?.id ?? null,
                        format: selectedVariant?.title || null,
                        variantLabel: selectedVariant?.title || null,
                        variantSku: selectedVariant?.sku || null,
                      })
                    }
                    className="w-full"
                  >
                    Aggiungi al carrello
                  </Button>
                  <Button type="button" variant="ghost" onClick={handleBuyNow} className="w-full">
                    Acquista ora
                  </Button>
                  {effectiveRole === "admin" ? (
                    <Button type="button" variant="ghost" onClick={handleEditProduct} className="w-full">
                      Modifica
                    </Button>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid items-start gap-3 lg:grid-cols-[repeat(3,minmax(0,1fr))]">
          <ProductInfoAccordion
            title="Dettagli prodotto"
            open={openInfoSection === "details"}
            onToggle={() => setOpenInfoSection((current) => (current === "details" ? null : "details"))}
          >
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
          </ProductInfoAccordion>
          <ProductInfoAccordion
            title="Spedizione e acquisto"
            open={openInfoSection === "shipping"}
            onToggle={() => setOpenInfoSection((current) => (current === "shipping" ? null : "shipping"))}
          >
            Il checkout conserva variante selezionata, prezzo applicato e disponibilità verificata lato server prima della conferma ordine.
          </ProductInfoAccordion>
          <ProductInfoAccordion
            title="Consegna"
            open={openInfoSection === "delivery"}
            onToggle={() => setOpenInfoSection((current) => (current === "delivery" ? null : "delivery"))}
          >
            <div className="grid gap-2">
              <p>Consegna in 3-5 giorni lavorativi.</p>
              <p>Spedizione {shippingCostValue > 0 ? `da ${shippingCostLabel}` : shippingCostLabel}.</p>
            </div>
          </ProductInfoAccordion>
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
