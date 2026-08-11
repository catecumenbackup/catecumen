import { useState } from "react";
import useEtiquetasOpciones from "../hooks/useEtiquetasOpciones.js";
import { FlameIcon, CalizIcon, iconoBautismo, iconoConfirmacion } from "./icons.jsx";
import { C, BTN, CARD, MODAL, OVERLAY } from "../ui.js";
import { T } from "../i18n.js";

export default function SacSelectModal({onContinue,onBack}){
  const [sel,setSel]=useState([]);
  const etiquetas=useEtiquetasOpciones();
  const toggle=s=>setSel(p=>p.includes(s)?p.filter(x=>x!==s):[...p,s]);
  const sacs=[
    {k:"bautismo",   icon:"__bautismo_img__", es:"Bautismo",        en:"Baptism",        fr:"Baptême",       de:"Taufe",             pt:"Batismo",           it:"Battesimo"},
    {k:"confirmacion",icon:"__confirmacion_img__",es:"Confirmación",en:"Confirmation",   fr:"Confirmation",  de:"Firmung",           pt:"Crisma",            it:"Cresima"},
    {k:"primera_comunion",icon:"__caliz__",es:"Primera Comunión",en:"First Communion",   fr:"Première Communion",de:"Erstkommunion", pt:"Primeira Comunhão", it:"Prima Comunione"},
  ];
  const canContinue=sel.length>0;
  return(
    <div style={OVERLAY}>
      <div style={{...MODAL,maxWidth:560}}>
        <h2 style={{fontFamily:"'Cinzel',serif",color:C.gold,fontSize:18,marginBottom:6}}>
          {T("¿Qué sacramento(s) deseas recibir?","Which sacrament(s) do you wish to receive?","Quel(s) sacrement(s) souhaitez-vous recevoir ?","Welche(s) Sakrament(e) möchten Sie empfangen?","Qual(is) sacramento(s) você deseja receber?","Quale/i sacramento/i desideri ricevere?")}
        </h2>
        <p style={{color:C.ivoryM,fontSize:13,marginBottom:20}}>
          {T("Puedes elegir una, dos o las tres opciones","You may choose one, two, or all three","Vous pouvez choisir une, deux ou les trois options","Sie können eine, zwei oder alle drei Optionen wählen","Você pode escolher uma, duas ou as três opções","Puoi scegliere una, due o tutte e tre le opzioni")}
        </p>
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:24}}>
          {sacs.map(s=>{
            const etq=etiquetas[s.k];   // hay etiqueta → se muestra el chip
            const bloqueado=!!(etq&&etq.bloquea); // …y además inhabilita si el admin lo indicó
            return(
            <button key={s.k} onClick={bloqueado?undefined:()=>toggle(s.k)}
              disabled={bloqueado} aria-disabled={bloqueado}
              style={{...CARD,cursor:bloqueado?"not-allowed":"pointer",display:"flex",alignItems:"center",gap:14,
                border:`1.5px solid ${sel.includes(s.k)?C.gold:C.borderD}`,opacity:bloqueado?0.55:1,
                background:sel.includes(s.k)?"rgba(200,169,81,0.12)":C.card,transition:"all .2s"}}>
              {s.icon==="__caliz__"?<CalizIcon size={30}/>
               :s.icon==="__bautismo_img__"?<img src={iconoBautismo} width={30} height={30} style={{objectFit:"contain",filter:"sepia(1) saturate(3) brightness(0.95)"}} alt=""/>
               :s.icon==="__confirmacion_img__"?<img src={iconoConfirmacion} width={30} height={30} style={{objectFit:"contain",filter:"sepia(1) saturate(3) brightness(0.95)"}} alt=""/>
               :s.icon==="__flame__"?<FlameIcon size={28}/>
               :<span style={{fontSize:24}}>{s.icon}</span>}
              <span style={{color:C.ivory,fontFamily:"'Crimson Text',serif",fontSize:17,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                {T(s.es,s.en,s.fr,s.de,s.pt,s.it)}
                {etq&&(
                  <span style={{background:etq.bg,color:etq.fg,fontFamily:"'Cinzel',serif",
                    fontSize:10,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",
                    padding:"3px 9px",borderRadius:99,border:`1px solid ${etq.fg}55`}}>{etq.txt}</span>
                )}
              </span>
              {bloqueado?<span style={{marginLeft:"auto",fontSize:16}}>🔒</span>
               :sel.includes(s.k)&&<span style={{marginLeft:"auto",color:C.gold,fontSize:18}}>✓</span>}
            </button>
          );})}
        </div>
        
        <div style={{display:"flex",gap:12}}>
          <button onClick={onBack} style={{...BTN("sec"),flex:1,justifyContent:"center"}}>
            ← {T("Regresar","Back","Retour","Zurück","Voltar","Indietro")}
          </button>
          <button onClick={()=>canContinue&&onContinue(sel)}
            disabled={!canContinue}
            style={{...BTN("pri"),flex:2,justifyContent:"center",
              opacity:canContinue?1:0.4,cursor:canContinue?"pointer":"not-allowed"}}>
            {T("Continuar","Continue","Continuer","Weiter","Continuar","Continua")} →
          </button>
        </div>
      </div>
    </div>
  );
}
