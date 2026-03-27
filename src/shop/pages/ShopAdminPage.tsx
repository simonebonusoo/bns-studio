import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"

import { ShopLayout } from "../components/ShopLayout"
import { ProductFiltersBar } from "../components/admin/ProductFiltersBar"
import { ProductFormCard } from "../components/admin/ProductFormCard"
import { ProductListSection } from "../components/admin/ProductListSection"
import { apiFetch } from "../lib/api"
import { formatPrice } from "../lib/format"
import { downloadInvoicePdf } from "../lib/invoice"
import { AdminCollection, ShopOrder, ShopProduct, ShopReview, ShopSettings, ProductStatus } from "../types"

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
  featured: boolean
  stock: number
  lowStockThreshold: number
  status: ProductStatus
  existingImageUrls: string[]
}

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
  featured: false,
  stock: 0,
  lowStockThreshold: 5,
  status: "active",
  existingImageUrls: [],
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

function sortImages(main: string, images: string[]) {
  return [main, ...images.filter((image) => image !== main)]
}

function containWheel(event: React.WheelEvent<HTMLElement>) {
  event.stopPropagation()
}

function formatEuroInput(value: number) {
  return Number.isInteger(value / 100) ? String(value / 100) : (value / 100).toFixed(2)
}

function parseEuroToCents(value: string) {
  const normalized = Number(String(value).replace(",", "."))
  if (!Number.isFinite(normalized) || normalized < 0) return 0
  return Math.round(normalized * 100)
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
  const [productSort, setProductSort] = useState<"title" | "createdAt" | "updatedAt" | "price">("updatedAt")
  const [productSortDirection, setProductSortDirection] = useState<"asc" | "desc">("desc")
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([])
  const [bulkAction, setBulkAction] = useState<"set_status" | "set_category" | "delete" | "add_tags" | "remove_tags">("set_status")
  const [bulkStatus, setBulkStatus] = useState<ProductStatus>("active")
  const [bulkCategory, setBulkCategory] = useState("")
  const [bulkTags, setBulkTags] = useState("")
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
  }, [productCategoryFilter, productSearch, productSort, productSortDirection, productStatusFilter])

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
    setSelectedProductIds([])
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
    params.set("sort", productSort)
    params.set("direction", productSortDirection)

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
    setEditingProductId(null)
    setProductFiles([])
    productPreviewUrls.forEach((url) => URL.revokeObjectURL(url))
    setProductPreviewUrls([])
  }

  function startEditProduct(product: ShopProduct) {
    clearFeedback()
    resetProductForm()
    setEditingProductId(product.id)
    setProductForm({
      title: product.title,
      sku: product.sku || "",
      description: product.description,
      priceA4: formatEuroInput(product.priceA4 ?? product.price),
      priceA3: product.priceA3 ? formatEuroInput(product.priceA3) : "",
      costPrice: "",
      hasA4: product.hasA4 !== false,
      hasA3: Boolean(product.hasA3),
      category: product.category,
      tags: product.tags?.map((tag) => tag.name).join(", ") || "",
      collectionIds: product.collections?.map((collection) => collection.id) || [],
      featured: product.featured,
      stock: product.stock,
      lowStockThreshold: product.lowStockThreshold || 5,
      status: product.status,
      existingImageUrls: product.imageUrls,
    })
  }

  function handleProductFileChange(files: FileList | null) {
    if (!files) return
    const nextFiles = Array.from(files)
    const nextPreviewUrls = nextFiles.map((file) => URL.createObjectURL(file))
    productPreviewUrls.forEach((url) => URL.revokeObjectURL(url))
    setProductFiles(nextFiles)
    setProductPreviewUrls(nextPreviewUrls)
  }

  function removeExistingImage(imageUrl: string) {
    setProductForm((current) => ({
      ...current,
      existingImageUrls: current.existingImageUrls.filter((image) => image !== imageUrl),
    }))
  }

  function moveImageToPrimary(imageUrl: string) {
    if (productForm.existingImageUrls.includes(imageUrl)) {
      setProductForm((current) => ({
        ...current,
        existingImageUrls: sortImages(imageUrl, current.existingImageUrls),
      }))
      return
    }

    const index = productPreviewUrls.indexOf(imageUrl)
    if (index === -1) return
    const nextPreviewUrls = sortImages(imageUrl, productPreviewUrls)
    const nextFiles = sortImages(imageUrl, productPreviewUrls).map((previewUrl) => {
      const fileIndex = productPreviewUrls.indexOf(previewUrl)
      return productFiles[fileIndex]
    })
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

  async function saveProduct(event: React.FormEvent) {
    event.preventDefault()
    clearFeedback()

    try {
      const uploadedUrls = await uploadProductImages()
      const imageUrls = [...productForm.existingImageUrls, ...uploadedUrls]

      if (!imageUrls.length) {
        throw new Error("Carica almeno un'immagine per il prodotto.")
      }

      const payload = {
        title: productForm.title,
        sku: productForm.sku || null,
        description: productForm.description,
        price: parseEuroToCents(productForm.hasA4 ? productForm.priceA4 : productForm.priceA3),
        costPrice: 0,
        hasA4: productForm.hasA4,
        hasA3: productForm.hasA3,
        priceA4: productForm.hasA4 ? parseEuroToCents(productForm.priceA4) : null,
        priceA3: productForm.hasA3 ? parseEuroToCents(productForm.priceA3) : null,
        category: productForm.category,
        tags: productForm.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
        collectionIds: productForm.collectionIds,
        featured: productForm.featured,
        stock: Number(productForm.stock),
        lowStockThreshold: Number(productForm.lowStockThreshold),
        status: productForm.status,
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

      setProducts((current) => {
        const exists = current.some((product) => product.id === savedProduct.id)
        if (!exists) return current
        return current.map((product) => (product.id === savedProduct.id ? savedProduct : product))
      })

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

  async function createCategory(event: React.FormEvent) {
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

  async function saveCollection(event: React.FormEvent) {
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

  async function runBulkAction() {
    clearFeedback()
    if (!selectedProductIds.length) {
      setError("Seleziona almeno un prodotto.")
      return
    }

    if (bulkAction === "delete" && !window.confirm(`Vuoi eliminare ${selectedProductIds.length} prodotti?`)) {
      return
    }

    try {
      await apiFetch("/admin/products/bulk", {
        method: "POST",
        body: JSON.stringify({
          productIds: selectedProductIds,
          action: bulkAction,
          status: bulkAction === "set_status" ? bulkStatus : undefined,
          category: bulkAction === "set_category" ? bulkCategory : undefined,
          tags: bulkAction === "add_tags" || bulkAction === "remove_tags" ? bulkTags.split(",").map((tag) => tag.trim()).filter(Boolean) : undefined,
        }),
      })
      setSelectedProductIds([])
      setBulkTags("")
      await refresh()
      setMessage("Azione bulk completata correttamente.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante l'azione bulk.")
    }
  }

  const bulkActionLabel =
    bulkAction === "set_status"
      ? "Cambio stato"
      : bulkAction === "set_category"
        ? "Cambio categoria"
        : bulkAction === "add_tags"
          ? "Aggiunta tag"
          : bulkAction === "remove_tags"
            ? "Rimozione tag"
            : "Eliminazione multipla"

  const bulkActionValueLabel =
    bulkAction === "set_status"
      ? bulkStatus
      : bulkAction === "set_category"
        ? bulkCategory || "Categoria non selezionata"
        : bulkAction === "add_tags" || bulkAction === "remove_tags"
          ? bulkTags || "Tag non inseriti"
          : "Richiede conferma"

  const bulkActionReady =
    selectedProductIds.length > 0 &&
    (bulkAction === "set_status"
      ? Boolean(bulkStatus)
      : bulkAction === "set_category"
        ? Boolean(bulkCategory)
        : bulkAction === "add_tags" || bulkAction === "remove_tags"
          ? Boolean(bulkTags.trim())
          : true)

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

  async function saveCoupon(event: React.FormEvent) {
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

  async function saveRule(event: React.FormEvent) {
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

  async function saveSettings(event: React.FormEvent) {
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
            className={`rounded-full px-4 py-2 text-sm ${tab === key ? "bg-white text-black" : "border border-white/10 text-white/70"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {message ? <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">{message}</div> : null}
      {error ? <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">{error}</div> : null}

      {tab === "prodotti" ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <ProductFormCard
            editingProductId={editingProductId}
            productForm={productForm}
            categories={categories}
            collections={collections}
            productImages={productImages}
            onSubmit={saveProduct}
            onCancel={resetProductForm}
            onChange={setProductForm}
            onFileChange={handleProductFileChange}
            onMakePrimary={moveImageToPrimary}
            onRemoveExisting={removeExistingImage}
          />

          <div className="flex min-h-0 flex-col gap-4">
            <ProductFiltersBar
              search={productSearch}
              category={productCategoryFilter}
              status={productStatusFilter}
              sort={productSort}
              direction={productSortDirection}
              categories={categories}
              total={products.length}
              onSearchChange={setProductSearch}
              onCategoryChange={setProductCategoryFilter}
              onStatusChange={(value) => setProductStatusFilter(value as "all" | ProductStatus)}
              onSortChange={(value) => setProductSort(value as "title" | "createdAt" | "updatedAt" | "price")}
              onDirectionChange={setProductSortDirection}
            />
            <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-white">Azioni massive</p>
                  <p className="text-xs text-white/55">
                    Seleziona uno o più prodotti dalla lista per applicare una modifica multipla.
                  </p>
                </div>
                <div className="grid gap-3 rounded-2xl border border-white/8 bg-white/[0.02] p-3 md:grid-cols-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Selezionati</p>
                    <p className="mt-1 text-sm text-white">{selectedProductIds.length} prodotti</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Azione</p>
                    <p className="mt-1 text-sm text-white">{bulkActionLabel}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Valore</p>
                    <p className="mt-1 text-sm text-white">{bulkActionValueLabel}</p>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,12rem)_minmax(0,1fr)_auto]">
                  <select className="shop-select min-w-[12rem]" value={bulkAction} onChange={(event) => setBulkAction(event.target.value as typeof bulkAction)}>
                    <option value="set_status">Cambia stato</option>
                    <option value="set_category">Cambia categoria</option>
                    <option value="add_tags">Aggiungi tag</option>
                    <option value="remove_tags">Rimuovi tag</option>
                    <option value="delete">Elimina prodotti</option>
                  </select>
                  {bulkAction === "set_status" ? (
                    <select className="shop-select min-w-[12rem]" value={bulkStatus} onChange={(event) => setBulkStatus(event.target.value as ProductStatus)}>
                      <option value="active">Active</option>
                      <option value="draft">Draft</option>
                      <option value="hidden">Hidden</option>
                      <option value="out_of_stock">Out of stock</option>
                    </select>
                  ) : null}
                  {bulkAction === "set_category" ? (
                    <select className="shop-select min-w-[12rem]" value={bulkCategory} onChange={(event) => setBulkCategory(event.target.value)}>
                      <option value="">Categoria</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  ) : null}
                  {(bulkAction === "add_tags" || bulkAction === "remove_tags") ? (
                    <input
                      className="shop-input min-w-[16rem]"
                      placeholder="Tag separati da virgola"
                      value={bulkTags}
                      onChange={(event) => setBulkTags(event.target.value)}
                    />
                  ) : null}
                  {bulkAction === "delete" ? (
                    <div className="rounded-2xl border border-red-400/15 bg-red-400/8 px-4 py-3 text-sm text-red-100/85">
                      Elimina definitivamente i prodotti selezionati dopo conferma.
                    </div>
                  ) : null}
                  <button
                    type="button"
                    onClick={runBulkAction}
                    disabled={!bulkActionReady}
                    className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    Applica
                  </button>
                </div>
              </div>
            </section>
            <div onWheelCapture={containWheel} className="min-h-0 flex-1">
              <ProductListSection
                products={products}
                selectedIds={selectedProductIds}
                onToggleSelected={(productId, checked) =>
                  setSelectedProductIds((current) =>
                    checked ? Array.from(new Set([...current, productId])) : current.filter((id) => id !== productId),
                  )
                }
                onEdit={startEditProduct}
                onDuplicate={duplicateProduct}
                onDelete={async (product) => {
                  clearFeedback()
                  try {
                    await apiFetch(`/admin/products/${product.id}`, { method: "DELETE" })
                    await refresh()
                    setMessage("Prodotto eliminato correttamente.")
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Errore durante l'eliminazione del prodotto.")
                  }
                }}
              />
            </div>
          </div>

          <section className="shop-card space-y-4 p-6 xl:col-span-2">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="max-w-3xl">
                <h2 className="text-xl font-semibold text-white">Gestione categorie</h2>
                <p className="mt-1 text-sm text-white/55">Organizza le categorie prodotto in un unico pannello largo e compatto.</p>
              </div>
              <form onSubmit={createCategory} className="flex w-full flex-col gap-3 md:w-auto md:min-w-[420px] md:flex-row">
                <input
                  className="h-11 rounded-lg border border-white/12 bg-white/[0.03] px-4 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-white/25"
                  placeholder="Nuova categoria"
                  value={newCategoryName}
                  onChange={(event) => setNewCategoryName(event.target.value)}
                />
                <button type="submit" className="h-11 rounded-lg border border-white/12 bg-white px-4 text-sm font-medium text-black transition hover:bg-white/90">
                  Crea
                </button>
              </form>
            </div>
            <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
              {categories.map((category) => (
                <div key={category} className="rounded-2xl border border-white/10 px-4 py-3">
                  {renamingCategory === category ? (
                    <div className="flex flex-col gap-3 md:flex-row">
                      <input className="shop-input" value={renamedCategoryValue} onChange={(event) => setRenamedCategoryValue(event.target.value)} />
                      <button type="button" onClick={() => renameCategory(category)} className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black">
                        Salva nome
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm text-white">{category}</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setRenamingCategory(category)
                            setRenamedCategoryValue(category)
                          }}
                          className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70"
                        >
                          Rinomina
                        </button>
                        <button type="button" onClick={() => deleteCategory(category)} className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70">
                          Elimina
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="shop-card space-y-4 p-6 xl:col-span-2">
            <div className="max-w-4xl space-y-2">
              <h2 className="text-xl font-semibold text-white">Gestione collezioni</h2>
              <p className="text-sm leading-6 text-white/60">
                Le collezioni servono a raggruppare prodotti in temi o percorsi editoriali trasversali, diversi dalle categorie principali.
                Esempio: categoria = Print, collezione = Cantanti famosi.
              </p>
            </div>
            <div className="grid gap-6 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                <form onSubmit={saveCollection} className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Nuova collezione</h3>
                      <p className="mt-1 text-sm text-white/55">Crea o aggiorna una collezione da riutilizzare nel catalogo e nella homepage.</p>
                    </div>
                    {editingCollectionId ? (
                      <button type="button" onClick={resetCollectionForm} className="text-sm text-white/60 transition hover:text-white">
                        Annulla modifica
                      </button>
                    ) : null}
                  </div>
                  <input className="shop-input" placeholder="Titolo collezione" value={collectionForm.title} onChange={(event) => setCollectionForm({ ...collectionForm, title: event.target.value })} />
                  <input className="shop-input" placeholder="Slug (opzionale)" value={collectionForm.slug} onChange={(event) => setCollectionForm({ ...collectionForm, slug: event.target.value })} />
                  <textarea className="shop-textarea min-h-28 resize-none" placeholder="Descrizione collezione" value={collectionForm.description} onChange={(event) => setCollectionForm({ ...collectionForm, description: event.target.value })} />
                  <label className="flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/70">
                    <input type="checkbox" checked={collectionForm.active} onChange={(event) => setCollectionForm({ ...collectionForm, active: event.target.checked })} />
                    Collezione attiva nel catalogo pubblico
                  </label>
                  <button type="submit" className="rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-white/90">
                    {editingCollectionId ? "Aggiorna collezione" : "Crea collezione"}
                  </button>
                </form>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-white">Collezioni esistenti</h3>
                  <p className="mt-1 text-sm text-white/55">Lista delle collezioni già create e del numero di prodotti collegati.</p>
                </div>
                <div className="space-y-3">
                  {collections.map((collection) => (
                    <div key={collection.id} className="rounded-2xl border border-white/10 px-4 py-4">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-white">{collection.title}</p>
                            <span className="rounded-full border border-white/10 px-2 py-1 text-[11px] uppercase tracking-[0.18em] text-white/55">
                              {collection.active ? "Active" : "Hidden"}
                            </span>
                          </div>
                          <p className="text-xs text-white/45">/{collection.slug} · {collection._count?.products || 0} prodotti</p>
                          {collection.description ? <p className="text-sm text-white/60">{collection.description}</p> : null}
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => startEditCollection(collection)} className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70">
                            Modifica
                          </button>
                          <button type="button" onClick={() => deleteCollection(collection.id)} className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70">
                            Elimina
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {!collections.length ? <p className="text-sm text-white/50">Nessuna collezione creata.</p> : null}
                </div>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {tab === "homepage" ? (
        <div className="space-y-6">
          <section className="shop-card space-y-5 p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Selezioni in evidenza</h2>
                <p className="mt-1 text-sm text-white/55">Modifica i blocchi editoriali mostrati nella homepage dello shop.</p>
              </div>
              <button type="button" onClick={saveHomepageContent} className="rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-white/90">
                Salva contenuti homepage
              </button>
            </div>

            <div className="space-y-4">
              {homepageShowcases.map((item, index) => (
                <div
                  key={`${item.title}-${index}`}
                  className={`rounded-[24px] border p-5 ${homepageFocus.section === "showcases" && homepageFocus.item === index ? "border-[#e3f503]/45 bg-white/[0.05]" : "border-white/10 bg-white/[0.03]"}`}
                >
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <p className="text-sm font-medium text-white">Blocco {index + 1}</p>
                    <button
                      type="button"
                      onClick={() => setHomepageFocus({ section: "showcases", item: index })}
                      className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70"
                    >
                      In modifica
                    </button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <input className="shop-input" placeholder="Eyebrow" value={item.eyebrow} onChange={(event) => setHomepageShowcases((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, eyebrow: event.target.value } : entry))} />
                    <input className="shop-input" placeholder="Titolo" value={item.title} onChange={(event) => setHomepageShowcases((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, title: event.target.value } : entry))} />
                    <input className="shop-input" placeholder="Query collegata" value={item.query} onChange={(event) => setHomepageShowcases((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, query: event.target.value } : entry))} />
                    <input className="shop-input" placeholder="Link destinazione" value={item.href} onChange={(event) => setHomepageShowcases((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, href: event.target.value } : entry))} />
                    <input className="shop-input" placeholder="Etichetta CTA" value={item.ctaLabel} onChange={(event) => setHomepageShowcases((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, ctaLabel: event.target.value } : entry))} />
                    <input className="shop-input" placeholder="URL immagine (opzionale)" value={item.imageUrl || ""} onChange={(event) => setHomepageShowcases((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, imageUrl: event.target.value } : entry))} />
                  </div>
                  <textarea className="shop-textarea mt-4 min-h-24 resize-none" placeholder="Descrizione" value={item.description} onChange={(event) => setHomepageShowcases((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, description: event.target.value } : entry))} />
                </div>
              ))}
            </div>
          </section>

          <section className="shop-card space-y-5 p-6">
            <div>
              <h2 className="text-xl font-semibold text-white">Categorie popolari</h2>
              <p className="mt-1 text-sm text-white/55">Modifica le card scrollabili usate nella homepage dello shop.</p>
            </div>

            <div className="space-y-4">
              {homepagePopularCategories.map((item, index) => (
                <div
                  key={`${item.title}-${index}`}
                  className={`rounded-[24px] border p-5 ${homepageFocus.section === "popular-categories" && homepageFocus.item === index ? "border-[#e3f503]/45 bg-white/[0.05]" : "border-white/10 bg-white/[0.03]"}`}
                >
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <p className="text-sm font-medium text-white">Categoria {index + 1}</p>
                    <button
                      type="button"
                      onClick={() => setHomepageFocus({ section: "popular-categories", item: index })}
                      className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70"
                    >
                      In modifica
                    </button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <input className="shop-input" placeholder="Titolo categoria" value={item.title} onChange={(event) => setHomepagePopularCategories((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, title: event.target.value } : entry))} />
                    <input className="shop-input" placeholder="Query collegata" value={item.query} onChange={(event) => setHomepagePopularCategories((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, query: event.target.value } : entry))} />
                    <input className="shop-input" placeholder="Link destinazione" value={item.href} onChange={(event) => setHomepagePopularCategories((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, href: event.target.value } : entry))} />
                    <input className="shop-input" placeholder="URL immagine (opzionale)" value={item.imageUrl || ""} onChange={(event) => setHomepagePopularCategories((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, imageUrl: event.target.value } : entry))} />
                  </div>
                  <textarea className="shop-textarea mt-4 min-h-24 resize-none" placeholder="Descrizione breve" value={item.description} onChange={(event) => setHomepagePopularCategories((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, description: event.target.value } : entry))} />
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {tab === "recensioni" ? (
        <section className="shop-card space-y-5 p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Recensioni</h2>
              <p className="mt-1 text-sm text-white/55">
                Seleziona fino a 10 recensioni da mostrare nel loop della homepage.
              </p>
            </div>
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/65">
              {reviews.filter((review) => review.showOnHomepage).length} / 10 in homepage
            </span>
          </div>

          <div className="space-y-3">
            {reviews.map((review) => {
              const selectedCount = reviews.filter((item) => item.showOnHomepage).length
              const disableSelect = !review.showOnHomepage && selectedCount >= 10

              return (
                <article key={review.id} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-base font-medium text-white">{review.authorName}</p>
                        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60">
                          {review.rating}/5
                        </span>
                        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60">
                          {new Date(review.createdAt).toLocaleDateString("it-IT")}
                        </span>
                        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60">
                          {review.status}
                        </span>
                      </div>
                      <h3 className="mt-3 text-lg font-semibold text-white">{review.title}</h3>
                      <p className="mt-2 line-clamp-3 text-sm leading-7 text-white/68">{review.body}</p>
                      <div className="mt-3">
                        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60">
                          {review.tag}
                        </span>
                      </div>
                    </div>

                    <label className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm ${review.showOnHomepage ? "border-[#e3f503]/40 text-white" : "border-white/10 text-white/65"}`}>
                      <input
                        type="checkbox"
                        checked={review.showOnHomepage}
                        disabled={disableSelect}
                        onChange={(event) => toggleHomepageReview(review.id, event.target.checked)}
                      />
                      Mostra in homepage
                    </label>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      ) : null}

      {tab === "ordini" ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <article key={order.id} className="shop-card flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-lg font-semibold text-white">{order.orderReference}</p>
                <p className="mt-1 text-sm text-white/60">
                  {order.firstName} {order.lastName} · {formatPrice(order.total)}
                </p>
              </div>
              <div className="flex flex-col items-stretch gap-3 lg:min-w-[320px]">
                <div className="flex flex-wrap gap-2">
                  <Link
                    to={`/shop/orders/${order.orderReference}`}
                    className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/75 transition hover:border-white/25 hover:text-white"
                  >
                    Visualizza ordine
                  </Link>
                  <button
                    type="button"
                    onClick={() => openOrderProfit(order.id)}
                    className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/75 transition hover:border-white/25 hover:text-white"
                  >
                    {loadingProfitOrderId === order.id ? "Calcolo..." : "Visualizza guadagno"}
                  </button>
                  {order.status === "paid" || order.status === "shipped" ? (
                    <button
                      type="button"
                      onClick={() => downloadInvoicePdf(order, shopSettings)}
                      className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/75 transition hover:border-white/25 hover:text-white"
                    >
                      Scarica ricevuta
                    </button>
                  ) : null}
                </div>
                <select
                  className="shop-select max-w-48"
                  value={order.status}
                  onChange={async (event) => {
                    clearFeedback()
                    try {
                      await apiFetch(`/admin/orders/${order.id}`, {
                        method: "PATCH",
                        body: JSON.stringify({ status: event.target.value }),
                      })
                      await refresh()
                      setMessage("Stato ordine aggiornato.")
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Errore durante l'aggiornamento dell'ordine.")
                    }
                  }}
                >
                  <option value="pending">In attesa</option>
                  <option value="paid">Pagato</option>
                  <option value="shipped">Spedito</option>
                </select>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {tab === "utenti" ? (
        <section className="shop-card space-y-6 p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Utenti</h2>
              <p className="mt-1 text-sm text-white/55">
                Elenco reale degli account registrati nello shop, visibile solo lato admin.
              </p>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-5 py-4 text-right">
              <p className="text-xs uppercase tracking-[0.2em] text-white/45">Totale registrati</p>
              <p className="mt-2 text-3xl font-semibold text-white">{usersTotal}</p>
            </div>
          </div>

          <div className="min-h-0 max-h-[34rem] space-y-3 overflow-y-auto overscroll-contain pr-1" onWheelCapture={containWheel}>
            {users.map((entry) => (
              <article key={entry.id} className="rounded-[22px] border border-white/10 bg-white/[0.03] px-5 py-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-base font-medium text-white">{entry.email}</p>
                    <p className="mt-1 text-sm text-white/55">
                      {entry.username || "username non impostato"} · {entry.role}
                    </p>
                  </div>
                  <span className="text-sm text-white/50">{new Date(entry.createdAt).toLocaleDateString("it-IT")}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {tab === "data" ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              ["Visualizzazioni sito", analytics?.siteViewsTotal ?? 0],
              ["Vendite concluse", analytics?.salesCount ?? 0],
              ["Ordini totali", analytics?.totalOrders ?? 0],
              ["Ticket medio ordine", formatPrice(analytics?.averageOrderValue ?? 0)],
            ].map(([label, value]) => (
              <article key={label} className="shop-card p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-white/45">{label}</p>
                <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
              </article>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <article className="shop-card p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-white/45">Guadagno netto totale</p>
              <p className="mt-3 text-3xl font-semibold text-white">{formatPrice(analytics?.totalNet ?? 0)}</p>
            </article>
            <article className="shop-card p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-white/45">Spese totali prodotti</p>
              <p className="mt-3 text-3xl font-semibold text-white">{formatPrice(analytics?.totalExpenses ?? 0)}</p>
            </article>
            <article className="shop-card p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-white/45">Incassato totale</p>
              <p className="mt-3 text-3xl font-semibold text-white">{formatPrice(analytics?.totalRevenue ?? 0)}</p>
            </article>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <article className="shop-card space-y-4 p-6">
              <h2 className="text-xl font-semibold text-white">Medie e andamento</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4">
                  <p className="text-sm text-white/55">Guadagno medio giornaliero</p>
                  <p className="mt-2 text-xl font-semibold text-white">{formatPrice(analytics?.averageDailyNet ?? 0)}</p>
                </div>
                <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4">
                  <p className="text-sm text-white/55">Guadagno medio mensile</p>
                  <p className="mt-2 text-xl font-semibold text-white">{formatPrice(analytics?.averageMonthlyNet ?? 0)}</p>
                </div>
                <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4">
                  <p className="text-sm text-white/55">Spese giornaliere</p>
                  <p className="mt-2 text-xl font-semibold text-white">{formatPrice(analytics?.averageDailyExpenses ?? 0)}</p>
                </div>
                <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4">
                  <p className="text-sm text-white/55">Spese mensili</p>
                  <p className="mt-2 text-xl font-semibold text-white">{formatPrice(analytics?.averageMonthlyExpenses ?? 0)}</p>
                </div>
              </div>
            </article>

            <article className="shop-card space-y-4 p-6">
              <h2 className="text-xl font-semibold text-white">Best seller e traffico</h2>
              <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4">
                <p className="text-sm text-white/55">Prodotto più venduto</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {analytics?.bestSellingProduct?.title || "Nessun dato disponibile"}
                </p>
                {analytics?.bestSellingProduct ? (
                  <p className="mt-1 text-sm text-white/55">{analytics.bestSellingProduct.quantity} unità vendute</p>
                ) : null}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4">
                  <p className="text-sm text-white/55">Visualizzazioni oggi</p>
                  <p className="mt-2 text-xl font-semibold text-white">{analytics?.siteViewsToday ?? 0}</p>
                </div>
                <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4">
                  <p className="text-sm text-white/55">Visualizzazioni mese</p>
                  <p className="mt-2 text-xl font-semibold text-white">{analytics?.siteViewsThisMonth ?? 0}</p>
                </div>
              </div>
              {analytics && !analytics.shippingCostsTracked ? (
                <p className="text-sm text-white/50">
                  I costi di spedizione operativi non sono ancora tracciati separatamente: le spese mostrano i costi prodotto reali salvati in admin.
                </p>
              ) : null}
            </article>
          </div>
        </div>
      ) : null}

      {tab === "sconti" ? (
        <div className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-2">
            <form onSubmit={saveCoupon} className="shop-card h-full space-y-4 p-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold text-white">{editingCouponId ? "Modifica coupon" : "Crea coupon"}</h2>
                {editingCouponId ? (
                  <button type="button" onClick={() => { setEditingCouponId(null); setCouponForm(emptyCouponForm()) }} className="text-sm text-white/60">
                    Annulla
                  </button>
                ) : null}
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white/65">Codice coupon</label>
                <input className="shop-input" placeholder="Codice coupon" value={couponForm.code} onChange={(event) => setCouponForm({ ...couponForm, code: event.target.value.toUpperCase() })} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm text-white/65">Tipo coupon</label>
                  <select className="shop-select" value={couponForm.type} onChange={(event) => setCouponForm({ ...couponForm, type: event.target.value as CouponFormState["type"] })}>
                    <option value="percentage">Percentuale</option>
                    <option value="fixed">Importo fisso</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-white/65">{getCouponAmountLabel(couponForm.type)}</label>
                  <input className="shop-input" type="number" step={couponForm.type === "fixed" ? "0.01" : "1"} placeholder={getCouponAmountLabel(couponForm.type)} value={couponForm.amount} onChange={(event) => setCouponForm({ ...couponForm, amount: event.target.value })} />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm text-white/65">Data di scadenza</label>
                  <input className="shop-input" type="date" value={couponForm.expiresAt} onChange={(event) => setCouponForm({ ...couponForm, expiresAt: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-white/65">Limite utilizzi</label>
                  <input className="shop-input" type="number" placeholder="Numero massimo utilizzi" value={couponForm.usageLimit} onChange={(event) => setCouponForm({ ...couponForm, usageLimit: event.target.value })} />
                </div>
              </div>
              <label className="flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/70">
                <input type="checkbox" checked={couponForm.active} onChange={(event) => setCouponForm({ ...couponForm, active: event.target.checked })} />
                Coupon attivo
              </label>
              <button type="submit" className="rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-white/90">
                {editingCouponId ? "Aggiorna coupon" : "Crea coupon"}
              </button>
            </form>

            <div className="shop-card flex h-full min-h-0 flex-col space-y-4 p-6">
              <h2 className="text-xl font-semibold text-white">Coupon esistenti</h2>
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-1" onWheelCapture={containWheel}>
                {coupons.map((coupon) => (
                  <div key={coupon.id} className="rounded-2xl border border-white/10 px-4 py-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-white">{coupon.code}</p>
                        <p className="mt-1 text-sm text-white/60">
                          {coupon.type === "percentage" ? `${coupon.amount}%` : formatPrice(coupon.amount)} · {coupon.active ? "Attivo" : "Disattivato"}
                        </p>
                        {coupon.expiresAt ? (
                          <p className="mt-1 text-xs text-white/45">Valido fino al {new Date(coupon.expiresAt).toLocaleDateString("it-IT")}</p>
                        ) : null}
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => startEditCoupon(coupon)} className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70">
                          Modifica
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            clearFeedback()
                            try {
                              await apiFetch(`/admin/coupons/${coupon.id}`, { method: "DELETE" })
                              await refresh()
                              setMessage("Coupon eliminato correttamente.")
                            } catch (err) {
                              setError(err instanceof Error ? err.message : "Errore durante l'eliminazione del coupon.")
                            }
                          }}
                          className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70"
                        >
                          Elimina
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <form onSubmit={saveRule} className="shop-card h-full space-y-4 p-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold text-white">{editingRuleId ? "Modifica regola sconto" : "Crea regola sconto"}</h2>
                {editingRuleId ? (
                  <button type="button" onClick={() => { setEditingRuleId(null); setRuleForm(emptyRuleForm()) }} className="text-sm text-white/60">
                    Annulla
                  </button>
                ) : null}
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white/65">Titolo regola</label>
                <input className="shop-input" placeholder="Titolo regola" value={ruleForm.name} onChange={(event) => setRuleForm({ ...ruleForm, name: event.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white/65">Descrizione opzionale</label>
                <textarea className="shop-textarea min-h-24 resize-none" placeholder="Descrizione opzionale" value={ruleForm.description} onChange={(event) => setRuleForm({ ...ruleForm, description: event.target.value })} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm text-white/65">Tipo regola</label>
                  <select className="shop-select" value={ruleForm.ruleType} onChange={(event) => setRuleForm({ ...ruleForm, ruleType: event.target.value as RuleFormState["ruleType"] })}>
                    <option value="quantity_percentage">Sconto percentuale per quantita minima</option>
                    <option value="free_shipping_quantity">Spedizione gratuita per quantita minima</option>
                    <option value="subtotal_fixed">Sconto fisso per subtotale minimo</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-white/65">Modalità sconto</label>
                  <select className="shop-select" value={ruleForm.discountType} onChange={(event) => setRuleForm({ ...ruleForm, discountType: event.target.value as RuleFormState["discountType"] })}>
                    <option value="percentage">Percentuale</option>
                    <option value="shipping">Spedizione</option>
                    <option value="fixed">Importo fisso</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm text-white/65">{getRuleThresholdLabel(ruleForm.ruleType)}</label>
                  <input className="shop-input" type="number" step={ruleForm.ruleType === "subtotal_fixed" ? "0.01" : "1"} placeholder={getRuleThresholdLabel(ruleForm.ruleType)} value={ruleForm.threshold} onChange={(event) => setRuleForm({ ...ruleForm, threshold: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-white/65">{getRuleAmountLabel(ruleForm.discountType)}</label>
                  <input className="shop-input" type="number" step={ruleForm.discountType === "fixed" ? "0.01" : "1"} placeholder={getRuleAmountLabel(ruleForm.discountType)} value={ruleForm.discountType === "shipping" ? "0" : ruleForm.amount} disabled={ruleForm.discountType === "shipping"} onChange={(event) => setRuleForm({ ...ruleForm, amount: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-white/65">Priorità</label>
                  <input className="shop-input" type="number" placeholder="Priorità" value={ruleForm.priority} onChange={(event) => setRuleForm({ ...ruleForm, priority: Number(event.target.value) })} />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm text-white/65">Data inizio validità</label>
                  <input className="shop-input" type="datetime-local" value={ruleForm.startsAt} onChange={(event) => setRuleForm({ ...ruleForm, startsAt: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-white/65">Data fine validità</label>
                  <input className="shop-input" type="datetime-local" value={ruleForm.endsAt} onChange={(event) => setRuleForm({ ...ruleForm, endsAt: event.target.value })} />
                </div>
              </div>
              <label className="flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/70">
                <input type="checkbox" checked={ruleForm.active} onChange={(event) => setRuleForm({ ...ruleForm, active: event.target.checked })} />
                Regola attiva
              </label>
              <button type="submit" className="rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-white/90">
                {editingRuleId ? "Aggiorna regola" : "Crea regola"}
              </button>
            </form>

            <div className="shop-card flex h-full min-h-0 flex-col space-y-4 p-6">
              <h2 className="text-xl font-semibold text-white">Regole sconto esistenti</h2>
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-1" onWheelCapture={containWheel}>
                {rules.map((rule) => (
                  <div key={rule.id} className="rounded-2xl border border-white/10 px-4 py-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-white">{rule.name}</p>
                        <p className="mt-1 text-sm text-white/60">
                          {rule.active ? "Attiva" : "Disattivata"} ·{" "}
                          {rule.ruleType === "subtotal_fixed"
                            ? `soglia ${formatPrice(rule.threshold)}`
                            : `soglia ${rule.threshold}`} ·{" "}
                          {rule.discountType === "fixed"
                            ? `valore ${formatPrice(rule.amount)}`
                            : rule.discountType === "percentage"
                              ? `valore ${rule.amount}%`
                              : "spedizione gratuita"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => startEditRule(rule)} className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70">
                          Modifica
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            clearFeedback()
                            try {
                              await apiFetch(`/admin/discount-rules/${rule.id}`, { method: "DELETE" })
                              await refresh()
                              setMessage("Regola sconto eliminata correttamente.")
                            } catch (err) {
                              setError(err instanceof Error ? err.message : "Errore durante l'eliminazione della regola.")
                            }
                          }}
                          className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70"
                        >
                          Elimina
                        </button>
                      </div>
                    </div>
                    {rule.description ? <p className="mt-2 text-sm text-white/55">{rule.description}</p> : null}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <form onSubmit={saveSettings} className="shop-card flex h-full flex-col space-y-4 p-6">
            <div>
              <h2 className="text-xl font-semibold text-white">Impostazioni PayPal</h2>
              <p className="mt-2 text-sm text-white/60">
                Inserisci l&apos;email business PayPal oppure un link PayPal.Me reale. L&apos;email business ha priorita e replica il flusso del vecchio shop.
              </p>
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-white/65">Nome shop mostrato nel checkout</label>
                  <input
                    className="shop-input"
                    placeholder="Nome shop"
                    value={settingValue("storeName", "BNS Studio Shop")}
                    onChange={(event) => updateSetting("storeName", event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-white/65">Email business PayPal</label>
                  <input
                    className="shop-input"
                    placeholder="Email business PayPal"
                    value={settingValue("paypalBusinessEmail")}
                    onChange={(event) => updateSetting("paypalBusinessEmail", event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-white/65">Email contatto sito</label>
                  <input
                    className="shop-input"
                    placeholder="Email contatto sito"
                    value={settingValue("contactEmail", "bnsstudio@gmail.com")}
                    onChange={(event) => updateSetting("contactEmail", event.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-white/65">Link PayPal.Me</label>
                  <input
                    className="shop-input"
                    placeholder="Link PayPal.Me"
                    value={settingValue("paypalMeLink")}
                    onChange={(event) => updateSetting("paypalMeLink", event.target.value)}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm text-white/65">Valuta</label>
                    <input
                      className="shop-input"
                      placeholder="Valuta"
                      value={settingValue("currencyCode", "EUR")}
                      onChange={(event) => updateSetting("currencyCode", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-white/65">Spedizione standard (€)</label>
                    <input
                      className="shop-input"
                      type="number"
                      step="0.01"
                      placeholder="Spedizione standard"
                      value={shippingCostInput}
                      onChange={(event) => setShippingCostInput(event.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
            <button type="submit" className="mt-auto rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-white/90">
              Salva impostazioni PayPal
            </button>
          </form>
        </div>
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
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:border-white/25 hover:text-white"
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
