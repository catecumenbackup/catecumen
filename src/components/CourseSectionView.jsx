import { SEC_META, videoState } from "../data/course.js";
import SecIcon from "./SecIcon.jsx";
import { LibraryButton, ConsultarDudasButton, ConsultarIAButton, SoporteFloat } from "./support.jsx";
import { C, BTN, CARD } from "../ui.js";
import { T, PICK } from "../i18n.js";

// Área de estudio de una sección: línea de tiempo de videos con su estado
// (bloqueado/disponible/visto/aprobado) y botones de ver/evaluar/rever.
export default function CourseSectionView({secId,progress,onVideoAction,onEvalAction,onBack,onDash,canBack=true}){
  const sec=SEC_META[secId];
  if(!sec) return null;
  const vids=sec.videos;
  const prog=progress[secId]||{};
  const stateColor={locked:C.tM,available:C.blue,watched:C.gold,passed:C.green};
  const stateIcon={locked:"🔒",available:"▶",watched:"📋",passed:"✅"};
  const stateLabelES={locked:"Bloqueado",available:"Disponible",watched:"Visto — Evaluación pendiente",passed:"Aprobado"};
  const stateLabelEN={locked:"Locked",available:"Available",watched:"Watched — Evaluation pending",passed:"Passed"};
  return(
    <div style={{minHeight:"100vh",background:"rgba(250,247,240,0.82)",padding:"24px 16px",
      display:"flex",justifyContent:"center",alignItems:"flex-start"}}>
      <div className="catePanel" style={{maxWidth:720,width:"100%",
        background:`linear-gradient(160deg,var(--c-modalStart) 0%,${C.surface} 55%,var(--c-modalEnd) 100%)`,
        border:"1px solid rgba(200,169,81,0.18)",borderRadius:20,
        boxShadow:"0 24px 64px rgba(0,0,0,0.65)",
        padding:"26px clamp(14px,3vw,30px)",
        maxHeight:"calc(100dvh - 48px)",overflowY:"auto"}}>
        {/* Header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24,gap:8,flexWrap:"wrap"}}>
          {canBack
            ?<button onClick={onBack} style={{...BTN("sec"),fontSize:12}}>← {T("Volver","Back","Retour","Zurück","Voltar","Indietro")}</button>
            :<span/>}
          <div style={{display:"flex",gap:8,marginLeft:"auto"}}>
            <LibraryButton/>
            <ConsultarIAButton contexto={"Área de estudio — "+secId}/>
            <ConsultarDudasButton contexto={"Área de estudio — "+secId}/>
            <button onClick={onDash} style={{...BTN("sec"),fontSize:12}}>👤 {T("Mi Cuenta","My Account","Mon compte","Mein Konto","Minha Conta","Il mio account")}</button>
          </div>
        </div>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontSize:40,marginBottom:8}}><SecIcon id={secId} size={40}/></div>
          <h1 style={{fontFamily:"'Cinzel',serif",color:C.gold,fontSize:22}}>
            {PICK(sec)}
          </h1>
          <p style={{color:C.ivoryM,fontSize:13,marginTop:4}}>
            {vids.filter(v=>prog[v.id]?.passed).length}/{vids.length} {T("completados","completed","terminés","abgeschlossen","concluídos","completati")}
          </p>
        </div>
        {/* Timeline */}
        <div style={{position:"relative"}}>
          {/* vertical line */}
          <div style={{position:"absolute",left:28,top:0,bottom:0,width:2,
            background:`linear-gradient(to bottom,${C.gold}40,transparent)`,zIndex:0}}/>
          {vids.map((vid,idx)=>{
            const state=videoState(secId,vid,progress,vids);
            const vp=prog[vid.id]||{};
            return(
              <div key={vid.id} style={{display:"flex",gap:16,marginBottom:16,position:"relative",zIndex:1}}>
                {/* Circle */}
                <div style={{width:56,height:56,borderRadius:"50%",flexShrink:0,
                  background:state==="passed"?C.green:state==="watched"?C.gold:state==="available"?C.blue:C.gray,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:20,border:`2px solid ${state==="passed"?C.greenB:state==="available"?C.blueB:C.borderD}`,
                  boxShadow:state==="available"?`0 0 12px ${C.blue}60`:undefined}}>
                  {stateIcon[state]}
                </div>
                {/* Card */}
                <div style={{...CARD,flex:1,background:state==="locked"?C.surface:C.card,
                  opacity:state==="locked"?0.6:1}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                    <div>
                      <p style={{color:C.ivory,fontFamily:"'Crimson Text',serif",fontSize:16,fontWeight:600}}>
                        {idx+1}. {PICK(vid)}
                      </p>
                      <p style={{color:C.ivoryM,fontSize:12,marginTop:2}}>⏱ {vid.dur}</p>
                    </div>
                    <span style={{color:stateColor[state],fontSize:11,fontFamily:"'Cinzel',serif",
                      letterSpacing:"0.05em",whiteSpace:"nowrap",marginLeft:8}}>
                      {PICK({es:stateLabelES[state],en:stateLabelEN[state],fr:stateLabelES[state],de:stateLabelES[state],pt:stateLabelES[state],it:stateLabelES[state]})}
                    </span>
                  </div>
                  {vp.score!=null&&(
                    <p style={{color:vp.passed?C.green:"#F87171",fontSize:13,marginBottom:8}}>
                      {T("Última puntuación:","Last score:","Dernier score :","Letzte Punktzahl:","Última pontuação:","Ultimo punteggio:")} {vp.score.toFixed(1)}/10
                    </p>
                  )}
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    {(state==="available"||state==="watched")&&(
                      <button onClick={()=>onVideoAction(secId,vid)}
                        style={{...BTN("pri"),fontSize:12,padding:"8px 16px"}}>
                        ▶ {state==="watched"?T("Rever video","Rewatch","Revoir la vidéo","Video erneut ansehen","Rever vídeo","Rivedi il video"):T("Ver video","Watch","Voir","Ansehen","Ver","Guarda")}
                      </button>
                    )}
                    {state==="watched"&&(
                      <button onClick={()=>onEvalAction(secId,vid)}
                        style={{...BTN("sec"),fontSize:12,padding:"8px 16px"}}>
                        📝 {T("Evaluación","Evaluation","Évaluation","Bewertung","Avaliação","Valutazione")}
                      </button>
                    )}
                    {state==="passed"&&(
                      <button onClick={()=>onVideoAction(secId,vid)}
                        style={{...BTN("sec"),fontSize:12,padding:"8px 16px",opacity:.7}}>
                        ▶ {T("Rever","Rewatch","Revoir","Erneut ansehen","Rever","Rivedi")}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <SoporteFloat contexto={T("Área de formación — ","Formation area — ","Espace de formation — ","Ausbildungsbereich — ","Área de formação — ","Area di formazione — ")+PICK(sec)}/>
    </div>
  );
}
