import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import FaqSection from "../components/FaqSection";
import ContactStrip from "../components/ContactStrip";

export default function HomePage({ featured, settings }) {
  return (
    <div className="page">
      <section className="hero premium-hero reveal">
        <div className="hero-copy hero-centered">
          <p className="eyebrow">Collezione premium</p>
          <h1>{settings.storeName || "bns studio"}</h1>
          <p className="lede">{settings.heroHeadline || "Poster minimali per interni essenziali."}</p>
          <p className="hero-support">Stampe curate per case, studi e spazi che cercano equilibrio visivo, ritmo editoriale e una presenza pulita.</p>
          <div className="hero-actions">
            <Link className="button button-primary" to="/shop">
              Scopri i poster
            </Link>
            <Link className="button button-secondary" to="/auth">
              Area cliente
            </Link>
          </div>
        </div>
        <div className="hero-aside">
          <div className="hero-stat">
            <span className="eyebrow">Edizione</span>
            <strong>01</strong>
          </div>
          <div className="hero-card">
            <p className="eyebrow">Stampe curate</p>
            <h2>Forme pulite, contrasti calibrati e semplicità da galleria.</h2>
          </div>
        </div>
      </section>

      <section className="section reveal">
        <div className="section-heading">
          <div>
            <p className="eyebrow">In evidenza</p>
            <h2>Poster selezionati</h2>
            <p className="section-subcopy">Una selezione essenziale di poster contemporanei con palette sobrie e composizione decisa.</p>
          </div>
          <Link to="/shop">Vedi tutto</Link>
        </div>
        <div className="product-grid">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="section editorial-band reveal">
        <div>
          <p className="eyebrow">Note di studio</p>
          <h2>Progettati per vivere bene in spazi calmi e intenzionali.</h2>
        </div>
        <p>
          Ogni poster è presentato con un'interfaccia misurata e un checkout lineare, così il prodotto resta al centro senza distrazioni superflue.
        </p>
      </section>
      <FaqSection />
      <ContactStrip />
    </div>
  );
}
