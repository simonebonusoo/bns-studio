import { downloadInvoicePdf } from "../lib/invoice";

export default function OrderInvoiceButton({ order, settings, label = "Scarica PDF" }) {
  return (
    <button
      className="button button-secondary"
      onClick={() => downloadInvoicePdf(order, settings)}
      type="button"
    >
      {label}
    </button>
  );
}
