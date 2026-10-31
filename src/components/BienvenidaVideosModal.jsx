// src/components/BienvenidaVideosModal.jsx
// Popup de bienvenida que el alumno ve la PRIMERA vez que entra al área de
// videos (saludo pastoral + guía breve). El contenido viene del panel (ajuste
// 'bienvenida_videos'), ya resuelto por idioma, en las props titulo/cuerpo.
// Al cerrarlo, App dispara la oración larga de inicio.
import { createPortal } from "react-dom";
import { C } from "../ui.js";
import { T } from "../i18n.js";

export default function BienvenidaVideosModal({ titulo, cuerpo, onClose }) {
  const boton = T("Comenzar", "Begin", "Commencer", "Beginnen", "Começar", "Inizia");
  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 2950, background: "rgba(8,5,2,0.72)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ position: "relative", width: "min(640px,96vw)", maxHeight: "90vh", overflowY: "auto",
          borderRadius: 16, padding: "clamp(24px,4vw,40px)",
          background: "linear-gradient(160deg,#FBF7EC 0%,#F4ECD6 100%)",
          boxShadow: "0 24px 70px rgba(0,0,0,0.5)", border: "1px solid rgba(200,169,81,0.5)" }}>
        <div style={{ fontSize: 34, textAlign: "center", marginBottom: 6 }}>🕊️</div>
        <h2 style={{ fontFamily: "'Cinzel',serif", color: "#9A7A2A", fontWeight: 700, textAlign: "center",
          fontSize: "clamp(19px,2.6vw,25px)", lineHeight: 1.25, margin: "0 0 16px" }}>{titulo}</h2>
        <div style={{ color: "#3A2E14", fontFamily: "'Crimson Text',serif", whiteSpace: "pre-line",
          fontSize: "clamp(14px,1.6vw,17px)", lineHeight: 1.7 }}>{cuerpo}</div>
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <button onClick={onClose}
            style={{ fontFamily: "'Cinzel',serif", fontWeight: 700, fontSize: 15, padding: "12px 34px",
              border: "none", borderRadius: 10, cursor: "pointer", color: "#2A1807",
              background: "linear-gradient(135deg,#E5C97A,#C8A951 55%,#9A7A2A)",
              boxShadow: "0 6px 18px rgba(200,169,81,0.4)" }}>{boton}</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
