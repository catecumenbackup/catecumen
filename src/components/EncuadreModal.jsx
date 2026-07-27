import { ENCUADRES } from "../data/encuadres.js";
import { T, PICK } from "../i18n.js";
import { C, BTN, MODAL, OVERLAY, READ } from "../ui.js";
import { FlameIcon, CalizIcon, iconoBautismo, iconoConfirmacion } from "./icons.jsx";

// Modal de "encuadre": presenta las características de la formación según el
// tipo de usuario/sacramento (textos en ENCUADRES, 6 idiomas). Se muestra antes
// del registro. Diferido con React.lazy: arrastra ~1600 líneas de texto que no
// se necesitan en el arranque. Probado en EncuadreModal.test.jsx.
export default function EncuadreModal({ encKey, onRegister, onBack }) {
  const d = ENCUADRES[encKey];
  if (!d) return null;
  const { title, icon, body } = PICK(d);
  const isOrg = encKey === "parroquia" || encKey === "diocesis";
  return (
    <div style={OVERLAY}>
      <div style={{ ...MODAL, maxWidth: 720 }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 36, marginBottom: 8, display: "flex", justifyContent: "center" }}>
            {icon === "__caliz__" ? <CalizIcon size={42} />
              : icon === "__flame__" ? <FlameIcon size={42} />
              : icon === "__bautismo_img__" ? <img src={iconoBautismo} width={52} height={52} style={{ objectFit: "contain", filter: "sepia(1) saturate(3) brightness(0.95)" }} alt="" />
              : icon === "__confirmacion_img__" ? <img src={iconoConfirmacion} width={52} height={52} style={{ objectFit: "contain", filter: "sepia(1) saturate(3) brightness(0.95)" }} alt="" />
              : <span>{icon}</span>}
          </div>
          <h2 style={{ fontFamily: "'Cinzel',serif", color: C.gold, fontSize: 18 }}>{title}</h2>
        </div>
        <div style={{ ...READ, whiteSpace: "pre-line", marginBottom: 20 }}>
          {body}
        </div>
        <p style={{ marginTop: -6, marginBottom: 20, color: C.goldL, textAlign: "center", fontSize: 14 }}>
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
