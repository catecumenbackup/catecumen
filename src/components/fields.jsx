import { useState } from "react";
import { LBL, INP, C } from "../ui.js";

// Primitivas de formulario compartidas por las pantallas de registro/login.
// Solo dependen de estilos base (ui.js). Extraídas de App.jsx para que las
// pantallas que salen del monolito las importen.

export function FRow({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={LBL}>{label}</label>
      {children}
    </div>
  );
}

export function Input({ value, onChange, placeholder, type = "text", style = {} }) {
  return (
    <input type={type} value={value || ""} onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder} style={{ ...INP, ...style }} />
  );
}

export function PasswordInput({ value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <input type={show ? "text" : "password"} value={value || ""} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} style={{ ...INP, paddingRight: 44 }} />
      <button onClick={() => setShow((s) => !s)} type="button"
        aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
        style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
          background: "none", border: "none", color: C.gold, cursor: "pointer", fontSize: 17,
          padding: 0, lineHeight: 1 }}>
        {show ? "🙈" : "👁"}
      </button>
    </div>
  );
}
