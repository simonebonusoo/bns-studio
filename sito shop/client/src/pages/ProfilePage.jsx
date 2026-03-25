import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../lib/api";
import { formatPrice } from "../lib/format";
import OrderInvoiceButton from "../components/OrderInvoiceButton";

export default function ProfilePage({ settings = {} }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    apiFetch("/orders/my-orders").then(setOrders);
  }, []);

  return (
    <div className="page reveal">
      <section className="section profile-hero">
        <p className="eyebrow">Profilo</p>
        <h1>{user.firstName} {user.lastName}</h1>
        <p className="section-subcopy">{user.email}</p>
      </section>
      <section className="section">
        <div className="section-heading">
          <h2>Storico ordini</h2>
        </div>
        {!orders.length ? <div className="empty-state"><h3>Nessun ordine ancora</h3><p>Qui compariranno gli ordini completati o in attesa, con accesso alla ricevuta PDF.</p></div> : null}
        <div className="stack">
          {orders.map((order) => (
            <article key={order.id} className="card profile-order-card glass-panel">
              <div className="row-between">
                <div>
                  <h3>{order.orderReference}</h3>
                  <p>{new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <span className="pill">{statusLabel(order.status)}</span>
              </div>
              <div className="row-between"><span>Totale</span><strong>{formatPrice(order.total)}</strong></div>
              <div className="row-between"><span>Sconto</span><span>{formatPrice(order.discountTotal)}</span></div>
              <div className="row-between"><span>Spedizione</span><span>{formatPrice(order.shippingTotal)}</span></div>
              <div className="inline-actions">
                <OrderInvoiceButton order={order} settings={settings} label="Scarica PDF" />
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function statusLabel(status) {
  if (status === "pending") return "In attesa";
  if (status === "paid") return "Pagato";
  if (status === "shipped") return "Spedito";
  return status;
}
