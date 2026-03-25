import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { formatPrice } from "../lib/format";
import { useCart } from "../context/CartContext";
import { resolveAssetUrl } from "../lib/assets";

export default function ProductPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");
  const { addItem } = useCart();

  useEffect(() => {
    apiFetch(`/store/products/${slug}`).then((data) => {
      setProduct(data);
      setSelectedImage(data.imageUrls[0]);
    });
  }, [slug]);

  if (!product) {
    return <div className="page"><div className="empty-state"><h3>Caricamento poster</h3><p>Sto preparando la scheda prodotto.</p></div></div>;
  }

  return (
    <div className="page product-page reveal">
      <div className="gallery editorial-gallery">
        <img className="product-main-image" src={resolveAssetUrl(selectedImage)} alt={product.title} />
        <div className="gallery-strip">
          {product.imageUrls.map((image) => (
            <button key={image} className="thumb" onClick={() => setSelectedImage(image)}>
              <img src={resolveAssetUrl(image)} alt={product.title} />
            </button>
          ))}
        </div>
      </div>
      <div className="product-detail glass-panel">
        <p className="eyebrow">{product.category}</p>
        <h1>{product.title}</h1>
        <p className="price-tag">{formatPrice(product.price)}</p>
        <p className="detail-copy">{product.description}</p>
        <div className="detail-meta">
          <span>Poster in edizione</span>
          <span>Disponibilità {product.stock}</span>
        </div>
        <button className="button button-primary" onClick={() => addItem(product, 1)}>
          Aggiungi al carrello
        </button>
      </div>
    </div>
  );
}
