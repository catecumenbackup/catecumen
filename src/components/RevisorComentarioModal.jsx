import { useState } from "react";
import { C, BTN, CARD, MODAL, OVERLAY } from "../ui.js";
import { T, PICK } from "../i18n.js";
import { useEscClose, BotonX } from "./modalUtils.jsx";
import { supabase } from "../supabaseClient.js";

// Popup para el REVISOR ECLESIÁSTICO al terminar un video: escribe su comentario
// y le llega directamente al administrador (RPC revisor_comentar → notificación +
// tabla revisor_comentarios). Es opcional: puede omitirlo y continuar.
export default function RevisorComentarioModal({secId,vid,bridge,onClose}){
  useEscClose(onClose);
  const [texto,setTexto]=useState("");
  const [enviando,setEnviando]=useState(false);
  const [enviado,setEnviado]=useState(false);
  const [error,setError]=useState("");
  const videoUuid=bridge?.frontToUuid?.[secId]?.[vid?.id]||null;
  const titulo=PICK(vid);
  const contexto=`${secId}${titulo?" · "+titulo:""}`;

  const enviar=async()=>{
    if(!texto.trim()||enviando) return;
    setEnviando(true); setError("");
    try{
      const {data,error:e}=await supabase.rpc("revisor_comentar",
        {p_video_id:videoUuid,p_contexto:contexto,p_comentario:texto.trim()});
      if(e||!data?.ok){ setError(T("No se pudo enviar. Intenta de nuevo.","Could not send. Please try again.","Échec de l'envoi. Réessayez.","Senden fehlgeschlagen. Bitte erneut versuchen.","Não foi possível enviar. Tente novamente.","Invio non riuscito. Riprova.")); setEnviando(false); return; }
      setEnviado(true);
      setTimeout(onClose,1300);
    }catch{ setError(T("No se pudo enviar. Intenta de nuevo.","Could not send. Please try again.","Échec de l'envoi. Réessayez.","Senden fehlgeschlagen. Bitte erneut versuchen.","Não foi possível enviar. Tente novamente.","Invio non riuscito. Riprova.")); setEnviando(false); }
  };

  return(
    <div style={OVERLAY}>
      <div style={{...MODAL,maxWidth:520,position:"relative",textAlign:"left"}}>
        <BotonX onClose={onClose} />
        <div style={{textAlign:"center",marginBottom:6}}>
          <div style={{fontSize:38,marginBottom:4}}>📝</div>
          <h2 style={{fontFamily:"'Cinzel',serif",color:C.gold,fontSize:19,margin:0}}>
            {T("Comentario del revisor eclesiástico","Ecclesiastical reviewer comment","Commentaire du réviseur ecclésiastique","Kommentar des kirchlichen Prüfers","Comentário do revisor eclesiástico","Commento del revisore ecclesiastico")}
          </h2>
        </div>
        <p style={{color:C.ivoryM,fontFamily:"'Crimson Text',serif",fontSize:13.5,lineHeight:1.5,margin:"8px 0 4px"}}>
          {T("Tus observaciones sobre este video llegarán directamente al administrador.","Your remarks on this video go straight to the administrator.","Vos observations sur cette vidéo parviennent directement à l'administrateur.","Deine Anmerkungen zu diesem Video gehen direkt an den Administrator.","Suas observações sobre este vídeo chegam diretamente ao administrador.","Le tue osservazioni su questo video arrivano direttamente all'amministratore.")}
        </p>
        <p style={{color:C.gold,fontFamily:"'Crimson Text',serif",fontSize:12,margin:"0 0 10px",opacity:0.85}}>{contexto}</p>

        {enviado?(
          <div style={{...CARD,background:"rgba(45,122,90,0.12)",textAlign:"center",padding:"18px"}}>
            <p style={{color:C.green,fontFamily:"'Cinzel',serif",fontSize:16,margin:0}}>
              ✓ {T("Comentario enviado","Comment sent","Commentaire envoyé","Kommentar gesendet","Comentário enviado","Commento inviato")}
            </p>
          </div>
        ):(<>
          <textarea value={texto} onChange={e=>setTexto(e.target.value)} rows={5}
            placeholder={T("Escribe aquí tus observaciones…","Write your remarks here…","Écrivez vos observations ici…","Schreibe hier deine Anmerkungen…","Escreva aqui suas observações…","Scrivi qui le tue osservazioni…")}
            style={{width:"100%",boxSizing:"border-box",background:"rgba(255,255,255,0.06)",
              border:"1px solid rgba(200,169,81,0.35)",borderRadius:10,color:C.ivory,
              fontFamily:"'Crimson Text',serif",fontSize:14,padding:"10px 12px",resize:"vertical"}}/>
          {error&&<p style={{color:"#F87171",fontSize:12.5,margin:"6px 0 0"}}>{error}</p>}
          <div style={{display:"flex",gap:10,marginTop:14,justifyContent:"flex-end",flexWrap:"wrap"}}>
            <button onClick={onClose} style={{...BTN("sec"),minWidth:120}}>
              {T("Omitir","Skip","Ignorer","Überspringen","Omitir","Salta")}
            </button>
            <button onClick={enviar} disabled={!texto.trim()||enviando}
              style={{...BTN("pri"),minWidth:150,opacity:(!texto.trim()||enviando)?0.6:1}}>
              {enviando?T("Enviando…","Sending…","Envoi…","Senden…","Enviando…","Invio…")
                       :T("Enviar al administrador","Send to administrator","Envoyer à l'administrateur","An den Administrator senden","Enviar ao administrador","Invia all'amministratore")}
            </button>
          </div>
        </>)}
      </div>
    </div>
  );
}
