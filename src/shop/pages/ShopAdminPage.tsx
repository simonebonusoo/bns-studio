import { useEffect, useMemo, useState } from "react"

import { ShopLayout } from "../components/ShopLayout"
import { apiFetch } from "../lib/api"
import { formatPrice } from "../lib/format"
import { ShopOrder, ShopProduct } from "../types"

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
  slug: string
  description: string
  price: number
  category: string
  featured: boolean
  stock: number
  existingImageUrls: string[]
}

type CouponFormState = {
  code: string
  type: "percentage" | "fixed"
  amount: number
  expiresAt: string
  usageLimit: string
  active: boolean
}

type RuleFormState = {
  name: string
  description: string
  ruleType: "quantity_percentage" | "free_shipping_quantity" | "subtotal_fixed"
  threshold: number
  discountType: "percentage" | "shipping" | "fixed"
  amount: number
  priority: number
  startsAt: string
  endsAt: string
  active: boolean
}

const emptyProductForm = (): ProductFormState => ({
  title: "",
  slug: "",
  description: "",
  price: 0,
  category: "",
  featured: false,
  stock: 0,
  existingImageUrls: [],
})

const emptyCouponForm = (): CouponFormState => ({
  code: "",
  type: "percentage",
  amount: 10,
  expiresAt: "",
  usageLimit: "",
  active: true,
})

const emptyRuleForm = (): RuleFormState => ({
  name: "",
  description: "",
  ruleType: "quantity_percentage",
  threshold: 2,
  discountType: "percentage",
  amount: 10,
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

export function ShopAdminPage() {
  const [products, setProducts] = useState<ShopProduct[]>([])
  const [orders, setOrders] = useState<ShopOrder[]>([])
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [rules, setRules] = useState<DiscountRule[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [settings, setSettings] = useState<SettingEntry[]>([])
  const [tab, setTab] = useState<"prodotti" | "ordini" | "sconti">("prodotti")

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

  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const productImages = useMemo(
    () => [...productForm.existingImageUrls, ...productPreviewUrls],
    [productForm.existingImageUrls, productPreviewUrls]
  )

  useEffect(() => {
    refresh()
  }, [])

  useEffect(() => {
    return () => {
      productPreviewUrls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [productPreviewUrls])

  async function refresh() {
    const [productData, orderData, couponData, ruleData, categoryData, settingsData] = await Promise.all([
      apiFetch<ShopProduct[]>("/admin/products"),
      apiFetch<ShopOrder[]>("/admin/orders"),
      apiFetch<Coupon[]>("/admin/coupons"),
      apiFetch<DiscountRule[]>("/admin/discount-rules"),
      apiFetch<string[]>("/admin/categories"),
      apiFetch<SettingEntry[]>("/admin/settings"),
    ])

    setProducts(productData)
    setOrders(orderData)
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
      slug: product.slug,
      description: product.description,
      price: product.price,
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
        slug: productForm.slug,
        description: productForm.description,
        price: Number(productForm.price),
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
      amount: coupon.amount,
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
        amount: Number(couponForm.amount),
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
      threshold: rule.threshold,
      discountType: rule.discountType,
      amount: rule.amount,
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
        threshold: Number(ruleForm.threshold),
        discountType: ruleForm.discountType,
        amount: Number(ruleForm.amount),
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
      const allowedSettings = ["storeName", "currencyCode", "shippingCost", "paypalMeLink", "paypalBusinessEmail"]
      const payload = settings
        .filter((entry) => allowedSettings.includes(entry.key))
        .map((entry) => ({
          key: entry.key,
          value: entry.value,
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

  return (
    <ShopLayout
      eyebrow="Admin"
      title="Gestione shop"
      intro="Prodotti, categorie, ordini, coupon e regole sconto vengono gestiti direttamente nello shop integrato, con testi e flussi coerenti con il sito principale."
    >
      <div className="flex flex-wrap gap-3">
        {[
          ["prodotti", "Prodotti"],
          ["ordini", "Ordini"],
          ["sconti", "Sconti e coupon"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key as "prodotti" | "ordini" | "sconti")}
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

              <input className="shop-input" placeholder="Titolo" value={productForm.title} onChange={(event) => setProductForm({ ...productForm, title: event.target.value })} />
              <input className="shop-input" placeholder="Slug" value={productForm.slug} onChange={(event) => setProductForm({ ...productForm, slug: event.target.value })} />
              <div className="grid gap-4 md:grid-cols-2">
                <select className="shop-select" value={productForm.category} onChange={(event) => setProductForm({ ...productForm, category: event.target.value })}>
                  <option value="">Seleziona una categoria</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <input className="shop-input" type="number" placeholder="Prezzo in centesimi" value={productForm.price} onChange={(event) => setProductForm({ ...productForm, price: Number(event.target.value) })} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <input className="shop-input" type="number" placeholder="Quantita disponibile" value={productForm.stock} onChange={(event) => setProductForm({ ...productForm, stock: Number(event.target.value) })} />
                <label className="flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/70">
                  <input type="checkbox" checked={productForm.featured} onChange={(event) => setProductForm({ ...productForm, featured: event.target.checked })} />
                  Metti in evidenza
                </label>
              </div>
              <textarea className="shop-textarea min-h-32" placeholder="Descrizione" value={productForm.description} onChange={(event) => setProductForm({ ...productForm, description: event.target.value })} />

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
            <div className="max-h-[34rem] flex-1 space-y-4 overflow-y-auto overscroll-contain pr-1">
            {products.map((product) => (
              <article key={product.id} className="shop-card overflow-hidden">
                <div className="grid gap-4 p-5 md:grid-cols-[120px_1fr_auto] md:items-center">
                  <img src={product.imageUrls[0]} alt={product.title} className="h-24 w-full rounded-2xl object-cover" />
                  <div>
                    <p className="text-lg font-semibold text-white">{product.title}</p>
                    <p className="mt-1 text-sm text-white/60">
                      {product.category} · {formatPrice(product.price)} · disponibilita {product.stock}
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
                <input className="shop-input" placeholder="Nuova categoria" value={newCategoryName} onChange={(event) => setNewCategoryName(event.target.value)} />
                <button type="submit" className="rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-white/90">
                  Crea categoria
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
            </article>
          ))}
        </div>
      ) : null}

      {tab === "sconti" ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="space-y-6">
            <form onSubmit={saveCoupon} className="shop-card space-y-4 p-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold text-white">{editingCouponId ? "Modifica coupon" : "Crea coupon"}</h2>
                {editingCouponId ? (
                  <button type="button" onClick={() => { setEditingCouponId(null); setCouponForm(emptyCouponForm()) }} className="text-sm text-white/60">
                    Annulla
                  </button>
                ) : null}
              </div>
              <input className="shop-input" placeholder="Codice coupon" value={couponForm.code} onChange={(event) => setCouponForm({ ...couponForm, code: event.target.value.toUpperCase() })} />
              <div className="grid gap-4 md:grid-cols-2">
                <select className="shop-select" value={couponForm.type} onChange={(event) => setCouponForm({ ...couponForm, type: event.target.value as CouponFormState["type"] })}>
                  <option value="percentage">Percentuale</option>
                  <option value="fixed">Importo fisso</option>
                </select>
                <input className="shop-input" type="number" placeholder="Valore sconto" value={couponForm.amount} onChange={(event) => setCouponForm({ ...couponForm, amount: Number(event.target.value) })} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <input className="shop-input" type="date" placeholder="Scadenza" value={couponForm.expiresAt} onChange={(event) => setCouponForm({ ...couponForm, expiresAt: event.target.value })} />
                <input className="shop-input" type="number" placeholder="Limite utilizzi" value={couponForm.usageLimit} onChange={(event) => setCouponForm({ ...couponForm, usageLimit: event.target.value })} />
              </div>
              <label className="flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/70">
                <input type="checkbox" checked={couponForm.active} onChange={(event) => setCouponForm({ ...couponForm, active: event.target.checked })} />
                Coupon attivo
              </label>
              <button type="submit" className="rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-white/90">
                {editingCouponId ? "Aggiorna coupon" : "Crea coupon"}
              </button>
            </form>

            <div className="shop-card space-y-4 p-6">
              <h2 className="text-xl font-semibold text-white">Coupon esistenti</h2>
              <div className="space-y-3">
                {coupons.map((coupon) => (
                  <div key={coupon.id} className="rounded-2xl border border-white/10 px-4 py-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-white">{coupon.code}</p>
                        <p className="mt-1 text-sm text-white/60">
                          {coupon.type === "percentage" ? `${coupon.amount}%` : formatPrice(coupon.amount)} · {coupon.active ? "Attivo" : "Disattivato"}
                        </p>
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

            <form onSubmit={saveSettings} className="shop-card space-y-4 p-6">
              <h2 className="text-xl font-semibold text-white">Impostazioni PayPal</h2>
              <p className="text-sm text-white/60">
                Inserisci l&apos;email business PayPal oppure un link PayPal.Me reale. L&apos;email business ha priorita e replica il flusso del vecchio shop.
              </p>
              <input
                className="shop-input"
                placeholder="Nome shop"
                value={settingValue("storeName", "BNS Studio Shop")}
                onChange={(event) => updateSetting("storeName", event.target.value)}
              />
              <input
                className="shop-input"
                placeholder="Email business PayPal"
                value={settingValue("paypalBusinessEmail")}
                onChange={(event) => updateSetting("paypalBusinessEmail", event.target.value)}
              />
              <input
                className="shop-input"
                placeholder="Link PayPal.Me"
                value={settingValue("paypalMeLink")}
                onChange={(event) => updateSetting("paypalMeLink", event.target.value)}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  className="shop-input"
                  placeholder="Valuta"
                  value={settingValue("currencyCode", "EUR")}
                  onChange={(event) => updateSetting("currencyCode", event.target.value)}
                />
                <input
                  className="shop-input"
                  placeholder="Spedizione in centesimi"
                  value={settingValue("shippingCost", "900")}
                  onChange={(event) => updateSetting("shippingCost", event.target.value)}
                />
              </div>
              <button type="submit" className="rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-white/90">
                Salva impostazioni PayPal
              </button>
            </form>
          </div>

          <div className="space-y-6">
            <form onSubmit={saveRule} className="shop-card space-y-4 p-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold text-white">{editingRuleId ? "Modifica regola sconto" : "Crea regola sconto"}</h2>
                {editingRuleId ? (
                  <button type="button" onClick={() => { setEditingRuleId(null); setRuleForm(emptyRuleForm()) }} className="text-sm text-white/60">
                    Annulla
                  </button>
                ) : null}
              </div>
              <input className="shop-input" placeholder="Titolo regola" value={ruleForm.name} onChange={(event) => setRuleForm({ ...ruleForm, name: event.target.value })} />
              <textarea className="shop-textarea min-h-24" placeholder="Descrizione opzionale" value={ruleForm.description} onChange={(event) => setRuleForm({ ...ruleForm, description: event.target.value })} />
              <div className="grid gap-4 md:grid-cols-2">
                <select className="shop-select" value={ruleForm.ruleType} onChange={(event) => setRuleForm({ ...ruleForm, ruleType: event.target.value as RuleFormState["ruleType"] })}>
                  <option value="quantity_percentage">Sconto percentuale per quantita minima</option>
                  <option value="free_shipping_quantity">Spedizione gratuita per quantita minima</option>
                  <option value="subtotal_fixed">Sconto fisso per subtotale minimo</option>
                </select>
                <select className="shop-select" value={ruleForm.discountType} onChange={(event) => setRuleForm({ ...ruleForm, discountType: event.target.value as RuleFormState["discountType"] })}>
                  <option value="percentage">Percentuale</option>
                  <option value="shipping">Spedizione</option>
                  <option value="fixed">Importo fisso</option>
                </select>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <input className="shop-input" type="number" placeholder="Soglia minima" value={ruleForm.threshold} onChange={(event) => setRuleForm({ ...ruleForm, threshold: Number(event.target.value) })} />
                <input className="shop-input" type="number" placeholder="Valore sconto" value={ruleForm.amount} onChange={(event) => setRuleForm({ ...ruleForm, amount: Number(event.target.value) })} />
                <input className="shop-input" type="number" placeholder="Priorita" value={ruleForm.priority} onChange={(event) => setRuleForm({ ...ruleForm, priority: Number(event.target.value) })} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <input className="shop-input" type="datetime-local" value={ruleForm.startsAt} onChange={(event) => setRuleForm({ ...ruleForm, startsAt: event.target.value })} />
                <input className="shop-input" type="datetime-local" value={ruleForm.endsAt} onChange={(event) => setRuleForm({ ...ruleForm, endsAt: event.target.value })} />
              </div>
              <label className="flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/70">
                <input type="checkbox" checked={ruleForm.active} onChange={(event) => setRuleForm({ ...ruleForm, active: event.target.checked })} />
                Regola attiva
              </label>
              <button type="submit" className="rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-white/90">
                {editingRuleId ? "Aggiorna regola" : "Crea regola"}
              </button>
            </form>

            <div className="shop-card space-y-4 p-6">
              <h2 className="text-xl font-semibold text-white">Regole sconto esistenti</h2>
              <div className="space-y-3">
                {rules.map((rule) => (
                  <div key={rule.id} className="rounded-2xl border border-white/10 px-4 py-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-white">{rule.name}</p>
                        <p className="mt-1 text-sm text-white/60">
                          {rule.active ? "Attiva" : "Disattivata"} · soglia {rule.threshold} · valore {rule.amount}
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
        </div>
      ) : null}

      {!orders.length && tab === "ordini" ? (
        <div className="rounded-[24px] border border-dashed border-white/10 px-6 py-14 text-center text-white/60">
          Nessun ordine disponibile al momento.
        </div>
      ) : null}
    </ShopLayout>
  )
}
