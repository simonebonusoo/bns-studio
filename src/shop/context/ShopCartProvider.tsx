import { createContext, useContext, useEffect, useState } from "react"
import { ShopCartItem, ShopProduct } from "../types"
import { getDefaultFormat } from "../lib/product"

type CartContextValue = {
  items: ShopCartItem[]
  couponCode: string
  setCouponCode: (value: string) => void
  addItem: (product: ShopProduct, quantity?: number, format?: "A3" | "A4") => void
  beginCheckout: (product: ShopProduct, quantity?: number, format?: "A3" | "A4") => void
  updateItem: (productId: number, quantity: number, format?: "A3" | "A4") => void
  removeItem: (productId: number, format?: "A3" | "A4") => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

function readItems() {
  try {
    return (JSON.parse(localStorage.getItem("bns_shop_cart") || "[]") as ShopCartItem[]).map((item) => ({
      ...item,
      format: item.format || getDefaultFormat(item.product),
    }))
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

  function addItem(product: ShopProduct, quantity = 1, format = getDefaultFormat(product)) {
    setItems((current) => {
      const existing = current.find((item) => item.productId === product.id && (item.format || getDefaultFormat(item.product)) === format)
      if (existing) {
        return current.map((item) =>
          item.productId === product.id && (item.format || getDefaultFormat(item.product)) === format
            ? { ...item, quantity: item.quantity + quantity, product, format }
            : item
        )
      }
      return [...current, { productId: product.id, quantity, product, format }]
    })
  }

  function updateItem(productId: number, quantity: number, format?: "A3" | "A4") {
    setItems((current) =>
      current
        .map((item) =>
          item.productId === productId && (format ? item.format === format : true) ? { ...item, quantity } : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  function removeItem(productId: number, format?: "A3" | "A4") {
    setItems((current) => current.filter((item) => !(item.productId === productId && (format ? item.format === format : true))))
  }

  function beginCheckout(product: ShopProduct, quantity = 1, format = getDefaultFormat(product)) {
    setItems([{ productId: product.id, quantity, product, format }])
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
