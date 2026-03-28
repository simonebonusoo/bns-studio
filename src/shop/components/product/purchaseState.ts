export type ProductPurchaseState = {
  showPurchaseActions: boolean
  showNotifyAction: boolean
  showEditAction: boolean
  showNotifyFeedback: boolean
}

export { getProductPurchaseState } from "../../lib/purchase-state.mjs"
