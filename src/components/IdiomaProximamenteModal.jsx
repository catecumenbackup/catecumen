// IdiomaProximamenteModal — Aviso "próximamente en tu idioma" + preinscripción.
// Se muestra a usuarios cuyo idioma activo NO es español (la plataforma solo
// tiene contenido en español por ahora). Captura nombre + correo y avisa al
// admin (reusa la edge function genérica `avisar-admin`: notificación en el
// panel + correo). El texto sale en el idioma activo vía T().
import { useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../supabaseClient.js";
import { C, BTN, INP, MODAL, OVERLAY } from "../ui.js";
import { T, LANG, setAppLanguage } from "../i18n.js";

const NOMBRE_IDIOMA = { es:"español", en:"English", fr:"français", de:"Deutsch", pt:"português", it:"italiano" };

export default function IdiomaProximamenteModal({ onClose, bloqueante = false, onLogout }) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState("form"); // form | enviando | ok | error
  const emailOk = /^\S+@\S+\.\S+$/.test(email.trim());
  const puede = nombre.trim().length >= 2 && emailOk;

  const enviar = async () => {
    if (!puede || estado === "enviando") return;
    setEstado("enviando");
    try {
      await supabase.functions.invoke("avisar-admin", { body: {
        tipo: "preinscripcion_idioma",
        titulo: "Preinscripción — idioma aún no disponible",
        detalle: { nombre: nombre.trim(), email: email.trim(), idioma: LANG, idioma_nombre: NOMBRE_IDIOMA[LANG] || LANG },
      }});
      setEstado("ok");
    } catch (e) { setEstado("error"); }
  };

  return createPortal(
    <div style={OVERLAY} onClick={bloqueante ? undefined : onClose}>
      <div style={{ ...MODAL, maxWidth: 480, textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 34, marginBottom: 8 }} aria-hidden="true">🌍</div>
        <h2 style={{ fontFamily: "'Cinzel',serif", color: C.gold, fontSize: 19, marginBottom: 10 }}>
          {T("Próximamente en tu idioma", "Coming soon in your language", "Bientôt dans votre langue",
             "Bald in deiner Sprache", "Em breve no seu idioma", "Presto nella tua lingua")}
        </h2>

        {estado === "ok" ? (
          <>
            <p style={{ color: C.ivory, fontFamily: "'Crimson Text',serif", fontSize: 15.5, lineHeight: 1.6, marginBottom: 18 }}>
              {T("¡Gracias! Guardamos tu preinscripción. Te avisaremos por correo en cuanto Catecumen abra en tu idioma.",
                 "Thank you! We saved your pre-registration. We'll email you as soon as Catecumen opens in your language.",
                 "Merci ! Votre préinscription est enregistrée. Nous vous écrirons dès l'ouverture de Catecumen dans votre langue.",
                 "Danke! Deine Vormerkung ist gespeichert. Wir benachrichtigen dich per E-Mail, sobald Catecumen in deiner Sprache öffnet.",
                 "Obrigado! Guardamos sua pré-inscrição. Avisaremos por e-mail assim que a Catecumen abrir no seu idioma.",
                 "Grazie! Abbiamo salvato la tua preiscrizione. Ti avviseremo via e-mail appena Catecumen aprirà nella tua lingua.")}
            </p>
            <button onClick={bloqueante ? onLogout : onClose} style={{ ...BTN("pri"), width: "100%", justifyContent: "center" }}>
              {bloqueante
                ? T("Cerrar sesión", "Log out", "Se déconnecter", "Abmelden", "Sair", "Esci")
                : T("Cerrar", "Close", "Fermer", "Schließen", "Fechar", "Chiudi")}
            </button>
          </>
        ) : (
          <>
            <p style={{ color: C.ivory, fontFamily: "'Crimson Text',serif", fontSize: 15, lineHeight: 1.6, marginBottom: 16 }}>
              {T("La formación de Catecumen todavía no está disponible en tu idioma. La estamos preparando con mucho cuidado y la abriremos muy pronto. Déjanos tus datos para avisarte en cuanto esté lista y reservar tu preinscripción.",
                 "Catecumen's formation is not available in your language yet. We're preparing it carefully and will open it very soon. Leave your details to be notified when it's ready and to reserve your pre-registration.",
                 "La formation de Catecumen n'est pas encore disponible dans votre langue. Nous la préparons avec soin et l'ouvrirons très bientôt. Laissez vos coordonnées pour être prévenu dès qu'elle sera prête et réserver votre préinscription.",
                 "Die Catecumen-Formation ist noch nicht in deiner Sprache verfügbar. Wir bereiten sie sorgfältig vor und öffnen sie sehr bald. Hinterlasse deine Daten, um benachrichtigt zu werden und deine Vormerkung zu sichern.",
                 "A formação da Catecumen ainda não está disponível no seu idioma. Estamos preparando-a com cuidado e abriremos muito em breve. Deixe seus dados para ser avisado quando estiver pronta e reservar sua pré-inscrição.",
                 "La formazione di Catecumen non è ancora disponibile nella tua lingua. La stiamo preparando con cura e la apriremo molto presto. Lascia i tuoi dati per essere avvisato quando sarà pronta e riservare la tua preiscrizione.")}
            </p>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)}
              placeholder={T("Tu nombre", "Your name", "Votre nom", "Dein Name", "Seu nome", "Il tuo nome")}
              style={{ ...INP, width: "100%", marginBottom: 10 }} />
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email"
              placeholder={T("Tu correo electrónico", "Your email", "Votre e-mail", "Deine E-Mail", "Seu e-mail", "La tua e-mail")}
              style={{ ...INP, width: "100%", marginBottom: 14 }} />
            {estado === "error" && (
              <p style={{ color: C.wine, fontSize: 13, marginBottom: 10 }}>
                {T("No se pudo enviar. Revisa tu conexión e inténtalo de nuevo.", "Couldn't send. Check your connection and try again.",
                   "Échec de l'envoi. Vérifiez votre connexion et réessayez.", "Senden fehlgeschlagen. Prüfe deine Verbindung und versuche es erneut.",
                   "Não foi possível enviar. Verifique sua conexão e tente de novo.", "Invio non riuscito. Controlla la connessione e riprova.")}
              </p>
            )}
            <button onClick={enviar} disabled={!puede || estado === "enviando"}
              style={{ ...BTN("pri"), width: "100%", justifyContent: "center",
                opacity: (!puede || estado === "enviando") ? 0.5 : 1, cursor: (!puede || estado === "enviando") ? "default" : "pointer" }}>
              {estado === "enviando"
                ? T("Enviando…", "Sending…", "Envoi…", "Senden…", "Enviando…", "Invio…")
                : T("Solicitar preinscripción", "Request pre-registration", "Demander une préinscription",
                    "Vormerkung anfordern", "Solicitar pré-inscrição", "Richiedi preiscrizione")}
            </button>
            {bloqueante ? (
              <div style={{ marginTop: 14, display: "flex", gap: 18, justifyContent: "center", flexWrap: "wrap" }}>
                <button onClick={() => setAppLanguage("es")}
                  style={{ background: "none", border: "none", color: C.gold, fontFamily: "'Crimson Text',serif",
                    fontSize: 13.5, cursor: "pointer", textDecoration: "underline" }}>
                  {T("Ver en español", "View in Spanish", "Voir en espagnol", "Auf Spanisch ansehen", "Ver em espanhol", "Vedi in spagnolo")}
                </button>
                {onLogout && (
                  <button onClick={onLogout}
                    style={{ background: "none", border: "none", color: C.ivoryM, fontFamily: "'Crimson Text',serif",
                      fontSize: 13.5, cursor: "pointer", textDecoration: "underline" }}>
                    {T("Cerrar sesión", "Log out", "Se déconnecter", "Abmelden", "Sair", "Esci")}
                  </button>
                )}
              </div>
            ) : (
              <button onClick={onClose}
                style={{ background: "none", border: "none", color: C.ivoryM, fontFamily: "'Crimson Text',serif",
                  fontSize: 13.5, marginTop: 12, cursor: "pointer", textDecoration: "underline" }}>
                {T("Ahora no", "Not now", "Pas maintenant", "Jetzt nicht", "Agora não", "Non ora")}
              </button>
            )}
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
