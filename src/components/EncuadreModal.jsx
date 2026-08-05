import { ENCUADRES } from "../data/encuadres.js";
import { T, PICK } from "../i18n.js";
import { C, BTN, MODAL, OVERLAY } from "../ui.js";
import { FlameIcon, CalizIcon, iconoBautismo, iconoConfirmacion } from "./icons.jsx";

const AR = "Arial, Helvetica, sans-serif";

// Divide el body en bloques por líneas en blanco.
function bloquesDe(body) {
  return String(body || "").split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
}

// Un sub-ítem "Nombre (descripción)" se pinta con el nombre resaltado y la
// descripción más tenue. Si no casa el patrón, se pinta el texto tal cual.
function SubItem({ texto }) {
  const m = texto.match(/^([^(]+?)\s*\(([\s\S]*)\)\s*$/);
  return (
    <div style={{ display: "flex", gap: 9, alignItems: "flex-start",
      background: "rgba(255,255,255,0.035)", border: `1px solid ${C.gold}1f`,
      borderRadius: 9, padding: "8px 11px" }}>
      <span style={{ color: C.gold, fontSize: 13, lineHeight: 1.5, marginTop: 1, flexShrink: 0 }}>◆</span>
      <span style={{ fontFamily: AR, fontSize: 13.5, lineHeight: 1.55, color: C.ivory }}>
        {m ? (<><strong style={{ color: C.goldL, fontWeight: 700 }}>{m[1].trim()}</strong>
          <span style={{ color: C.ivoryM }}> — {m[2].trim()}</span></>)
          : texto}
      </span>
    </div>
  );
}

// Modal de "encuadre": presenta las características de la formación según el
// tipo de usuario/sacramento (textos en ENCUADRES, 6 idiomas). Se muestra antes
// del registro. Diferido con React.lazy: arrastra ~1600 líneas de texto que no
// se necesitan en el arranque. Probado en EncuadreModal.test.jsx.
export default function EncuadreModal({ encKey, onRegister, onBack }) {
  const d = ENCUADRES[encKey];
  if (!d) return null;
  const { title, icon, body } = PICK(d);
  const isOrg = encKey === "parroquia" || encKey === "diocesis";

  // Parseo genérico del cuerpo: párrafos guía / ítems numerados / cierre.
  const bloques = bloquesDe(body);
  let hayItems = false;
  const nodos = bloques.map((b, i) => {
    const m = b.match(/^(\d+)\.\s+([\s\S]*)$/);
    if (m) {
      hayItems = true;
      const lineas = m[2].split(/\n/).map((s) => s.trim()).filter(Boolean);
      const principal = lineas[0];
      const sub = lineas.slice(1);
      return (
        <div key={i} style={{ display: "flex", gap: 13, alignItems: "flex-start",
          background: `linear-gradient(145deg, rgba(200,169,81,0.07) 0%, rgba(200,169,81,0.02) 100%)`,
          border: `1px solid ${C.gold}22`, borderRadius: 13, padding: "13px 15px" }}>
          <span style={{ flexShrink: 0, width: 28, height: 28, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "linear-gradient(135deg,#F0D68A,#B8912F)", color: "#3A2E12",
            fontFamily: AR, fontWeight: 800, fontSize: 14,
            boxShadow: "0 2px 6px rgba(0,0,0,0.35)" }}>{m[1]}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontFamily: AR, fontSize: 14.5, lineHeight: 1.65, color: C.ivory }}>{principal}</p>
            {sub.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 10 }}>
                {sub.map((s, j) => <SubItem key={j} texto={s} />)}
              </div>
            )}
          </div>
        </div>
      );
    }
    // Bloque sin número: guía (antes de la lista) o cierre (después).
    const esEtiqueta = b.endsWith(":") && !hayItems && b.length < 130;
    if (esEtiqueta) {
      return (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
          <span style={{ height: 1, flex: "0 0 18px", background: `linear-gradient(90deg,transparent,${C.gold})` }} />
          <span style={{ fontFamily: AR, color: C.gold, fontSize: 12.5, letterSpacing: "0.08em",
            textTransform: "uppercase", fontWeight: 700 }}>{b.replace(/:\s*$/, "")}</span>
          <span style={{ height: 1, flex: 1, background: `linear-gradient(90deg,${C.gold},transparent)` }} />
        </div>
      );
    }
    if (hayItems) {
      // Cierre: callout con barra dorada a la izquierda.
      return (
        <p key={i} style={{ margin: 0, fontFamily: AR, fontSize: 14, lineHeight: 1.65, color: C.ivory,
          background: "rgba(200,169,81,0.08)", borderLeft: `3px solid ${C.gold}`,
          borderRadius: "0 10px 10px 0", padding: "12px 15px", fontStyle: "italic" }}>{b}</p>
      );
    }
    // Párrafo guía (intro).
    return (
      <p key={i} style={{ margin: 0, fontFamily: AR, fontSize: 15.5, lineHeight: 1.7, color: C.ivory }}>{b}</p>
    );
  });

  return (
    <div style={OVERLAY}>
      <div style={{ ...MODAL, maxWidth: 720, fontFamily: AR }}>
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div style={{ fontSize: 36, marginBottom: 8, display: "flex", justifyContent: "center" }}>
            {icon === "__caliz__" ? <CalizIcon size={42} />
              : icon === "__flame__" ? <FlameIcon size={42} />
              : icon === "__bautismo_img__" ? <img src={iconoBautismo} width={52} height={52} style={{ objectFit: "contain", filter: "sepia(1) saturate(3) brightness(0.95)" }} alt="" />
              : icon === "__confirmacion_img__" ? <img src={iconoConfirmacion} width={52} height={52} style={{ objectFit: "contain", filter: "sepia(1) saturate(3) brightness(0.95)" }} alt="" />
              : <span>{icon}</span>}
          </div>
          <h2 style={{ fontFamily: AR, color: C.gold, fontSize: 20, fontWeight: 700, margin: 0 }}>{title}</h2>
          <div style={{ width: 54, height: 2, background: `linear-gradient(90deg,transparent,${C.gold},transparent)`, margin: "12px auto 0" }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: "44em", margin: "0 auto 22px" }}>
          {nodos}
        </div>

        <p style={{ marginTop: 0, marginBottom: 20, color: C.goldL, textAlign: "center", fontSize: 14, fontFamily: AR }}>
          {T("Conoce más en: ", "Learn more at: ", "En savoir plus sur : ", "Mehr erfahren unter: ", "Saiba mais em: ", "Scopri di più su: ")}
          <a href="https://www.catecumen.com/info" target="_blank" rel="noreferrer"
            style={{ color: C.gold }}>www.catecumen.com/info</a>
        </p>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={onBack} style={{ ...BTN("sec"), flex: 1, justifyContent: "center" }}>
            ← {T("Regresar", "Back", "Retour", "Zurück", "Voltar", "Indietro")}
          </button>
          <button onClick={onRegister} style={{ ...BTN("pri"), flex: 2, justifyContent: "center" }}>
            {isOrg ? T("Realizar el Registro", "Complete Registration", "Effectuer l'inscription", "Registrierung abschließen", "Realizar o Registro", "Completa la registrazione") : T("Realizar mi Registro", "Complete My Registration", "Effectuer mon inscription", "Meine Registrierung abschließen", "Realizar meu Registro", "Completa la mia registrazione")} →
          </button>
        </div>
      </div>
    </div>
  );
}
