import { PICK, T } from "../i18n.js";
import { C, BTN, CARD, MODAL, OVERLAY } from "../ui.js";

// Pantalla que ve un usuario PREINSCRITO al iniciar sesión mientras la
// plataforma no ha abierto al acceso total. `mensaje` es el texto i18n
// configurable desde el panel (ajuste "preinscripcion".mensaje); si no hay,
// se usa un texto por defecto.
export default function PreinscripcionEspera({ mensaje, nombre, onLogout }){
  const texto = (mensaje && PICK(mensaje)) ||
    T("Tu preinscripción está confirmada. Aún no se requiere ningún pago. Te avisaremos por este medio en cuanto se abra el acceso completo a la plataforma para que puedas completar tu inscripción. ¡Gracias por tu paciencia y que Dios te bendiga!",
      "Your pre-registration is confirmed. No payment is required yet. We'll notify you here as soon as full access to the platform opens so you can complete your registration. Thank you for your patience, and God bless you!",
      "Votre préinscription est confirmée. Aucun paiement n'est requis pour l'instant. Nous vous préviendrons ici dès l'ouverture de l'accès complet à la plateforme afin que vous puissiez finaliser votre inscription. Merci de votre patience, et que Dieu vous bénisse !",
      "Ihre Voranmeldung ist bestätigt. Es ist noch keine Zahlung erforderlich. Wir benachrichtigen Sie hier, sobald der vollständige Zugang zur Plattform freigeschaltet wird, damit Sie Ihre Anmeldung abschließen können. Vielen Dank für Ihre Geduld, und Gott segne Sie!",
      "Sua pré-inscrição está confirmada. Ainda não é necessário nenhum pagamento. Avisaremos por aqui assim que o acesso completo à plataforma for aberto para que você possa concluir sua inscrição. Obrigado pela paciência, e que Deus te abençoe!",
      "La tua preiscrizione è confermata. Non è ancora richiesto alcun pagamento. Ti avviseremo qui non appena si aprirà l'accesso completo alla piattaforma, così potrai completare la tua iscrizione. Grazie per la pazienza, e che Dio ti benedica!");
  return (
    <div style={OVERLAY}>
      <div style={{ ...MODAL, maxWidth: 520, textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 10 }}>⏳</div>
        <h2 style={{ fontFamily: "'Cinzel',serif", color: C.gold, fontSize: 20, marginBottom: 6 }}>
          {T("Preinscripción confirmada", "Pre-registration confirmed", "Préinscription confirmée", "Voranmeldung bestätigt", "Pré-inscrição confirmada", "Preiscrizione confermata")}
        </h2>
        {nombre && (
          <p style={{ color: C.goldL, fontFamily: "'Crimson Text',serif", fontSize: 16, marginBottom: 14 }}>
            {T("¡Hola", "Hello", "Bonjour", "Hallo", "Olá", "Ciao")}, {nombre}
          </p>
        )}
        <div style={{ ...CARD, background: "rgba(200,169,81,0.08)", marginBottom: 20 }}>
          <p style={{ color: C.ivory, fontFamily: "'Crimson Text',serif", fontSize: 16, lineHeight: 1.7, whiteSpace: "pre-line" }}>
            {texto}
          </p>
        </div>
        <button onClick={onLogout}
          style={{ ...BTN("sec"), width: "100%", justifyContent: "center" }}>
          {T("Cerrar sesión", "Sign out", "Se déconnecter", "Abmelden", "Sair", "Esci")}
        </button>
      </div>
    </div>
  );
}
