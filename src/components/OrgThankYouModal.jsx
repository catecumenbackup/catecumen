import { C, BTN, MODAL, OVERLAY } from "../ui.js";
import { T } from "../i18n.js";

export default function OrgThankYouModal({orgType,formData,onClose}){
  return(
    <div style={OVERLAY}>
      <div style={{...MODAL,maxWidth:500,textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:12}}>{orgType==="parroquia"?"⛪":orgType==="centroadiccion"?"🏥":"🏛️"}</div>
        <h2 style={{fontFamily:"'Cinzel',serif",color:C.gold,fontSize:20,marginBottom:12}}>
          {T("¡Solicitud Recibida!","Request Received!","Demande reçue !","Antrag erhalten!","Solicitação Recebida!","Richiesta ricevuta!")}
        </h2>
        <p style={{color:C.ivory,fontFamily:"'Crimson Text',serif",fontSize:16,lineHeight:1.7}}>
          {T(
            `Hemos recibido la solicitud de afiliación de ${formData.nombre||""}. En breve nos pondremos en contacto al correo ${formData.email||""} para finalizar el proceso.`,
            `We have received the affiliation request for ${formData.nombre||""}. We will contact you at ${formData.email||""} shortly to complete the process.`,
            `Nous avons reçu la demande d'affiliation de ${formData.nombre||""}. Nous vous contacterons sous peu à l'adresse ${formData.email||""} pour finaliser le processus.`,
            `Wir haben den Antrag auf Anschluss von ${formData.nombre||""} erhalten. Wir werden Sie in Kürze unter ${formData.email||""} kontaktieren, um den Vorgang abzuschließen.`,
            `Recebemos a solicitação de afiliação de ${formData.nombre||""}. Em breve entraremos em contato pelo e-mail ${formData.email||""} para finalizar o processo.`,
            `Abbiamo ricevuto la richiesta di affiliazione di ${formData.nombre||""}. Ti contatteremo a breve all'indirizzo ${formData.email||""} per completare il processo.`
          )}
        </p>
        <button onClick={onClose} style={{...BTN("pri"),marginTop:24,width:"100%",justifyContent:"center"}}>
          {T("Cerrar","Close","Fermer","Schließen","Fechar","Chiudi")}
        </button>
      </div>
    </div>
  );
}
