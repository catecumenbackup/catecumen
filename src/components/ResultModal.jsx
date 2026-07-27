import { C, BTN, CARD, MODAL, OVERLAY } from "../ui.js";
import { T, PICK } from "../i18n.js";

export default function ResultModal({result,vid,onClose}){
  const {score,passed,correct,total}=result;
  const title=PICK(vid);
  return(
    <div style={OVERLAY}>
      <div style={{...MODAL,maxWidth:460,textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:8}}>{passed?"🏆":"📚"}</div>
        <h2 style={{fontFamily:"'Cinzel',serif",color:passed?C.green:"#F87171",fontSize:20,marginBottom:8}}>
          {passed?T("¡Aprobado!","Passed!","Réussi !","Bestanden!","Aprovado!","Superato!"):T("No aprobado","Not passed","Non réussi","Nicht bestanden","Não aprovado","Non superato")}
        </h2>
        <p style={{color:C.ivoryM,fontSize:14,marginBottom:12}}>{title}</p>
        <div style={{...CARD,background:passed?"rgba(45,122,90,0.12)":"rgba(248,113,113,0.12)",
          marginBottom:16,display:"inline-block",padding:"16px 40px"}}>
          <p style={{color:passed?C.green:"#F87171",fontFamily:"'Cinzel',serif",fontSize:32,fontWeight:700}}>
            {score.toFixed(1)}/10
          </p>
          <p style={{color:C.ivoryM,fontSize:13}}>{correct}/{total} {T("correctas","correct","correctes","richtig","corretas","corrette")}</p>
        </div>
        {!passed&&(
          <p style={{color:"#FCA5A5",fontFamily:"'Crimson Text',serif",fontSize:15,marginBottom:16}}>
            {T("Necesitas 8/10 para aprobar. El video ha sido marcado como no visto para que puedas revisarlo antes de intentar de nuevo.","You need 8/10 to pass. The video has been marked as unwatched so you can review it before trying again.","Vous avez besoin de 8/10 pour réussir. La vidéo a été marquée comme non visionnée afin que vous puissiez la revoir avant de réessayer.","Sie benötigen 8/10, um zu bestehen. Das Video wurde als ungesehen markiert, damit Sie es vor dem nächsten Versuch erneut ansehen können.","Você precisa de 8/10 para ser aprovado. O vídeo foi marcado como não assistido para que você possa revisá-lo antes de tentar novamente.","Ti servono 8/10 per superare la prova. Il video è stato contrassegnato come non visto, così puoi rivederlo prima di riprovare.")}
          </p>
        )}
        {passed&&(
          <p style={{color:"#86EFAC",fontFamily:"'Crimson Text',serif",fontSize:15,marginBottom:16}}>
            {T("¡Excelente! Puedes continuar con el siguiente tema.","Excellent! You may continue to the next topic.","Excellent ! Vous pouvez passer au sujet suivant.","Ausgezeichnet! Sie können mit dem nächsten Thema fortfahren.","Excelente! Você pode continuar para o próximo tema.","Ottimo! Puoi proseguire con l'argomento successivo.")}
          </p>
        )}
        <button onClick={onClose} style={{...BTN("pri"),width:"100%",justifyContent:"center"}}>
          {T("Continuar","Continue","Continuer","Weiter","Continuar","Continua")} →
        </button>
      </div>
    </div>
  );
}
