import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../lib/format";
import OrderInvoiceButton from "../components/OrderInvoiceButton";

export default function CheckoutConfirmPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const payload = location.state;

  useEffect(() => {
    if (!payload) {
      navigate("/checkout", { replace: true });
    }
  }, [payload, navigate]);

  if (!payload) return null;

  const { payment, order } = payload;

  function handleContinue() {
    clearCart();
    window.location.href = payment.redirectUrl;
  }

  return (
    <div className="page narrow-page reveal">
      <div className="card stack payment-card glass-panel">
        <img className="checkout-logo" src="/brand/logo.png" alt="bns studio logo" />
        <p className="eyebrow">Conferma pagamento</p>
        <h1>Continua su PayPal</h1>
        <p className="section-subcopy">Il tuo ordine è già stato salvato nel database come pagamento in attesa prima di lasciare il sito.</p>
        <p>Riferimento ordine: {payment.orderReference}</p>
        <div className="row-between"><span>Subtotale</span><span>{formatPrice(payment.subtotal, payment.currencyCode)}</span></div>
        <div className="row-between"><span>Sconti</span><span>-{formatPrice(payment.discountTotal, payment.currencyCode)}</span></div>
        <div className="row-between"><span>Spedizione</span><span>{formatPrice(payment.shippingTotal, payment.currencyCode)}</span></div>
        <div className="row-between total-row"><strong>Totale finale</strong><strong>{formatPrice(payment.amount, payment.currencyCode)}</strong></div>
        <p className="small-text">
          {payment.mode === "paypal_standard"
            ? "PayPal si aprirà con importo esatto e riferimento ordine già precompilati."
            : "PayPal.Me si aprirà con l'importo esatto precompilato. Il riferimento ordine resta salvato nel tuo profilo e in questa schermata."}
        </p>
        <button className="button button-primary" onClick={handleContinue}>
          Continua su PayPal
        </button>
        <button className="button button-secondary" onClick={() => navigate("/cart")}>
          Torna al carrello
        </button>
        <OrderInvoiceButton order={order} label="Scarica ricevuta PDF" />
        <p className="small-text">L'ordine resta in attesa finché non rientri da PayPal e l'admin non conferma il pagamento.</p>
      </div>
    </div>
  );
}
