import { createContext, useContext, useEffect, useState } from "react"
import { ShopCartItem, ShopProduct } from "../types"

type CartContextValue = {
  items: ShopCartItem[]
  couponCode: string
  setCouponCode: (value: string) => void
  addItem: (product: ShopProduct, quantity?: number) => void
  beginCheckout: (product: ShopProduct, quantity?: number) => void
  updateItem: (productId: number, quantity: number) => void
  removeItem: (productId: number) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

function readItems() {
  try {
    return JSON.parse(localStorage.getItem("bns_shop_cart") || "[]") as ShopCartItem[]
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

  function addItem(product: ShopProduct, quantity = 1) {
    setItems((current) => {
      const existing = current.find((item) => item.productId === product.id)
      if (existing) {
        return current.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + quantity, product } : item
        )
      }
      return [...current, { productId: product.id, quantity, product }]
    })
  }

  function updateItem(productId: number, quantity: number) {
    setItems((current) =>
      current.map((item) => (item.productId === productId ? { ...item, quantity } : item)).filter((item) => item.quantity > 0)
    )
  }

  function removeItem(productId: number) {
    setItems((current) => current.filter((item) => item.productId !== productId))
  }

  function beginCheckout(product: ShopProduct, quantity = 1) {
    setItems([{ productId: product.id, quantity, product }])
    setCouponCode("")
  }

  function clearCart() {
    setItems([])
    setCouponCode("")
  }

  return (
    <CartContext.Provider value={{ items, couponCode, setCouponCode, addItem, beginCheckout, updateItem, removeItem, clearCart }}>
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
