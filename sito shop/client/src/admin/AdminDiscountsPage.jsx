import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

const emptyRule = {
  name: "",
  description: "",
  ruleType: "quantity_percentage",
  threshold: 1,
  discountType: "percentage",
  amount: 10,
  priority: 100,
  startsAt: "",
  endsAt: "",
  active: true
};

export default function AdminDiscountsPage() {
  const [rules, setRules] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [ruleForm, setRuleForm] = useState(emptyRule);
  const [editingRuleId, setEditingRuleId] = useState(null);

  function load() {
    apiFetch("/admin/discount-rules").then(setRules);
    apiFetch("/admin/coupons").then(setCoupons);
  }

  useEffect(() => {
    load();
  }, []);

  async function submitRule(event) {
    event.preventDefault();
    const payload = {
      ...ruleForm,
      threshold: Number(ruleForm.threshold),
      amount: Number(ruleForm.amount),
      priority: Number(ruleForm.priority)
    };
    await apiFetch(editingRuleId ? `/admin/discount-rules/${editingRuleId}` : "/admin/discount-rules", {
      method: editingRuleId ? "PUT" : "POST",
      body: JSON.stringify(payload)
    });
    setRuleForm(emptyRule);
    setEditingRuleId(null);
    load();
  }

  return (
    <div className="stack">
      <div>
        <p className="eyebrow">Sconti</p>
        <h1>Regole e coupon</h1>
      </div>
      <div className="card glass-panel">
        <h2>{editingRuleId ? "Modifica regola" : "Nuova regola"}</h2>
        <form className="form form-lined" onSubmit={submitRule}>
          <input placeholder="Nome regola" value={ruleForm.name} onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })} />
          <textarea placeholder="Descrizione breve" value={ruleForm.description} onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })} />
          <select value={ruleForm.ruleType} onChange={(e) => setRuleForm({ ...ruleForm, ruleType: e.target.value })}>
            <option value="quantity_percentage">Sconto percentuale per quantità minima</option>
            <option value="free_shipping_quantity">Spedizione gratuita per quantità minima</option>
            <option value="subtotal_fixed">Sconto fisso per subtotale minimo</option>
          </select>
          <select value={ruleForm.discountType} onChange={(e) => setRuleForm({ ...ruleForm, discountType: e.target.value })}>
            <option value="percentage">Percentuale</option>
            <option value="shipping">Spedizione</option>
            <option value="fixed">Importo fisso</option>
          </select>
          <input type="number" placeholder="Soglia" value={ruleForm.threshold} onChange={(e) => setRuleForm({ ...ruleForm, threshold: e.target.value })} />
          <input type="number" placeholder="Valore sconto" value={ruleForm.amount} onChange={(e) => setRuleForm({ ...ruleForm, amount: e.target.value })} />
          <input type="number" placeholder="Priorità" value={ruleForm.priority} onChange={(e) => setRuleForm({ ...ruleForm, priority: e.target.value })} />
          <input type="date" value={ruleForm.startsAt} onChange={(e) => setRuleForm({ ...ruleForm, startsAt: e.target.value })} />
          <input type="date" value={ruleForm.endsAt} onChange={(e) => setRuleForm({ ...ruleForm, endsAt: e.target.value })} />
          <label><input type="checkbox" checked={ruleForm.active} onChange={(e) => setRuleForm({ ...ruleForm, active: e.target.checked })} /> Attiva</label>
          <button className="button button-primary">{editingRuleId ? "Aggiorna regola" : "Crea regola"}</button>
        </form>
        <div className="stack">
          {rules.map((rule) => (
            <div className="card glass-panel admin-rule-card" key={rule.id}>
              <div className="row-between">
                <div>
                  <strong>{rule.name}</strong>
                  <p className="small-text">{rule.description || "Nessuna descrizione"}</p>
                </div>
                <span className="pill">{rule.active ? "Attiva" : "Disattiva"}</span>
              </div>
              <div className="row-between"><span>Tipo</span><span>{ruleTypeLabel(rule.ruleType)}</span></div>
              <div className="row-between"><span>Condizione</span><span>{conditionLabel(rule)}</span></div>
              <div className="row-between"><span>Priorità</span><span>{rule.priority}</span></div>
              <div className="inline-actions">
                <button onClick={() => {
                  setEditingRuleId(rule.id);
                  setRuleForm({
                    name: rule.name,
                    description: rule.description || "",
                    ruleType: rule.ruleType,
                    discountType: rule.discountType,
                    threshold: rule.threshold,
                    amount: rule.amount,
                    priority: rule.priority,
                    startsAt: rule.startsAt ? rule.startsAt.slice(0, 10) : "",
                    endsAt: rule.endsAt ? rule.endsAt.slice(0, 10) : "",
                    active: rule.active
                  });
                }}>Modifica</button>
                <button onClick={async () => {
                  await apiFetch(`/admin/discount-rules/${rule.id}`, { method: "DELETE" });
                  load();
                }}>Elimina</button>
                <button onClick={async () => {
                  await apiFetch(`/admin/discount-rules/${rule.id}`, {
                    method: "PUT",
                    body: JSON.stringify({
                      ...rule,
                      description: rule.description || "",
                      startsAt: rule.startsAt ? rule.startsAt.slice(0, 10) : null,
                      endsAt: rule.endsAt ? rule.endsAt.slice(0, 10) : null,
                      active: !rule.active
                    })
                  });
                  load();
                }}>{rule.active ? "Disattiva" : "Attiva"}</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="card glass-panel">
        <h2>Coupon</h2>
        {coupons.map((coupon) => (
          <div className="row-between" key={coupon.id}>
            <span>{coupon.code} · {coupon.type === "percentage" ? "percentuale" : "fisso"} · {coupon.amount}</span>
            <button onClick={() => setEditingCoupon(coupon)}>Modifica</button>
          </div>
        ))}
        <form
          className="form form-lined"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const payload = {
              code: form.get("code"),
              type: form.get("type"),
              amount: Number(form.get("amount")),
              expiresAt: form.get("expiresAt") || null,
              usageLimit: form.get("usageLimit") ? Number(form.get("usageLimit")) : null,
              active: form.get("active") === "on"
            };
            await apiFetch(editingCoupon ? `/admin/coupons/${editingCoupon.id}` : "/admin/coupons", {
              method: editingCoupon ? "PUT" : "POST",
              body: JSON.stringify(payload)
            });
            event.currentTarget.reset();
            setEditingCoupon(null);
            load();
          }}
        >
          <input name="code" placeholder="Codice coupon" defaultValue={editingCoupon?.code || ""} />
          <select name="type" defaultValue={editingCoupon?.type || "percentage"}>
            <option value="percentage">Percentuale</option>
            <option value="fixed">Importo fisso</option>
          </select>
          <input name="amount" type="number" placeholder="Valore" defaultValue={editingCoupon?.amount || ""} />
          <input name="expiresAt" type="date" defaultValue={editingCoupon?.expiresAt ? editingCoupon.expiresAt.slice(0, 10) : ""} />
          <input name="usageLimit" type="number" placeholder="Limite utilizzi" defaultValue={editingCoupon?.usageLimit || ""} />
          <label><input name="active" type="checkbox" defaultChecked={editingCoupon ? editingCoupon.active : true} /> Attivo</label>
          <button className="button button-primary">{editingCoupon ? "Aggiorna coupon" : "Crea coupon"}</button>
        </form>
      </div>
    </div>
  );
}

function ruleTypeLabel(type) {
  if (type === "quantity_percentage") return "Percentuale su quantità minima";
  if (type === "free_shipping_quantity") return "Spedizione gratuita su quantità minima";
  if (type === "subtotal_fixed") return "Sconto fisso su subtotale minimo";
  return type;
}

function conditionLabel(rule) {
  if (rule.ruleType === "quantity_percentage") return `Almeno ${rule.threshold} prodotti · ${rule.amount}%`;
  if (rule.ruleType === "free_shipping_quantity") return `Almeno ${rule.threshold} prodotti · spedizione gratuita`;
  if (rule.ruleType === "subtotal_fixed") return `Subtotale minimo ${rule.threshold} cent · sconto ${rule.amount} cent`;
  return `${rule.threshold}`;
}
