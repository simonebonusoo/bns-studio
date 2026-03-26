import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"

import { ShopLayout } from "../components/ShopLayout"
import { apiFetch } from "../lib/api"
import { formatPrice } from "../lib/format"
import { downloadInvoicePdf } from "../lib/invoice"
import { ShopOrder, ShopProduct, ShopReview, ShopSettings } from "../types"

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

type ProductFormState = {
  title: string
  description: string
  priceA4: string
  priceA3: string
  costPrice: string
  hasA4: boolean
  hasA3: boolean
  category: string
  featured: boolean
  stock: number
  existingImageUrls: string[]
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
  description: "",
  priceA4: "",
  priceA3: "",
  costPrice: "",
  hasA4: true,
  hasA3: false,
  category: "",
  featured: false,
  stock: 0,
  existingImageUrls: [],
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
  const [reviews, setReviews] = useState<AdminReview[]>([])
  const [orders, setOrders] = useState<ShopOrder[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [usersTotal, setUsersTotal] = useState(0)
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null)
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [rules, setRules] = useState<DiscountRule[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [settings, setSettings] = useState<SettingEntry[]>([])
  const [shippingCostInput, setShippingCostInput] = useState("9")
  const [tab, setTab] = useState<"prodotti" | "recensioni" | "ordini" | "utenti" | "data" | "sconti">("prodotti")

  const [productForm, setProductForm] = useState<ProductFormState>(emptyProductForm)
  const [productFiles, setProductFiles] = useState<File[]>([])
  const [productPreviewUrls, setProductPreviewUrls] = useState<string[]>([])
  const [editingProductId, setEditingProductId] = useState<number | null>(null)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [renamingCategory, setRenamingCategory] = useState<string | null>(null)
  const [renamedCategoryValue, setRenamedCategoryValue] = useState("")

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
    const editProductId = Number(searchParams.get("editProduct") || 0)
    if (!editProductId || !products.length) return

    const targetProduct = products.find((product) => product.id === editProductId)
    if (!targetProduct) return

    setTab("prodotti")
    startEditProduct(targetProduct)
    navigate("/shop/admin", { replace: true })
  }, [navigate, products, searchParams])

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

  async function refresh() {
    const [productData, reviewData, orderData, usersData, analyticsData, couponData, ruleData, categoryData, settingsData] = await Promise.all([
      apiFetch<ShopProduct[]>("/admin/products"),
      apiFetch<AdminReview[]>("/admin/reviews"),
      apiFetch<ShopOrder[]>("/admin/orders"),
      apiFetch<AdminUsersResponse>("/admin/users"),
      apiFetch<AdminAnalytics>("/admin/analytics"),
      apiFetch<Coupon[]>("/admin/coupons"),
      apiFetch<DiscountRule[]>("/admin/discount-rules"),
      apiFetch<string[]>("/admin/categories"),
      apiFetch<SettingEntry[]>("/admin/settings"),
    ])

    setProducts(productData)
    setReviews(reviewData)
    setOrders(orderData)
    setUsers(usersData.users)
    setUsersTotal(usersData.total)
    setAnalytics(analyticsData)
    setCoupons(couponData)
    setRules(ruleData)
    setCategories(categoryData)
    setSettings(settingsData)
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
      description: product.description,
      priceA4: formatEuroInput(product.priceA4 ?? product.price),
      priceA3: product.priceA3 ? formatEuroInput(product.priceA3) : "",
      costPrice: "",
      hasA4: product.hasA4 !== false,
      hasA3: Boolean(product.hasA3),
      category: product.category,
      featured: product.featured,
      stock: product.stock,
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
        description: productForm.description,
        price: parseEuroToCents(productForm.hasA4 ? productForm.priceA4 : productForm.priceA3),
        costPrice: 0,
        hasA4: productForm.hasA4,
        hasA3: productForm.hasA3,
        priceA4: productForm.hasA4 ? parseEuroToCents(productForm.priceA4) : null,
        priceA3: productForm.hasA3 ? parseEuroToCents(productForm.priceA3) : null,
        category: productForm.category,
        featured: productForm.featured,
        stock: Number(productForm.stock),
        imageUrls,
      }

      if (editingProductId) {
        await apiFetch(`/admin/products/${editingProductId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        })
        setMessage("Prodotto aggiornato correttamente.")
      } else {
        await apiFetch("/admin/products", {
          method: "POST",
          body: JSON.stringify(payload),
        })
        setMessage("Prodotto creato correttamente.")
      }

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

  return (
    <ShopLayout
      eyebrow="Admin"
      title="Gestione shop"
      intro="Prodotti, categorie, ordini, coupon, recensioni e regole sconto vengono gestiti direttamente nello shop integrato, con una lettura più ampia e coerente con il layout principale del sito."
    >
      <div className="flex flex-wrap gap-3">
        {[
          ["prodotti", "Prodotti"],
          ["recensioni", "Recensioni"],
          ["ordini", "Ordini"],
          ["utenti", "Utenti"],
          ["data", "Data"],
          ["sconti", "Sconti e coupon"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key as "prodotti" | "recensioni" | "ordini" | "utenti" | "data" | "sconti")}
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
          <form onSubmit={saveProduct} className="shop-card h-full space-y-4 p-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold text-white">{editingProductId ? "Modifica prodotto" : "Nuovo prodotto"}</h2>
                {editingProductId ? (
                  <button
                    type="button"
                    onClick={resetProductForm}
                    className="text-sm text-white/60 transition hover:text-white"
                  >
                    Annulla modifica
                  </button>
                ) : null}
              </div>

              <input
                className="shop-input"
                placeholder="Titolo"
                aria-label="Titolo"
                value={productForm.title}
                onChange={(event) => setProductForm({ ...productForm, title: event.target.value })}
              />

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <select
                  className="shop-select"
                  aria-label="Categoria"
                  value={productForm.category}
                  onChange={(event) => setProductForm({ ...productForm, category: event.target.value })}
                >
                  <option value="">Categoria</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <div className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/70">
                  <div className="flex flex-wrap gap-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={productForm.hasA4}
                        onChange={(event) => setProductForm({ ...productForm, hasA4: event.target.checked })}
                      />
                      A4
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={productForm.hasA3}
                        onChange={(event) => setProductForm({ ...productForm, hasA3: event.target.checked })}
                      />
                      A3
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <input
                  className="shop-input"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  placeholder="Prezzo A4"
                  aria-label="Prezzo A4 in euro"
                  value={productForm.priceA4}
                  disabled={!productForm.hasA4}
                  onChange={(event) => setProductForm({ ...productForm, priceA4: event.target.value })}
                />
                <input
                  className="shop-input"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  placeholder="Prezzo A3"
                  aria-label="Prezzo A3 in euro"
                  value={productForm.priceA3}
                  disabled={!productForm.hasA3}
                  onChange={(event) => setProductForm({ ...productForm, priceA3: event.target.value })}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <input
                  className="shop-input"
                  type="number"
                  min="0"
                  placeholder="Quantità"
                  aria-label="Quantità"
                  value={productForm.stock}
                  onChange={(event) => setProductForm({ ...productForm, stock: Number(event.target.value) })}
                />
                <label className="flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/70">
                  <input type="checkbox" checked={productForm.featured} onChange={(event) => setProductForm({ ...productForm, featured: event.target.checked })} />
                  Metti in evidenza
                </label>
              </div>
              <textarea
                className="shop-textarea min-h-32 resize-none"
                placeholder="Descrizione"
                aria-label="Descrizione"
                value={productForm.description}
                onChange={(event) => setProductForm({ ...productForm, description: event.target.value })}
              />

              <div className="space-y-3 rounded-2xl border border-white/10 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-white">Immagini prodotto</p>
                    <p className="mt-1 text-xs text-white/55">La prima immagine viene usata come principale.</p>
                  </div>
                  <label className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/75 transition hover:border-white/25 hover:text-white">
                    Carica immagini
                    <input type="file" multiple accept="image/*" className="hidden" onChange={(event) => handleProductFileChange(event.target.files)} />
                  </label>
                </div>

                {productImages.length ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {productImages.map((image, index) => (
                      <div key={image} className="rounded-2xl border border-white/10 p-3">
                        <img src={image} alt="" className="aspect-[4/3] w-full rounded-xl object-cover" />
                        <div className="mt-3 flex flex-wrap gap-2">
                          {index !== 0 ? (
                            <button type="button" onClick={() => moveImageToPrimary(image)} className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70">
                              Imposta principale
                            </button>
                          ) : (
                            <span className="rounded-full bg-[#e3f503] px-3 py-1 text-xs font-medium text-black">Immagine principale</span>
                          )}
                          {productForm.existingImageUrls.includes(image) ? (
                            <button type="button" onClick={() => removeExistingImage(image)} className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70">
                              Rimuovi
                            </button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-white/50">Nessuna immagine caricata.</p>
                )}
              </div>

              <button type="submit" className="rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-white/90">
                {editingProductId ? "Aggiorna prodotto" : "Salva prodotto"}
              </button>
          </form>

          <section className="shop-card flex h-full min-h-0 flex-col p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Lista prodotti</h2>
                <p className="mt-1 text-sm text-white/55">Panoramica rapida dei prodotti già pubblicati nello shop.</p>
              </div>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/65">{products.length} elementi</span>
            </div>
            <div
              className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pr-1"
              onWheelCapture={containWheel}
            >
            {products.map((product) => (
              <article key={product.id} className="shop-card overflow-hidden">
                <div className="grid gap-4 p-5 md:grid-cols-[120px_1fr_auto] md:items-center">
                  <img src={product.imageUrls[0]} alt={product.title} className="h-24 w-full rounded-2xl object-cover" />
                  <div>
                    <p className="text-lg font-semibold text-white">{product.title}</p>
                    <p className="mt-1 text-sm text-white/60">
                      {product.category} · {product.availableFormats?.join(" / ") || "A4"} ·
                      {product.hasA4 !== false ? ` A4 ${formatPrice(product.priceA4 ?? product.price)}` : ""}
                      {product.hasA3 ? ` · A3 ${formatPrice(product.priceA3 ?? product.price)}` : ""}
                      {" · "}disponibilita {product.stock}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => startEditProduct(product)} className="rounded-full border border-white/10 px-3 py-2 text-xs text-white/70">
                      Modifica
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        clearFeedback()
                        try {
                          await apiFetch(`/admin/products/${product.id}`, { method: "DELETE" })
                          await refresh()
                          setMessage("Prodotto eliminato correttamente.")
                        } catch (err) {
                          setError(err instanceof Error ? err.message : "Errore durante l'eliminazione del prodotto.")
                        }
                      }}
                      className="rounded-full border border-white/10 px-3 py-2 text-xs text-white/70"
                    >
                      Elimina
                    </button>
                  </div>
                </div>
              </article>
            ))}
            </div>
          </section>

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
                  <button
                    type="button"
                    onClick={() => downloadInvoicePdf(order, shopSettings)}
                    className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/75 transition hover:border-white/25 hover:text-white"
                  >
                    Scarica ricevuta
                  </button>
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
