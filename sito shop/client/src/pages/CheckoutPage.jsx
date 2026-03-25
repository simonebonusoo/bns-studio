import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { apiFetch } from "../lib/api";
import { formatPrice } from "../lib/format";

export default function CheckoutPage() {
  const { user } = useAuth();
  const { items, couponCode } = useCart();
  const [pricing, setPricing] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: user?.email || "",
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    postalCode: "",
    country: "Italy"
  });

  useEffect(() => {
    if (!items.length) return;
    apiFetch("/store/pricing/preview", {
      method: "POST",
      body: JSON.stringify({
        items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        couponCode: couponCode || null
      })
    }).then(setPricing).catch((err) => setError(err.message));
  }, [items, couponCode]);

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      const data = await apiFetch("/orders/checkout", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          couponCode: couponCode || null,
          items: items.map((item) => ({ productId: item.productId, quantity: item.quantity }))
        })
      });
      navigate("/checkout/confirm", { state: data });
    } catch (err) {
      setError(err.message);
    }
  }

  if (!items.length) {
    return <div className="page"><div className="empty-state"><h3>Il carrello è vuoto</h3><p>Aggiungi dei poster prima di procedere al checkout.</p></div></div>;
  }

  return (
    <div className="page checkout-layout reveal">
      <form className="card form form-lined checkout-form glass-panel" onSubmit={handleSubmit}>
        <img className="checkout-logo" src="/brand/logo.png" alt="bns studio logo" />
        <div>
          <p className="eyebrow">Checkout sicuro</p>
          <h1>Dati di spedizione</h1>
          <p className="section-subcopy">Checkout essenziale in due passaggi. Salviamo prima l'ordine e poi ti reindirizziamo su PayPal con il totale esatto.</p>
        </div>
        <input type="email" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        <input placeholder="Nome" value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} />
        <input placeholder="Cognome" value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} />
        <input placeholder="Indirizzo" value={form.addressLine1} onChange={(event) => setForm({ ...form, addressLine1: event.target.value })} />
        <input placeholder="Interno, scala, dettagli aggiuntivi" value={form.addressLine2} onChange={(event) => setForm({ ...form, addressLine2: event.target.value })} />
        <input placeholder="Città" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} />
        <input placeholder="CAP" value={form.postalCode} onChange={(event) => setForm({ ...form, postalCode: event.target.value })} />
        <input placeholder="Paese" value={form.country} onChange={(event) => setForm({ ...form, country: event.target.value })} />
        {error ? <p className="error-text">{error}</p> : null}
        <button className="button button-primary" type="submit">Rivedi il pagamento PayPal</button>
      </form>
      <aside className="card summary checkout-summary editorial-summary glass-panel">
        <p className="eyebrow">Riepilogo ordine</p>
        <h2>Revisione finale</h2>
        <div className="stack order-mini-list">
          {items.map((item) => (
            <div className="row-between" key={item.productId}>
              <span>{item.product.title} × {item.quantity}</span>
              <span>{formatPrice(item.product.price * item.quantity)}</span>
            </div>
          ))}
        </div>
        {pricing ? (
          <>
            <div className="row-between"><span>Subtotale</span><span>{formatPrice(pricing.subtotal)}</span></div>
            <div className="row-between"><span>Sconti</span><span>-{formatPrice(pricing.discountTotal)}</span></div>
            <div className="row-between"><span>Spedizione</span><span>{formatPrice(pricing.shippingTotal)}</span></div>
            <div className="row-between total-row"><strong>Totale</strong><strong>{formatPrice(pricing.total)}</strong></div>
            <p className="small-text">Questo totale viene ricalcolato lato server prima di generare il reindirizzamento a PayPal.</p>
          </>
        ) : null}
      </aside>
    </div>
  );
}
