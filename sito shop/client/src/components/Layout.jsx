import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import Footer from "./Footer";

export default function Layout({ settings, children }) {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const logoSrc = settings.logoUrl || "/brand/logo.png";

  return (
    <div className="shell">
      <header className="topbar">
        <Link to="/" className="brand">
          <img className="brand-logo" src={logoSrc} alt={`${settings.storeName || "bns studio"} logo`} />
          <span className="brand-copy">
            <strong>{settings.storeName || "bns studio"}</strong>
            <small>Poster curati</small>
          </span>
        </Link>
        <nav className="nav">
          <NavLink to="/shop">Negozio</NavLink>
          {user ? <NavLink to="/profile">Profilo</NavLink> : <NavLink to="/auth">Accedi</NavLink>}
          {user?.role === "admin" ? <NavLink to="/admin">Admin</NavLink> : null}
          <NavLink to="/cart">Carrello <span className="nav-count">{cartCount}</span></NavLink>
          {user ? (
            <button className="link-button" onClick={logout}>
              Esci
            </button>
          ) : null}
        </nav>
      </header>
      <main>{children}</main>
      <Footer />
    </div>
  );
}
