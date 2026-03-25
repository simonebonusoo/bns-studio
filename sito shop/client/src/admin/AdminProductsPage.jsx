import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";
import { resolveAssetUrl } from "../lib/assets";

const emptyProduct = {
  title: "",
  slug: "",
  description: "",
  price: 0,
  category: "",
  imageUrls: [],
  featured: false,
  stock: 0
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [message, setMessage] = useState("");

  function load() {
    apiFetch("/admin/products").then(setProducts);
  }

  useEffect(() => {
    load();
  }, []);

  const localPreviews = useMemo(
    () => selectedFiles.map((file) => URL.createObjectURL(file)),
    [selectedFiles]
  );

  useEffect(() => {
    return () => {
      localPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [localPreviews]);

  async function uploadFiles() {
    if (!selectedFiles.length) {
      return [];
    }
    const body = new FormData();
    selectedFiles.forEach((file) => body.append("images", file));
    const data = await apiFetch("/admin/uploads", {
      method: "POST",
      body
    });
    return data.files.map((file) => file.url);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    const uploadedUrls = await uploadFiles();
    const payload = {
      ...form,
      price: Number(form.price),
      stock: Number(form.stock),
      imageUrls: [...form.imageUrls, ...uploadedUrls]
    };

    if (editingId) {
      await apiFetch(`/admin/products/${editingId}`, { method: "PUT", body: JSON.stringify(payload) });
      setMessage("Prodotto aggiornato con successo.");
    } else {
      await apiFetch("/admin/products", { method: "POST", body: JSON.stringify(payload) });
      setMessage("Prodotto creato con successo.");
    }

    setForm(emptyProduct);
    setEditingId(null);
    setSelectedFiles([]);
    load();
  }

  function removeImage(index) {
    setForm((current) => ({
      ...current,
      imageUrls: current.imageUrls.filter((_, currentIndex) => currentIndex !== index)
    }));
  }

  return (
    <div className="stack">
      <form className="card form form-lined glass-panel" onSubmit={handleSubmit}>
        <p className="eyebrow">Prodotti</p>
        <h2>{editingId ? "Modifica prodotto" : "Nuovo prodotto"}</h2>
        <input placeholder="Titolo" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <input placeholder="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
        <textarea placeholder="Descrizione" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input placeholder="Prezzo in centesimi" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        <input placeholder="Categoria" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
        <input placeholder="Disponibilità" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
        <label><input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> In evidenza</label>
        <label className="stack">
          <span>Carica immagini prodotto</span>
          <input type="file" accept="image/*" multiple onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))} />
        </label>

        {form.imageUrls.length ? (
          <div className="admin-image-grid">
            {form.imageUrls.map((image, index) => (
              <div className="admin-image-preview" key={`${image}-${index}`}>
                <img src={resolveAssetUrl(image)} alt="" />
                <button type="button" className="button button-secondary" onClick={() => removeImage(index)}>
                  Rimuovi
                </button>
              </div>
            ))}
          </div>
        ) : null}

        {localPreviews.length ? (
          <div className="admin-image-grid">
            {localPreviews.map((image) => (
              <div className="admin-image-preview" key={image}>
                <img src={image} alt="" />
                <span className="small-text">Anteprima upload</span>
              </div>
            ))}
          </div>
        ) : null}

        {message ? <p className="small-text">{message}</p> : null}
        <button className="button button-primary" type="submit">{editingId ? "Salva modifiche" : "Salva prodotto"}</button>
      </form>
      <div className="stack">
        {products.map((product) => (
          <div className="card row-between admin-list-row glass-panel" key={product.id}>
            <div>
              <strong>{product.title}</strong>
              <p className="small-text">{product.category} · {product.stock} disponibili</p>
            </div>
            <div className="inline-actions">
              <button onClick={() => {
                setEditingId(product.id);
                setSelectedFiles([]);
                setForm({
                  ...product,
                  imageUrls: product.imageUrls
                });
              }}>Modifica</button>
              <button onClick={async () => {
                await apiFetch(`/admin/products/${product.id}`, { method: "DELETE" });
                load();
              }}>Elimina</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
