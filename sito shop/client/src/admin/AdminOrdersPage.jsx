import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { formatPrice } from "../lib/format";
import OrderInvoiceButton from "../components/OrderInvoiceButton";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);

  function load() {
    apiFetch("/admin/orders").then(setOrders);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="stack">
      <div>
        <p className="eyebrow">Ordini</p>
        <h1>Gestione ordini</h1>
      </div>
      {orders.map((order) => (
        <article key={order.id} className="card stack admin-order-card glass-panel">
          <div className="row-between">
            <div>
              <h3>{order.orderReference}</h3>
              <p>{order.user.firstName} {order.user.lastName} · {order.user.email}</p>
            </div>
            <select
              value={order.status}
              onChange={async (event) => {
                await apiFetch(`/admin/orders/${order.id}`, {
                  method: "PATCH",
                  body: JSON.stringify({ status: event.target.value })
                });
                load();
              }}
            >
              <option value="pending">In attesa</option>
              <option value="paid">Pagato</option>
              <option value="shipped">Spedito</option>
            </select>
          </div>
          <div className="row-between"><span>Totale</span><span>{formatPrice(order.total)}</span></div>
          <div className="row-between"><span>Sconto</span><span>{formatPrice(order.discountTotal)}</span></div>
          <div className="row-between"><span>Spedizione</span><span>{formatPrice(order.shippingTotal)}</span></div>
          <div className="inline-actions">
            <OrderInvoiceButton order={order} label="Scarica PDF" />
          </div>
        </article>
      ))}
    </div>
  );
}
