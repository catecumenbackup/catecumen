import { ENCUADRES } from "../data/encuadres.js";
import { T, PICK } from "../i18n.js";
import { C, BTN, MODAL, OVERLAY } from "../ui.js";
import { FlameIcon, CalizIcon, iconoBautismo, iconoConfirmacion } from "./icons.jsx";

const AR = "Arial, Helvetica, sans-serif";

// Divide el body en bloques por líneas en blanco.
function bloquesDe(body) {
  return String(body || "").split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
}

// Un sub-ítem se pinta con el nombre/título resaltado y la descripción más
// tenue. Reconoce dos patrones: "Nombre (descripción)" (módulos) y
// "Título: descripción" (viñetas de organizaciones). Si no casa, texto tal cual.
function SubItem({ texto }) {
  const mParen = texto.match(/^([^(]+?)\s*\(([\s\S]*)\)\s*$/);
  const mColon = !mParen && texto.match(/^([^:]{2,60}):\s+([\s\S]+)$/);
  return (
    <div style={{ display: "flex", gap: 9, alignItems: "flex-start",
      background: "rgba(255,255,255,0.035)", border: `1px solid ${C.gold}1f`,
      borderRadius: 9, padding: "8px 11px" }}>
      <span style={{ color: C.gold, fontSize: 13, lineHeight: 1.5, marginTop: 1, flexShrink: 0 }}>◆</span>
      <span style={{ fontFamily: AR, fontSize: 13.5, lineHeight: 1.55, color: C.ivory, textAlign: "left" }}>
        {mParen ? (<><strong style={{ color: C.goldL, fontWeight: 700 }}>{mParen[1].trim()}</strong>
          <span style={{ color: C.ivoryM }}> — {mParen[2].trim()}</span></>)
          : mColon ? (<><strong style={{ color: C.goldL, fontWeight: 700 }}>{mColon[1].trim()}:</strong>
          <span style={{ color: C.ivoryM }}> {mColon[2].trim()}</span></>)
          : texto}
      </span>
    </div>
  );
}

// Resalta el título inicial "Xxxx:" de una sección (organizaciones).
function ConTitulo({ texto }) {
  const m = texto.match(/^([^:]{2,70}):\s+([\s\S]+)$/);
  if (!m) return <>{texto}</>;
  return (<><strong style={{ color: C.goldL, fontWeight: 700 }}>{m[1].trim()}:</strong> {m[2].trim()}</>);
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
  // Numeración CONTINUA: los ítems pueden venir como "N." (sacramentos) o como
  // secciones que empiezan con un emoji (organizaciones); ambos se numeran en la
  // misma secuencia. Las viñetas "•" internas se vuelven sub-tarjetas.
  const bloques = bloquesDe(body);
  let hayItems = false;
  let contador = 0;
  const nodos = bloques.map((b, i) => {
    const mNum = b.match(/^(\d+)\.\s+([\s\S]*)$/);
    const mEmoji = !mNum && b.match(/^(\p{Extended_Pictographic}️?)\s+([\s\S]*)$/u);
    if (mNum || mEmoji) {
      hayItems = true;
      let num, contenido, esOrg = false;
      if (mNum) { num = parseInt(mNum[1], 10); contador = num; contenido = mNum[2]; }
      else { contador += 1; num = contador; contenido = mEmoji[2]; esOrg = true; }
      // Sub-ítems: por viñetas "•" (organizaciones) o por saltos de línea (módulos).
      let principal, sub = [];
      if (contenido.includes("•")) {
        const partes = contenido.split("•").map((s) => s.trim()).filter(Boolean);
        principal = partes[0]; sub = partes.slice(1);
      } else {
        const lineas = contenido.split(/\n/).map((s) => s.trim()).filter(Boolean);
        principal = lineas[0]; sub = lineas.slice(1);
      }
      return (
        <div key={i} style={{ display: "flex", gap: 13, alignItems: "flex-start",
          background: `linear-gradient(145deg, rgba(200,169,81,0.07) 0%, rgba(200,169,81,0.02) 100%)`,
          border: `1px solid ${C.gold}22`, borderRadius: 13, padding: "13px 15px" }}>
          <span style={{ flexShrink: 0, width: 28, height: 28, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "linear-gradient(135deg,#F0D68A,#B8912F)", color: "#3A2E12",
            fontFamily: AR, fontWeight: 800, fontSize: 14,
            boxShadow: "0 2px 6px rgba(0,0,0,0.35)" }}>{num}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontFamily: AR, fontSize: 14.5, lineHeight: 1.65, color: C.ivory, textAlign: "justify" }}>
              {esOrg ? <ConTitulo texto={principal} /> : principal}
            </p>
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
          borderRadius: "0 10px 10px 0", padding: "12px 15px", fontStyle: "italic", textAlign: "justify" }}>{b}</p>
      );
    }
    // Párrafo guía (intro).
    return (
      <p key={i} style={{ margin: 0, fontFamily: AR, fontSize: 15.5, lineHeight: 1.7, color: C.ivory, textAlign: "justify" }}>{b}</p>
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
