import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { apiFetch } from "../lib/api";
import { formatPrice } from "../lib/format";
import { resolveAssetUrl } from "../lib/assets";

export default function CartPage() {
  const { items, updateItem, removeItem, couponCode, setCouponCode } = useCart();
  const [pricing, setPricing] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!items.length) {
      setPricing(null);
      return;
    }
    apiFetch("/store/pricing/preview", {
      method: "POST",
      body: JSON.stringify({
        items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        couponCode: couponCode || null
      })
    })
      .then((data) => {
        setError("");
        setPricing(data);
      })
      .catch((err) => {
        setError(err.message);
        setPricing(null);
      });
  }, [items, couponCode]);

  return (
    <div className="page reveal">
      <section className="section cart-layout">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Carrello</p>
            <h1>La tua selezione</h1>
            <p className="section-subcopy">Controlla i poster, applica un coupon e procedi alla conferma finale del pagamento.</p>
          </div>
        </div>
        {!items.length ? <div className="empty-state"><h3>Il carrello è vuoto</h3><p><Link to="/shop">Sfoglia la collezione</Link> per aggiungere dei poster.</p></div> : null}
        <div className="stack">
          {items.map((item) => (
            <article key={item.productId} className="card cart-item premium-cart-item glass-panel">
              <img src={resolveAssetUrl(item.product.imageUrls?.[0] || item.product?.imageUrl)} alt={item.product.title} />
              <div>
                <p className="eyebrow">{item.product.category || "Poster"}</p>
                <h3>{item.product.title}</h3>
                <p>{formatPrice(item.product.price)}</p>
              </div>
              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(event) => updateItem(item.productId, Number(event.target.value))}
              />
              <button className="link-button" onClick={() => removeItem(item.productId)}>
                Rimuovi
              </button>
            </article>
          ))}
        </div>
        {items.length ? (
          <aside className="summary editorial-summary glass-panel">
            <p className="eyebrow">Riepilogo</p>
            <h2>Totali ordine</h2>
            <input
              placeholder="Codice coupon"
              value={couponCode}
              onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
            />
            {error ? <p className="error-text">{error}</p> : null}
            {pricing ? (
              <>
                <div className="row-between"><span>Subtotale</span><span>{formatPrice(pricing.subtotal)}</span></div>
                <div className="row-between"><span>Sconti</span><span>-{formatPrice(pricing.discountTotal)}</span></div>
                <div className="row-between"><span>Spedizione</span><span>{formatPrice(pricing.shippingTotal)}</span></div>
                <div className="row-between total-row"><strong>Totale</strong><strong>{formatPrice(pricing.total)}</strong></div>
                <Link className="button button-primary" to="/checkout">Vai al checkout</Link>
              </>
            ) : null}
          </aside>
        ) : null}
      </section>
    </div>
  );
}
