import { useSearchParams } from "react-router-dom";

export default function PaypalReturnPage() {
  const [params] = useSearchParams();
  const orderRef = params.get("orderRef");

  return (
    <div className="page narrow-page reveal">
      <div className="card stack payment-card glass-panel">
        <img className="checkout-logo" src="/brand/logo.png" alt="bns studio logo" />
        <p className="eyebrow">Rientro da PayPal</p>
        <h1>Grazie.</h1>
        <p className="section-subcopy">Il tuo ordine è stato creato prima del reindirizzamento, quindi il team può verificare il pagamento usando il riferimento salvato.</p>
        <p>Riferimento: {orderRef || "Non disponibile"}</p>
        <p>Un admin può confermare il pagamento e aggiornare lo stato dell'ordine in pagato o spedito dalla dashboard.</p>
      </div>
    </div>
  );
}
