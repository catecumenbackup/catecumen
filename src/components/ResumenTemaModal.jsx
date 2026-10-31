// src/components/ResumenTemaModal.jsx
// Resumen del TEMA que se muestra tras la encuesta del bloque D, antes de la
// evaluación. Repasa el contenido de los 4 bloques (A/B/C/D). Si el equipo de
// contenido cargó un resumen curado (puntos DOCTRINA/PRÁCTICA), se usa ese; si
// no, se arma un repaso con los títulos de los bloques. Tono individual ("tú").
import { createPortal } from "react-dom";
import { C, BTN } from "../ui.js";
import { T } from "../i18n.js";

const BLOQUE_NOMBRE = {
  A: ["Gancho", "Hook", "Accroche", "Einstieg", "Gancho", "Aggancio"],
  B: ["Iluminación", "Illumination", "Illumination", "Erleuchtung", "Iluminação", "Illuminazione"],
  C: ["Signo y símbolo", "Sign and symbol", "Signe et symbole", "Zeichen und Symbol", "Sinal e símbolo", "Segno e simbolo"],
  D: ["Envío", "Sending", "Envoi", "Sendung", "Envio", "Invio"],
};

export default function ResumenTemaModal({ titulo, bloques = [], puntos = null, hojaPdfUrl = null, onClose }) {
  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 2970, background: "rgba(8,5,2,0.74)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ position: "relative", width: "min(680px,96vw)", maxHeight: "90vh", overflowY: "auto",
          borderRadius: 16, padding: "clamp(22px,4vw,38px)",
          background: `linear-gradient(160deg,var(--c-modalStart) 0%,${C.surface} 55%,var(--c-modalEnd) 100%)`,
          border: "1px solid rgba(200,169,81,0.3)", boxShadow: "0 24px 70px rgba(0,0,0,0.55)" }}>
        <div style={{ textAlign: "center", marginBottom: 6, fontSize: 30 }}>📝</div>
        <p style={{ textAlign: "center", color: C.ivoryM, fontFamily: "'Cinzel',serif", fontSize: 12,
          letterSpacing: "0.08em", margin: "0 0 4px" }}>
          {T("REPASO DEL TEMA", "TOPIC REVIEW", "RÉVISION DU THÈME", "THEMEN-RÜCKBLICK", "REVISÃO DO TEMA", "RIPASSO DEL TEMA")}
        </p>
        <h2 style={{ fontFamily: "'Cinzel',serif", color: C.gold, fontWeight: 700, textAlign: "center",
          fontSize: "clamp(17px,2.4vw,22px)", lineHeight: 1.25, margin: "0 0 6px" }}>{titulo}</h2>
        <p style={{ textAlign: "center", color: C.ivoryM, fontFamily: "'Crimson Text',serif", fontSize: 14,
          margin: "0 0 18px" }}>
          {T("Repasa antes de tu evaluación.", "Review before your evaluation.", "Révise avant ton évaluation.",
            "Wiederhole vor deiner Bewertung.", "Revise antes da tua avaliação.", "Ripassa prima della tua valutazione.")}
        </p>

        {Array.isArray(puntos) && puntos.length ? (
          // Resumen curado por el equipo de contenido (DOCTRINA / PRÁCTICA).
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {puntos.map((p, i) => {
              const esDoc = (p.tipo || "").toLowerCase() === "doctrina";
              return (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start",
                  background: C.card, border: "1px solid rgba(200,169,81,0.16)", borderRadius: 10, padding: "10px 13px" }}>
                  <span style={{ fontFamily: "'Cinzel',serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
                    color: esDoc ? C.gold : "#6FB0E0", border: `1px solid ${esDoc ? C.gold : "#6FB0E0"}`,
                    borderRadius: 6, padding: "2px 7px", whiteSpace: "nowrap", marginTop: 2 }}>
                    {esDoc ? T("DOCTRINA", "DOCTRINE", "DOCTRINE", "LEHRE", "DOUTRINA", "DOTTRINA")
                           : T("PRÁCTICA", "PRACTICE", "PRATIQUE", "PRAXIS", "PRÁTICA", "PRATICA")}
                  </span>
                  <span style={{ color: C.ivory, fontFamily: "'Crimson Text',serif", fontSize: 15.5, lineHeight: 1.55 }}>{p.texto}</span>
                </div>
              );
            })}
          </div>
        ) : (
          // Repaso por bloques (títulos reales de A/B/C/D) mientras no haya resumen curado.
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {bloques.map((b, i) => (
              <div key={b.id || i} style={{ display: "flex", gap: 10, alignItems: "flex-start",
                background: C.card, border: "1px solid rgba(200,169,81,0.16)", borderRadius: 10, padding: "10px 13px" }}>
                <span style={{ fontFamily: "'Cinzel',serif", fontSize: 14, fontWeight: 700, color: "#fff",
                  background: C.gold, borderRadius: "50%", width: 26, height: 26, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center" }}>{b.blk || (i + 1)}</span>
                <div>
                  {b.blk && BLOQUE_NOMBRE[b.blk] && (
                    <p style={{ color: C.gold, fontFamily: "'Cinzel',serif", fontSize: 11, letterSpacing: "0.04em", margin: "0 0 2px" }}>
                      {T(...BLOQUE_NOMBRE[b.blk])}
                    </p>
                  )}
                  <p style={{ color: C.ivory, fontFamily: "'Crimson Text',serif", fontSize: 15, lineHeight: 1.5, margin: 0 }}>{b.es}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginTop: 22 }}>
          {hojaPdfUrl && (
            <a href={hojaPdfUrl} target="_blank" rel="noopener noreferrer"
              style={{ ...BTN("sec"), textDecoration: "none" }}>
              📄 {T("Descargar la hoja", "Download the sheet", "Télécharger la fiche", "Blatt herunterladen", "Baixar a folha", "Scarica la scheda")}
            </a>
          )}
          <button onClick={onClose} style={{ ...BTN("pri"), cursor: "pointer" }}>
            {T("Ir a la evaluación", "Go to the evaluation", "Aller à l'évaluation", "Zur Bewertung", "Ir para a avaliação", "Vai alla valutazione")} →
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
