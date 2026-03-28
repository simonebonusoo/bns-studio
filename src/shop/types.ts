export type ProductStatus = "draft" | "active" | "hidden" | "out_of_stock"
export type StockStatus = "in_stock" | "low_stock" | "out_of_stock"

export type ShopProductVariant = {
  id?: number | null
  title: string
  key: string
  sku?: string | null
  options?: Array<{
    name: string
    value: string
  }>
  optionSummary?: string | null
  price: number
  costPrice?: number
  stock: number
  lowStockThreshold: number
  position: number
  isDefault: boolean
  isActive: boolean
  legacyFormat?: string | null
  stockStatus?: StockStatus
}

export type ProductTag = {
  id: number
  name: string
  slug: string
}

export type ProductCollection = {
  id: number
  title: string
  slug: string
  description?: string
  active: boolean
}

export type ProductManualBadge = {
  id: string
  label: string
  enabled: boolean
}

export type ProductVisibleBadge = {
  key: string
  label: string
  source: "manual" | "automatic"
}

export type ShopUser = {
  id: number
  email: string
  username: string
  firstName: string
  lastName: string
  role: string
}

export type ShopProduct = {
  id: number
  title: string
  slug: string
  sku?: string | null
  description: string
  status: ProductStatus
  price: number
  priceA3?: number | null
  priceA4?: number | null
  costPrice?: number
  hasA3?: boolean
  hasA4?: boolean
  defaultFormat?: "A3" | "A4"
  availableFormats?: Array<"A3" | "A4">
  category: string
  imageUrls: string[]
  coverImageUrl?: string
  featured: boolean
  stock: number
  lowStockThreshold?: number
  stockStatus?: StockStatus
  stockLabel?: string
  variants?: ShopProductVariant[]
  defaultVariantId?: number | null
  manualBadges?: ProductManualBadge[]
  badges?: ProductVisibleBadge[]
  tags?: ProductTag[]
  collections?: ProductCollection[]
  isPurchasable?: boolean
  createdAt?: string
  updatedAt?: string
}

export type ShopProductListResponse = {
  items: ShopProduct[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export type AdminCollection = ProductCollection & {
  _count?: {
    products: number
  }
}

export type ShopCartItem = {
  productId: number
  quantity: number
  format?: string
  variantId?: number | null
  variantLabel?: string | null
  variantSku?: string | null
  product: ShopProduct
}

export type PricingItem = {
  productId: number
  slug: string
  title: string
  imageUrl: string
  format?: string
  variantId?: number | null
  variantLabel?: string | null
  variantSku?: string | null
  unitPrice: number
  unitCost?: number
  quantity: number
  lineTotal: number
  costTotal?: number
}

export type ShopPricing = {
  items: PricingItem[]
  subtotal: number
  shippingBase: number
  shippingTotal: number
  automaticDiscount: number
  couponDiscount: number
  discountTotal: number
  total: number
  appliedCoupon: string | null
  appliedRules: { type: string; label: string; amount: number }[]
}

export type ShopOrderItem = {
  id: number
  productId: number
  variantId?: number | null
  title: string
  imageUrl: string
  format?: string | null
  variantLabel?: string | null
  variantSku?: string | null
  unitPrice: number
  unitCost?: number
  quantity: number
  lineTotal: number
  costTotal?: number
}

export type ShopOrder = {
  id: number
  orderReference: string
  email: string
  firstName: string
  lastName: string
  addressLine1: string
  addressLine2?: string | null
  city: string
  postalCode: string
  country: string
  status: string
  subtotal: number
  discountTotal: number
  shippingTotal: number
  total: number
  couponCode?: string | null
  createdAt: string
  pricingBreakdown: ShopPricing
  items: ShopOrderItem[]
}

export type ShopSettings = Record<string, string>

export type ShopPayment = {
  redirectUrl: string
  mode: "paypal_standard" | "paypal_me"
  currencyCode: string
  orderReference: string
  amount: number
  subtotal: number
  discountTotal: number
  shippingTotal: number
}

export type ShopReview = {
  id: string
  rating: number
  title: string
  body: string
  tag: string
  status?: string
  showOnHomepage?: boolean
  createdAt: string
  authorName: string
}

export type ShopReviewSummary = {
  averageRating: number
  count: number
}
