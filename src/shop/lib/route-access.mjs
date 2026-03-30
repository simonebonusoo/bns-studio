export function canAccessCustomerCheckout({ user, effectiveRole }) {
  if (!user) return { allowed: false, reason: "unauthenticated" }
  if (effectiveRole !== "customer") return { allowed: false, reason: "not_customer" }
  return { allowed: true, reason: "ok" }
}
