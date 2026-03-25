import { NavLink, Outlet } from "react-router-dom";

export default function AdminLayout() {
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar glass-panel">
        <img className="admin-logo" src="/brand/logo.png" alt="bns studio logo" />
        <div>
          <p className="eyebrow">Admin</p>
          <h2>bns studio</h2>
        </div>
        <NavLink to="/admin">Dashboard</NavLink>
        <NavLink to="/admin/products">Prodotti</NavLink>
        <NavLink to="/admin/orders">Ordini</NavLink>
        <NavLink to="/admin/discounts">Sconti</NavLink>
        <NavLink to="/admin/settings">Impostazioni</NavLink>
      </aside>
      <section className="admin-content">
        <Outlet />
      </section>
    </div>
  );
}
