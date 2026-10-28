// src/components/PlazoBloqueo.jsx
// Plazo máximo de formación: aviso de días restantes y pantalla de bloqueo al
// vencer, con botón para solicitar prórroga al administrador.
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../supabaseClient.js";
import { C, BTN, MODAL, OVERLAY } from "../ui.js";
import { T } from "../i18n.js";

// Banner sutil cuando quedan pocos días (<=15). Se puede cerrar por sesión.
export function PlazoAviso({ formacion }) {
  const [oculto, setOculto] = useState(false);
  useEffect(() => {
    try { if (sessionStorage.getItem("catecumen_plazo_aviso") === "1") setOculto(true); } catch { /* no-op */ }
  }, []);
  if (!formacion || formacion.vencido || oculto) return null;
  const d = formacion.dias_restantes;
  if (d == null || d > 15) return null;
  const cerrar = () => { try { sessionStorage.setItem("catecumen_plazo_aviso", "1"); } catch { /* no-op */ } setOculto(true); };
  return (
    <div role="status" style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 904,
      background: "var(--c-wine)", color: "#fff", padding: "7px 36px 7px 14px",
      textAlign: "center", fontFamily: "'Crimson Text',serif", fontSize: 13.5,
      boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
    }}>
      ⏳ {T(`Te quedan ${d} día${d === 1 ? "" : "s"} para concluir tu formación.`,
            `You have ${d} day${d === 1 ? "" : "s"} left to complete your formation.`,
            `Il vous reste ${d} jour${d === 1 ? "" : "s"} pour terminer votre formation.`,
            `Dir bleiben noch ${d} Tag${d === 1 ? "" : "e"}, um deine Ausbildung abzuschließen.`,
            `Você tem ${d} dia${d === 1 ? "" : "s"} para concluir sua formação.`,
            `Ti restano ${d} giorno${d === 1 ? "" : "i"} per completare la tua formazione.`)}
      <button onClick={cerrar} aria-label="Cerrar" style={{
        position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
        background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 16, opacity: .8,
      }}>×</button>
    </div>
  );
}

// Pantalla de bloqueo cuando el plazo venció.
export default function PlazoBloqueo({ formacion, onLogout }) {
  const [sol, setSol] = useState(!!(formacion && formacion.solicitud_pendiente));
  const [motivo, setMotivo] = useState("");
  const [busy, setBusy] = useState(false);
  if (!formacion || !formacion.vencido) return null;

  const pedir = async () => {
    if (busy) return; setBusy(true);
    try { await supabase.rpc("solicitar_prorroga", { p_motivo: motivo || null }); setSol(true); }
    catch (e) { console.warn("solicitar_prorroga:", e); }
    setBusy(false);
  };

  return createPortal(
    <div style={{ ...OVERLAY, zIndex: 3000 }}>
      <div style={{ ...MODAL, maxWidth: 560, textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 10 }} aria-hidden="true">⏳</div>
        <h2 style={{ fontFamily: "'Cinzel',serif", color: C.gold, fontSize: 19, marginBottom: 10 }}>
          {T("Tu plazo de formación concluyó", "Your formation period has ended", "Votre délai de formation est terminé",
             "Deine Ausbildungsfrist ist abgelaufen", "Seu prazo de formação terminou", "Il tuo periodo di formazione è terminato")}
        </h2>
        <p style={{ color: C.ivory, fontFamily: "'Crimson Text',serif", fontSize: 15, lineHeight: 1.6, marginBottom: 16 }}>
          {T("El plazo máximo para concluir tu formación venció. Para continuar, puedes solicitar una prórroga; un administrador la revisará y te avisaremos.",
             "The maximum period to complete your formation has ended. To continue, you can request an extension; an administrator will review it and we'll let you know.",
             "Le délai maximum pour terminer votre formation est écoulé. Pour continuer, vous pouvez demander une prolongation ; un administrateur l'examinera et vous serez prévenu.",
             "Die Höchstfrist zum Abschluss deiner Ausbildung ist abgelaufen. Um fortzufahren, kannst du eine Verlängerung beantragen; ein Administrator prüft sie und wir benachrichtigen dich.",
             "O prazo máximo para concluir sua formação terminou. Para continuar, você pode solicitar uma prorrogação; um administrador irá avaliá-la e avisaremos você.",
             "Il periodo massimo per completare la tua formazione è terminato. Per continuare, puoi richiedere una proroga; un amministratore la esaminerà e ti avviseremo.")}
        </p>

        {sol ? (
          <p style={{ color: C.gold, fontFamily: "'Cinzel',serif", fontSize: 14, marginBottom: 16 }}>
            ⏳ {T("Solicitud enviada. Te avisaremos cuando se apruebe.", "Request sent. We'll let you know when it's approved.",
                  "Demande envoyée. Nous vous préviendrons de l'approbation.", "Anfrage gesendet. Wir benachrichtigen dich bei Genehmigung.",
                  "Solicitação enviada. Avisaremos quando for aprovada.", "Richiesta inviata. Ti avviseremo dell'approvazione.")}
          </p>
        ) : (
          <>
            <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={3}
              placeholder={T("Motivo (opcional)", "Reason (optional)", "Motif (facultatif)", "Grund (optional)", "Motivo (opcional)", "Motivo (facoltativo)")}
              style={{ width: "100%", background: "var(--c-inputBg)", border: `1px solid ${C.border}`, borderRadius: 8,
                padding: "10px 12px", color: C.ivory, fontFamily: "'Crimson Text',serif", fontSize: 15, outline: "none",
                boxSizing: "border-box", marginBottom: 14, resize: "vertical" }} />
            <button onClick={pedir} disabled={busy} style={{ ...BTN("pri"), width: "100%", justifyContent: "center", opacity: busy ? .6 : 1 }}>
              🔓 {T("Solicitar prórroga", "Request extension", "Demander une prolongation", "Verlängerung anfordern", "Solicitar prorrogação", "Richiedi proroga")}
            </button>
          </>
        )}

        <button onClick={onLogout} style={{ ...BTN("sec"), marginTop: 14, justifyContent: "center" }}>
          {T("Cerrar sesión", "Sign out", "Se déconnecter", "Abmelden", "Sair", "Esci")}
        </button>
      </div>
    </div>,
    document.body
  );
}
