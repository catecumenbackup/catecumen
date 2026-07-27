import { C, BTN, CARD, MODAL, OVERLAY } from "../ui.js";
import { T } from "../i18n.js";

export default function ThankYouModal({formData,onClose}){
  return(
    <div style={OVERLAY}>
      <div style={{...MODAL,maxWidth:500,textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:12}}>🙏</div>
        <h2 style={{fontFamily:"'Cinzel',serif",color:C.gold,fontSize:22,marginBottom:12}}>
          {T("¡Bienvenido/a!","Welcome!","Bienvenue !","Willkommen!","Bem-vindo/a!","Benvenuto/a!")}
        </h2>
        <p style={{color:C.ivory,fontFamily:"'Crimson Text',serif",fontSize:17,lineHeight:1.7,marginBottom:16}}>
          {T(
            `Gracias por tu inscripción, ${formData.nombre||""}. Tu pago ha sido procesado exitosamente. Hemos enviado la confirmación y tus datos de registro al correo ${formData.email||""}. Tu catequista asignada es Nelly Montoya.`,
            `Thank you for registering, ${formData.nombre||""}. Your payment was processed successfully. We sent confirmation to ${formData.email||""}. Your assigned catechist is Nelly Montoya.`,
            `Merci pour votre inscription, ${formData.nombre||""}. Votre paiement a été traité avec succès. Nous avons envoyé la confirmation et vos données d'inscription à l'adresse ${formData.email||""}. Votre catéchiste assignée est Nelly Montoya.`,
            `Vielen Dank für Ihre Anmeldung, ${formData.nombre||""}. Ihre Zahlung wurde erfolgreich verarbeitet. Wir haben die Bestätigung und Ihre Anmeldedaten an ${formData.email||""} gesendet. Ihre zugewiesene Katechetin ist Nelly Montoya.`,
            `Obrigado pela sua inscrição, ${formData.nombre||""}. Seu pagamento foi processado com sucesso. Enviamos a confirmação e seus dados de registro para o e-mail ${formData.email||""}. Sua catequista designada é Nelly Montoya.`,
            `Grazie per la tua iscrizione, ${formData.nombre||""}. Il tuo pagamento è stato elaborato con successo. Abbiamo inviato la conferma e i tuoi dati di registrazione all'indirizzo ${formData.email||""}. La tua catechista assegnata è Nelly Montoya.`
          )}
        </p>
        <div style={{...CARD,background:"rgba(200,169,81,0.08)",marginBottom:20,textAlign:"left"}}>
          <p style={{color:C.goldL,fontFamily:"'Cinzel',serif",fontSize:14,marginBottom:8}}>
            {T("Tu catequista asignada:","Your assigned catechist:","Votre catéchiste assignée :","Ihre zugewiesene Katechetin:","Sua catequista designada:","La tua catechista assegnata:")}
          </p>
          <p style={{color:C.ivory,fontFamily:"'Crimson Text',serif",fontSize:17}}>🧑‍🏫 Nelly Montoya</p>
          {formData.registrationId&&(
            <div style={{marginTop:12,borderTop:`1px solid ${C.borderD}`,paddingTop:10}}>
              <p style={{color:C.goldL,fontFamily:"'Cinzel',serif",fontSize:12,letterSpacing:"0.08em",marginBottom:4}}>
                {T("IDENTIFICADOR DE REGISTRO","REGISTRATION ID","IDENTIFIANT D'INSCRIPTION","REGISTRIERUNGSKENNUNG","IDENTIFICADOR DE REGISTRO","IDENTIFICATIVO DI REGISTRAZIONE")}
              </p>
              <p style={{color:C.gold,fontFamily:"'Cinzel',serif",fontSize:16,fontWeight:700,letterSpacing:"0.12em"}}>
                {formData.registrationId}
              </p>
              <p style={{color:C.ivoryM,fontSize:11,marginTop:4}}>
                {T("Este identificador se ha enviado a tu correo junto con los datos de tu registro.","This ID has been sent to your email along with your registration details.","Cet identifiant a été envoyé à votre e-mail avec les données de votre inscription.","Diese Kennung wurde zusammen mit Ihren Anmeldedaten an Ihre E-Mail gesendet.","Este identificador foi enviado ao seu e-mail junto com os dados do seu registro.","Questo identificativo è stato inviato alla tua email insieme ai dati della tua registrazione.")}
              </p>
            </div>
          )}
        </div>
        <button onClick={onClose} style={{...BTN("pri"),width:"100%",justifyContent:"center"}}>
          {T("Comenzar mi formación en Tronco Común 1","Begin my formation in Common Core 1","Commencer ma formation en Tronc Commun 1","Meine Ausbildung in Gemeinsamer Grundlagenkurs 1 beginnen","Começar minha formação no Tronco Comum 1","Inizia la mia formazione nel Tronco Comune 1")} →
        </button>
      </div>
    </div>
  );
}
