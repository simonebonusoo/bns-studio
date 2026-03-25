const faqItems = [
  {
    question: "Come viene gestito un ordine?",
    answer: "Ogni ordine viene salvato prima del reindirizzamento al pagamento e poi monitorato dall'area admin fino alla conferma finale."
  },
  {
    question: "Posso trovare facilmente uno stile preciso?",
    answer: "La collezione è organizzata per categorie e filtri essenziali, così da trovare rapidamente il poster più adatto al proprio spazio."
  },
  {
    question: "Come vengono applicati gli sconti?",
    answer: "Gli sconti vengono calcolati lato server, combinando regole automatiche e coupon validi prima di generare il totale finale."
  },
  {
    question: "Cosa succede dopo PayPal?",
    answer: "La schermata di rientro conferma il riferimento ordine e permette al team di verificare il pagamento e aggiornare lo stato."
  }
];

export default function FaqSection() {
  return (
    <section className="section support-section reveal">
      <div className="section-heading section-heading-stacked">
        <div>
          <p className="eyebrow">Supporto</p>
          <h2>Risposte chiare, interfaccia essenziale.</h2>
          <p className="section-subcopy">
            Una sezione di supporto progettata con lo stesso ritmo editoriale del resto dello storefront.
          </p>
        </div>
      </div>

      <div className="glass-panel faq-panel">
        <div className="faq-grid">
          {faqItems.map((item) => (
            <details key={item.question} className="faq-item">
              <summary>
                <span>{item.question}</span>
                <span className="faq-plus">+</span>
              </summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
