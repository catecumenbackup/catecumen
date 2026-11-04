// src/components/ResumenTemaModal.jsx
// Resumen del TEMA (repaso de los 4 bloques A/B/C/D). Se usa en los 4 accesos:
//   1) «Para tus apuntes» — panel en el reproductor al terminar el bloque.
//   2) Pestaña «Resumen» — junto al reproductor, en todo momento.
//   3) Repaso desde el índice de la lección.
//   4) Modal antes de la evaluación (tras la encuesta del bloque D).
// `ResumenContenido` es el bloque reutilizable; `ResumenTemaModal` lo envuelve en
// un modal. Tono individual ("tú"). Si hay puntos curados (DOCTRINA/PRÁCTICA) se
// usan; si no, se arma el repaso con los títulos de los bloques.
import { createPortal } from "react-dom";
import { C, BTN } from "../ui.js";
import { T } from "../i18n.js";
import { useEscClose, BotonX } from "./modalUtils.jsx";

const BLOQUE_NOMBRE = {
  A: ["Gancho", "Hook", "Accroche", "Einstieg", "Gancho", "Aggancio"],
  B: ["Iluminación", "Illumination", "Illumination", "Erleuchtung", "Iluminação", "Illuminazione"],
  C: ["Signo y símbolo", "Sign and symbol", "Signe et symbole", "Zeichen und Symbol", "Sinal e símbolo", "Segno e simbolo"],
  D: ["Envío", "Sending", "Envoi", "Sendung", "Envio", "Invio"],
};

// Contenido reutilizable del resumen (sin modal). `compacto` reduce paddings para
// el panel bajo el reproductor.
export function ResumenContenido({ titulo = null, bloques = [], puntos = null, hojaPdfUrl = null, compacto = false }) {
  return (
    <div>
      {titulo && (
        <>
          <p style={{ textAlign: "center", color: C.ivoryM, fontFamily: "'Cinzel',serif", fontSize: 11,
            letterSpacing: "0.08em", margin: "0 0 3px" }}>
            {T("REPASO DEL TEMA", "TOPIC REVIEW", "RÉVISION DU THÈME", "THEMEN-RÜCKBLICK", "REVISÃO DO TEMA", "RIPASSO DEL TEMA")}
          </p>
          <h3 style={{ fontFamily: "'Cinzel',serif", color: C.gold, fontWeight: 700, textAlign: "center",
            fontSize: compacto ? 15 : "clamp(16px,2.2vw,20px)", lineHeight: 1.25, margin: "0 0 12px" }}>{titulo}</h3>
        </>
      )}
      {Array.isArray(puntos) && puntos.length ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {puntos.map((p, i) => {
            const esDoc = (p.tipo || "").toLowerCase() === "doctrina";
            return (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start",
                background: C.card, border: "1px solid rgba(200,169,81,0.16)", borderRadius: 10, padding: "9px 12px" }}>
                <span style={{ fontFamily: "'Cinzel',serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
                  color: esDoc ? C.gold : "#6FB0E0", border: `1px solid ${esDoc ? C.gold : "#6FB0E0"}`,
                  borderRadius: 6, padding: "2px 7px", whiteSpace: "nowrap", marginTop: 2 }}>
                  {esDoc ? T("DOCTRINA", "DOCTRINE", "DOCTRINE", "LEHRE", "DOUTRINA", "DOTTRINA")
                         : T("PRÁCTICA", "PRACTICE", "PRATIQUE", "PRAXIS", "PRÁTICA", "PRATICA")}
                </span>
                <span style={{ color: C.ivory, fontFamily: "'Crimson Text',serif", fontSize: 15, lineHeight: 1.5 }}>{p.texto}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {bloques.map((b, i) => (
            <div key={b.id || i} style={{ display: "flex", gap: 10, alignItems: "flex-start",
              background: C.card, border: "1px solid rgba(200,169,81,0.16)", borderRadius: 10, padding: "9px 12px" }}>
              <span style={{ fontFamily: "'Cinzel',serif", fontSize: 13, fontWeight: 700, color: "#fff",
                background: C.gold, borderRadius: "50%", width: 24, height: 24, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center" }}>{b.blk || (i + 1)}</span>
              <div>
                {b.blk && BLOQUE_NOMBRE[b.blk] && (
                  <p style={{ color: C.gold, fontFamily: "'Cinzel',serif", fontSize: 11, letterSpacing: "0.04em", margin: "0 0 2px" }}>
                    {T(...BLOQUE_NOMBRE[b.blk])}
                  </p>
                )}
                <p style={{ color: C.ivory, fontFamily: "'Crimson Text',serif", fontSize: 14.5, lineHeight: 1.45, margin: 0 }}>{b.es}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      {hojaPdfUrl && (
        <a href={hojaPdfUrl} target="_blank" rel="noopener noreferrer"
          style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 16, textDecoration: "none",
            background: C.card, border: `1px solid ${C.gold}55`, borderRadius: 12, padding: "12px 14px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.25)" }}>
          {/* Miniatura: una "hoja de trabajo" para que se note que hay material descargable */}
          <svg width="52" height="66" viewBox="0 0 52 66" style={{ flexShrink: 0, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.35))" }} aria-hidden="true">
            <rect x="2" y="2" width="48" height="62" rx="4" fill="#FBF6EA" stroke="#C8A951" strokeWidth="1.5" />
            <path d="M38 2 L50 14 L38 14 Z" fill="#E5C97A" />
            <rect x="9" y="12" width="22" height="4.5" rx="2" fill="#C8A951" />
            <rect x="9" y="24" width="34" height="2.4" rx="1.2" fill="#C2AE74" />
            <rect x="9" y="31" width="34" height="2.4" rx="1.2" fill="#C2AE74" />
            <rect x="9" y="38" width="26" height="2.4" rx="1.2" fill="#C2AE74" />
            <rect x="9" y="47" width="34" height="2.4" rx="1.2" fill="#C2AE74" />
            <rect x="9" y="54" width="20" height="2.4" rx="1.2" fill="#C2AE74" />
          </svg>
          <div style={{ textAlign: "left", flex: 1 }}>
            <p style={{ color: C.gold, fontFamily: "'Cinzel',serif", fontSize: 11.5, fontWeight: 700, letterSpacing: "0.05em", margin: "0 0 3px" }}>
              {T("MATERIAL DE TRABAJO", "WORKSHEET", "FICHE DE TRAVAIL", "ARBEITSBLATT", "MATERIAL DE TRABALHO", "MATERIALE DI LAVORO")}
            </p>
            <p style={{ color: C.ivoryM, fontFamily: "'Crimson Text',serif", fontSize: 13.5, lineHeight: 1.35, margin: "0 0 8px" }}>
              {T("Hoja descargable para profundizar y practicar lo aprendido en este tema.",
                 "Downloadable sheet to go deeper and practice what you learned in this topic.",
                 "Fiche téléchargeable pour approfondir et mettre en pratique ce thème.",
                 "Herunterladbares Blatt, um das Gelernte dieses Themas zu vertiefen und zu üben.",
                 "Folha para baixar e aprofundar e praticar o que você aprendeu neste tema.",
                 "Scheda scaricabile per approfondire e mettere in pratica ciò che hai imparato in questo tema.")}
            </p>
            <span style={{ ...BTN("pri"), fontSize: 12.5, padding: "8px 16px", display: "inline-flex", color: "var(--c-btnPriText)" }}>
              ⬇ {T("Descarga el material de trabajo", "Download the worksheet", "Télécharger la fiche de travail", "Arbeitsblatt herunterladen", "Baixe o material de trabalho", "Scarica il materiale di lavoro")}
            </span>
          </div>
        </a>
      )}
    </div>
  );
}

export default function ResumenTemaModal({ titulo, bloques = [], puntos = null, hojaPdfUrl = null, onClose, ctaEval = true }) {
  useEscClose(onClose);
  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 2970, background: "rgba(8,5,2,0.74)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ position: "relative", width: "min(680px,96vw)", maxHeight: "90vh", overflowY: "auto",
          borderRadius: 16, padding: "clamp(22px,4vw,36px)",
          background: `linear-gradient(160deg,var(--c-modalStart) 0%,${C.surface} 55%,var(--c-modalEnd) 100%)`,
          border: "1px solid rgba(200,169,81,0.3)", boxShadow: "0 24px 70px rgba(0,0,0,0.55)" }}>
        <BotonX onClose={onClose} />
        <div style={{ textAlign: "center", marginBottom: 6, fontSize: 28 }}>📝</div>
        <ResumenContenido titulo={titulo} bloques={bloques} puntos={puntos} hojaPdfUrl={hojaPdfUrl} />
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 20 }}>
          <button onClick={onClose} style={{ ...BTN("pri"), cursor: "pointer" }}>
            {ctaEval
              ? T("Ir a la evaluación", "Go to the evaluation", "Aller à l'évaluation", "Zur Bewertung", "Ir para a avaliação", "Vai alla valutazione") + " →"
              : T("Cerrar", "Close", "Fermer", "Schließen", "Fechar", "Chiudi")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
