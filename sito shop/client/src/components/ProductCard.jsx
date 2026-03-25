import { Link } from "react-router-dom";
import { formatPrice } from "../lib/format";
import { resolveAssetUrl } from "../lib/assets";

export default function ProductCard({ product }) {
  return (
    <article className="product-card">
      <Link to={`/products/${product.slug}`}>
        <img src={resolveAssetUrl(product.imageUrls[0])} alt={product.title} />
      </Link>
      <div className="product-meta">
        <div>
          <p className="eyebrow">{product.category}</p>
          <h3>{product.title}</h3>
        </div>
        <div className="product-card-price">
          <span>{formatPrice(product.price)}</span>
          <small>Stampa artistica</small>
        </div>
      </div>
    </article>
  );
}
