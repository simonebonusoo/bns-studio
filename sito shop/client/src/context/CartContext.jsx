import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext(null);

function readInitialCart() {
  try {
    return JSON.parse(localStorage.getItem("bns_cart") || "[]");
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readInitialCart);
  const [couponCode, setCouponCode] = useState(localStorage.getItem("bns_coupon") || "");

  useEffect(() => {
    localStorage.setItem("bns_cart", JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem("bns_coupon", couponCode);
  }, [couponCode]);

  function addItem(product, quantity = 1) {
    setItems((current) => {
      const found = current.find((item) => item.productId === product.id);
      if (found) {
        return current.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + quantity, product }
            : item
        );
      }
      return [...current, { productId: product.id, quantity, product }];
    });
  }

  function updateItem(productId, quantity) {
    setItems((current) =>
      current
        .map((item) => (item.productId === productId ? { ...item, quantity } : item))
        .filter((item) => item.quantity > 0)
    );
  }

  function removeItem(productId) {
    setItems((current) => current.filter((item) => item.productId !== productId));
  }

  function clearCart() {
    setItems([]);
    setCouponCode("");
  }

  return (
    <CartContext.Provider
      value={{
        items,
        couponCode,
        setCouponCode,
        addItem,
        updateItem,
        removeItem,
        clearCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}

