import { useState, Fragment } from "react";
import useEtiquetasOpciones from "../hooks/useEtiquetasOpciones.js";
import { C, MODAL, OVERLAY } from "../ui.js";
import { T } from "../i18n.js";

export default function FilterModal({onSelect}){
  const [showBecas,setShowBecas]=useState(true);
  const etiquetas=useEtiquetasOpciones();
  const opts=[
    {k:"catecumeno", icon:"✝️", es:"Quiero recibir mis sacramentos",en:"I want to receive my sacraments",fr:"Je veux recevoir mes sacrements",de:"Ich möchte meine Sakramente empfangen",pt:"Quero receber meus sacramentos",it:"Voglio ricevere i miei sacramenti"},
    {k:"prebautismal",icon:"👨‍👩‍👧",es:"Soy papá/mamá y quiero formación pre-sacramental para que mi hijo reciba el Bautismo, Confirmación y/o Primera Comunión",en:"I'm a parent and want pre-sacramental formation for my child attending to receive the Baptism, Confirmation and/or Fist Communion",fr:"Je suis parent et je souhaite une formation pré-sacramentelle pour que mon enfant reçoive le Baptême, la Confirmation et/ou la Première Communion",de:"Ich bin Vater/Mutter und möchte eine vorsakramentale Bildung, damit mein Kind die Taufe, Firmung und/oder Erstkommunion empfängt",pt:"Sou pai/mãe e quero formação pré-sacramental para que meu filho receba o Batismo, a Crisma e/ou a Primeira Comunhão",it:"Sono genitore e desidero una formazione pre-sacramentale affinché mio figlio riceva il Battesimo, la Cresima e/o la Prima Comunione"},
    {k:"padrino",    icon:"🤝", es:"Soy padrino/madrina y quiero recibir formación sacramental",en:"I'm a godparent seeking sacramental formation",fr:"Je suis parrain/marraine et je souhaite une formation sacramentelle",de:"Ich bin Pate/Patin und möchte eine sakramentale Bildung erhalten",pt:"Sou padrinho/madrinha e quero receber formação sacramental",it:"Sono padrino/madrina e desidero ricevere una formazione sacramentale"},
    {k:"catequista", icon:"🧠", es:"Soy catequista y quiero formación en Neuropedagogía Catequética",en:"I'm a catechist seeking catechetical neuropedagogy training",fr:"Je suis catéchiste et je souhaite une formation en Neuropédagogie Catéchétique",de:"Ich bin Katechet/in und möchte eine Ausbildung in Katechetischer Neuropädagogik",pt:"Sou catequista e quero formação em Neuropedagogia Catequética",it:"Sono catechista e desidero una formazione in Neuropedagogia Catechetica"},
    {k:"parroquia",  icon:"⛪", es:"Soy una parroquia y deseo afiliarme a la plataforma",en:"I'm a parish seeking to affiliate with this platform",fr:"Je suis une paroisse et je souhaite m'affilier à la plateforme",de:"Ich bin eine Pfarrei und möchte mich der Plattform anschließen",pt:"Sou uma paróquia e desejo me afiliar à plataforma",it:"Sono una parrocchia e desidero affiliarmi alla piattaforma"},
    {k:"diocesis",   icon:"🏛️", es:"Soy una diócesis y deseo afiliarme a la plataforma",en:"I'm a diocese seeking to affiliate with this platform",fr:"Je suis un diocèse et je souhaite m'affilier à la plateforme",de:"Ich bin eine Diözese und möchte mich der Plattform anschließen",pt:"Sou uma diocese e desejo me afiliar à plataforma",it:"Sono una diocesi e desidero affiliarmi alla piattaforma"},
    {k:"centroadiccion",icon:"🏥", es:"Soy un Centro de Tratamiento de Adicciones y deseo afiliarme",en:"I'm an Addiction Treatment Center seeking to affiliate",fr:"Je suis un Centre de Traitement des Addictions et je souhaite m'affilier",de:"Ich bin ein Suchtbehandlungszentrum und möchte mich anschließen",pt:"Sou um Centro de Tratamento de Dependências e desejo me afiliar",it:"Sono un Centro di Trattamento delle Dipendenze e desidero affiliarmi"},
  ];
  return(
<div style={OVERLAY}>
    {/* ─── Animaciones inyectadas para el Pop-up ─── */}
    <style>
      {`
        @keyframes popupEntrance {
          0% {
            opacity: 0;
            transform: translateX(-50%) translateY(40px) scale(0.9);
          }
          60% {
            transform: translateX(-50%) translateY(-5px) scale(1.02);
          }
          100% {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1);
          }
        }
        
        @keyframes auraPulse {
          0% { 
            box-shadow: 0 0 22px 5px rgba(198, 146, 26, 0.55), 0 0 55px 16px rgba(212, 175, 55, 0.30), 0 8px 40px rgba(0,0,0,0.5), 0 0 0 2px ${C.gold}; 
          }
          50% { 
            box-shadow: 0 0 52px 16px rgba(198, 146, 26, 0.90), 0 0 120px 40px rgba(212, 175, 55, 0.55), 0 8px 40px rgba(0,0,0,0.5), 0 0 0 2px ${C.gold}; 
          }
          100% { 
            box-shadow: 0 0 22px 5px rgba(198, 146, 26, 0.55), 0 0 55px 16px rgba(212, 175, 55, 0.30), 0 8px 40px rgba(0,0,0,0.5), 0 0 0 2px ${C.gold}; 
          }
        }
      `}
    </style>

    {/* ─── Pop-up flotante de becas (fixed, sobre el modal) ─── */}
    {showBecas && (
      <div style={{
        position: "fixed", top: "clamp(12px, 9vh, 188px)", left: "50%", 
        zIndex: 10010, width: "min(540px, calc(100vw - 32px))",
        maxHeight: "calc(100dvh - 24px)", overflowY: "auto",
        background: `linear-gradient(145deg, var(--c-modalStart) 0%, var(--c-modalEnd) 100%)`,
        border: `1.5px solid ${C.gold}`, borderRadius: 16,
        padding: "16px clamp(14px, 4vw, 20px) 16px",
        
        transform: "translateX(-50%)",
        boxShadow: `0 0 22px 5px rgba(198, 146, 26, 0.55), 0 0 55px 16px rgba(212, 175, 55, 0.30), 0 8px 40px rgba(0,0,0,0.5), 0 0 0 2px ${C.gold}`,
        
        animation: "popupEntrance 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) forwards, auraPulse 3s infinite ease-in-out 0.7s"
      }}>
            {/* Header */}
<div style={{
  display: "flex", 
  justifyContent: "center", // Centra el contenido principal
  alignItems: "center", 
  marginBottom: 12, 
  position: "relative" // Necesario para posicionar el botón de forma absoluta
}}>
  <p style={{
    fontFamily: "'Cinzel',serif", 
    color: C.gold, 
    fontSize: "clamp(15px, 4.5vw, 20px)",
    letterSpacing: "0.1em", 
    textTransform: "uppercase",
    margin: 0, // Asegura que no haya márgenes por defecto que desfasen el centro
    textAlign: "center",
    padding: "0 34px" // Reserva espacio simétrico para el botón ✕ y evita encimamiento
  }}>
    🎓 {T("Becas disponibles","Scholarships available","Bourses disponibles","Verfügbare Stipendien","Bolsas disponíveis","Borse di studio disponibili")}
  </p>

  <button 
    onClick={() => setShowBecas(false)}
    style={{
      position: "absolute", // Saca el botón del flujo flexbox
      right: 0, // Lo pega al extremo derecho
      background: "rgba(200,169,81,0.15)", 
      border: `1px solid ${C.gold}60`,
      color: C.gold, 
      cursor: "pointer", 
      fontSize: 14, 
      lineHeight: 1,
      width: 26, 
      height: 26, 
      borderRadius: "50%", 
      display: "flex",
      alignItems: "center", 
      justifyContent: "center"
    }}
  >
                ✕
              </button>
            </div>
            {/* Divider */}
            <div style={{height:1,background:`${C.gold}30`,marginBottom:12}}/>
            {/* Becas */}
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <div style={{display:"flex",gap:12,alignItems:"flex-start",
                background:"rgba(255,255,255,0.03)",borderRadius:10,padding:"10px 12px",
                border:`1px solid ${C.gold}20`}}>
                <span style={{fontSize:22,lineHeight:1,flexShrink:0}}>🏆</span>
                <p style={{color:C.ivory,fontFamily:"'Crimson Text',serif",
                  fontSize:14.5,lineHeight:1.6,margin:0}}>
                  <strong style={{color:C.gold,fontFamily:"'Cinzel',serif",
                    fontSize:11.5,letterSpacing:"0.05em",display:"block",marginBottom:3}}>
                    {T("BECA SOLIDARIA DEL 100%","100% SOLIDARITY SCHOLARSHIP","BOURSE DE SOLIDARITÉ DE 100 %","SOLIDARITÄTSSTIPENDIUM VON 100 %","BOLSA SOLIDÁRIA DE 100%","BORSA DI SOLIDARIETÀ DEL 100%")}
                  </strong>
                  {T("Acceso totalmente gratuito a tu formación catequética si te encuentras interno en un reclusorio, correccional, albergue, asilo o casa hogar.","Completely free access to your catechetical formation if you are in a correctional, rehabilitation, shelter, nursing home, or group home institution.","Accès entièrement gratuit à votre formation catéchétique si vous êtes interné dans un établissement pénitentiaire, un centre correctionnel, un foyer, une maison de retraite ou un foyer d'accueil.","Völlig kostenloser Zugang zu Ihrer katechetischen Bildung, wenn Sie sich in einer Justizvollzugsanstalt, einer Erziehungseinrichtung, einem Heim, einem Altenheim oder einem Kinderheim befinden.","Acesso totalmente gratuito à sua formação catequética se você estiver internado em um presídio, centro correcional, abrigo, asilo ou casa lar.","Accesso totalmente gratuito alla tua formazione catechetica se ti trovi recluso in un carcere, riformatorio, rifugio, casa di riposo o casa famiglia.")}
                </p>
              </div>
              <div style={{display:"flex",gap:12,alignItems:"flex-start",
                background:"rgba(255,255,255,0.03)",borderRadius:10,padding:"10px 12px",
                border:`1px solid ${C.gold}20`}}>
                <span style={{fontSize:22,lineHeight:1,flexShrink:0}}>💊</span>
                <p style={{color:C.ivory,fontFamily:"'Crimson Text',serif",
                  fontSize:14.5,lineHeight:1.6,margin:0}}>
                  <strong style={{color:C.gold,fontFamily:"'Cinzel',serif",
                    fontSize:11.5,letterSpacing:"0.05em",display:"block",marginBottom:3}}>
                    {T("BECA DE ESPERANZA DEL 20%","20% HOPE SCHOLARSHIP","BOURSE D'ESPÉRANCE DE 20 %","HOFFNUNGSSTIPENDIUM VON 20 %","BOLSA ESPERANÇA DE 20%","BORSA DI SPERANZA DEL 20%")}
                  </strong>
                  {T("Un descuento directo en tu cuota de recuperación si estás luchando valientemente por tu recuperación como paciente en un Centro de Rehabilitación de Adicciones.","A direct discount on your recovery fee if you are valiantly fighting your recovery as a patient in an Addiction Rehabilitation Center.","Une réduction directe sur votre contribution si vous luttez courageusement pour votre rétablissement en tant que patient dans un Centre de Réhabilitation des Addictions.","Ein direkter Rabatt auf Ihren Genesungsbeitrag, wenn Sie als Patient in einem Suchtrehabilitationszentrum mutig für Ihre Genesung kämpfen.","Um desconto direto na sua taxa de recuperação se você estiver lutando bravamente por sua recuperação como paciente em um Centro de Reabilitação de Dependências.","Uno sconto diretto sulla tua quota di recupero se stai lottando coraggiosamente per la tua guarigione come paziente in un Centro di Riabilitazione delle Dipendenze.")}
                </p>
              </div>
            </div>
          </div>
        )}

  <div style={{...MODAL, maxWidth: 640}}>
    
        <div style={{textAlign:"center",marginBottom:24}}>
                  <h2 style={{fontFamily:"'Cinzel',serif",color:C.gold,fontSize:20}}>
            {T("Dinos quién eres","Tell us Who you are","Dites-nous qui vous êtes","Sagen Sie uns, wer Sie sind","Diga-nos quem você é","Dicci chi sei")}
          </h2>
          <p style={{color:C.ivoryM,fontSize:14,marginTop:6}}>
            {T("Selecciona la opción que mejor te describe","Select the option that best describes you","Sélectionnez l'option qui vous décrit le mieux","Wählen Sie die Option, die am besten auf Sie zutrifft","Selecione a opção que melhor descreve você","Seleziona l'opzione che ti descrive meglio")}
          </p>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {opts.map((o,i)=>{
            const afiliacionKeys=["parroquia","diocesis","centroadiccion"];
            const esAfiliacion=afiliacionKeys.includes(o.k);
            const prevAfiliacion=i>0 && afiliacionKeys.includes(opts[i-1].k);
            const mostrarFormacion=i===0;
            const mostrarAfiliacion=esAfiliacion && !prevAfiliacion;
            const Encabezado=({texto})=>(
              <div style={{display:"flex",alignItems:"center",gap:12,margin:"6px 2px 2px"}}>
                <span style={{height:1,flex:"0 0 16px",background:`linear-gradient(90deg,transparent,${C.gold})`}}/>
                <span style={{fontFamily:"'Cinzel',serif",color:C.gold,fontSize:12.5,
                  letterSpacing:"0.16em",textTransform:"uppercase",fontWeight:700,whiteSpace:"nowrap"}}>{texto}</span>
                <span style={{height:1,flex:1,background:`linear-gradient(90deg,${C.gold},transparent)`}}/>
              </div>
            );
            return(
            <Fragment key={o.k}>
              {mostrarFormacion&&<Encabezado texto={T("Formación","Formation","Formation","Bildung","Formação","Formazione")}/>}
              {mostrarAfiliacion&&<Encabezado texto={T("Afiliación","Affiliation","Affiliation","Anbindung","Afiliação","Affiliazione")}/>}
            <button onClick={etiquetas[o.k]?undefined:()=>onSelect(o.k)}
              disabled={!!etiquetas[o.k]}
              aria-disabled={!!etiquetas[o.k]}
              style={{cursor:etiquetas[o.k]?"not-allowed":"pointer",textAlign:"left",display:"flex",alignItems:"center",width:"100%",
                gap:16,padding:"14px 18px",borderRadius:14,transition:"all .22s ease",
                background:`linear-gradient(145deg,${C.card} 0%,rgba(200,169,81,0.10) 100%)`,
                border:`1px solid ${C.borderD}`,opacity:etiquetas[o.k]?0.55:1,
                boxShadow:"0 2px 12px rgba(0,0,0,0.3)"}}
              onMouseEnter={etiquetas[o.k]?undefined:e=>{
                e.currentTarget.style.background=`linear-gradient(145deg,${C.cardH} 0%,rgba(200,169,81,0.22) 100%)`;
                e.currentTarget.style.border=`1px solid ${C.gold}50`;
                e.currentTarget.style.transform="translateX(4px)";
                e.currentTarget.style.boxShadow=`0 4px 20px rgba(200,169,81,0.15)`;
              }}
              onMouseLeave={etiquetas[o.k]?undefined:e=>{
                e.currentTarget.style.background=`linear-gradient(145deg,${C.card} 0%,rgba(200,169,81,0.10) 100%)`;
                e.currentTarget.style.border=`1px solid ${C.borderD}`;
                e.currentTarget.style.transform="translateX(0)";
                e.currentTarget.style.boxShadow="0 2px 12px rgba(0,0,0,0.3)";
              }}>
              <span style={{fontSize:30,minWidth:42,textAlign:"center",
                filter:"drop-shadow(0 2px 4px rgba(200,169,81,0.3))"}}>{o.icon}</span>
              <div>
                <span style={{color:C.ivory,fontFamily:"'Crimson Text',serif",fontSize:16.5,
                  display:"block"}}>{T(o.es,o.en,o.fr,o.de,o.pt,o.it)}</span>
                {etiquetas[o.k]&&(
                  <span style={{display:"inline-block",marginTop:6,
                    background:etiquetas[o.k].bg,color:etiquetas[o.k].fg,
                    fontFamily:"'Cinzel',serif",fontSize:10.5,fontWeight:700,
                    letterSpacing:"0.12em",textTransform:"uppercase",
                    padding:"3px 10px",borderRadius:99,
                    border:`1px solid ${etiquetas[o.k].fg}55`,
                    boxShadow:"0 1px 6px rgba(0,0,0,0.35)"}}>
                    {etiquetas[o.k].txt}
                  </span>
                )}
              </div>
              <span style={{marginLeft:"auto",color:C.gold,fontSize:16,opacity:0.5}}>{etiquetas[o.k]?"🔒":"›"}</span>
            </button>
            </Fragment>
          );})}
        </div>
      </div>
    </div>
  );
}
