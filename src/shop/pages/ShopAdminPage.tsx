import type { FormEvent, WheelEvent } from "react"
import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"

import { Button } from "../../components/Button"
import { ShopLayout } from "../components/ShopLayout"
import { getButtonClassName } from "../../components/Button"
import { AdminAnalyticsSection } from "../components/admin/AdminAnalyticsSection"
import { AdminDiscountsSection } from "../components/admin/AdminDiscountsSection"
import { AdminHomepageSection } from "../components/admin/AdminHomepageSection"
import { AdminOrdersSection } from "../components/admin/AdminOrdersSection"
import { AdminProductsSection } from "../components/admin/AdminProductsSection"
import { AdminReviewsSection } from "../components/admin/AdminReviewsSection"
import { AdminUsersSection } from "../components/admin/AdminUsersSection"
import { apiFetch } from "../lib/api"
import { formatPrice } from "../lib/format"
import { AdminCollection, ProductManualBadge, ShopOrder, ShopProduct, ShopProductVariant, ShopReview, ShopSettings, ProductStatus } from "../types"

type Coupon = {
  id: number
  code: string
  type: "percentage" | "fixed"
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
  href: string
  query: string
  imageUrl?: string
}

type HomepageShowcase = {
  eyebrow: string
  title: string
  description: string
  href: string
  query: string
  imageUrl?: string
  ctaLabel: string
}

type ProductFormState = {
  title: string
  sku: string
  description: string
  priceA4: string
  priceA3: string
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
  type: "percentage" | "fixed"
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
  warnings: string[]
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
  { title: "Cantanti famosi", description: "Poster dedicati alle icone pop, rap e rock piu amate.", href: "/shop?search=cantanti", query: "cantanti" },
  { title: "Frasi d'amore", description: "Parole da regalare, appendere e trasformare in atmosfera.", href: "/shop?search=amore", query: "amore" },
  { title: "Calciatori famosi", description: "Stampe per chi vuole portare il tifo dentro casa.", href: "/shop?search=calciatori", query: "calciatori" },
  { title: "Film e serie TV", description: "Scene, citazioni e mondi diventati immagini da collezione.", href: "/shop?search=film", query: "film" },
  { title: "Arte iconica", description: "Visioni forti, linee pulite e riferimenti visivi senza tempo.", href: "/shop?search=arte", query: "arte" },
  { title: "Poster personalizzati", description: "Idee su misura da regalare o costruire intorno ai tuoi ricordi.", href: "/shop?search=personalizzati", query: "personalizzati" },
  { title: "Citazioni motivazionali", description: "Messaggi diretti per studio, lavoro e spazi creativi.", href: "/shop?search=motivazionali", query: "motivazionali" },
  { title: "Fotografie artistiche", description: "Scatti editoriali e immagini da lasciare respirare sulla parete.", href: "/shop?search=fotografie", query: "fotografie" },
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
      costPriceCents: parseEuroToCents(variant.costPrice),
    }))

  const fallbackVariants = normalized.length
    ? normalized
    : variants.map((variant, index) => ({
        ...variant,
        title: variant.title.trim() || `Variante ${index + 1}`,
        key: slugifyVariantKey(variant.key || variant.title || `variant-${index + 1}`),
        priceCents: parseEuroToCents(variant.price),
        costPriceCents: parseEuroToCents(variant.costPrice),
      }))

  const defaultVariant = fallbackVariants.find((variant) => variant.isDefault) || fallbackVariants[0]
  const a4Variant = fallbackVariants.find((variant) => variant.title.trim().toUpperCase() === "A4")
  const a3Variant = fallbackVariants.find((variant) => variant.title.trim().toUpperCase() === "A3")

  return {
    variants: variants.map((variant, index) => ({
      id: variant.id,
      title: variant.title.trim() || `Variante ${index + 1}`,
      key: slugifyVariantKey(variant.key || variant.title || `variant-${index + 1}`),
      sku: variant.sku.trim() || null,
      price: parseEuroToCents(variant.price),
      costPrice: parseEuroToCents(variant.costPrice),
      stock: Number(variant.stock || 0),
      lowStockThreshold: Number(variant.lowStockThreshold || 0),
      position: index,
      isDefault: defaultVariant ? (variant.id ? variant.id === defaultVariant.id : slugifyVariantKey(variant.key || variant.title) === defaultVariant.key) : index === 0,
      isActive: variant.isActive !== false,
    })),
    summary: {
      price: Math.min(...fallbackVariants.map((variant) => variant.priceCents)),
      costPrice: defaultVariant?.costPriceCents ?? 0,
      hasA4: Boolean(a4Variant),
      hasA3: Boolean(a3Variant),
      priceA4: a4Variant?.priceCents ?? null,
      priceA3: a3Variant?.priceCents ?? null,
      stock: fallbackVariants.reduce((sum, variant) => sum + Number(variant.stock || 0), 0),
      lowStockThreshold: Number(defaultVariant?.lowStockThreshold || 5),
    },
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

function getCouponAmountLabel(type: CouponFormState["type"]) {
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
  const [orders, setOrders] = useState<ShopOrder[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [usersTotal, setUsersTotal] = useState(0)
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null)
  const [runtimeStatus, setRuntimeStatus] = useState<AdminRuntimeStatus | null>(null)
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [rules, setRules] = useState<DiscountRule[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [settings, setSettings] = useState<SettingEntry[]>([])
  const [shippingCostInput, setShippingCostInput] = useState("9")
  const [tab, setTab] = useState<"prodotti" | "homepage" | "recensioni" | "ordini" | "utenti" | "data" | "sconti">("prodotti")
  const [homepagePopularCategories, setHomepagePopularCategories] = useState<HomepagePopularCategory[]>(defaultHomepagePopularCategories)
  const [homepageShowcases, setHomepageShowcases] = useState<HomepageShowcase[]>(defaultHomepageShowcases)
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
  const [loadingProfitOrderId, setLoadingProfitOrderId] = useState<number | null>(null)

  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const productImages = useMemo(
    () => [...productForm.existingImageUrls, ...productPreviewUrls],
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
    refresh()
  }, [])

  useEffect(() => {
    void refreshProducts()
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
    if (nextTab === "homepage") {
      setTab("homepage")
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
  }, [tab])

  useEffect(() => {
    setShippingCostInput(formatEuroInput(Number(settingValue("shippingCost", "900"))))
  }, [settings])

  useEffect(() => {
    setHomepagePopularCategories(parseHomepageSetting(settingValue("homepagePopularCategories"), defaultHomepagePopularCategories))
    setHomepageShowcases(parseHomepageSetting(settingValue("homepageShowcases"), defaultHomepageShowcases))
  }, [settings])

  async function refreshProducts() {
    const params = new URLSearchParams()
    if (productSearch.trim()) params.set("search", productSearch.trim())
    if (productCategoryFilter) params.set("category", productCategoryFilter)
    if (productStatusFilter !== "all") params.set("status", productStatusFilter)

    const productData = await apiFetch<ShopProduct[]>(`/admin/products?${params.toString()}`)
    setProducts(productData)
  }

  async function refresh() {
    const [, reviewData, orderData, usersData, analyticsData, couponData, ruleData, categoryData, settingsData, runtimeData, collectionsData] = await Promise.all([
      refreshProducts(),
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
    ])

    setReviews(reviewData)
    setOrders(orderData)
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
    setProductForm({
      title: product.title,
      sku: product.sku || "",
      description: product.description,
      priceA4: formatEuroInput(product.priceA4 ?? product.price),
      priceA3: product.priceA3 ? formatEuroInput(product.priceA3) : "",
      costPrice: product.costPrice ? formatEuroInput(product.costPrice) : "",
      hasA4: product.hasA4 !== false,
      hasA3: Boolean(product.hasA3),
      category: product.category,
      tags: product.tags?.map((tag) => tag.name).join(", ") || "",
      collectionIds: product.collections?.map((collection) => collection.id) || [],
      manualBadges: product.manualBadges || [],
      featured: product.featured,
      stock: product.stock,
      lowStockThreshold: product.lowStockThreshold || 5,
      status: product.status,
      existingImageUrls: product.imageUrls,
      variants: (product.variants?.length
        ? product.variants
        : [
            {
              id: null,
              title: product.hasA4 !== false ? "A4" : product.hasA3 ? "A3" : "Standard",
              key: product.hasA4 !== false ? "a4" : product.hasA3 ? "a3" : "standard",
              sku: product.sku || null,
              price: product.hasA4 !== false ? (product.priceA4 ?? product.price) : (product.priceA3 ?? product.price),
              costPrice: getSuggestedVariantCostCents(product.hasA4 !== false ? "A4" : product.hasA3 ? "A3" : "Standard"),
              stock: product.stock,
              lowStockThreshold: product.lowStockThreshold || 5,
              position: 0,
              isDefault: true,
              isActive: true,
            },
            ...(product.hasA3
              ? [
                  {
                    id: null,
                    title: "A3",
                    key: "a3",
                    sku: null,
                    price: product.priceA3 ?? product.price,
                    costPrice: getSuggestedVariantCostCents("A3"),
                    stock: product.stock,
                    lowStockThreshold: product.lowStockThreshold || 5,
                    position: 1,
                    isDefault: product.hasA4 === false,
                    isActive: true,
                  },
                ]
              : []),
          ]
      ).map(mapProductVariantToForm),
    })
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

      const variantSummary = buildLegacyVariantSummary(productForm.variants)

      const payload = {
        title: productForm.title,
        sku: productForm.sku || null,
        description: productForm.description,
        price: variantSummary.summary.price,
        costPrice: variantSummary.summary.costPrice,
        hasA4: variantSummary.summary.hasA4,
        hasA3: variantSummary.summary.hasA3,
        priceA4: variantSummary.summary.priceA4,
        priceA3: variantSummary.summary.priceA3,
        category: productForm.category,
        tags: productForm.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
        collectionIds: productForm.collectionIds,
        manualBadges: productForm.manualBadges,
        featured: productForm.featured,
        stock: variantSummary.summary.stock,
        lowStockThreshold: variantSummary.summary.lowStockThreshold,
        status: productForm.status,
        imageUrls,
        variants: variantSummary.variants,
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

  function startEditCoupon(coupon: Coupon) {
    clearFeedback()
    setEditingCouponId(coupon.id)
    setCouponForm({
      code: coupon.code,
      type: coupon.type,
      amount: coupon.type === "percentage" ? String(coupon.amount) : formatEuroInput(coupon.amount),
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
        amount: couponForm.type === "percentage" ? Number(couponForm.amount) : parseEuroToCents(couponForm.amount),
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
      const data = await apiFetch<OrderProfitSummary>(`/admin/orders/${orderId}/profit`)
      setOrderProfit(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante il calcolo del guadagno.")
    } finally {
      setLoadingProfitOrderId(null)
    }
  }

  async function saveHomepageContent() {
    clearFeedback()
    try {
      const data = await apiFetch<SettingEntry[]>("/admin/settings", {
        method: "PUT",
        body: JSON.stringify([
          { key: "homepagePopularCategories", value: JSON.stringify(homepagePopularCategories) },
          { key: "homepageShowcases", value: JSON.stringify(homepageShowcases) },
        ]),
      })
      setSettings(data)
      setMessage("Contenuti homepage aggiornati correttamente.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante il salvataggio dei contenuti homepage.")
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
          ["recensioni", "Recensioni"],
          ["ordini", "Ordini"],
          ["utenti", "Utenti"],
          ["data", "Data"],
          ["sconti", "Sconti e coupon"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key as "prodotti" | "homepage" | "recensioni" | "ordini" | "utenti" | "data" | "sconti")}
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
          containWheel={containWheel}
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
          homepageFocus={homepageFocus}
          setHomepageFocus={setHomepageFocus}
          setHomepageShowcases={setHomepageShowcases}
          setHomepagePopularCategories={setHomepagePopularCategories}
          saveHomepageContent={saveHomepageContent}
        />
      ) : null}

      {tab === "recensioni" ? <AdminReviewsSection reviews={reviews} onToggleHomepageReview={toggleHomepageReview} /> : null}

      {tab === "ordini" ? (
        <AdminOrdersSection
          orders={orders}
          shopSettings={shopSettings}
          loadingProfitOrderId={loadingProfitOrderId}
          containWheel={containWheel}
          onOpenOrderProfit={openOrderProfit}
          onUpdateOrderStatus={async (orderId, status) => {
            clearFeedback()
            try {
              await apiFetch(`/admin/orders/${orderId}`, {
                method: "PATCH",
                body: JSON.stringify({ status }),
              })
              await refresh()
              setMessage("Stato ordine aggiornato.")
            } catch (err) {
              setError(err instanceof Error ? err.message : "Errore durante l'aggiornamento dell'ordine.")
            }
          }}
        />
      ) : null}

      {tab === "utenti" ? <AdminUsersSection users={users} usersTotal={usersTotal} containWheel={containWheel} /> : null}

      {tab === "data" ? <AdminAnalyticsSection analytics={analytics} /> : null}

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
                onClick={() => setOrderProfit(null)}
                className={getButtonClassName({ variant: "profile", size: "sm" })}
              >
                Chiudi
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4">
                <p className="text-sm text-white/55">Incassato ordine</p>
                <p className="mt-2 text-2xl font-semibold text-white">{formatPrice(orderProfit.grossTotal)}</p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4">
                <p className="text-sm text-white/55">Spese prodotti</p>
                <p className="mt-2 text-2xl font-semibold text-white">{formatPrice(orderProfit.productCostsTotal)}</p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4">
                <p className="text-sm text-white/55">Guadagno netto</p>
                <p className="mt-2 text-2xl font-semibold text-white">{formatPrice(orderProfit.netTotal)}</p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {orderProfit.items.map((item) => (
                <article key={item.id} className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-base font-medium text-white">{item.title}</p>
                      <p className="mt-1 text-sm text-white/55">
                        {item.format} · {item.quantity} pz · ricavo {formatPrice(item.revenueTotal)} · costo {formatPrice(item.costTotal)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-white/55">Netto riga</p>
                      <p className="mt-1 text-base font-semibold text-white">{formatPrice(item.netTotal)}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {!orderProfit.shippingCostsTracked ? (
              <p className="mt-5 text-sm text-white/50">
                I costi di spedizione operativi non sono ancora tracciati separatamente: il netto sottrae i costi reali dei prodotti salvati nell&apos;admin.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </ShopLayout>
  )
}
