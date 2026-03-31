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
  discountPrice?: number | null
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
  discountPrice?: number | null
  priceA3?: number | null
  discountPriceA3?: number | null
  priceA4?: number | null
  discountPriceA4?: number | null
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
  shippingMethod?: string | null
  shippingCarrier?: string | null
  shippingLabel?: string | null
  shippingCost?: number | null
  shippingError?: string | null
  availableShippingRates?: Array<{
    key: string
    carrier: string
    carrierLabel: string
    label: string
    description: string
    cost: number
    source?: string | null
    meta?: Record<string, unknown> | null
  }>
  subtotal: number
  shippingBase: number | null
  shippingTotal: number | null
  automaticDiscount: number
  couponDiscount: number
  discountTotal: number
  total: number
  appliedCoupon: string | null
  appliedRules: { type: string; label: string; amount: number }[]
  isShippingPending?: boolean
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
  phone?: string | null
  addressLine1: string
  addressLine2?: string | null
  streetNumber?: string | null
  staircase?: string | null
  apartment?: string | null
  floor?: string | null
  intercom?: string | null
  deliveryNotes?: string | null
  city: string
  region?: string | null
  postalCode: string
  country: string
  status: string
  fulfillmentStatus?: string | null
  shippingMethod?: string | null
  shippingCarrier?: string | null
  shippingLabel?: string | null
  shippingHandoffMode?: string | null
  shippingStatus?: string | null
  shippingCost?: number | null
  shipmentReference?: string | null
  shipmentUrl?: string | null
  trackingNumber?: string | null
  subtotal: number
  discountTotal: number
  shippingTotal: number
  total: number
  couponCode?: string | null
  trackingUrl?: string | null
  shippingCreatedAt?: string | null
  dhlShipmentReference?: string | null
  labelUrl?: string | null
  shippingProviderPayload?: Record<string, unknown> | null
  shippingError?: string | null
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
