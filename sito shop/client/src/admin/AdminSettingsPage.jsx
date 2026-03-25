import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState([]);

  function load() {
    apiFetch("/admin/settings").then(setSettings);
  }

  useEffect(() => {
    load();
  }, []);

  const labels = {
    storeName: "Nome negozio",
    logoUrl: "URL logo alternativo",
    primaryColor: "Colore principale",
    paypalMeLink: "Link PayPal.Me",
    paypalBusinessEmail: "Email business PayPal",
    currencyCode: "Valuta",
    shippingCost: "Costo spedizione",
    heroHeadline: "Headline hero"
  };

  return (
    <form
      className="card form form-lined glass-panel"
      onSubmit={async (event) => {
        event.preventDefault();
        const payload = settings.map((entry) => ({
          key: entry.key,
          value: entry.value
        }));
        const data = await apiFetch("/admin/settings", {
          method: "PUT",
          body: JSON.stringify(payload)
        });
        setSettings(data);
      }}
    >
      <p className="eyebrow">Impostazioni</p>
      <h1>Impostazioni negozio</h1>
      {settings.map((setting) => (
        <label className="stack" key={setting.id}>
          <span>{labels[setting.key] || setting.key}</span>
          <input
            value={setting.value}
            onChange={(event) =>
              setSettings((current) =>
                current.map((entry) =>
                  entry.id === setting.id ? { ...entry, value: event.target.value } : entry
                )
              )
            }
          />
        </label>
      ))}
      <button className="button button-primary" type="submit">Salva impostazioni</button>
    </form>
  );
}
