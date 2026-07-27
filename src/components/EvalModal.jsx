import { useState } from "react";
import { Q } from "../data/course.js";
import { C, BTN, CARD, MODAL, OVERLAY } from "../ui.js";
import { T, PICK } from "../i18n.js";

export default function EvalModal({secId,vid,onResult,onClose}){
  const qs=Q[vid.id]||(()=>{const keys=Object.keys(Q);return Q[keys[vid.o%keys.length]];})();
  const [ans,setAns]=useState({});
  const [submitted,setSubmitted]=useState(false);
  if(!qs) return null;
  const handleSubmit=()=>{
    const correct=qs.filter(q=>ans[q.id]===q.k).length;
    const score=(correct/qs.length)*10;
    setSubmitted(true);
    setTimeout(()=>onResult({score,passed:score>=8,correct,total:qs.length}),600);
  };
  const allAnswered=qs.every(q=>ans[q.id]);
  const title=PICK(vid);
  return(
    <div style={OVERLAY}>
      <div style={{...MODAL,maxWidth:640}}>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:28,marginBottom:8}}>📝</div>
          <h2 style={{fontFamily:"'Cinzel',serif",color:C.gold,fontSize:16}}>{T("Evaluación","Evaluation","Évaluation","Bewertung","Avaliação","Valutazione")}</h2>
          <p style={{color:C.ivoryM,fontSize:13,marginTop:4}}>{title}</p>
          <p style={{color:C.ivoryM,fontSize:12}}>
            {T("Necesitas 8/10 para aprobar","You need 8/10 to pass","Vous avez besoin de 8/10 pour réussir","Sie benötigen 8/10, um zu bestehen","Você precisa de 8/10 para ser aprovado","Ti servono 8/10 per superare la prova")} | 
            {T(` ${qs.length} preguntas`,` ${qs.length} questions`,` ${qs.length} questions`,` ${qs.length} Fragen`,` ${qs.length} perguntas`,` ${qs.length} domande`)}
          </p>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:18}}>
          {qs.map((q,qi)=>(
            <div key={q.id} style={{...CARD}}>
              <p style={{color:C.ivory,fontFamily:"'Crimson Text',serif",fontSize:16,marginBottom:12}}>
                <strong style={{color:C.gold}}>{qi+1}.</strong> {q.q}
              </p>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {Object.entries(q.o).map(([k,v])=>(
                  <button key={k} onClick={()=>!submitted&&setAns(p=>({...p,[q.id]:k}))}
                    style={{
                      background:ans[q.id]===k?"rgba(200,169,81,0.18)":"rgba(255,255,255,0.04)",
                      border:`1.5px solid ${ans[q.id]===k?C.gold:C.borderD}`,
                      borderRadius:8,padding:"10px 12px",color:C.ivory,
                      fontFamily:"'Crimson Text',serif",fontSize:14,textAlign:"left",cursor:"pointer",
                      transition:"all .2s",
                    }}>
                    <strong style={{color:C.gold}}>{k.toUpperCase()}.</strong> {v}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:12,marginTop:20}}>
          <button onClick={onClose} style={{...BTN("sec"),flex:1,justifyContent:"center"}}>
            {T("Cancelar","Cancel","Annuler","Abbrechen","Cancelar","Annulla")}
          </button>
          <button onClick={handleSubmit} disabled={!allAnswered||submitted}
            style={{...BTN("pri"),flex:2,justifyContent:"center",
              opacity:(allAnswered&&!submitted)?1:0.4,cursor:(allAnswered&&!submitted)?"pointer":"not-allowed"}}>
            {submitted?T("Calificando…","Grading…","Notation en cours…","Wird bewertet…","Avaliando…","Valutazione in corso…"):T("Enviar evaluación","Submit evaluation","Envoyer l'évaluation","Bewertung einreichen","Enviar avaliação","Invia valutazione")}
          </button>
        </div>
      </div>
    </div>
  );
}
