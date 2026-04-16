import { ShopOrder, ShopSettings } from "../types"
import { formatPrice } from "./format"
import { formatVariantSelectionLabel } from "./product"
import { formatShippingAddressLines } from "./shipping-details.mjs"

export async function downloadInvoicePdf(order: ShopOrder, settings: ShopSettings = {}) {
  const { jsPDF } = await import("jspdf")
  const doc = new jsPDF({ unit: "pt", format: "a4" })

  const storeName = settings.storeName || "BNS Studio Shop"
  const margin = 56
  let y = 72

  doc.setFillColor(8, 8, 8)
  doc.rect(0, 0, 595, 842, "F")
  doc.setFillColor(227, 245, 3)
  doc.rect(0, 0, 18, 842, "F")

  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(34)
  doc.text("receipt.", margin, y)

  y += 34
  doc.setFont("helvetica", "normal")
  doc.setFontSize(12)
  doc.text(storeName, margin, y)
  doc.text(order.orderReference, 540, y, { align: "right" })

  y += 44
  doc.setTextColor(190, 190, 190)
  doc.text("Bill to", margin, y)
  doc.text("Date", 320, y)

  y += 18
  doc.setTextColor(255, 255, 255)
  const shipping = formatShippingAddressLines(order)
  ;[
    shipping.personLine,
    ...shipping.contactLines,
    ...shipping.addressLines,
  ]
    .filter(Boolean)
    .forEach((line, index) => {
      doc.text(String(line), margin, y + index * 16)
    })

  doc.text(new Date(order.createdAt).toLocaleDateString("it-IT"), 320, y)
  doc.text(`Status ${order.status}`, 320, y + 18)

  y += 128
  doc.setDrawColor(80)
  doc.line(margin, y, 540, y)
  y += 24

  doc.setTextColor(190, 190, 190)
  doc.text("Item", margin, y)
  doc.text("Qty", 360, y)
  doc.text("Total", 540, y, { align: "right" })
  y += 18
  doc.line(margin, y, 540, y)
  y += 24

  doc.setTextColor(255, 255, 255)
  order.items.forEach((item) => {
    doc.text(`${item.title} · ${formatVariantSelectionLabel(item)}`, margin, y)
    doc.text(String(item.quantity), 360, y)
    doc.text(formatPrice(item.lineTotal), 540, y, { align: "right" })
    y += 22
    if (item.personalizationText) {
      doc.setTextColor(190, 190, 190)
      doc.text(`Personalizzazione: ${item.personalizationText}`, margin, y)
      doc.setTextColor(255, 255, 255)
      y += 18
    }
  })

  y += 12
  doc.line(280, y, 540, y)
  y += 24

  ;[
    ["Subtotale", formatPrice(order.subtotal)],
    ["Sconti", `-${formatPrice(order.discountTotal)}`],
    ["Spedizione", formatPrice(order.shippingTotal)],
    ["Totale", formatPrice(order.total)],
  ].forEach(([label, value], index, array) => {
    doc.setFont("helvetica", index === array.length - 1 ? "bold" : "normal")
    doc.text(label, 360, y)
    doc.text(value, 540, y, { align: "right" })
    y += 20
  })

  doc.save(`${order.orderReference}.pdf`)
}
