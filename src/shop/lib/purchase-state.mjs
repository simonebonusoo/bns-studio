export function getProductPurchaseState({
  effectiveRole,
  purchasable,
  notifyInterest,
}) {
  const isAdmin = effectiveRole === "admin"

  return {
    showPurchaseActions: purchasable,
    showNotifyAction: !purchasable,
    showEditAction: isAdmin,
    showNotifyFeedback: !purchasable && notifyInterest,
  }
}
