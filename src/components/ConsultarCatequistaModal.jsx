import { useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../supabaseClient.js";
import { C, BTN, MODAL, OVERLAY } from "../ui.js";
import { T } from "../i18n.js";

// Consulta del ALUMNO a su catequista sobre la fe / la formación. Distinto del
// soporte técnico (SoporteModal): esto entra por la mensajería interna vía
// `responder_usuario`, y la respuesta le llega a "Mi Cuenta → Mensajes".
// El `contexto` (sección de estudio) se antepone para que el catequista lo sepa.
export default function ConsultarCatequistaModal({ contexto = "", onClose }) {
  const [texto, setTexto] = useState("");
  const [estado, setEstado] = useState("escribiendo"); // escribiendo | enviando | ok | error

  const enviar = async () => {
    const cuerpo = texto.trim();
    if (!cuerpo || estado === "enviando") return;
    setEstado("enviando");
    try {
      const prefijo = contexto ? `[${contexto}] ` : "";
      const { error } = await supabase.rpc("responder_usuario", { p_cuerpo: prefijo + cuerpo });
      if (error) throw error;
      setEstado("ok");
    } catch (e) {
      console.error("consulta catequista:", e);
      setEstado("error");
    }
  };

  return createPortal(
    <div style={{ ...OVERLAY, zIndex: 3000 }} onClick={onClose}>
      <div className="catePanel" style={{ ...MODAL, maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 34, marginBottom: 8 }}>✝️</div>
          <h2 style={{ fontFamily: "'Cinzel',serif", color: C.gold, fontSize: 17 }}>
            {T("Consultar a tu catequista", "Ask your catechist", "Consulter votre catéchiste", "Deinen Katecheten fragen", "Consultar seu catequista", "Consulta il tuo catechista")}
          </h2>
          <p style={{ color: C.ivoryM, fontFamily: "'Crimson Text',serif", fontSize: 14.5, lineHeight: 1.6, marginTop: 8 }}>
            {T("Escribe tu duda sobre la fe o tu formación. Tu catequista te responderá en la sección «Mensajes» de tu cuenta.",
               "Write your question about the faith or your formation. Your catechist will reply in the “Messages” section of your account.",
               "Écrivez votre question sur la foi ou votre formation. Votre catéchiste vous répondra dans la section « Messages » de votre compte.",
               "Schreibe deine Frage zum Glauben oder deiner Ausbildung. Deine Katechetin antwortet dir im Bereich „Nachrichten“ deines Kontos.",
               "Escreva sua dúvida sobre a fé ou sua formação. Seu catequista responderá na seção «Mensagens» da sua conta.",
               "Scrivi la tua domanda sulla fede o sulla tua formazione. Il tuo catechista ti risponderà nella sezione «Messaggi» del tuo account.")}
          </p>
        </div>

        {estado === "ok" ? (
          <>
            <div style={{ ...MODAL_CARD, textAlign: "center" }}>
              <div style={{ fontSize: 30, marginBottom: 6 }}>✅</div>
              <p style={{ color: C.ivory, fontFamily: "'Crimson Text',serif", fontSize: 15.5, lineHeight: 1.6 }}>
                {T("Tu consulta fue enviada. Encontrarás la respuesta de tu catequista en «Mi Cuenta → Mensajes».",
                   "Your question was sent. You'll find your catechist's reply in “My Account → Messages”.",
                   "Votre question a été envoyée. Vous trouverez la réponse de votre catéchiste dans « Mon compte → Messages ».",
                   "Deine Frage wurde gesendet. Die Antwort deiner Katechetin findest du unter „Mein Konto → Nachrichten“.",
                   "Sua consulta foi enviada. Você encontrará a resposta do seu catequista em «Minha Conta → Mensagens».",
                   "La tua domanda è stata inviata. Troverai la risposta del tuo catechista in «Il mio account → Messaggi».")}
              </p>
            </div>
            <button onClick={onClose} style={{ ...BTN("pri"), width: "100%", justifyContent: "center", marginTop: 14 }}>
              {T("Entendido", "Got it", "Compris", "Verstanden", "Entendido", "Ho capito")}
            </button>
          </>
        ) : (
          <>
            <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={5} maxLength={2000}
              disabled={estado === "enviando"}
              placeholder={T("Escribe aquí tu pregunta…", "Write your question here…", "Écrivez votre question ici…", "Schreibe hier deine Frage…", "Escreva aqui sua pergunta…", "Scrivi qui la tua domanda…")}
              style={{ width: "100%", resize: "vertical", minHeight: 110, background: C.card, color: C.ivory,
                border: `1px solid ${C.borderD}`, borderRadius: 12, padding: "12px 14px",
                fontFamily: "'Crimson Text',serif", fontSize: 15, outline: "none", boxSizing: "border-box" }} />

            {estado === "error" && (
              <p style={{ color: "#F87171", fontSize: 13.5, textAlign: "center", marginTop: 8 }}>
                ⚠️ {T("No se pudo enviar. Intenta de nuevo.", "Could not send. Please try again.", "Échec de l'envoi. Réessayez.", "Senden fehlgeschlagen. Bitte erneut versuchen.", "Não foi possível enviar. Tente novamente.", "Invio non riuscito. Riprova.")}
              </p>
            )}

            <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
              <button onClick={onClose} disabled={estado === "enviando"}
                style={{ ...BTN("sec"), flex: 1, justifyContent: "center", opacity: estado === "enviando" ? 0.5 : 1 }}>
                {T("Cancelar", "Cancel", "Annuler", "Abbrechen", "Cancelar", "Annulla")}
              </button>
              <button onClick={enviar} disabled={estado === "enviando" || !texto.trim()}
                style={{ ...BTN("pri"), flex: 2, justifyContent: "center",
                  opacity: (estado === "enviando" || !texto.trim()) ? 0.5 : 1,
                  cursor: (estado === "enviando" || !texto.trim()) ? "default" : "pointer" }}>
                {estado === "enviando"
                  ? T("Enviando…", "Sending…", "Envoi…", "Wird gesendet…", "Enviando…", "Invio…")
                  : T("Enviar consulta", "Send question", "Envoyer la question", "Frage senden", "Enviar consulta", "Invia domanda")}
              </button>
            </div>

            <p style={{ color: C.ivoryM, fontSize: 11.5, textAlign: "center", marginTop: 12, lineHeight: 1.5 }}>
              {T("¿Tienes un problema técnico con la plataforma? Usa el botón de Soporte.",
                 "Having a technical problem with the platform? Use the Support button.",
                 "Un problème technique avec la plateforme ? Utilisez le bouton Support.",
                 "Ein technisches Problem mit der Plattform? Nutze die Support-Schaltfläche.",
                 "Tem um problema técnico com a plataforma? Use o botão de Suporte.",
                 "Hai un problema tecnico con la piattaforma? Usa il pulsante Assistenza.")}
            </p>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}

const MODAL_CARD = {
  background: "rgba(45,122,90,0.12)",
  border: "1px solid rgba(45,122,90,0.4)",
  borderRadius: 14,
  padding: "16px 18px",
};
