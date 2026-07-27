import { useState } from "react";
import { supabase } from "../supabaseClient.js";
import { T } from "../i18n.js";
import { C, BTN, MODAL, OVERLAY } from "../ui.js";
import { FRow, Input, PasswordInput } from "./fields.jsx";

// Modal de inicio de sesión (correo + contraseña vía Supabase Auth), con
// mensajes de error específicos y enlaces a recuperar contraseña / reanudar
// pago. Diferido con React.lazy. Probado en LoginModal.test.jsx.
export default function LoginModal({ onBack, onSuccess, onResume }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const canLogin = email.includes("@") && pass.length >= 6;

  const handleLogin = async () => {
    if (!canLogin) return;
    setLoading(true); setErr("");
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) throw error;
      onSuccess(data.user);
    } catch (e) {
      const msg = e?.message || "";
      if (/email not confirmed/i.test(msg)) {
        setErr(T("Tu cuenta existe pero el correo aún no está confirmado. Busca el mensaje de confirmación en tu bandeja (y en spam) y haz clic en el enlace; después vuelve a iniciar sesión.", "Your account exists but the email is not yet confirmed. Find the confirmation message in your inbox (and spam) and click the link; then sign in again.", "Votre compte existe mais l'e-mail n'est pas encore confirmé. Recherchez le message de confirmation dans votre boîte de réception (et vos spams) et cliquez sur le lien ; puis reconnectez-vous.", "Ihr Konto existiert, aber die E-Mail-Adresse ist noch nicht bestätigt. Suchen Sie die Bestätigungsnachricht in Ihrem Posteingang (und im Spam-Ordner) und klicken Sie auf den Link; melden Sie sich danach erneut an.", "Sua conta existe, mas o e-mail ainda não foi confirmado. Procure a mensagem de confirmação na sua caixa de entrada (e no spam) e clique no link; depois faça login novamente.", "Il tuo account esiste ma l'email non è ancora confermata. Cerca il messaggio di conferma nella tua casella di posta (e nello spam) e clicca sul link; poi accedi di nuovo."));
      } else if (/invalid login credentials/i.test(msg)) {
        setErr(T("Correo o contraseña incorrectos. Verifica tus datos o usa «Recupérala aquí» para restablecer tu contraseña.", "Incorrect email or password. Check your credentials or use “Reset it here” to set a new password.", "E-mail ou mot de passe incorrect. Vérifiez vos données ou utilisez « Le récupérer ici » pour réinitialiser votre mot de passe.", "E-Mail-Adresse oder Passwort falsch. Überprüfen Sie Ihre Angaben oder nutzen Sie „Hier zurücksetzen“, um ein neues Passwort festzulegen.", "E-mail ou senha incorretos. Verifique seus dados ou use «Recuperar aqui» para redefinir sua senha.", "Email o password errati. Controlla i tuoi dati oppure usa «Recuperala qui» per reimpostare la password."));
      } else if (/rate limit|too many/i.test(msg)) {
        setErr(T("Demasiados intentos. Espera unos minutos e intenta de nuevo.", "Too many attempts. Wait a few minutes and try again.", "Trop de tentatives. Attendez quelques minutes et réessayez.", "Zu viele Versuche. Warten Sie einige Minuten und versuchen Sie es erneut.", "Muitas tentativas. Aguarde alguns minutos e tente novamente.", "Troppi tentativi. Attendi qualche minuto e riprova."));
      } else if (/network|fetch/i.test(msg)) {
        setErr(T("No hay conexión con el servidor. Revisa tu internet e intenta de nuevo.", "Cannot reach the server. Check your connection and try again.", "Aucune connexion au serveur. Vérifiez votre connexion internet et réessayez.", "Keine Verbindung zum Server. Überprüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.", "Sem conexão com o servidor. Verifique sua internet e tente novamente.", "Nessuna connessione al server. Controlla la tua connessione internet e riprova."));
      } else {
        setErr("⚠ " + msg);
      }
    } finally { setLoading(false); }
  };

  return (
    <div style={OVERLAY}>
      <div style={{ ...MODAL, maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🔑</div>
          <h2 style={{ fontFamily: "'Cinzel',serif", color: C.gold, fontSize: 20 }}>
            {T("Iniciar sesión", "Sign in", "Se connecter", "Anmelden", "Entrar", "Accedi")}
          </h2>
          <p style={{ color: C.ivoryM, fontFamily: "'Crimson Text',serif", fontSize: 14, marginTop: 6 }}>
            {T("Ingresa con tu correo y contraseña registrados.", "Sign in with your registered email and password.", "Connectez-vous avec votre e-mail et votre mot de passe enregistrés.", "Melden Sie sich mit Ihrer registrierten E-Mail-Adresse und Ihrem Passwort an.", "Entre com seu e-mail e senha cadastrados.", "Accedi con la tua email e password registrate.")}
          </p>
        </div>
        <FRow label={T("Correo electrónico", "Email address", "Adresse e-mail", "E-Mail-Adresse", "E-mail", "Indirizzo email")}>
          <Input type="email" value={email} onChange={setEmail} placeholder="usuario@correo.com" />
        </FRow>
        <FRow label={T("Contraseña", "Password", "Mot de passe", "Passwort", "Senha", "Password")}>
          <PasswordInput value={pass} onChange={setPass}
            placeholder={T("Tu contraseña", "Your password", "Votre mot de passe", "Ihr Passwort", "Sua senha", "La tua password")} />
        </FRow>
        {err && (
          <p style={{ color: "#F87171", fontFamily: "'Crimson Text',serif", fontSize: 14, marginBottom: 12 }}>⚠️ {err}</p>
        )}
        <button onClick={handleLogin} disabled={!canLogin || loading}
          style={{ ...BTN("pri"), width: "100%", justifyContent: "center",
            opacity: canLogin && !loading ? 1 : 0.4,
            cursor: canLogin && !loading ? "pointer" : "not-allowed", marginBottom: 12 }}>
          {loading
            ? T("Verificando...", "Verifying...", "Vérification...", "Wird überprüft...", "Verificando...", "Verifica in corso...")
            : T("Entrar a la plataforma", "Enter the platform", "Entrer sur la plateforme", "Zur Plattform", "Entrar na plataforma", "Entra nella piattaforma")} →
        </button>
        <button onClick={onBack} style={{ ...BTN("sec"), width: "100%", justifyContent: "center" }}>
          ← {T("Regresar", "Back", "Retour", "Zurück", "Voltar", "Indietro")}
        </button>
        <p style={{ color: C.ivoryM, fontSize: 12, textAlign: "center", marginTop: 14 }}>
          {T("¿Olvidaste tu contraseña?", "Forgot your password?", "Mot de passe oublié ?", "Passwort vergessen?", "Esqueceu sua senha?", "Hai dimenticato la password?")}
          {" "}<span style={{ color: C.gold, cursor: "pointer", textDecoration: "underline" }}
            onClick={() => window.open("https://www.catecumen.com/recuperar", "_blank")}>
            {T("Recupérala aquí", "Reset it here", "La récupérer ici", "Hier zurücksetzen", "Recuperar aqui", "Recuperala qui")}
          </span>
        </p>
        <p style={{ color: C.ivoryM, fontSize: 12, textAlign: "center", marginTop: 8 }}>
          {T("¿Te registraste pero no completaste tu pago?", "Registered but never finished payment?", "Vous êtes inscrit(e) mais n'avez pas terminé le paiement ?", "Registriert, aber die Zahlung nicht abgeschlossen?", "Registrou-se mas não concluiu o pagamento?", "Ti sei registrato/a ma non hai completato il pagamento?")}
          {" "}<span style={{ color: C.gold, cursor: "pointer", textDecoration: "underline" }} onClick={onResume}>
            {T("Reanúdalo aquí", "Resume it here", "Reprenez-le ici", "Hier fortsetzen", "Retome aqui", "Riprendilo qui")}
          </span>
        </p>
      </div>
    </div>
  );
}
