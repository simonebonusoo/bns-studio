import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { formatPrice } from "../lib/format";

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    apiFetch("/admin/dashboard").then(setData);
  }, []);

  if (!data) return <div className="card empty-state"><h3>Caricamento dashboard</h3><p>Sto raccogliendo i dati del negozio.</p></div>;

  return (
    <div className="stack">
      <div>
        <p className="eyebrow">Panoramica</p>
        <h1>Dashboard admin</h1>
      </div>
      <div className="admin-grid">
        <div className="card admin-stat glass-panel"><p>Fatturato</p><h2>{formatPrice(data.revenue)}</h2></div>
        <div className="card admin-stat glass-panel"><p>Ordini</p><h2>{data.orderCount}</h2></div>
      </div>
      <div className="card glass-panel">
        <h3>Prodotti più venduti</h3>
        {data.topProducts.map((item) => (
          <div className="row-between" key={item.title}><span>{item.title}</span><span>{item.quantity}</span></div>
        ))}
      </div>
      <div className="card glass-panel">
        <h3>Ordini recenti</h3>
        {data.recentOrders.map((order) => (
          <div className="row-between" key={order.id}><span>{order.orderReference}</span><span className="pill">{statusLabel(order.status)}</span></div>
        ))}
      </div>
    </div>
  );
}

function statusLabel(status) {
  if (status === "pending") return "In attesa";
  if (status === "paid") return "Pagato";
  if (status === "shipped") return "Spedito";
  return status;
}
