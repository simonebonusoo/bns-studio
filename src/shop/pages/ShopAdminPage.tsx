import type { FormEvent, WheelEvent } from "react"
import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"

import { Button } from "../../components/Button"
import { ShopLayout } from "../components/ShopLayout"
import { getButtonClassName, getDangerButtonClassName } from "../../components/Button"
import { AdminAnalyticsSection } from "../components/admin/AdminAnalyticsSection"
import { ConfirmActionModal } from "../components/admin/ConfirmActionModal"
import { AdminDiscountsSection } from "../components/admin/AdminDiscountsSection"
import { AdminBannerSection } from "../components/admin/AdminBannerSection"
import { AdminHomepageSection } from "../components/admin/AdminHomepageSection"
import { AdminOrdersSection } from "../components/admin/AdminOrdersSection"
import { AdminProductsSection } from "../components/admin/AdminProductsSection"
import { AdminReviewsSection } from "../components/admin/AdminReviewsSection"
import { AdminTrendingSection } from "../components/admin/AdminTrendingSection"
import { AdminUsersSection } from "../components/admin/AdminUsersSection"
import { apiFetch } from "../lib/api"
import { formatPrice } from "../lib/format"
import { normalizeProductFormStateForEdit } from "../lib/admin-product-edit.mjs"
import { parseMidBannerSettings, parseTopBannerSettings } from "../lib/banner-settings.mjs"
import { resolveTrendingProductIds } from "../lib/trending-products.mjs"
import { AdminCollection, ProductManualBadge, ShopOrder, ShopProduct, ShopProductVariant, ShopReview, ShopSettings, ProductStatus } from "../types"

type Coupon = {
  id: number
  code: string
  type: "percentage" | "fixed" | "first_registration"
  amount: number
  active: boolean
  usageLimit?: number | null
  expiresAt?: string | null
}

type DiscountRule = {
  id: number
  name: string
  description?: string | null
  ruleType: "quantity_percentage" | "free_shipping_quantity" | "subtotal_fixed"
  threshold: number
  discountType: "percentage" | "shipping" | "fixed"
  amount: number
  priority: number
  startsAt?: string | null
  endsAt?: string | null
  active: boolean
}

type SettingEntry = {
  id?: number
  key: string
  value: string
}

type HomepagePopularCategory = {
  title: string
  description: string
  category: string
  imageUrl?: string
}

type HomepageShowcase = {
  eyebrow: string
  title: string
  description: string
  href: string
  query: string
  collectionSlug?: string
  imageUrl?: string
  ctaLabel: string
}

type ProductFormState = {
  title: string
  sku: string
  description: string
  priceA4: string
  priceA3: string
  discountPriceA4: string
  discountPriceA3: string
  costPrice: string
  hasA4: boolean
  hasA3: boolean
  category: string
  tags: string
  collectionIds: number[]
  manualBadges: ProductManualBadge[]
  featured: boolean
  stock: number
  lowStockThreshold: number
  status: ProductStatus
  existingImageUrls: string[]
  variants: Array<{
    id: number | null
    title: string
    key: string
    sku: string
    price: string
    discountPrice: string
    costPrice: string
    stock: number
    lowStockThreshold: number
    isDefault: boolean
    isActive: boolean
  }>
}

type ProductTouchedState = Partial<Record<keyof ProductFormState, boolean>>

type CollectionFormState = {
  title: string
  slug: string
  description: string
  active: boolean
}

type AdminReview = ShopReview & {
  status: string
  showOnHomepage: boolean
}

type CouponFormState = {
  code: string
  type: "percentage" | "fixed" | "first_registration"
  amount: string
  expiresAt: string
  usageLimit: string
  active: boolean
}

type RuleFormState = {
  name: string
  description: string
  ruleType: "quantity_percentage" | "free_shipping_quantity" | "subtotal_fixed"
  threshold: string
  discountType: "percentage" | "shipping" | "fixed"
  amount: string
  priority: number
  startsAt: string
  endsAt: string
  active: boolean
}

type AdminUser = {
  id: number
  email: string
  username?: string | null
  role: string
  createdAt: string
}

type AdminUsersResponse = {
  total: number
  users: AdminUser[]
}

type AdminAnalytics = {
  siteViewsTotal: number
  siteViewsToday: number
  siteViewsThisMonth: number
  totalOrders: number
  salesCount: number
  totalRevenue: number
  totalExpenses: number
  totalNet: number
  averageOrderValue: number
  averageDailyNet: number
  averageMonthlyNet: number
  averageDailyExpenses: number
  averageMonthlyExpenses: number
  bestSellingProduct: { productId: number; title: string; quantity: number } | null
  shippingCostsTracked: boolean
  chartSeries?: Array<{
    key: string
    label: string
    siteViews: number
    revenue: number
    expenses: number
    net: number
  }>
}

type AdminRuntimeStatus = {
  environment: {
    nodeEnv: string
    isProduction: boolean
    isRender: boolean
  }
  storage: {
    databaseUrl: string
    databasePath: string
    uploadsRootDir: string
    assetStorageMode: string
    renderDiskMountPath: string
    persistentStorageEnabled: boolean
    databaseGuaranteed: boolean
    uploadsGuaranteed: boolean
    storageGuaranteed: boolean
  }
  shippingManual?: {
    packlinkProNewShipmentUrl?: string
    defaultParcel?: {
      weightKg: number
      lengthCm: number
      widthCm: number
      heightCm: number
    }
  }
  warnings: string[]
}

type TopBannerState = {
  enabled: boolean
  title: string
  subtitle: string
  backgroundColor: string
  textColor: string
  countdownEnabled: boolean
  countdownTarget: string
}

type MidBannerState = {
  enabled: boolean
  text: string
  messages: string[]
  backgroundColor: string
  textColor: string
}

type OrderProfitSummary = {
  orderId: number
  orderReference: string
  status: string
  createdAt: string
  grossTotal: number
  subtotal: number
  discountTotal: number
  shippingTotal: number
  productCostsTotal: number
  shippingOperationalCost: number
  totalExpenses: number
  netTotal: number
  shippingCostsTracked: boolean
  items: Array<{
    id: number
    productId: number
    title: string
    format: string
    quantity: number
    unitPrice: number
    unitCost: number
    revenueTotal: number
    costTotal: number
    netTotal: number
  }>
}

const emptyProductForm = (): ProductFormState => ({
  title: "",
  sku: "",
  description: "",
  priceA4: "",
  priceA3: "",
  discountPriceA4: "",
  discountPriceA3: "",
  costPrice: "",
  hasA4: true,
  hasA3: false,
  category: "",
  tags: "",
  collectionIds: [],
  manualBadges: [],
  featured: false,
  stock: 0,
  lowStockThreshold: 5,
  status: "active",
  existingImageUrls: [],
  variants: [
    {
      id: null,
      title: "A4",
      key: "a4",
      sku: "",
      price: "",
      discountPrice: "",
      costPrice: "8",
      stock: 0,
      lowStockThreshold: 5,
      isDefault: true,
      isActive: true,
    },
  ],
})

const emptyCollectionForm = (): CollectionFormState => ({
  title: "",
  slug: "",
  description: "",
  active: true,
})

const emptyCouponForm = (): CouponFormState => ({
  code: "",
  type: "percentage",
  amount: "10",
  expiresAt: "",
  usageLimit: "",
  active: true,
})

const emptyRuleForm = (): RuleFormState => ({
  name: "",
  description: "",
  ruleType: "quantity_percentage",
  threshold: "2",
  discountType: "percentage",
  amount: "10",
  priority: 100,
  startsAt: "",
  endsAt: "",
  active: true,
})

const defaultHomepagePopularCategories: HomepagePopularCategory[] = [
  { title: "Cantanti famosi", category: "Cantanti famosi", description: "Poster dedicati alle icone pop, rap e rock piu amate." },
  { title: "Frasi d'amore", category: "Frasi d'amore", description: "Parole da regalare, appendere e trasformare in atmosfera." },
  { title: "Calciatori famosi", category: "Calciatori famosi", description: "Stampe per chi vuole portare il tifo dentro casa." },
  { title: "Film e serie TV", category: "Film e serie TV", description: "Scene, citazioni e mondi diventati immagini da collezione." },
  { title: "Arte iconica", category: "Arte iconica", description: "Visioni forti, linee pulite e riferimenti visivi senza tempo." },
  { title: "Poster personalizzati", category: "Poster personalizzati", description: "Idee su misura da regalare o costruire intorno ai tuoi ricordi." },
  { title: "Citazioni motivazionali", category: "Citazioni motivazionali", description: "Messaggi diretti per studio, lavoro e spazi creativi." },
  { title: "Fotografie artistiche", category: "Fotografie artistiche", description: "Scatti editoriali e immagini da lasciare respirare sulla parete." },
]

const defaultHomepageShowcases: HomepageShowcase[] = [
  {
    eyebrow: "Selezione in evidenza",
    title: "Cantanti famosi",
    description: "Volti iconici, testi che restano impressi e poster pensati per chi vuole dare subito carattere a una stanza.",
    href: "/shop?search=cantanti",
    query: "cantanti",
    ctaLabel: "Esplora la collezione",
  },
  {
    eyebrow: "Da regalare o tenere",
    title: "Frasi d'amore",
    description: "Una collezione costruita per dire qualcosa di preciso con poco: parole semplici, atmosfera pulita, impatto immediato.",
    href: "/shop?search=amore",
    query: "amore",
    ctaLabel: "Esplora la collezione",
  },
  {
    eyebrow: "Per chi vive il gioco",
    title: "Calciatori famosi",
    description: "Stampe con energia sportiva e taglio grafico deciso, per portare passione, memorie e riferimenti forti dentro casa.",
    href: "/shop?search=calciatori",
    query: "calciatori",
    ctaLabel: "Esplora la collezione",
  },
]

function toDatetimeLocal(value?: string | null) {
  if (!value) return ""
  const date = new Date(value)
  const offset = date.getTimezoneOffset()
  const normalized = new Date(date.getTime() - offset * 60_000)
  return normalized.toISOString().slice(0, 16)
}

function containWheel(event: WheelEvent<HTMLElement>) {
  event.stopPropagation()
}

function formatEuroInput(value: number) {
  return Number.isInteger(value / 100) ? String(value / 100) : (value / 100).toFixed(2)
}

function getSuggestedVariantCostCents(title: string) {
  const normalized = String(title || "").trim().toUpperCase()
  if (normalized === "A4") return 800
  if (normalized === "A3") return 1000
  return 0
}

function getShippingAdminActionError(code: string, shippingError = "", fallback = "Operazione spedizione non completata.") {
  if (String(shippingError || "").trim()) {
    return shippingError
  }

  switch (String(code || "").trim()) {
    case "shipment_not_required":
      return "La spedizione esiste gia oppure l'ordine non e idoneo alla creazione."
    case "tracking_not_available":
      return "Il tracking non e ancora disponibile per questo ordine."
    case "provider_not_supported":
      return "Il provider spedizione non e supportato per questo ordine."
    case "shipment_failed":
      return "La spedizione non e stata creata correttamente."
    case "tracking_refresh_failed":
      return "Non siamo riusciti ad aggiornare il tracking."
    default:
      return fallback
  }
}

function getVariantCostInputValue(title: string, costPrice?: number | null) {
  const resolvedCost = typeof costPrice === "number" && costPrice > 0 ? costPrice : getSuggestedVariantCostCents(title)
  return resolvedCost > 0 ? formatEuroInput(resolvedCost) : ""
}

function parseEuroToCents(value: string) {
  const normalized = Number(String(value).replace(",", "."))
  if (!Number.isFinite(normalized) || normalized < 0) return 0
  return Math.round(normalized * 100)
}

function slugifyVariantKey(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
}

function mapProductVariantToForm(variant: ShopProductVariant, index: number) {
  return {
    id: typeof variant.id === "number" ? variant.id : null,
    title: variant.title,
    key: variant.key || slugifyVariantKey(variant.title) || `variant-${index + 1}`,
    sku: variant.sku || "",
    price: formatEuroInput(variant.price),
    discountPrice: variant.discountPrice ? formatEuroInput(variant.discountPrice) : "",
    costPrice: getVariantCostInputValue(variant.title, variant.costPrice),
    stock: variant.stock,
    lowStockThreshold: variant.lowStockThreshold ?? 5,
    isDefault: Boolean(variant.isDefault),
    isActive: variant.isActive !== false,
  }
}

function buildLegacyVariantSummary(variants: ProductFormState["variants"]) {
  const normalized = variants
    .filter((variant) => variant.isActive !== false)
    .map((variant, index) => ({
      ...variant,
      title: variant.title.trim() || `Variante ${index + 1}`,
      key: slugifyVariantKey(variant.key || variant.title || `variant-${index + 1}`),
      priceCents: parseEuroToCents(variant.price),
      discountPriceCents: variant.discountPrice.trim() ? parseEuroToCents(variant.discountPrice) : null,
      costPriceCents: parseEuroToCents(variant.costPrice),
    }))

  const fallbackVariants = normalized.length
    ? normalized
    : variants.map((variant, index) => ({
        ...variant,
        title: variant.title.trim() || `Variante ${index + 1}`,
        key: slugifyVariantKey(variant.key || variant.title || `variant-${index + 1}`),
        priceCents: parseEuroToCents(variant.price),
        discountPriceCents: variant.discountPrice.trim() ? parseEuroToCents(variant.discountPrice) : null,
        costPriceCents: parseEuroToCents(variant.costPrice),
      }))

  const defaultVariant = fallbackVariants.find((variant) => variant.isDefault) || fallbackVariants[0]
  const a4Variant = fallbackVariants.find((variant) => variant.title.trim().toUpperCase() === "A4")
  const a3Variant = fallbackVariants.find((variant) => variant.title.trim().toUpperCase() === "A3")

  fallbackVariants.forEach((variant) => {
    if (variant.discountPriceCents !== null && variant.discountPriceCents > variant.priceCents) {
      throw new Error(`Il prezzo scontato non puo superare il prezzo pieno per la variante ${variant.title}`)
    }
  })

  return {
    variants: variants.map((variant, index) => ({
      id: variant.id,
      title: variant.title.trim() || `Variante ${index + 1}`,
      key: slugifyVariantKey(variant.key || variant.title || `variant-${index + 1}`),
      sku: variant.sku.trim() || null,
      price: parseEuroToCents(variant.price),
      discountPrice: variant.discountPrice.trim() ? parseEuroToCents(variant.discountPrice) : null,
      costPrice: parseEuroToCents(variant.costPrice),
      stock: Number(variant.stock || 0),
      lowStockThreshold: Number(variant.lowStockThreshold || 0),
      position: index,
      isDefault: defaultVariant ? (variant.id ? variant.id === defaultVariant.id : slugifyVariantKey(variant.key || variant.title) === defaultVariant.key) : index === 0,
      isActive: variant.isActive !== false,
    })),
    summary: {
      price: Math.min(...fallbackVariants.map((variant) => variant.priceCents)),
      discountPrice: (() => {
        const discountPrices = fallbackVariants
          .map((variant) => (typeof variant.discountPriceCents === "number" && variant.discountPriceCents < variant.priceCents ? variant.discountPriceCents : null))
          .filter((value): value is number => typeof value === "number")
        return discountPrices.length ? Math.min(...discountPrices) : null
      })(),
      costPrice: defaultVariant?.costPriceCents ?? 0,
      hasA4: Boolean(a4Variant),
      hasA3: Boolean(a3Variant),
      priceA4: a4Variant?.priceCents ?? null,
      discountPriceA4:
        typeof a4Variant?.discountPriceCents === "number" && a4Variant.discountPriceCents < a4Variant.priceCents ? a4Variant.discountPriceCents : null,
      priceA3: a3Variant?.priceCents ?? null,
      discountPriceA3:
        typeof a3Variant?.discountPriceCents === "number" && a3Variant.discountPriceCents < a3Variant.priceCents ? a3Variant.discountPriceCents : null,
      stock: fallbackVariants.reduce((sum, variant) => sum + Number(variant.stock || 0), 0),
      lowStockThreshold: Number(defaultVariant?.lowStockThreshold || 5),
    },
  }
}

function buildProductPayloadFromFormState(productForm: ProductFormState) {
  const variantSummary = buildLegacyVariantSummary(productForm.variants)

  return {
    title: productForm.title,
    sku: productForm.sku || null,
    description: productForm.description,
    price: variantSummary.summary.price,
    discountPrice: variantSummary.summary.discountPrice,
    costPrice: variantSummary.summary.costPrice,
    hasA4: variantSummary.summary.hasA4,
    hasA3: variantSummary.summary.hasA3,
    priceA4: variantSummary.summary.priceA4,
    discountPriceA4: variantSummary.summary.discountPriceA4,
    priceA3: variantSummary.summary.priceA3,
    discountPriceA3: variantSummary.summary.discountPriceA3,
    category: productForm.category,
    tags: productForm.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
    collectionIds: productForm.collectionIds,
    manualBadges: productForm.manualBadges,
    featured: productForm.featured,
    stock: variantSummary.summary.stock,
    lowStockThreshold: variantSummary.summary.lowStockThreshold,
    status: productForm.status,
    imageUrls: productForm.existingImageUrls,
    variants: variantSummary.variants,
  }
}

function parseHomepageSetting<T extends Record<string, unknown>>(value: string | undefined, fallback: T[]) {
  if (!value) return fallback
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) && parsed.length ? (parsed as T[]) : fallback
  } catch {
    return fallback
  }
}

function parseHomepagePopularCategoriesSetting(value: string | undefined, fallback: HomepagePopularCategory[]) {
  const parsed = parseHomepageSetting<Record<string, unknown>>(value, fallback)
  return parsed
    .map((entry) => {
      const href = typeof entry.href === "string" ? entry.href : ""
      const hrefParams = new URLSearchParams(href.split("?")[1] || "")
      const resolvedCategory = String(entry.category || hrefParams.get("category") || entry.title || "").trim()

      return {
        title: String(entry.title || resolvedCategory || "").trim(),
        category: resolvedCategory,
        description: String(entry.description || "").trim(),
        imageUrl: typeof entry.imageUrl === "string" ? entry.imageUrl : "",
      }
    })
    .filter((entry) => entry.title && entry.category)
}

function parseHomepageShowcasesSetting(value: string | undefined, fallback: HomepageShowcase[], collections: AdminCollection[]) {
  const parsed = parseHomepageSetting<Record<string, unknown>>(value, fallback)
  return parsed
    .map((entry) => {
      const href = String(entry.href || "").trim()
      const hrefParams = new URLSearchParams(href.split("?")[1] || "")
      const rawCollectionSlug = String(entry.collectionSlug || hrefParams.get("collectionSlug") || "").trim()
      const normalizedTitle = String(entry.title || "").trim().toLowerCase()
      const slugifiedTitle = normalizedTitle.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
      const resolvedCollection =
        collections.find((collection) => collection.slug === rawCollectionSlug) ||
        collections.find((collection) => collection.title.trim().toLowerCase() === normalizedTitle) ||
        collections.find((collection) => collection.slug === slugifiedTitle) ||
        null

      return {
        eyebrow: String(entry.eyebrow || "").trim(),
        title: String(entry.title || resolvedCollection?.title || "").trim(),
        description: String(entry.description || resolvedCollection?.description || "").trim(),
        href,
        query: String(entry.query || "").trim(),
        collectionSlug: resolvedCollection?.slug || rawCollectionSlug,
        imageUrl: typeof entry.imageUrl === "string" ? entry.imageUrl : "",
        ctaLabel: String(entry.ctaLabel || "Esplora la collezione").trim(),
      }
    })
    .filter((entry) => entry.title && (entry.collectionSlug || entry.href || entry.query))
}

function getCouponAmountLabel(type: CouponFormState["type"]) {
  if (type === "first_registration") return "Sconto prima registrazione (%)"
  return type === "percentage" ? "Valore sconto (%)" : "Valore sconto (€)"
}

function getRuleThresholdLabel(ruleType: RuleFormState["ruleType"]) {
  return ruleType === "subtotal_fixed" ? "Subtotale minimo ordine (€)" : "Quantità minima prodotti"
}

function getRuleAmountLabel(discountType: RuleFormState["discountType"]) {
  if (discountType === "percentage") return "Valore sconto (%)"
  if (discountType === "fixed") return "Valore sconto (€)"
  return "Valore regola (0 se spedizione)"
}

export function ShopAdminPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [products, setProducts] = useState<ShopProduct[]>([])
  const [collections, setCollections] = useState<AdminCollection[]>([])
  const [reviews, setReviews] = useState<AdminReview[]>([])
  const [archivedReviews, setArchivedReviews] = useState<AdminReview[]>([])
  const [orders, setOrders] = useState<ShopOrder[]>([])
  const [archivedOrders, setArchivedOrders] = useState<ShopOrder[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [usersTotal, setUsersTotal] = useState(0)
  const [roleUpdateLoadingId, setRoleUpdateLoadingId] = useState<number | null>(null)
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null)
  const [showOrderProfitBreakdown, setShowOrderProfitBreakdown] = useState(false)
  const [runtimeStatus, setRuntimeStatus] = useState<AdminRuntimeStatus | null>(null)
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [rules, setRules] = useState<DiscountRule[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [settings, setSettings] = useState<SettingEntry[]>([])
  const [shippingCostInput, setShippingCostInput] = useState("9")
  const [tab, setTab] = useState<"prodotti" | "homepage" | "banner" | "tendenza" | "recensioni" | "ordini" | "archivio" | "utenti" | "data" | "sconti">("prodotti")
  const [homepagePopularCategories, setHomepagePopularCategories] = useState<HomepagePopularCategory[]>(defaultHomepagePopularCategories)
  const [homepageShowcases, setHomepageShowcases] = useState<HomepageShowcase[]>(defaultHomepageShowcases)
  const [trendingProductIds, setTrendingProductIds] = useState<number[]>([])
  const [topBanner, setTopBanner] = useState<TopBannerState>(() => {
    const parsed = parseTopBannerSettings()
    return { ...parsed, countdownTarget: toDatetimeLocal(parsed.countdownTarget) }
  })
  const [midBanner, setMidBanner] = useState<MidBannerState>(parseMidBannerSettings())
  const [homepageFocus, setHomepageFocus] = useState<{ section: "showcases" | "popular-categories"; item: number | null }>({
    section: "showcases",
    item: null,
  })

  const [productForm, setProductForm] = useState<ProductFormState>(emptyProductForm)
  const [productFiles, setProductFiles] = useState<File[]>([])
  const [productPreviewUrls, setProductPreviewUrls] = useState<string[]>([])
  const [editingProductId, setEditingProductId] = useState<number | null>(null)
  const [productSearch, setProductSearch] = useState("")
  const [productCategoryFilter, setProductCategoryFilter] = useState("")
  const [productStatusFilter, setProductStatusFilter] = useState<"all" | ProductStatus>("all")
  const [allProductsForTrending, setAllProductsForTrending] = useState<ShopProduct[]>([])
  const [updatingHomeProductId, setUpdatingHomeProductId] = useState<number | null>(null)
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([])
  const [productTouchedFields, setProductTouchedFields] = useState<ProductTouchedState>({})
  const [newCategoryName, setNewCategoryName] = useState("")
  const [renamingCategory, setRenamingCategory] = useState<string | null>(null)
  const [renamedCategoryValue, setRenamedCategoryValue] = useState("")
  const [collectionForm, setCollectionForm] = useState<CollectionFormState>(emptyCollectionForm)
  const [editingCollectionId, setEditingCollectionId] = useState<number | null>(null)

  const [couponForm, setCouponForm] = useState<CouponFormState>(emptyCouponForm)
  const [editingCouponId, setEditingCouponId] = useState<number | null>(null)

  const [ruleForm, setRuleForm] = useState<RuleFormState>(emptyRuleForm)
  const [editingRuleId, setEditingRuleId] = useState<number | null>(null)
  const [orderProfit, setOrderProfit] = useState<OrderProfitSummary | null>(null)
  const [pendingArchiveDelete, setPendingArchiveDelete] = useState<null | { type: "review" | "order"; id: string | number }>(null)
  const [loadingProfitOrderId, setLoadingProfitOrderId] = useState<number | null>(null)

  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const productImages = useMemo(
    () => [...(Array.isArray(productForm.existingImageUrls) ? productForm.existingImageUrls : []), ...productPreviewUrls],
    [productForm.existingImageUrls, productPreviewUrls]
  )
  const shopSettings = useMemo<ShopSettings>(
    () =>
      settings.reduce<ShopSettings>((acc, entry) => {
        acc[entry.key] = entry.value
        return acc
      }, {}),
    [settings]
  )

  useEffect(() => {
    refresh().catch((err) => {
      setError(err instanceof Error ? err.message : "Errore durante il caricamento della dashboard admin.")
    })
  }, [])

  useEffect(() => {
    void refreshProducts().catch((err) => {
      setError(err instanceof Error ? err.message : "Errore durante il caricamento dei prodotti admin.")
    })
  }, [productCategoryFilter, productSearch, productStatusFilter])

  useEffect(() => {
    const editProductId = Number(searchParams.get("editProduct") || 0)
    if (!editProductId || !products.length) return

    const targetProduct = products.find((product) => product.id === editProductId)
    if (!targetProduct) return

    setTab("prodotti")
    startEditProduct(targetProduct)
    navigate("/shop/admin", { replace: true })
  }, [navigate, products, searchParams])

  useEffect(() => {
    const nextTab = searchParams.get("tab")
    if (
      nextTab === "homepage" ||
      nextTab === "tendenza" ||
      nextTab === "prodotti" ||
      nextTab === "recensioni" ||
      nextTab === "ordini" ||
      nextTab === "archivio" ||
      nextTab === "utenti" ||
      nextTab === "data" ||
      nextTab === "sconti"
    ) {
      setTab(nextTab)
    }

    const section = searchParams.get("section")
    const item = Number(searchParams.get("item") || "")
    if (section === "showcases" || section === "popular-categories") {
      setHomepageFocus({
        section,
        item: Number.isFinite(item) ? item : null,
      })
    }
  }, [searchParams])

  useEffect(() => {
    return () => {
      productPreviewUrls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [productPreviewUrls])

  useEffect(() => {
    if (!message && !error) return

    const timer = window.setTimeout(() => {
      setMessage("")
      setError("")
    }, 2800)

    return () => window.clearTimeout(timer)
  }, [message, error])

  useEffect(() => {
    setMessage("")
    setError("")
    setOrderProfit(null)
    setShowOrderProfitBreakdown(false)
  }, [tab])

  useEffect(() => {
    setShippingCostInput(formatEuroInput(Number(settingValue("shippingCost", "900"))))
  }, [settings])

  useEffect(() => {
    setHomepagePopularCategories(parseHomepagePopularCategoriesSetting(settingValue("homepagePopularCategories"), defaultHomepagePopularCategories))
    setHomepageShowcases(parseHomepageShowcasesSetting(settingValue("homepageShowcases"), defaultHomepageShowcases, collections))
    setTrendingProductIds(resolveTrendingProductIds(settingValue("homepageTrendingProductIds"), allProductsForTrending))
    {
      const parsedTopBanner = parseTopBannerSettings(shopSettings)
      setTopBanner({ ...parsedTopBanner, countdownTarget: toDatetimeLocal(parsedTopBanner.countdownTarget) })
    }
    setMidBanner(parseMidBannerSettings(shopSettings))
  }, [allProductsForTrending, collections, settings])

  async function refreshProducts() {
    const params = new URLSearchParams()
    if (productSearch.trim()) params.set("search", productSearch.trim())
    if (productCategoryFilter) params.set("category", productCategoryFilter)
    if (productStatusFilter !== "all") params.set("status", productStatusFilter)

    const productData = await apiFetch<ShopProduct[]>(`/admin/products?${params.toString()}`)
    setProducts(productData)
  }

  async function refresh() {
    const [, allProductsData, reviewData, orderData, usersData, analyticsData, couponData, ruleData, categoryData, settingsData, runtimeData, collectionsData, archivedReviewData, archivedOrderData] = await Promise.all([
      refreshProducts(),
      apiFetch<ShopProduct[]>("/admin/products"),
      apiFetch<AdminReview[]>("/admin/reviews"),
      apiFetch<ShopOrder[]>("/admin/orders"),
      apiFetch<AdminUsersResponse>("/admin/users"),
      apiFetch<AdminAnalytics>("/admin/analytics"),
      apiFetch<Coupon[]>("/admin/coupons"),
      apiFetch<DiscountRule[]>("/admin/discount-rules"),
      apiFetch<string[]>("/admin/categories"),
      apiFetch<SettingEntry[]>("/admin/settings"),
      apiFetch<AdminRuntimeStatus>("/admin/runtime-status"),
      apiFetch<AdminCollection[]>("/admin/collections"),
      apiFetch<AdminReview[]>("/admin/archive/reviews"),
      apiFetch<ShopOrder[]>("/admin/archive/orders"),
    ])

    setAllProductsForTrending(allProductsData)
    setReviews(reviewData)
    setArchivedReviews(archivedReviewData)
    setOrders(orderData)
    setArchivedOrders(archivedOrderData)
    setUsers(usersData.users)
    setUsersTotal(usersData.total)
    setAnalytics(analyticsData)
    setCoupons(couponData)
    setRules(ruleData)
    setCategories(categoryData)
    setSettings(settingsData)
    setRuntimeStatus(runtimeData)
    setCollections(collectionsData)
  }

  function clearFeedback() {
    setMessage("")
    setError("")
  }

  function mergeUpdatedOrder(nextOrder: ShopOrder) {
    setOrders((current) => current.map((order) => (order.id === nextOrder.id ? nextOrder : order)))
  }

  async function updateUserRole(user: AdminUser, nextRole: "admin" | "customer") {
    clearFeedback()
    try {
      setRoleUpdateLoadingId(user.id)
      const updatedUser = await apiFetch<AdminUser>(`/admin/users/${user.id}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role: nextRole }),
      })

      setUsers((current) => current.map((entry) => (entry.id === updatedUser.id ? updatedUser : entry)))
      setMessage(nextRole === "admin" ? "Utente promosso ad admin." : "Utente impostato come cliente.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante l'aggiornamento del ruolo utente.")
      throw err
    } finally {
      setRoleUpdateLoadingId(null)
    }
  }

  function resetProductForm() {
    setProductForm(emptyProductForm())
    setProductTouchedFields({})
    setEditingProductId(null)
    setProductFiles([])
    productPreviewUrls.forEach((url) => URL.revokeObjectURL(url))
    setProductPreviewUrls([])
  }

  function startEditProduct(product: ShopProduct) {
    clearFeedback()
    resetProductForm()
    setEditingProductId(product.id)
    setProductTouchedFields({})
    setProductForm(normalizeProductFormStateForEdit(product))
  }

  function areFormValuesEqual(left: unknown, right: unknown) {
    return JSON.stringify(left) === JSON.stringify(right)
  }

  function handleProductFormChange(next: ProductFormState) {
    setProductTouchedFields((current) => {
      const nextTouched = { ...current }
      ;(Object.keys(next) as Array<keyof ProductFormState>).forEach((key) => {
        if (!areFormValuesEqual(productForm[key], next[key])) {
          nextTouched[key] = true
        }
      })
      return nextTouched
    })
    setProductForm(next)
  }

  const selectedProducts = useMemo(
    () => products.filter((product) => selectedProductIds.includes(product.id)),
    [products, selectedProductIds],
  )
  const isMultiEdit = selectedProductIds.length > 1
  const hasTouchedFields = Object.values(productTouchedFields).some(Boolean)

  useEffect(() => {
    if (selectedProductIds.length === 0) {
      if (editingProductId !== null) {
        resetProductForm()
      }
      return
    }

    if (selectedProductIds.length === 1) {
      const selectedProduct = products.find((product) => product.id === selectedProductIds[0])
      if (selectedProduct && editingProductId !== selectedProduct.id) {
        startEditProduct(selectedProduct)
      }
      return
    }

    if (selectedProductIds.length > 1) {
      resetProductForm()
    }
  }, [selectedProductIds, products])

  function handleProductFileChange(files: FileList | null) {
    if (!files) return
    const nextFiles = Array.from(files)
    const nextPreviewUrls = nextFiles.map((file) => URL.createObjectURL(file))
    productPreviewUrls.forEach((url) => URL.revokeObjectURL(url))
    setProductFiles(nextFiles)
    setProductPreviewUrls(nextPreviewUrls)
  }

  function removeProductImage(imageUrl: string) {
    if (productForm.existingImageUrls.includes(imageUrl)) {
      setProductForm((current) => ({
        ...current,
        existingImageUrls: current.existingImageUrls.filter((image) => image !== imageUrl),
      }))
      return
    }

    const nextPreviewUrls = productPreviewUrls.filter((image) => image !== imageUrl)
    const nextFiles = nextPreviewUrls.map((previewUrl) => productFiles[productPreviewUrls.indexOf(previewUrl)])
    setProductPreviewUrls(nextPreviewUrls)
    setProductFiles(nextFiles)
  }

  function reorderProductImages(nextImages: string[]) {
    setProductForm((current) => {
      const existingSet = new Set(current.existingImageUrls)
      return {
        ...current,
        existingImageUrls: nextImages.filter((image) => existingSet.has(image)),
      }
    })

    const previewIndexMap = new Map(productPreviewUrls.map((url, index) => [url, index]))
    const nextPreviewUrls = nextImages.filter((image) => previewIndexMap.has(image))
    const nextFiles = nextPreviewUrls.map((previewUrl) => productFiles[previewIndexMap.get(previewUrl) ?? 0]).filter(Boolean)
    setProductPreviewUrls(nextPreviewUrls)
    setProductFiles(nextFiles)
  }

  async function uploadProductImages() {
    if (!productFiles.length) return []

    const formData = new FormData()
    productFiles.forEach((file) => formData.append("images", file))
    const data = await apiFetch<{ files: { url: string }[] }>("/admin/uploads", {
      method: "POST",
      body: formData,
    })

    return data.files.map((file) => file.url)
  }

  async function uploadHomepageImage(file: File) {
    const formData = new FormData()
    formData.append("images", file)
    const data = await apiFetch<{ files: { url: string }[] }>("/admin/uploads", {
      method: "POST",
      body: formData,
    })
    return data.files[0]?.url || ""
  }

  async function saveProduct(event: FormEvent) {
    event.preventDefault()
    clearFeedback()

    try {
      if (isMultiEdit) {
        if (!selectedProducts.length) {
          throw new Error("Seleziona almeno due prodotti per la modifica multipla.")
        }
        if (!hasTouchedFields) {
          throw new Error("Modifica almeno un campo prima di aggiornare i prodotti selezionati.")
        }

        const requests = selectedProducts.map((product) => {
          const payload = {
            title: productTouchedFields.title ? productForm.title : product.title,
            sku: product.sku || null,
            description: productTouchedFields.description ? productForm.description : product.description,
            price: parseEuroToCents(
              productTouchedFields.hasA4 || productTouchedFields.priceA4 || productTouchedFields.hasA3 || productTouchedFields.priceA3
                ? (productForm.hasA4 ? productForm.priceA4 : productForm.priceA3)
                : formatEuroInput(product.hasA4 !== false ? (product.priceA4 ?? product.price) : (product.priceA3 ?? product.price)),
            ),
            costPrice: productTouchedFields.costPrice ? parseEuroToCents(productForm.costPrice) : Number(product.costPrice || 0),
            hasA4: productTouchedFields.hasA4 ? productForm.hasA4 : product.hasA4 !== false,
            hasA3: productTouchedFields.hasA3 ? productForm.hasA3 : Boolean(product.hasA3),
            priceA4:
              productTouchedFields.hasA4 || productTouchedFields.priceA4
                ? (productForm.hasA4 ? parseEuroToCents(productForm.priceA4) : null)
                : (product.priceA4 ?? product.price),
            priceA3:
              productTouchedFields.hasA3 || productTouchedFields.priceA3
                ? (productForm.hasA3 ? parseEuroToCents(productForm.priceA3) : null)
                : (product.priceA3 ?? null),
            category: productTouchedFields.category ? productForm.category : product.category,
            tags: productTouchedFields.tags ? productForm.tags.split(",").map((tag) => tag.trim()).filter(Boolean) : (product.tags?.map((tag) => tag.name) || []),
            collectionIds: productTouchedFields.collectionIds ? productForm.collectionIds : (product.collections?.map((collection) => collection.id) || []),
            manualBadges: productTouchedFields.manualBadges ? productForm.manualBadges : (product.manualBadges || []),
            featured: productTouchedFields.featured ? productForm.featured : product.featured,
            stock: productTouchedFields.stock ? Number(productForm.stock) : Number(product.stock),
            lowStockThreshold: productTouchedFields.lowStockThreshold ? Number(productForm.lowStockThreshold) : Number(product.lowStockThreshold || 5),
            status: productTouchedFields.status ? productForm.status : product.status,
            imageUrls: product.imageUrls,
          }

          return apiFetch<ShopProduct>(`/admin/products/${product.id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
          })
        })

        await Promise.all(requests)
        setSelectedProductIds([])
        resetProductForm()
        await refresh()
        setMessage("Prodotti aggiornati correttamente.")
        return
      }

      const uploadedUrls = await uploadProductImages()
      const imageUrls = [...productForm.existingImageUrls, ...uploadedUrls]

      if (!imageUrls.length) {
        throw new Error("Carica almeno un'immagine per il prodotto.")
      }

      const payload = {
        ...buildProductPayloadFromFormState(productForm),
        imageUrls,
      }

      let savedProduct: ShopProduct

      if (editingProductId) {
        savedProduct = await apiFetch<ShopProduct>(`/admin/products/${editingProductId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        })
        if (savedProduct.status !== payload.status) {
          throw new Error("Lo stato del prodotto non è stato aggiornato correttamente.")
        }
        setMessage("Prodotto aggiornato correttamente.")
      } else {
        savedProduct = await apiFetch<ShopProduct>("/admin/products", {
          method: "POST",
          body: JSON.stringify(payload),
        })
        setMessage("Prodotto creato correttamente.")
      }

      setProducts((current) => current.map((product) => (product.id === savedProduct.id ? savedProduct : product)))

      resetProductForm()
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante il salvataggio del prodotto.")
    }
  }

  async function toggleHomepageReview(reviewId: string, nextValue: boolean) {
    clearFeedback()

    const selectedCount = reviews.filter((review) => review.showOnHomepage).length
    if (nextValue && selectedCount >= 10) {
      setError("Puoi mostrare in homepage al massimo 10 recensioni.")
      return
    }

    try {
      await apiFetch(`/admin/reviews/${reviewId}`, {
        method: "PATCH",
        body: JSON.stringify({ showOnHomepage: nextValue }),
      })
      await refresh()
      setMessage(nextValue ? "Recensione aggiunta al loop homepage." : "Recensione rimossa dal loop homepage.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante l'aggiornamento della recensione.")
    }
  }

  async function createCategory(event: FormEvent) {
    event.preventDefault()
    clearFeedback()
    try {
      const next = await apiFetch<string[]>("/admin/categories", {
        method: "POST",
        body: JSON.stringify({ name: newCategoryName }),
      })
      setCategories(next)
      setNewCategoryName("")
      setMessage("Categoria creata correttamente.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante la creazione della categoria.")
    }
  }

  async function renameCategory(category: string) {
    clearFeedback()
    try {
      const next = await apiFetch<string[]>(`/admin/categories/${encodeURIComponent(category)}`, {
        method: "PUT",
        body: JSON.stringify({ name: renamedCategoryValue }),
      })
      setCategories(next)
      setRenamingCategory(null)
      setRenamedCategoryValue("")
      if (productForm.category === category) {
        setProductForm((current) => ({ ...current, category: renamedCategoryValue }))
      }
      await refresh()
      setMessage("Categoria rinominata correttamente.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante la modifica della categoria.")
    }
  }

  async function deleteCategory(category: string) {
    clearFeedback()
    try {
      const next = await apiFetch<string[]>(`/admin/categories/${encodeURIComponent(category)}`, {
        method: "DELETE",
      })
      setCategories(next)
      if (productForm.category === category) {
        setProductForm((current) => ({ ...current, category: "" }))
      }
      setMessage("Categoria eliminata correttamente.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante l'eliminazione della categoria.")
    }
  }

  function startEditCollection(collection: AdminCollection) {
    clearFeedback()
    setEditingCollectionId(collection.id)
    setCollectionForm({
      title: collection.title,
      slug: collection.slug,
      description: collection.description || "",
      active: collection.active,
    })
  }

  function resetCollectionForm() {
    setEditingCollectionId(null)
    setCollectionForm(emptyCollectionForm())
  }

  async function saveCollection(event: FormEvent) {
    event.preventDefault()
    clearFeedback()
    try {
      const payload = {
        title: collectionForm.title,
        slug: collectionForm.slug || undefined,
        description: collectionForm.description || null,
        active: collectionForm.active,
      }

      if (editingCollectionId) {
        await apiFetch(`/admin/collections/${editingCollectionId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        })
        setMessage("Collezione aggiornata correttamente.")
      } else {
        await apiFetch("/admin/collections", {
          method: "POST",
          body: JSON.stringify(payload),
        })
        setMessage("Collezione creata correttamente.")
      }

      resetCollectionForm()
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante il salvataggio della collezione.")
    }
  }

  async function deleteCollection(collectionId: number) {
    clearFeedback()
    try {
      await apiFetch(`/admin/collections/${collectionId}`, {
        method: "DELETE",
      })
      if (collectionForm && editingCollectionId === collectionId) {
        resetCollectionForm()
      }
      await refresh()
      setMessage("Collezione eliminata correttamente.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante l'eliminazione della collezione.")
    }
  }

  async function duplicateProduct(product: ShopProduct) {
    clearFeedback()
    try {
      const duplicated = await apiFetch<ShopProduct>(`/admin/products/${product.id}/duplicate`, {
        method: "POST",
      })
      await refresh()
      startEditProduct(duplicated)
      setMessage("Prodotto duplicato correttamente. La copia si apre in bozza pronta per la modifica.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante la duplicazione del prodotto.")
    }
  }

  async function toggleProductHomeVisibility(product: ShopProduct, nextValue: boolean) {
    clearFeedback()
    try {
      setUpdatingHomeProductId(product.id)
      const updated = await apiFetch<ShopProduct>(`/admin/products/${product.id}/home-visibility`, {
        method: "PATCH",
        body: JSON.stringify({ featured: nextValue }),
      })

      setProducts((current) => current.map((entry) => (entry.id === updated.id ? updated : entry)))
      setAllProductsForTrending((current) => current.map((entry) => (entry.id === updated.id ? updated : entry)))
      setMessage(nextValue ? "Prodotto incluso nei poster home." : "Prodotto rimosso dai poster home.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante l'aggiornamento della visibilità home.")
    } finally {
      setUpdatingHomeProductId(null)
    }
  }

  function startEditCoupon(coupon: Coupon) {
    clearFeedback()
    setEditingCouponId(coupon.id)
    setCouponForm({
      code: coupon.code,
      type: coupon.type,
      amount: coupon.type === "percentage" || coupon.type === "first_registration" ? String(coupon.amount) : formatEuroInput(coupon.amount),
      expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : "",
      usageLimit: coupon.usageLimit ? String(coupon.usageLimit) : "",
      active: coupon.active,
    })
  }

  async function saveCoupon(event: FormEvent) {
    event.preventDefault()
    clearFeedback()
    try {
      const payload = {
        code: couponForm.code,
        type: couponForm.type,
        amount: couponForm.type === "percentage" || couponForm.type === "first_registration" ? Number(couponForm.amount) : parseEuroToCents(couponForm.amount),
        expiresAt: couponForm.expiresAt || null,
        usageLimit: couponForm.usageLimit ? Number(couponForm.usageLimit) : null,
        active: couponForm.active,
      }

      if (editingCouponId) {
        await apiFetch(`/admin/coupons/${editingCouponId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        })
        setMessage("Coupon aggiornato correttamente.")
      } else {
        await apiFetch("/admin/coupons", {
          method: "POST",
          body: JSON.stringify(payload),
        })
        setMessage("Coupon creato correttamente.")
      }

      setCouponForm(emptyCouponForm())
      setEditingCouponId(null)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante il salvataggio del coupon.")
    }
  }

  function startEditRule(rule: DiscountRule) {
    clearFeedback()
    setEditingRuleId(rule.id)
    setRuleForm({
      name: rule.name,
      description: rule.description || "",
      ruleType: rule.ruleType,
      threshold: rule.ruleType === "subtotal_fixed" ? formatEuroInput(rule.threshold) : String(rule.threshold),
      discountType: rule.discountType,
      amount: rule.discountType === "fixed" ? formatEuroInput(rule.amount) : String(rule.amount),
      priority: rule.priority,
      startsAt: toDatetimeLocal(rule.startsAt),
      endsAt: toDatetimeLocal(rule.endsAt),
      active: rule.active,
    })
  }

  async function saveRule(event: FormEvent) {
    event.preventDefault()
    clearFeedback()
    try {
      const payload = {
        name: ruleForm.name,
        description: ruleForm.description || null,
        ruleType: ruleForm.ruleType,
        threshold: ruleForm.ruleType === "subtotal_fixed" ? parseEuroToCents(ruleForm.threshold) : Number(ruleForm.threshold),
        discountType: ruleForm.discountType,
        amount:
          ruleForm.discountType === "fixed"
            ? parseEuroToCents(ruleForm.amount)
            : ruleForm.discountType === "shipping"
              ? 0
              : Number(ruleForm.amount),
        priority: Number(ruleForm.priority),
        startsAt: ruleForm.startsAt || null,
        endsAt: ruleForm.endsAt || null,
        active: ruleForm.active,
      }

      if (editingRuleId) {
        await apiFetch(`/admin/discount-rules/${editingRuleId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        })
        setMessage("Regola sconto aggiornata correttamente.")
      } else {
        await apiFetch("/admin/discount-rules", {
          method: "POST",
          body: JSON.stringify(payload),
        })
        setMessage("Regola sconto creata correttamente.")
      }

      setRuleForm(emptyRuleForm())
      setEditingRuleId(null)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante il salvataggio della regola sconto.")
    }
  }

  async function saveSettings(event: FormEvent) {
    event.preventDefault()
    clearFeedback()
    try {
      const allowedSettings = ["storeName", "currencyCode", "shippingCost", "paypalMeLink", "paypalBusinessEmail", "contactEmail"]
      const payload = settings
        .filter((entry) => allowedSettings.includes(entry.key))
        .map((entry) => ({
          key: entry.key,
          value: entry.key === "shippingCost" ? String(parseEuroToCents(shippingCostInput)) : entry.value,
        }))

      const data = await apiFetch<SettingEntry[]>("/admin/settings", {
        method: "PUT",
        body: JSON.stringify(payload),
      })

      setSettings(data)
      setMessage("Impostazioni PayPal salvate correttamente.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante il salvataggio delle impostazioni PayPal.")
    }
  }

  function settingValue(key: string, fallback = "") {
    return settings.find((entry) => entry.key === key)?.value ?? fallback
  }

  function updateSetting(key: string, value: string) {
    setSettings((current) => {
      const existing = current.find((entry) => entry.key === key)
      if (existing) {
        return current.map((entry) => (entry.key === key ? { ...entry, value } : entry))
      }

      return [...current, { key, value }]
    })
  }

  async function openOrderProfit(orderId: number) {
    clearFeedback()
    try {
      setLoadingProfitOrderId(orderId)
      setShowOrderProfitBreakdown(false)
      const data = await apiFetch<OrderProfitSummary>(`/admin/orders/${orderId}/profit`)
      setOrderProfit(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante il calcolo del guadagno.")
    } finally {
      setLoadingProfitOrderId(null)
    }
  }

  async function deleteReview(reviewId: string) {
    clearFeedback()
    try {
      await apiFetch(`/admin/reviews/${reviewId}`, { method: "DELETE" })
      const archivedReview = reviews.find((review) => review.id === reviewId)
      setReviews((current) => current.filter((review) => review.id !== reviewId))
      if (archivedReview) {
        setArchivedReviews((current) => [archivedReview, ...current])
      }
      setMessage("Recensione archiviata.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante l'eliminazione della recensione.")
      throw err
    }
  }

  async function deleteOrder(orderId: number) {
    clearFeedback()
    try {
      await apiFetch(`/admin/orders/${orderId}`, { method: "DELETE" })
      const archivedOrder = orders.find((order) => order.id === orderId)
      setOrders((current) => current.filter((order) => order.id !== orderId))
      if (archivedOrder) {
        setArchivedOrders((current) => [archivedOrder, ...current])
      }
      setMessage("Ordine archiviato.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante l'eliminazione dell'ordine.")
      throw err
    }
  }

  async function saveHomepageContent(overrides?: {
    showcases?: HomepageShowcase[]
    popularCategories?: HomepagePopularCategory[]
  }) {
    clearFeedback()
    try {
      const nextPopularCategories = overrides?.popularCategories ?? homepagePopularCategories
      const nextShowcases = overrides?.showcases ?? homepageShowcases
      const data = await apiFetch<SettingEntry[]>("/admin/settings", {
        method: "PUT",
        body: JSON.stringify([
          { key: "homepagePopularCategories", value: JSON.stringify(nextPopularCategories) },
          { key: "homepageShowcases", value: JSON.stringify(nextShowcases) },
        ]),
      })
      setSettings(data)
      setHomepageFocus((current) => ({ ...current, item: null }))
      setMessage("Contenuti homepage aggiornati correttamente.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante il salvataggio dei contenuti homepage.")
    }
  }

  async function saveTrendingProducts() {
    clearFeedback()
    try {
      const data = await apiFetch<SettingEntry[]>("/admin/settings", {
        method: "PUT",
        body: JSON.stringify([{ key: "homepageTrendingProductIds", value: JSON.stringify(trendingProductIds) }]),
      })
      setSettings(data)
      setMessage("Poster di tendenza aggiornati correttamente.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante il salvataggio della sezione Tendenza.")
    }
  }

  async function saveTopBanner() {
    clearFeedback()
    try {
      const data = await apiFetch<SettingEntry[]>("/admin/settings", {
        method: "PUT",
        body: JSON.stringify([
          { key: "bannerTopEnabled", value: String(topBanner.enabled) },
          { key: "bannerTopTitle", value: topBanner.title },
          { key: "bannerTopSubtitle", value: topBanner.subtitle },
          { key: "bannerTopBackgroundColor", value: topBanner.backgroundColor },
          { key: "bannerTopTextColor", value: topBanner.textColor },
          { key: "bannerTopCountdownEnabled", value: String(topBanner.countdownEnabled) },
          { key: "bannerTopCountdownTarget", value: topBanner.countdownTarget || "" },
        ]),
      })
      setSettings(data)
      window.dispatchEvent(new Event("bns:settings-updated"))
      setMessage("Banner top aggiornato correttamente.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante il salvataggio del banner top.")
    }
  }

  async function saveMidBanner() {
    clearFeedback()
    try {
      const data = await apiFetch<SettingEntry[]>("/admin/settings", {
        method: "PUT",
        body: JSON.stringify([
          { key: "bannerMidEnabled", value: String(midBanner.enabled) },
          { key: "bannerMidBackgroundColor", value: midBanner.backgroundColor },
          { key: "bannerMidTextColor", value: midBanner.textColor },
          { key: "bannerMidText", value: midBanner.text },
          { key: "bannerMidMessages", value: JSON.stringify(midBanner.messages.filter((entry) => entry.trim())) },
        ]),
      })
      setSettings(data)
      window.dispatchEvent(new Event("bns:settings-updated"))
      setMessage("Banner mid aggiornato correttamente.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante il salvataggio del banner mid.")
    }
  }

  return (
    <ShopLayout
      eyebrow="Admin"
      title="Gestione shop"
      intro="Prodotti, categorie, ordini, coupon, recensioni e regole sconto vengono gestiti direttamente nello shop integrato, con una lettura più ampia e coerente con il layout principale del sito."
    >
      {runtimeStatus && !runtimeStatus.storage.storageGuaranteed ? (
        <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-50">
          <div className="font-medium">Storage runtime non garantito in questo ambiente.</div>
          <div className="mt-1 text-amber-100/80">
            Database: {runtimeStatus.storage.databasePath || runtimeStatus.storage.databaseUrl}
          </div>
          <div className="text-amber-100/80">Upload: {runtimeStatus.storage.uploadsRootDir}</div>
          <div className="text-amber-100/80">Asset storage mode: {runtimeStatus.storage.assetStorageMode}</div>
          {runtimeStatus.warnings.length ? (
            <div className="mt-2 text-amber-100/80">
              {runtimeStatus.warnings[0]}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {[
          ["prodotti", "Prodotti"],
          ["homepage", "Homepage"],
          ["banner", "Banner"],
          ["tendenza", "Tendenza"],
          ["recensioni", "Recensioni"],
          ["ordini", "Ordini"],
          ["archivio", "Archivio"],
          ["utenti", "Utenti"],
          ["data", "Data"],
          ["sconti", "Sconti e coupon"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key as "prodotti" | "homepage" | "banner" | "tendenza" | "recensioni" | "ordini" | "archivio" | "utenti" | "data" | "sconti")}
            className={getButtonClassName({ variant: tab === key ? "cart" : "profile", size: "sm" })}
          >
            {label}
          </button>
        ))}
      </div>

      {message ? <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">{message}</div> : null}
      {error ? <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">{error}</div> : null}

      {tab === "prodotti" ? (
        <AdminProductsSection
          editingProductId={editingProductId}
          selectedProductIds={selectedProductIds}
          isMultiEdit={isMultiEdit}
          hasTouchedFields={hasTouchedFields}
          productForm={productForm}
          categories={categories}
          collections={collections}
          productImages={productImages}
          productSearch={productSearch}
          productCategoryFilter={productCategoryFilter}
          productStatusFilter={productStatusFilter}
          products={products}
          updatingHomeProductId={updatingHomeProductId}
          newCategoryName={newCategoryName}
          renamingCategory={renamingCategory}
          renamedCategoryValue={renamedCategoryValue}
          collectionForm={collectionForm}
          editingCollectionId={editingCollectionId}
          onSubmitProduct={saveProduct}
          onCancelProduct={resetProductForm}
          onChangeProductForm={handleProductFormChange}
          onProductFileChange={handleProductFileChange}
          onReorderProductImages={reorderProductImages}
          onRemoveProductImage={removeProductImage}
          onProductSearchChange={setProductSearch}
          onProductCategoryFilterChange={setProductCategoryFilter}
          onProductStatusFilterChange={setProductStatusFilter}
          onToggleSelected={(productId, checked) =>
            setSelectedProductIds((current) =>
              checked ? Array.from(new Set([...current, productId])) : current.filter((id) => id !== productId),
            )
          }
          onToggleHomeVisibility={toggleProductHomeVisibility}
          onEditProduct={(product) => {
            setSelectedProductIds([product.id])
            startEditProduct(product)
          }}
          onDuplicateProduct={duplicateProduct}
          onDeleteProduct={async (product) => {
            clearFeedback()
            try {
              await apiFetch(`/admin/products/${product.id}`, { method: "DELETE" })
              await refresh()
              setMessage("Prodotto eliminato correttamente.")
            } catch (err) {
              setError(err instanceof Error ? err.message : "Errore durante l'eliminazione del prodotto.")
            }
          }}
          onStartRenameCategory={(category) => {
            setRenamingCategory(category)
            setRenamedCategoryValue(category)
          }}
          onRenamedCategoryValueChange={setRenamedCategoryValue}
          onRenameCategory={renameCategory}
          onDeleteCategory={deleteCategory}
          onNewCategoryNameChange={setNewCategoryName}
          onCreateCategory={createCategory}
          onCollectionFormChange={setCollectionForm}
          onSaveCollection={saveCollection}
          onResetCollectionForm={resetCollectionForm}
          onStartEditCollection={startEditCollection}
          onDeleteCollection={deleteCollection}
        />
      ) : null}

      {tab === "homepage" ? (
        <AdminHomepageSection
          homepageShowcases={homepageShowcases}
          homepagePopularCategories={homepagePopularCategories}
          categories={categories}
          collections={collections}
          homepageFocus={homepageFocus}
          setHomepageFocus={setHomepageFocus}
          setHomepageShowcases={setHomepageShowcases}
          setHomepagePopularCategories={setHomepagePopularCategories}
          saveHomepageContent={saveHomepageContent}
          onUploadShowcaseImage={async (index, files) => {
            const file = files?.[0]
            if (!file) return
            clearFeedback()
            try {
              const imageUrl = await uploadHomepageImage(file)
              if (!imageUrl) throw new Error("Upload immagine non riuscito.")
              setHomepageShowcases((current) =>
                current.map((entry, itemIndex) => (itemIndex === index ? { ...entry, imageUrl } : entry)),
              )
              setMessage("Immagine selezione caricata correttamente.")
            } catch (err) {
              setError(err instanceof Error ? err.message : "Errore durante l'upload dell'immagine selezione.")
            }
          }}
          onUploadPopularCategoryImage={async (index, files) => {
            const file = files?.[0]
            if (!file) return
            clearFeedback()
            try {
              const imageUrl = await uploadHomepageImage(file)
              if (!imageUrl) throw new Error("Upload immagine non riuscito.")
              setHomepagePopularCategories((current) =>
                current.map((entry, itemIndex) => (itemIndex === index ? { ...entry, imageUrl } : entry)),
              )
              setMessage("Immagine categoria caricata correttamente.")
            } catch (err) {
              setError(err instanceof Error ? err.message : "Errore durante l'upload dell'immagine categoria.")
            }
          }}
        />
      ) : null}

      {tab === "banner" ? (
        <AdminBannerSection
          topBanner={topBanner}
          midBanner={midBanner}
          onTopBannerChange={setTopBanner}
          onMidBannerChange={setMidBanner}
          onSaveTopBanner={saveTopBanner}
          onSaveMidBanner={saveMidBanner}
        />
      ) : null}

      {tab === "tendenza" ? (
        <AdminTrendingSection
          products={allProductsForTrending}
          trendingProductIds={trendingProductIds}
          setTrendingProductIds={setTrendingProductIds}
          onSave={saveTrendingProducts}
        />
      ) : null}

      {tab === "recensioni" ? <AdminReviewsSection reviews={reviews} onToggleHomepageReview={toggleHomepageReview} onDeleteReview={deleteReview} /> : null}

      {tab === "ordini" ? (
        <AdminOrdersSection
          orders={orders}
          shopSettings={shopSettings}
          packlinkProNewShipmentUrl={runtimeStatus?.shippingManual?.packlinkProNewShipmentUrl || "https://pro.packlink.it/app/shipments/new"}
          defaultParcel={runtimeStatus?.shippingManual?.defaultParcel || { weightKg: 1, lengthCm: 30, widthCm: 20, heightCm: 5 }}
          loadingProfitOrderId={loadingProfitOrderId}
          containWheel={containWheel}
          onOpenOrderProfit={openOrderProfit}
          onCreateShipment={async (orderId) => {
            clearFeedback()
            try {
              const targetUrl = runtimeStatus?.shippingManual?.packlinkProNewShipmentUrl || "https://pro.packlink.it/app/shipments/new"
              window.open(targetUrl, "_blank", "noopener,noreferrer")
              setMessage("Packlink Pro aperto in una nuova scheda.")
              return orders.find((entry) => entry.id === orderId) || null
            } catch (err) {
              setError(err instanceof Error ? err.message : "Impossibile aprire Packlink Pro.")
              return null
            }
          }}
          onRefreshTracking={async (orderId) => {
            clearFeedback()
            try {
              setMessage("Aggiorna tracking, link spedizione ed etichetta manualmente nei campi qui sotto, poi salva l'ordine.")
              return orders.find((entry) => entry.id === orderId) || null
            } catch (err) {
              setError(err instanceof Error ? err.message : "Aggiornamento tracking manuale non disponibile.")
              return null
            }
          }}
          onUpdateOrderStatus={async (orderId, payload) => {
            clearFeedback()
            try {
              const updatedOrder = await apiFetch<ShopOrder>(`/admin/orders/${orderId}`, {
                method: "PATCH",
                body: JSON.stringify(payload),
              })
              mergeUpdatedOrder(updatedOrder)
              setMessage("Ordine aggiornato.")
              return updatedOrder
            } catch (err) {
              setError(err instanceof Error ? err.message : "Errore durante l'aggiornamento dell'ordine.")
              return null
            }
          }}
          onDeleteOrder={deleteOrder}
        />
      ) : null}

      {tab === "archivio" ? (
        <section className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-2">
            <article className="shop-card space-y-4 p-6">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-white">Recensioni eliminate</h2>
                  <p className="mt-1 text-sm text-white/55">Recensioni archiviate, rimosse dalla homepage pubblica e dalla sezione attiva.</p>
                </div>
                <span className="whitespace-nowrap rounded-full border border-white/10 px-3 py-1 text-xs text-white/60">{archivedReviews.length} archiviate</span>
              </div>
              <div className="space-y-3">
                {archivedReviews.map((review) => (
                  <div key={review.id} className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="text-base font-medium text-white">{review.authorName}</p>
                          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60">{review.rating}/5</span>
                          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60">{new Date(review.createdAt).toLocaleDateString("it-IT")}</span>
                        </div>
                        <h3 className="mt-3 text-lg font-semibold text-white">{review.title}</h3>
                        <p className="mt-2 text-sm leading-7 text-white/68">{review.body}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 md:justify-end">
                        <button
                          type="button"
                          onClick={async () => {
                            clearFeedback()
                            try {
                              const restored = await apiFetch<AdminReview>(`/admin/archive/reviews/${review.id}/restore`, { method: "POST" })
                              setArchivedReviews((current) => current.filter((entry) => entry.id !== review.id))
                              setReviews((current) => [restored, ...current])
                              setMessage("Recensione ripristinata.")
                            } catch (err) {
                              setError(err instanceof Error ? err.message : "Errore durante il ripristino della recensione.")
                            }
                          }}
                          className={getButtonClassName({ variant: "cart", size: "sm" })}
                        >
                          Ripristina
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingArchiveDelete({ type: "review", id: review.id })}
                          className={getDangerButtonClassName({ size: "sm" })}
                        >
                          Elimina
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {!archivedReviews.length ? <div className="rounded-[22px] border border-dashed border-white/10 px-4 py-10 text-center text-sm text-white/50">Nessuna recensione archiviata.</div> : null}
              </div>
            </article>

            <article className="shop-card space-y-4 p-6">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-white">Ordini eliminati</h2>
                  <p className="mt-1 text-sm text-white/55">Gli ordini archiviati spariscono dalla lista attiva ma possono essere ripristinati.</p>
                </div>
                <span className="whitespace-nowrap rounded-full border border-white/10 px-3 py-1 text-xs text-white/60">{archivedOrders.length} archiviati</span>
              </div>
              <div className="space-y-3">
                {archivedOrders.map((order) => (
                  <div key={order.id} className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-base font-medium text-white">{order.orderReference}</p>
                        <p className="mt-1 text-sm text-white/60">{order.firstName} {order.lastName} · {formatPrice(order.total)}</p>
                        <p className="mt-1 text-sm text-white/45">{new Date(order.createdAt).toLocaleString("it-IT")}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 md:justify-end">
                        <button
                          type="button"
                          onClick={async () => {
                            clearFeedback()
                            try {
                              const restored = await apiFetch<ShopOrder>(`/admin/archive/orders/${order.id}/restore`, { method: "POST" })
                              setArchivedOrders((current) => current.filter((entry) => entry.id !== order.id))
                              setOrders((current) => [restored, ...current])
                              setMessage("Ordine ripristinato.")
                            } catch (err) {
                              setError(err instanceof Error ? err.message : "Errore durante il ripristino dell'ordine.")
                            }
                          }}
                          className={getButtonClassName({ variant: "cart", size: "sm" })}
                        >
                          Ripristina
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingArchiveDelete({ type: "order", id: order.id })}
                          className={getDangerButtonClassName({ size: "sm" })}
                        >
                          Elimina
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {!archivedOrders.length ? <div className="rounded-[22px] border border-dashed border-white/10 px-4 py-10 text-center text-sm text-white/50">Nessun ordine archiviato.</div> : null}
              </div>
            </article>
          </div>
        </section>
      ) : null}

      {tab === "utenti" ? (
        <AdminUsersSection
          users={users}
          usersTotal={usersTotal}
          containWheel={containWheel}
          onToggleRole={updateUserRole}
          roleUpdateLoadingId={roleUpdateLoadingId}
        />
      ) : null}

      {tab === "data" ? <AdminAnalyticsSection analytics={analytics} /> : null}

      <ConfirmActionModal
        open={Boolean(pendingArchiveDelete)}
        title="Elimina definitivamente"
        description="Sei sicuro di voler eliminare definitivamente questo elemento? Questa azione è irreversibile."
        onCancel={() => setPendingArchiveDelete(null)}
        onConfirm={async () => {
          if (!pendingArchiveDelete) return
          clearFeedback()
          try {
            if (pendingArchiveDelete.type === "review") {
              await apiFetch(`/admin/archive/reviews/${pendingArchiveDelete.id}`, { method: "DELETE" })
              setArchivedReviews((current) => current.filter((entry) => entry.id !== pendingArchiveDelete.id))
              setMessage("Recensione eliminata definitivamente.")
            } else {
              await apiFetch(`/admin/archive/orders/${pendingArchiveDelete.id}`, { method: "DELETE" })
              setArchivedOrders((current) => current.filter((entry) => entry.id !== pendingArchiveDelete.id))
              setMessage("Ordine eliminato definitivamente.")
            }
            setPendingArchiveDelete(null)
          } catch (err) {
            setError(
              err instanceof Error
                ? err.message
                : pendingArchiveDelete.type === "review"
                  ? "Errore durante l'eliminazione definitiva della recensione."
                  : "Errore durante l'eliminazione definitiva dell'ordine.",
            )
          }
        }}
      />

      {tab === "sconti" ? (
        <AdminDiscountsSection
          editingCouponId={editingCouponId}
          couponForm={couponForm}
          coupons={coupons}
          editingRuleId={editingRuleId}
          ruleForm={ruleForm}
          rules={rules}
          shippingCostInput={shippingCostInput}
          onSaveCoupon={saveCoupon}
          onCancelCouponEdit={() => {
            setEditingCouponId(null)
            setCouponForm(emptyCouponForm())
          }}
          onCouponFormChange={setCouponForm}
          onEditCoupon={startEditCoupon}
          onDeleteCoupon={async (couponId) => {
            clearFeedback()
            try {
              await apiFetch(`/admin/coupons/${couponId}`, { method: "DELETE" })
              await refresh()
              setMessage("Coupon eliminato correttamente.")
            } catch (err) {
              setError(err instanceof Error ? err.message : "Errore durante l'eliminazione del coupon.")
            }
          }}
          onSaveRule={saveRule}
          onCancelRuleEdit={() => {
            setEditingRuleId(null)
            setRuleForm(emptyRuleForm())
          }}
          onRuleFormChange={setRuleForm}
          onEditRule={startEditRule}
          onDeleteRule={async (ruleId) => {
            clearFeedback()
            try {
              await apiFetch(`/admin/discount-rules/${ruleId}`, { method: "DELETE" })
              await refresh()
              setMessage("Regola sconto eliminata correttamente.")
            } catch (err) {
              setError(err instanceof Error ? err.message : "Errore durante l'eliminazione della regola.")
            }
          }}
          onSaveSettings={saveSettings}
          settingValue={settingValue}
          updateSetting={updateSetting}
          onShippingCostInputChange={setShippingCostInput}
          getCouponAmountLabel={getCouponAmountLabel}
          getRuleThresholdLabel={getRuleThresholdLabel}
          getRuleAmountLabel={getRuleAmountLabel}
        />
      ) : null}

      {!orders.length && tab === "ordini" ? (
        <div className="rounded-[24px] border border-dashed border-white/10 px-6 py-14 text-center text-white/60">
          Nessun ordine disponibile al momento.
        </div>
      ) : null}

      {orderProfit ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 px-4 py-8">
          <div className="w-full max-w-4xl rounded-[28px] border border-white/10 bg-[#0b0b0c] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/45">Guadagno ordine</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">{orderProfit.orderReference}</h2>
                <p className="mt-2 text-sm text-white/55">{new Date(orderProfit.createdAt).toLocaleString("it-IT")}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOrderProfit(null)
                  setShowOrderProfitBreakdown(false)
                }}
                className={getButtonClassName({ variant: "profile", size: "sm" })}
              >
                Chiudi
              </button>
            </div>

            {!showOrderProfitBreakdown ? (
              <>
                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4">
                    <p className="text-sm text-white/55">Incassato ordine</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{formatPrice(orderProfit.grossTotal)}</p>
                  </div>
                  <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-sm text-white/55">Spese prodotti</p>
                      <button
                        type="button"
                        onClick={() => setShowOrderProfitBreakdown(true)}
                        className={getButtonClassName({ variant: "profile", size: "sm" })}
                      >
                        Vedi dettaglio
                      </button>
                    </div>
                    <p className="mt-2 text-2xl font-semibold text-white">{formatPrice(orderProfit.productCostsTotal)}</p>
                  </div>
                  <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4">
                    <p className="text-sm text-white/55">Spese spedizione</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{formatPrice(orderProfit.shippingOperationalCost)}</p>
                  </div>
                  <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4">
                    <p className="text-sm text-white/55">Spese totali ordine</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{formatPrice(orderProfit.totalExpenses)}</p>
                  </div>
                  <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4">
                    <p className="text-sm text-white/55">Guadagno netto</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{formatPrice(orderProfit.netTotal)}</p>
                  </div>
                </div>

                <p className="mt-5 text-sm text-white/50">
                  Il netto considera i costi reali prodotto e una sola spedizione operativa per ordine: 6,50 € per Standard, 8,50 € per Premium.
                </p>
              </>
            ) : (
              <div className="mt-6 rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-white/45">Dettaglio spese ordine</p>
                    <p className="mt-2 text-sm text-white/55">Breakdown completo di produzione e spedizione per questo ordine.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowOrderProfitBreakdown(false)}
                    className={getButtonClassName({ variant: "profile", size: "sm" })}
                  >
                    Torna al riepilogo
                  </button>
                </div>
                <div className="mt-5 space-y-3">
                  {orderProfit.items.map((item, index) => (
                    <div key={item.id} className="flex items-center justify-between gap-4 border-b border-white/6 pb-3 text-sm text-white/65 last:border-b-0 last:pb-0">
                      <div>
                        <p className="text-white">Totale spese riga {index + 1} — {item.title}</p>
                        <p className="mt-1 text-white/45">{item.format} · {item.quantity} pz</p>
                      </div>
                      <p className="font-medium text-white">{formatPrice(item.costTotal)}</p>
                    </div>
                  ))}
                  <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-3 text-sm text-white/65">
                    <p>Totale spese spedizione</p>
                    <p className="font-medium text-white">{formatPrice(orderProfit.shippingOperationalCost)}</p>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-sm text-white/65">
                    <p>Totale spese ordine</p>
                    <p className="font-medium text-white">{formatPrice(orderProfit.totalExpenses)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </ShopLayout>
  )
}
