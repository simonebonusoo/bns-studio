import { createContext, useContext, useEffect, useState } from "react"
import { ShopCartItem, ShopProduct } from "../types"
import { addCartItem, beginCheckoutCart, normalizeStoredCartItems, removeCartItem, updateCartItem } from "../lib/cart-state.mjs"

type VariantSelection = {
  variantId?: number | null
  format?: string | null
  variantLabel?: string | null
  variantSku?: string | null
  personalizationText?: string | null
  personalizationImageUrl?: string | null
}

type CartContextValue = {
  items: ShopCartItem[]
  couponCode: string
  setCouponCode: (value: string) => void
  addItem: (product: ShopProduct, quantity?: number, selection?: VariantSelection) => void
  beginCheckout: (product: ShopProduct, quantity?: number, selection?: VariantSelection) => void
  updateItem: (productId: number, quantity: number, selection?: VariantSelection) => void
  removeItem: (productId: number, selection?: VariantSelection) => void
  decrementItem: (productId: number, selection?: VariantSelection) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

function readItems() {
  try {
    return normalizeStoredCartItems(JSON.parse(localStorage.getItem("bns_shop_cart") || "[]") as ShopCartItem[])
  } catch {
    return []
  }
}

export function ShopCartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ShopCartItem[]>(readItems)
  const [couponCode, setCouponCode] = useState(localStorage.getItem("bns_shop_coupon") || "")

  useEffect(() => {
    localStorage.setItem("bns_shop_cart", JSON.stringify(items))
  }, [items])

  useEffect(() => {
    localStorage.setItem("bns_shop_coupon", couponCode)
  }, [couponCode])

  function addItem(product: ShopProduct, quantity = 1, selection?: VariantSelection) {
    setItems((current) => addCartItem(current, product, quantity, selection))
  }

  function updateItem(productId: number, quantity: number, selection?: VariantSelection) {
    setItems((current) => updateCartItem(current, productId, quantity, selection))
  }

  function removeItem(productId: number, selection?: VariantSelection) {
    setItems((current) => removeCartItem(current, productId, selection))
  }

  function decrementItem(productId: number, selection?: VariantSelection) {
    setItems((current) => removeCartItem(current, productId, selection))
  }

  function beginCheckout(product: ShopProduct, quantity = 1, selection?: VariantSelection) {
    setItems(beginCheckoutCart(product, quantity, selection))
    setCouponCode("")
  }

  function clearCart() {
    setItems([])
    setCouponCode("")
  }

  return (
    <CartContext.Provider value={{ items, couponCode, setCouponCode, addItem, beginCheckout, updateItem, removeItem, decrementItem, clearCart }}>
      {children}
    </CartContext.Provider>
  )
}

export function useShopCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useShopCart must be used within ShopCartProvider")
  }
  return context
}
