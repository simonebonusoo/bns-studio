import { formatPrice } from "./format";

export async function downloadInvoicePdf(order, settings = {}) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({
    unit: "pt",
    format: "a4"
  });

  const storeName = settings.storeName || "bns studio";
  const primary = settings.primaryColor || "#000000";
  const marginX = 56;
  let y = 72;

  doc.setFillColor(8, 8, 8);
  doc.rect(0, 0, 595, 842, "F");
  doc.setFillColor(227, 245, 3);
  doc.rect(0, 0, 18, 842, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(42);
  doc.text("order.", marginX, y);

  y += 38;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text(storeName, marginX, y);
  doc.text(`Reference ${order.orderReference}`, 520, y, { align: "right" });

  y += 48;
  doc.setTextColor(185, 185, 185);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("BILL TO", marginX, y);
  doc.text("ORDER DATE", 320, y);

  y += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  const customerLines = [
    `${order.firstName} ${order.lastName}`,
    order.email,
    order.addressLine1,
    order.addressLine2,
    `${order.postalCode} ${order.city}`,
    order.country
  ].filter(Boolean);

  customerLines.forEach((line, index) => {
    doc.text(line, marginX, y + index * 16);
  });

  doc.text(new Date(order.createdAt).toLocaleDateString(), 320, y);
  doc.text(`Status ${order.status}`, 320, y + 18);

  y += 128;
  doc.setDrawColor(80);
  doc.line(marginX, y, 540, y);
  y += 24;

  doc.setTextColor(185, 185, 185);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("ITEM", marginX, y);
  doc.text("QTY", 360, y);
  doc.text("TOTAL", 540, y, { align: "right" });

  y += 18;
  doc.line(marginX, y, 540, y);
  y += 24;

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  order.items.forEach((item) => {
    doc.text(item.title, marginX, y);
    doc.text(String(item.quantity), 360, y);
    doc.text(formatPrice(item.lineTotal), 540, y, { align: "right" });
    y += 22;
  });

  y += 18;
  doc.setDrawColor(80);
  doc.line(280, y, 540, y);
  y += 22;

  const totals = [
    ["Subtotale", formatPrice(order.subtotal)],
    ["Sconto", `-${formatPrice(order.discountTotal)}`],
    ["Spedizione", formatPrice(order.shippingTotal)],
    ["Totale", formatPrice(order.total)]
  ];

  totals.forEach(([label, value], index) => {
    doc.setFont("helvetica", index === totals.length - 1 ? "bold" : "normal");
    doc.setTextColor(index === totals.length - 1 ? 227 : 210, index === totals.length - 1 ? 245 : 210, index === totals.length - 1 ? 3 : 210);
    doc.text(label, 360, y);
    doc.setTextColor(255, 255, 255);
    doc.text(value, 540, y, { align: "right" });
    y += 20;
  });

  y += 48;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(227, 245, 3);
  doc.text("ricevuta.", marginX, y);
  y += 20;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(185, 185, 185);
  doc.text("Ricevuta minimale per il tuo ordine bns studio.", marginX, y);

  doc.save(`${order.orderReference}.pdf`);
}
