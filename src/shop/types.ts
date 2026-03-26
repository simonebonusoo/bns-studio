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
  description: string
  price: number
  category: string
  imageUrls: string[]
  featured: boolean
  stock: number
  createdAt?: string
  updatedAt?: string
}

export type ShopCartItem = {
  productId: number
  quantity: number
  product: ShopProduct
}

export type PricingItem = {
  productId: number
  slug: string
  title: string
  imageUrl: string
  unitPrice: number
  quantity: number
  lineTotal: number
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
  title: string
  imageUrl: string
  unitPrice: number
  quantity: number
  lineTotal: number
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
  createdAt: string
  authorName: string
}

export type ShopReviewSummary = {
  averageRating: number
  count: number
}
