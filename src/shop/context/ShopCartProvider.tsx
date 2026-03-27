import { createContext, useContext, useEffect, useState } from "react"
import { ShopCartItem, ShopProduct } from "../types"
import { getDefaultVariant, resolveSelectedVariant } from "../lib/product"

type VariantSelection = {
  variantId?: number | null
  format?: string | null
  variantLabel?: string | null
  variantSku?: string | null
}

type CartContextValue = {
  items: ShopCartItem[]
  couponCode: string
  setCouponCode: (value: string) => void
  addItem: (product: ShopProduct, quantity?: number, selection?: VariantSelection) => void
  beginCheckout: (product: ShopProduct, quantity?: number, selection?: VariantSelection) => void
  updateItem: (productId: number, quantity: number, selection?: VariantSelection) => void
  removeItem: (productId: number, selection?: VariantSelection) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

function normalizeSelection(product: ShopProduct, selection?: VariantSelection) {
  const variant = resolveSelectedVariant(product, {
    variantId: selection?.variantId,
    format: selection?.format,
  }) || getDefaultVariant(product)

  return {
    variantId: variant?.id ?? selection?.variantId ?? null,
    format: selection?.format || variant?.title || null,
    variantLabel: selection?.variantLabel || variant?.title || null,
    variantSku: selection?.variantSku || variant?.sku || null,
  }
}

function selectionMatches(item: ShopCartItem, selection: VariantSelection) {
  if (selection.variantId && item.variantId) {
    return Number(item.variantId) === Number(selection.variantId)
  }

  return String(item.format || "") === String(selection.format || "")
}

function readItems() {
  try {
    return (JSON.parse(localStorage.getItem("bns_shop_cart") || "[]") as ShopCartItem[]).map((item) => {
      const normalized = normalizeSelection(item.product, {
        variantId: item.variantId,
        format: item.format,
        variantLabel: item.variantLabel,
        variantSku: item.variantSku,
      })

      return {
        ...item,
        ...normalized,
      }
    })
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
    const normalized = normalizeSelection(product, selection)

    setItems((current) => {
      const existing = current.find((item) => item.productId === product.id && selectionMatches(item, normalized))
      if (existing) {
        return current.map((item) =>
          item.productId === product.id && selectionMatches(item, normalized)
            ? { ...item, quantity: item.quantity + quantity, product, ...normalized }
            : item
        )
      }

      return [...current, { productId: product.id, quantity, product, ...normalized }]
    })
  }

  function updateItem(productId: number, quantity: number, selection?: VariantSelection) {
    setItems((current) =>
      current
        .map((item) =>
          item.productId === productId && selectionMatches(item, selection || item)
            ? { ...item, quantity }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  function removeItem(productId: number, selection?: VariantSelection) {
    setItems((current) => current.filter((item) => !(item.productId === productId && selectionMatches(item, selection || item))))
  }

  function beginCheckout(product: ShopProduct, quantity = 1, selection?: VariantSelection) {
    const normalized = normalizeSelection(product, selection)
    setItems([{ productId: product.id, quantity, product, ...normalized }])
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
