export function getOrderStatusLabel(status: string) {
  if (status === "pending") return "In attesa"
  if (status === "paid") return "Pagato"
  if (status === "shipped") return "Spedito"
  return status
}
