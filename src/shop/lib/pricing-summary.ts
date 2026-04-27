import { formatPrice } from "./format"
import { ShopPricing, ThreeForTwoDiscountDetail } from "../types"

export function getThreeForTwoDiscountForLine(pricing: ShopPricing | null, lineIndex: number) {
  return getThreeForTwoItems(pricing).find((entry) => entry.lineIndex === lineIndex) || null
}

export function getThreeForTwoItems(pricing: ShopPricing | null) {
  return pricing?.threeForTwoItems || pricing?.threeForTwoDiscounts || []
}

export function getThreeForTwoDiscountAmount(pricing: ShopPricing | null) {
  if (typeof pricing?.threeForTwoDiscount === "number") return pricing.threeForTwoDiscount
  return getThreeForTwoItems(pricing).reduce((sum, entry) => sum + entry.discountAmount, 0)
}

export function getThreeForTwoDiscountSummaryRows(pricing: ShopPricing | null) {
  return getThreeForTwoItems(pricing).map((entry) => ({
    key: `3x2-${entry.lineIndex}`,
    label: `3x2: ${entry.title}`,
    description:
      entry.quantityDiscounted > 1
        ? `${entry.quantityDiscounted} unità gratis con 3x2`
        : "Prodotto meno costoso gratis",
    amount: entry.discountAmount,
  }))
}

export function getAdditionalDiscountSummaryRows(pricing: ShopPricing | null) {
  return (pricing?.appliedRules || [])
    .filter((rule) => rule.amount > 0 && rule.type !== "automatic_3x2" && rule.type !== "shipping")
    .map((rule) => ({
      key: `${rule.type}-${rule.label}`,
      label: rule.type === "coupon" ? `Coupon ${rule.label}` : rule.label,
      description: rule.type === "coupon" ? "Sconto applicato da coupon" : "Sconto automatico",
      amount: rule.amount,
    }))
}

export function formatThreeForTwoLineMessage(discount: ThreeForTwoDiscountDetail | null) {
  if (!discount) return ""
  if (discount.quantityDiscounted > 1) {
    return `Gratis con 3x2: ${discount.quantityDiscounted} unità`
  }
  return "Gratis con 3x2"
}

export function formatThreeForTwoPricePreview(discount: ThreeForTwoDiscountDetail | null) {
  if (!discount) return ""
  const originalTotal = discount.originalPrice * discount.quantityDiscounted
  return `${formatPrice(originalTotal)} → ${formatPrice(discount.discountedPrice)}`
}
