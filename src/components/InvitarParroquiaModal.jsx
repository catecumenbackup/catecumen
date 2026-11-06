// InvitarParroquiaModal — Aviso al entrar al directorio de parroquias afiliadas.
// Informa que, si la parroquia del usuario aún NO está afiliada, Catecumen gestiona
// directamente con la parroquia la aceptación de la constancia; y permite al usuario
// indicarnos su parroquia con el botón "Invitar a mi parroquia" (avisa al admin vía
// la edge function genérica `avisar-admin`: notificación en el panel + correo).
// Público (pre-login): `avisar-admin` usa service-role y no exige sesión.
import { useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../supabaseClient.js";
import { C, BTN, INP, MODAL, OVERLAY } from "../ui.js";
import { T, LANG } from "../i18n.js";

export default function InvitarParroquiaModal({ onClose }) {
  const [vista, setVista] = useState("info"); // info | form | enviando | ok | error
  const [parroquia, setParroquia] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const emailOk = /^\S+@\S+\.\S+$/.test(email.trim());
  const puede = parroquia.trim().length >= 2 && ciudad.trim().length >= 2 && nombre.trim().length >= 2 && emailOk;

  const enviar = async () => {
    if (!puede || vista === "enviando") return;
    setVista("enviando");
    try {
      await supabase.functions.invoke("avisar-admin", { body: {
        tipo: "invitar_parroquia",
        titulo: "Invitación a una parroquia (directorio de afiliados)",
        detalle: {
          parroquia: parroquia.trim(), ciudad: ciudad.trim(),
          nombre: nombre.trim(), email: email.trim(), idioma: LANG,
        },
      }});
      setVista("ok");
    } catch (e) { setVista("error"); }
  };

  const titulo = T("¿Tu parroquia todavía no está afiliada?", "Is your parish not affiliated yet?",
    "Votre paroisse n'est pas encore affiliée ?", "Ist deine Pfarrei noch nicht angeschlossen?",
    "Sua paróquia ainda não está afiliada?", "La tua parrocchia non è ancora affiliata?");

  return createPortal(
    <div style={{ ...OVERLAY, zIndex: 3200 }} onClick={onClose}>
      <div style={{ ...MODAL, maxWidth: 500, textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 34, marginBottom: 8 }} aria-hidden="true">⛪</div>
        <h2 style={{ fontFamily: "'Cinzel',serif", color: C.gold, fontSize: 19, marginBottom: 12 }}>{titulo}</h2>

        {vista === "ok" ? (
          <>
            <p style={{ color: C.ivory, fontFamily: "'Crimson Text',serif", fontSize: 15.5, lineHeight: 1.6, marginBottom: 18 }}>
              {T("¡Gracias! Recibimos los datos de tu parroquia. Nos pondremos en contacto con ella para gestionar la afiliación y la aceptación de tu constancia.",
                 "Thank you! We received your parish's details. We'll reach out to it to arrange the affiliation and the acceptance of your certificate.",
                 "Merci ! Nous avons reçu les coordonnées de votre paroisse. Nous la contacterons pour organiser l'affiliation et l'acceptation de votre attestation.",
                 "Danke! Wir haben die Daten deiner Pfarrei erhalten. Wir werden sie kontaktieren, um die Anbindung und die Anerkennung deiner Bescheinigung zu regeln.",
                 "Obrigado! Recebemos os dados da sua paróquia. Entraremos em contato com ela para tratar da afiliação e da aceitação da sua constância.",
                 "Grazie! Abbiamo ricevuto i dati della tua parrocchia. La contatteremo per organizzare l'affiliazione e l'accettazione del tuo attestato.")}
            </p>
            <button onClick={onClose} style={{ ...BTN("pri"), width: "100%", justifyContent: "center" }}>
              {T("Cerrar", "Close", "Fermer", "Schließen", "Fechar", "Chiudi")}
            </button>
          </>
        ) : vista === "form" || vista === "enviando" || vista === "error" ? (
          <>
            <p style={{ color: C.ivoryM, fontFamily: "'Crimson Text',serif", fontSize: 14, lineHeight: 1.55, marginBottom: 14 }}>
              {T("Indícanos cuál es tu parroquia y nosotros gestionamos con ella la afiliación y la aceptación de tu constancia.",
                 "Tell us which parish is yours and we'll handle the affiliation and the acceptance of your certificate with it.",
                 "Indiquez-nous votre paroisse et nous nous chargeons de l'affiliation et de l'acceptation de votre attestation avec elle.",
                 "Sag uns, welche deine Pfarrei ist, und wir kümmern uns mit ihr um die Anbindung und die Anerkennung deiner Bescheinigung.",
                 "Diga-nos qual é a sua paróquia e nós tratamos com ela a afiliação e a aceitação da sua constância.",
                 "Indicaci qual è la tua parrocchia e penseremo noi all'affiliazione e all'accettazione del tuo attestato con lei.")}
            </p>
            <input value={parroquia} onChange={(e) => setParroquia(e.target.value)}
              placeholder={T("Nombre de tu parroquia", "Your parish's name", "Nom de votre paroisse", "Name deiner Pfarrei", "Nome da sua paróquia", "Nome della tua parrocchia")}
              style={{ ...INP, width: "100%", marginBottom: 10 }} />
            <input value={ciudad} onChange={(e) => setCiudad(e.target.value)}
              placeholder={T("Ciudad / localidad y país", "City / town and country", "Ville / localité et pays", "Stadt / Ort und Land", "Cidade / localidade e país", "Città / località e paese")}
              style={{ ...INP, width: "100%", marginBottom: 10 }} />
            <input value={nombre} onChange={(e) => setNombre(e.target.value)}
              placeholder={T("Tu nombre", "Your name", "Votre nom", "Dein Name", "Seu nome", "Il tuo nome")}
              style={{ ...INP, width: "100%", marginBottom: 10 }} />
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email"
              placeholder={T("Tu correo electrónico", "Your email", "Votre e-mail", "Deine E-Mail", "Seu e-mail", "La tua e-mail")}
              style={{ ...INP, width: "100%", marginBottom: 14 }} />
            {vista === "error" && (
              <p style={{ color: C.wine, fontSize: 13, marginBottom: 10 }}>
                {T("No se pudo enviar. Revisa tu conexión e inténtalo de nuevo.", "Couldn't send. Check your connection and try again.",
                   "Échec de l'envoi. Vérifiez votre connexion et réessayez.", "Senden fehlgeschlagen. Prüfe deine Verbindung und versuche es erneut.",
                   "Não foi possível enviar. Verifique sua conexão e tente de novo.", "Invio non riuscito. Controlla la connessione e riprova.")}
              </p>
            )}
            <button onClick={enviar} disabled={!puede || vista === "enviando"}
              style={{ ...BTN("pri"), width: "100%", justifyContent: "center",
                opacity: (!puede || vista === "enviando") ? 0.5 : 1, cursor: (!puede || vista === "enviando") ? "default" : "pointer" }}>
              {vista === "enviando"
                ? T("Enviando…", "Sending…", "Envoi…", "Senden…", "Enviando…", "Invio…")
                : T("Enviar invitación", "Send invitation", "Envoyer l'invitation", "Einladung senden", "Enviar convite", "Invia invito")}
            </button>
            <button onClick={onClose}
              style={{ background: "none", border: "none", color: C.ivoryM, fontFamily: "'Crimson Text',serif",
                fontSize: 13.5, marginTop: 12, cursor: "pointer", textDecoration: "underline" }}>
              {T("Ahora no", "Not now", "Pas maintenant", "Jetzt nicht", "Agora não", "Non ora")}
            </button>
          </>
        ) : (
          <>
            <p style={{ color: C.ivory, fontFamily: "'Crimson Text',serif", fontSize: 15, lineHeight: 1.6, marginBottom: 16 }}>
              {T("Si tu parroquia aún no aparece en el directorio, no te preocupes: Catecumen gestiona directamente con tu parroquia la aceptación de tu constancia. Solo necesitamos que nos indiques cuál es.",
                 "If your parish isn't in the directory yet, don't worry: Catecumen works directly with your parish so it accepts your certificate. We just need you to tell us which one it is.",
                 "Si votre paroisse ne figure pas encore dans l'annuaire, pas d'inquiétude : Catecumen s'adresse directement à votre paroisse pour qu'elle accepte votre attestation. Il nous suffit que vous nous indiquiez laquelle.",
                 "Falls deine Pfarrei noch nicht im Verzeichnis steht, keine Sorge: Catecumen wendet sich direkt an deine Pfarrei, damit sie deine Bescheinigung anerkennt. Wir brauchen nur, dass du uns sagst, welche es ist.",
                 "Se sua paróquia ainda não aparece no diretório, não se preocupe: a Catecumen trata diretamente com sua paróquia a aceitação da sua constância. Só precisamos que você nos indique qual é.",
                 "Se la tua parrocchia non è ancora nel directory, non preoccuparti: Catecumen si rivolge direttamente alla tua parrocchia affinché accetti il tuo attestato. Ci basta che tu ci indichi quale sia.")}
            </p>
            <button onClick={() => setVista("form")} style={{ ...BTN("pri"), width: "100%", justifyContent: "center", color: "#FFFFFF" }}>
              ⛪ {T("Invitar a mi parroquia", "Invite my parish", "Inviter ma paroisse", "Meine Pfarrei einladen", "Convidar minha paróquia", "Invita la mia parrocchia")}
            </button>
            <button onClick={onClose}
              style={{ background: "none", border: "none", color: C.ivoryM, fontFamily: "'Crimson Text',serif",
                fontSize: 13.5, marginTop: 12, cursor: "pointer", textDecoration: "underline" }}>
              {T("Ahora no", "Not now", "Pas maintenant", "Jetzt nicht", "Agora não", "Non ora")}
            </button>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
