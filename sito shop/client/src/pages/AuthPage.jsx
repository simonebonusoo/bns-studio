import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  password: ""
};

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      setError("");
      await login(form, mode);
      navigate("/profile");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page auth-shell reveal">
      <div className="auth-intro">
        <img className="auth-logo" src="/brand/logo.png" alt="bns studio logo" />
        <p className="eyebrow">Account bns studio</p>
        <h1>{mode === "login" ? "Bentornato." : "Crea il tuo account."}</h1>
        <p className="section-subcopy">Accedi al checkout, allo storico ordini e all'area cliente in uno spazio chiaro e minimale.</p>
      </div>
      <div className="card auth-card glass-panel">
        <div className="toggle-row auth-toggle">
          <button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>
            Accedi
          </button>
          <button type="button" className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>
            Registrati
          </button>
        </div>
        <form className="form form-lined" onSubmit={handleSubmit}>
          {mode === "register" ? (
            <>
              <input placeholder="Nome" value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} />
              <input placeholder="Cognome" value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} />
            </>
          ) : null}
          <input type="email" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          <input type="password" placeholder="Password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
          {error ? <p className="error-text">{error}</p> : null}
          <button className="button button-primary" type="submit">
            {mode === "login" ? "Entra nello studio" : "Crea account"}
          </button>
        </form>
      </div>
    </div>
  );
}
