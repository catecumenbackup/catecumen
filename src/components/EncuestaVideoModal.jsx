import { useState } from "react";
import { supabase } from "../supabaseClient.js";
import EstrellasInput from "./EstrellasInput.jsx";
import { C, BTN, MODAL, OVERLAY } from "../ui.js";
import { T, PICK } from "../i18n.js";

export default function EncuestaVideoModal({secId,vid,insBySec,bridge,onDone}){
  const [claridad,setClaridad]=useState(0);
  const [contenido,setContenido]=useState(0);
  const [audiovideo,setAudiovideo]=useState(0);
  const [utilidad,setUtilidad]=useState(0);
  const [comentario,setComentario]=useState("");
  const [enviando,setEnviando]=useState(false);
  const title=PICK(vid);
  const completa=claridad&&contenido&&audiovideo&&utilidad;

  const params=[
    {v:claridad,  set:setClaridad,   lbl:T("Claridad de la exposición","Clarity of the presentation","Clarté de l'exposé","Klarheit der Darstellung","Clareza da exposição","Chiarezza dell'esposizione")},
    {v:contenido, set:setContenido,  lbl:T("Calidad del contenido","Quality of the content","Qualité du contenu","Qualität des Inhalts","Qualidade do conteúdo","Qualità del contenuto")},
    {v:audiovideo,set:setAudiovideo, lbl:T("Calidad de audio y video","Audio and video quality","Qualité audio et vidéo","Audio- und Videoqualität","Qualidade de áudio e vídeo","Qualità audio e video")},
    {v:utilidad,  set:setUtilidad,   lbl:T("Utilidad para tu formación","Usefulness for your formation","Utilité pour votre formation","Nutzen für Ihre Ausbildung","Utilidade para sua formação","Utilità per la tua formazione")},
  ];

  const enviar=async()=>{
    if(!completa) return;
    setEnviando(true);
    try{
      // Traducir el id del frontend (p.ej. "tc-01") al UUID real de la tabla
      // `videos` mediante el puente. Sin esto, la encuesta no se guarda.
      const videoUuid = bridge?.frontToUuid?.[secId]?.[vid.id] || null;
      if(videoUuid){
        await supabase.rpc("guardar_encuesta_video",{
          p_video_id: videoUuid,
          p_claridad: claridad, p_contenido: contenido,
          p_audiovideo: audiovideo, p_utilidad: utilidad,
          p_comentario: comentario||null,
        });
      }else{
        console.warn("encuesta: no se encontró UUID para", secId, vid.id, "— no se guardó");
      }
    }catch(e){ console.error("guardar_encuesta_video:",e); }
    setEnviando(false);
    onDone(); // continúa a la evaluación
  };

  return(
    <div style={OVERLAY}>
      <div style={{...MODAL,maxWidth:560}}>
        <div style={{textAlign:"center",marginBottom:16}}>
          <div style={{fontSize:28,marginBottom:8}}>⭐</div>
          <h2 style={{fontFamily:"'Cinzel',serif",color:C.gold,fontSize:17}}>
            {T("Antes de tu evaluación","Before your evaluation","Avant votre évaluation","Vor Ihrer Bewertung","Antes da sua avaliação","Prima della tua valutazione")}
          </h2>
          <p style={{color:C.ivoryM,fontSize:13,marginTop:4}}>{title}</p>
          <p style={{color:C.ivoryM,fontSize:12.5,marginTop:6,lineHeight:1.5}}>
            {T("Tu opinión nos ayuda a mejorar la formación. Califica esta lección para continuar.","Your feedback helps us improve the formation. Rate this lesson to continue.","Votre avis nous aide à améliorer la formation. Évaluez cette leçon pour continuer.","Ihr Feedback hilft uns, die Ausbildung zu verbessern. Bewerten Sie diese Lektion, um fortzufahren.","Sua opinião nos ajuda a melhorar a formação. Avalie esta lição para continuar.","Il tuo parere ci aiuta a migliorare la formazione. Valuta questa lezione per continuare.")}
          </p>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {params.map((p,idx)=>(
            <div key={idx} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,
              padding:"10px 14px",borderRadius:12,background:`${C.card}`,border:`1px solid ${C.borderD}`}}>
              <span style={{color:C.ivory,fontFamily:"'Crimson Text',serif",fontSize:15}}>{p.lbl}</span>
              <EstrellasInput valor={p.v} onChange={p.set}/>
            </div>
          ))}

          <div>
            <label style={{color:C.ivoryM,fontSize:13,fontFamily:"'Crimson Text',serif",display:"block",marginBottom:6}}>
              {T("Comentario o sugerencia (opcional)","Comment or suggestion (optional)","Commentaire ou suggestion (facultatif)","Kommentar oder Vorschlag (optional)","Comentário ou sugestão (opcional)","Commento o suggerimento (facoltativo)")}
            </label>
            <textarea value={comentario} onChange={e=>setComentario(e.target.value)} rows={3} maxLength={600}
              placeholder={T("Escribe aquí…","Write here…","Écrivez ici…","Hier schreiben…","Escreva aqui…","Scrivi qui…")}
              style={{width:"100%",resize:"vertical",background:C.card,color:C.ivory,
                border:`1px solid ${C.borderD}`,borderRadius:10,padding:"10px 12px",
                fontFamily:"'Crimson Text',serif",fontSize:14.5,outline:"none"}}/>
          </div>
        </div>

        <button onClick={enviar} disabled={!completa||enviando}
          style={{...BTN("pri"),width:"100%",justifyContent:"center",fontSize:15,marginTop:16,
            opacity:(!completa||enviando)?0.5:1,cursor:(!completa||enviando)?"default":"pointer"}}>
          {enviando
            ? T("Guardando…","Saving…","Enregistrement…","Speichern…","Salvando…","Salvataggio…")
            : (completa
                ? T("Continuar a la evaluación","Continue to evaluation","Continuer vers l'évaluation","Weiter zur Bewertung","Continuar para a avaliação","Continua alla valutazione")+" →"
                : T("Califica los 4 aspectos","Rate all 4 aspects","Évaluez les 4 aspects","Bewerten Sie alle 4 Aspekte","Avalie os 4 aspectos","Valuta tutti e 4 gli aspetti"))}
        </button>
      </div>
    </div>
  );
}
