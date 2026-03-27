import { prisma } from "./prisma.mjs"

export const PRODUCT_ORDER_SETTING_KEY = "homepageProductOrder"

export function parseStoredProductOrder(orderValue) {
  if (!orderValue) return []

  try {
    const parsed = JSON.parse(orderValue)
    if (!Array.isArray(parsed)) return []

    return Array.from(
      new Set(
        parsed
          .map((value) => Number(value))
          .filter((value) => Number.isInteger(value) && value > 0)
      )
    )
  } catch {
    return []
  }
}

export function applyStoredProductOrder(products, orderValue) {
  const storedOrder = parseStoredProductOrder(orderValue)
  if (!storedOrder.length) return products

  const rank = new Map(storedOrder.map((id, index) => [id, index]))

  return [...products].sort((a, b) => {
    const aRank = rank.has(a.id) ? rank.get(a.id) : Number.MAX_SAFE_INTEGER
    const bRank = rank.has(b.id) ? rank.get(b.id) : Number.MAX_SAFE_INTEGER
    if (aRank !== bRank) return aRank - bRank
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
}

export async function getStoredProductOrderSetting() {
  return prisma.setting.findUnique({
    where: { key: PRODUCT_ORDER_SETTING_KEY },
  })
}

export async function loadProductsWithStoredOrder(findManyArgs = {}) {
  const [products, orderSetting] = await Promise.all([
    prisma.product.findMany(findManyArgs),
    getStoredProductOrderSetting(),
  ])

  return applyStoredProductOrder(products, orderSetting?.value)
}

export async function saveProductOrder(productIds) {
  const normalizedIds = Array.from(
    new Set(
      productIds
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0)
    )
  )

  return prisma.setting.upsert({
    where: { key: PRODUCT_ORDER_SETTING_KEY },
    update: { value: JSON.stringify(normalizedIds) },
    create: { key: PRODUCT_ORDER_SETTING_KEY, value: JSON.stringify(normalizedIds) },
  })
}
