import { useState, lazy, Suspense } from "react";
import { createPortal } from "react-dom";
import useEtiquetasOpciones from "../hooks/useEtiquetasOpciones.js";
import { C, BTN, CARD, MODAL, OVERLAY } from "../ui.js";
import { T, LANG } from "../i18n.js";

const ConsultarIAModal = lazy(() => import("./ConsultarIAModal.jsx"));
const ConsultarCatequistaModal = lazy(() => import("./ConsultarCatequistaModal.jsx"));
const DirectorioAfiliados = lazy(() => import("./DirectorioAfiliados.jsx"));

// Cluster de soporte y biblioteca, compartido por varias pantallas.
// Sin estado del ámbito de App; solo depende de ui.js e i18n.js.

const LIBRARY_LINKS = {
  es: [
    {key:"catecismo", label:"Catecismo de la Iglesia Católica", icon:"📖",
     url:"https://www.vatican.va/archive/catechism_sp/index_sp.html"},
    {key:"biblia", label:"Biblia", icon:"📜",
     url:"https://www.vatican.va/archive/ESL0506/_INDEX.HTM"},
  ],
  en: [
    {key:"catechism", label:"Catechism of the Catholic Church", icon:"📖",
     url:"https://www.vatican.va/archive/ENG0015/_INDEX.HTM"},
    {key:"bible", label:"Bible", icon:"📜",
     url:"https://www.vatican.va/archive/ENG0839/_INDEX.HTM"},
  ],
  fr: [
    {key:"catechisme", label:"Catéchisme de l'Église Catholique", icon:"📖",
     url:"https://www.vatican.va/archive/FRA0013/_INDEX.HTM"},
    {key:"bible", label:"Bible", icon:"📜",
     url:"https://www.vatican.va/archive/bible/index.htm"},
  ],
  de: [
    {key:"katechismus", label:"Katechismus der Katholischen Kirche", icon:"📖",
     url:"https://www.vatican.va/archive/DEU0035/_INDEX.HTM"},
    {key:"bibel", label:"Bibel", icon:"📜",
     url:"https://www.vatican.va/archive/bible/index.htm"},
  ],
  pt: [
    {key:"catecismo", label:"Catecismo da Igreja Católica", icon:"📖",
     url:"https://www.vatican.va/archive/cathechism_po/index_new/indice_po.html"},
    {key:"biblia", label:"Bíblia", icon:"📜",
     url:"https://www.vatican.va/archive/bible/index.htm"},
  ],
  it: [
    {key:"catechismo", label:"Catechismo della Chiesa Cattolica", icon:"📖",
     url:"https://www.vatican.va/archive/catechism_it/index_it.htm"},
    {key:"bibbia", label:"Bibbia", icon:"📜",
     url:"https://www.vatican.va/archive/ITA0001/_INDEX.HTM"},
  ],
};

const SOPORTE_EMAIL="admin@catecumen.com";
function soporteTexto(contexto){
  const subject=T("Soporte Catecumen — Falla o duda","Catecumen Support — Issue or question","Support Catecumen — Problème ou question","Catecumen-Support — Problem oder Frage","Suporte Catecumen — Falha ou dúvida","Assistenza Catecumen — Problema o domanda");
  const body=
    T("Describe aquí tu falla o duda:","Describe your issue or question here:","Décrivez ici votre problème ou question :","Beschreiben Sie hier Ihr Problem oder Ihre Frage:","Descreva aqui sua falha ou dúvida:","Descrivi qui il tuo problema o la tua domanda:")+
    "\n\n\n----------------------------------------\n"+
    T("Información para soporte (no borrar):","Support information (do not delete):","Informations pour le support (ne pas supprimer) :","Support-Informationen (nicht löschen):","Informações para suporte (não apagar):","Informazioni per l'assistenza (non cancellare):")+"\n"+
    T("Sección","Section","Section","Abschnitt","Seção","Sezione")+": "+contexto+"\n"+
    T("Fecha","Date","Date","Datum","Data","Data")+": "+new Date().toLocaleString()+"\n"+
    T("Navegador","Browser","Navigateur","Browser","Navegador","Browser")+": "+navigator.userAgent;
  return {subject,body};
}
// Abre el cliente de correo sin navegar la página
// (un mailto: directo dispararía la advertencia "¿Abandonar sitio?")
function abrirCorreo(contexto){
  const {subject,body}=soporteTexto(contexto);
  const url=`mailto:${SOPORTE_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const f=document.createElement("iframe");
  f.style.display="none";f.src=url;
  document.body.appendChild(f);
  setTimeout(()=>{try{document.body.removeChild(f);}catch(e){}},2000);
}

export function SoporteModal({contexto,onClose}){
  const [copied,setCopied]=useState("");
  const [sinApp,setSinApp]=useState(false);
  // Heurística: si 1.6s después del clic la página nunca perdió el foco,
  // ninguna app de correo se abrió (típico en Windows sin app predeterminada).
  const intentarApp=()=>{
    setSinApp(false);
    abrirCorreo(contexto);
    setTimeout(()=>{if(document.hasFocus())setSinApp(true);},1600);
  };
  const abrirGmail=()=>{
    const {subject,body}=soporteTexto(contexto);
    window.open(
      `https://mail.google.com/mail/?view=cm&fs=1&to=${SOPORTE_EMAIL}`+
      `&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
      "_blank","noopener");
  };
  const copiar=async(texto,clave)=>{
    try{
      await navigator.clipboard.writeText(texto);
      setCopied(clave);setTimeout(()=>setCopied(""),2200);
    }catch(e){
      // Respaldo para navegadores sin Clipboard API
      const ta=document.createElement("textarea");
      ta.value=texto;document.body.appendChild(ta);ta.select();
      try{document.execCommand("copy");setCopied(clave);
        setTimeout(()=>setCopied(""),2200);}catch(_){}
      document.body.removeChild(ta);
    }
  };
  const {subject,body}=soporteTexto(contexto);
  const mensajeCompleto=T("Para","To","À","An","Para","A")+": "+SOPORTE_EMAIL+"\n"+
    T("Asunto","Subject","Objet","Betreff","Assunto","Oggetto")+": "+subject+"\n\n"+body;
  // Portal al <body>: los modales contenedores tienen transform por su
  // animación, lo que anclaría este position:fixed al formulario (y el
  // modal aparecería arriba, fuera de vista) en lugar de a la pantalla.
  return createPortal(
    <div style={{...OVERLAY,zIndex:3000}} onClick={onClose}>
      <div style={{...MODAL,maxWidth:440}} onClick={e=>e.stopPropagation()}>
        <div style={{textAlign:"center",marginBottom:16}}>
          <div style={{fontSize:34,marginBottom:8}}>🛟</div>
          <h2 style={{fontFamily:"'Cinzel',serif",color:C.gold,fontSize:17}}>
            {T("Soporte Catecumen","Catecumen Support","Support Catecumen","Catecumen-Support","Suporte Catecumen","Assistenza Catecumen")}
          </h2>
          <p style={{color:C.ivoryM,fontFamily:"'Crimson Text',serif",
            fontSize:14.5,lineHeight:1.6,marginTop:8}}>
            {T("Escríbenos describiendo tu falla o duda y te responderemos a la brevedad.","Write to us describing your issue or question and we will reply shortly.","Écrivez-nous en décrivant votre problème ou question et nous vous répondrons rapidement.","Schreiben Sie uns und beschreiben Sie Ihr Problem oder Ihre Frage — wir antworten Ihnen schnellstmöglich.","Escreva-nos descrevendo sua falha ou dúvida e responderemos em breve.","Scrivici descrivendo il tuo problema o la tua domanda e ti risponderemo al più presto.")}
          </p>
        </div>
        {/* Dirección visible y copiable */}
        <div style={{...CARD,background:"rgba(200,169,81,0.07)",padding:"12px 14px",
          marginBottom:14,display:"flex",alignItems:"center",gap:10,
          justifyContent:"space-between",flexWrap:"wrap"}}>
          <span style={{color:C.ivory,fontFamily:"'Crimson Text',serif",
            fontSize:16,userSelect:"all",wordBreak:"break-all"}}>
            ✉️ {SOPORTE_EMAIL}
          </span>
          <button onClick={()=>copiar(SOPORTE_EMAIL,"mail")}
            style={{...BTN("sec"),padding:"6px 14px",fontSize:11}}>
            {copied==="mail"?("✓ "+T("Copiado","Copied","Copié","Kopiert","Copiado","Copiato")):T("Copiar","Copy","Copier","Kopieren","Copiar","Copia")}
          </button>
        </div>
        <button onClick={abrirGmail}
          style={{...BTN("pri"),width:"100%",justifyContent:"center",marginBottom:10}}>
          ✉️ {T("Escribir desde Gmail","Compose in Gmail","Écrire depuis Gmail","Über Gmail schreiben","Escrever pelo Gmail","Scrivi da Gmail")}
        </button>
        <button onClick={intentarApp}
          style={{...BTN("sec"),width:"100%",justifyContent:"center",marginBottom:10}}>
          📧 {T("Abrir mi app de correo","Open my email app","Ouvrir mon application de messagerie","Meine E-Mail-App öffnen","Abrir meu aplicativo de e-mail","Apri la mia app di posta")}
        </button>
        {sinApp&&(
          <p style={{color:"#F5C36B",fontSize:13,lineHeight:1.55,
            fontFamily:"'Crimson Text',serif",textAlign:"center",marginBottom:10,
            background:"rgba(200,169,81,0.08)",border:`1px solid ${C.gold}30`,
            borderRadius:8,padding:"8px 12px"}}>
            ⚠️ {T("Parece que tu equipo no tiene una app de correo configurada. Usa el botón de Gmail o copia el mensaje y envíalo desde tu correo habitual.","It looks like your device has no email app configured. Use the Gmail button or copy the message and send it from your usual email.","Il semble que votre appareil n'ait pas d'application de messagerie configurée. Utilisez le bouton Gmail ou copiez le message et envoyez-le depuis votre messagerie habituelle.","Es scheint, dass auf Ihrem Gerät keine E-Mail-App eingerichtet ist. Nutzen Sie die Gmail-Schaltfläche oder kopieren Sie die Nachricht und senden Sie sie über Ihr gewohntes E-Mail-Konto.","Parece que seu dispositivo não tem um aplicativo de e-mail configurado. Use o botão do Gmail ou copie a mensagem e envie pelo seu e-mail habitual.","Sembra che il tuo dispositivo non abbia un'app di posta configurata. Usa il pulsante Gmail oppure copia il messaggio e invialo dalla tua email abituale.")}
          </p>
        )}
        <button onClick={()=>copiar(mensajeCompleto,"msg")}
          style={{...BTN("sec"),width:"100%",justifyContent:"center",marginBottom:14}}>
          {copied==="msg"
            ?("✓ "+T("Mensaje copiado","Message copied","Message copié","Nachricht kopiert","Mensagem copiada","Messaggio copiato"))
            :("📋 "+T("Copiar mensaje con datos técnicos","Copy message with technical details","Copier le message avec les données techniques","Nachricht mit technischen Daten kopieren","Copiar mensagem com dados técnicos","Copia messaggio con dati tecnici"))}
        </button>
        <p style={{color:C.ivoryM,fontSize:12.5,lineHeight:1.55,
          fontFamily:"'Crimson Text',serif",textAlign:"center",marginBottom:14}}>
          {T("Si tu app de correo no se abre, copia el mensaje y envíanoslo desde tu correo habitual (Gmail, Outlook, etc.).","If your email app does not open, copy the message and send it to us from your usual email (Gmail, Outlook, etc.).","Si votre application de messagerie ne s'ouvre pas, copiez le message et envoyez-le-nous depuis votre messagerie habituelle (Gmail, Outlook, etc.).","Wenn sich Ihre E-Mail-App nicht öffnet, kopieren Sie die Nachricht und senden Sie sie uns über Ihr gewohntes E-Mail-Konto (Gmail, Outlook usw.).","Se seu aplicativo de e-mail não abrir, copie a mensagem e envie para nós pelo seu e-mail habitual (Gmail, Outlook, etc.).","Se la tua app di posta non si apre, copia il messaggio e inviacelo dalla tua email abituale (Gmail, Outlook, ecc.).")}
        </p>
        <button onClick={onClose}
          style={{...BTN("sec"),width:"100%",justifyContent:"center"}}>
          ✕ {T("Cerrar","Close","Fermer","Schließen","Fechar","Chiudi")}
        </button>
      </div>
    </div>,
    document.body
  );
}

export function SoporteLink({contexto,style={}}){
  const [open,setOpen]=useState(false);
  return(
    <>
      <p style={{textAlign:"center",fontSize:12.5,color:C.ivoryM,
        fontFamily:"'Crimson Text',serif",marginTop:14,...style}}>
        🛟 {T("¿Tienes una falla o duda? ","Having an issue or question? ","Un problème ou une question ? ","Haben Sie ein Problem oder eine Frage? ","Tem alguma falha ou dúvida? ","Hai un problema o una domanda? ")}
        <a href="#soporte" onClick={e=>{e.preventDefault();setOpen(true);}}
          style={{color:C.gold,textDecoration:"underline"}}>
          {T("Contacta a soporte","Contact support","Contacter le support","Support kontaktieren","Contatar suporte","Contatta l'assistenza")}
        </a>
      </p>
      {open&&<SoporteModal contexto={contexto} onClose={()=>setOpen(false)}/>}
    </>
  );
}

export function SoporteFloat({contexto}){
  const [open,setOpen]=useState(false);
  return(
    <>
      <button onClick={()=>setOpen(true)}
        title={T("Reportar una falla o duda","Report an issue or question","Signaler un problème ou une question","Ein Problem oder eine Frage melden","Reportar uma falha ou dúvida","Segnala un problema o una domanda")}
        style={{position:"fixed",right:18,bottom:"calc(18px + var(--install-offset, 0px))",zIndex:900,cursor:"pointer",
          display:"inline-flex",alignItems:"center",gap:8,
          background:`linear-gradient(145deg,${C.card} 0%,#0E1B2E 100%)`,
          border:`1px solid ${C.gold}55`,borderRadius:30,
          padding:"10px 18px",color:C.gold,
          fontFamily:"'Cinzel',serif",fontSize:12,fontWeight:700,letterSpacing:"0.05em",
          boxShadow:"0 4px 18px rgba(0,0,0,0.55)"}}>
        🛟 {T("Soporte","Support","Support","Support","Suporte","Assistenza")}
      </button>
      {open&&<SoporteModal contexto={contexto} onClose={()=>setOpen(false)}/>}
    </>
  );
}

export function LibraryButton({size="sec"}){
  const [open,setOpen]=useState(false);
  const links=LIBRARY_LINKS[LANG]||LIBRARY_LINKS.es;
  return(
    <div style={{position:"relative",display:"inline-block"}}>
      <button onClick={()=>setOpen(o=>!o)}
        style={{...BTN(size),fontSize:12}}>
        📚 {T("Biblioteca","Library","Bibliothèque","Bibliothek","Biblioteca","Biblioteca")}
      </button>
      {open&&(
        <>
          <div onClick={()=>setOpen(false)} style={{position:"fixed",inset:0,zIndex:3000}}/>
          <div style={{
            position:"absolute",top:"calc(100% + 8px)",left:0,zIndex:3001,minWidth:240,
            background:"var(--c-card)",border:`1px solid ${C.border}`,borderRadius:12,
            padding:10,boxShadow:"var(--c-modalShadow)",
          }}>
            <p style={{color:C.gold,fontFamily:"'Cinzel',serif",fontSize:11,
              letterSpacing:"0.06em",textTransform:"uppercase",padding:"2px 8px 8px"}}>
              {T("Biblioteca — Santa Sede","Library — Holy See","Bibliothèque — Saint-Siège","Bibliothek — Heiliger Stuhl","Biblioteca — Santa Sé","Biblioteca — Santa Sede")}
            </p>
            {links.map(l=>(
              <a key={l.key} href={l.url} target="_blank" rel="noreferrer"
                onClick={()=>setOpen(false)}
                style={{
                  display:"flex",alignItems:"center",gap:10,textDecoration:"none",
                  color:C.ivory,fontFamily:"'Crimson Text',serif",fontSize:15,
                  borderRadius:8,padding:"9px 10px",
                }}>
                <span style={{fontSize:16}}>{l.icon}</span>
                <span>{l.label}</span>
                <span style={{marginLeft:"auto",color:C.ivoryM,fontSize:12}}>↗</span>
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Consulta del alumno a su catequista (mensajería interna). Modal propio, distinto
// del soporte técnico, para no confundir al estudiante.
export function ConsultarDudasButton({contexto="",size="sec"}){
  const [open,setOpen]=useState(false);
  return(
    <div style={{display:"inline-block"}}>
      <button onClick={()=>setOpen(true)} style={{...BTN(size),fontSize:12}}>
        💬 {T("Consultar a tu catequista","Ask your catechist","Consulter votre catéchiste","Deinen Katecheten fragen","Consultar seu catequista","Consulta il tuo catechista")}
      </button>
      {open&&(
        <Suspense fallback={<div style={OVERLAY}><div style={{color:C.gold,fontFamily:"'Cinzel',serif"}}>{T("Cargando…","Loading…","Chargement…","Wird geladen…","Carregando…","Caricamento…")}</div></div>}>
          <ConsultarCatequistaModal contexto={contexto} onClose={()=>setOpen(false)}/>
        </Suspense>
      )}
    </div>
  );
}

// Buscador público de parroquias/diócesis afiliadas (modal diferido). Es
// etiquetable/bloqueable desde el panel admin (clave "buscar_parroquia"): con la
// etiqueta activa muestra el sello y queda deshabilitado. `tono` da el color del
// contenedor (p. ej. "green" en la bienvenida).
export function DirectorioButton({size="sec",estilo={},tono=null}){
  const [open,setOpen]=useState(false);
  const etiquetas=useEtiquetasOpciones();
  const etq=etiquetas["buscar_parroquia"];        // hay etiqueta → se muestra el chip
  const bloqueado=!!(etq&&etq.bloquea);           // …y además bloquea si el admin lo indicó
  const full=estilo.width==="100%";
  const tonos={
    green:{background:"rgba(45,122,90,0.18)",color:C.ivory,border:"1px solid rgba(45,122,90,0.55)"},
  };
  return(
    <div style={{display:full?"block":"inline-block",...estilo}}>
      <button onClick={bloqueado?undefined:()=>setOpen(true)} disabled={bloqueado} aria-disabled={bloqueado}
        style={{...BTN(size),fontSize:12,...(full?{width:"100%",justifyContent:"center"}:{}),
          ...(tono&&tonos[tono]?tonos[tono]:{}),...(bloqueado?{opacity:0.55,cursor:"not-allowed"}:{})}}>
        ⛪ {T("Buscar parroquia afiliada","Find affiliated parish","Trouver une paroisse affiliée","Angeschlossene Pfarrei finden","Buscar paróquia afiliada","Trova parrocchia affiliata")}
        {etq&&(
          <span style={{marginLeft:8,background:etq.bg,color:etq.fg,fontFamily:"'Cinzel',serif",
            fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",
            padding:"2px 8px",borderRadius:99,border:`1px solid ${etq.fg}55`}}>{etq.txt}</span>
        )}
      </button>
      {open&&!bloqueado&&(
        <Suspense fallback={<div style={OVERLAY}><div style={{color:C.gold,fontFamily:"'Cinzel',serif"}}>{T("Cargando…","Loading…","Chargement…","Wird geladen…","Carregando…","Caricamento…")}</div></div>}>
          <DirectorioAfiliados onClose={()=>setOpen(false)}/>
        </Suspense>
      )}
    </div>
  );
}

// Abre el chat con Magisterium AI (modal diferido). Botón para el área de estudio.
export function ConsultarIAButton({contexto="",size="sec"}){
  const [open,setOpen]=useState(false);
  return(
    <div style={{display:"inline-block"}}>
      <button onClick={()=>setOpen(true)} style={{...BTN(size),fontSize:12}}>
        ✨ {T("Consultar a Magisterium AI","Ask Magisterium AI","Consulter Magisterium AI","Magisterium AI fragen","Consultar o Magisterium AI","Consulta Magisterium AI")}
      </button>
      {open&&(
        <Suspense fallback={<div style={OVERLAY}><div style={{color:C.gold,fontFamily:"'Cinzel',serif"}}>{T("Cargando…","Loading…","Chargement…","Wird geladen…","Carregando…","Caricamento…")}</div></div>}>
          <ConsultarIAModal contexto={contexto} onClose={()=>setOpen(false)}/>
        </Suspense>
      )}
    </div>
  );
}
