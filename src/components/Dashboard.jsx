import { useState, useEffect, lazy, Suspense } from "react";
import { supabase } from "../supabaseClient.js";
import { SEC_META, isSectionDone } from "../data/course.js";
import SecIcon from "./SecIcon.jsx";
import { FRow, Input, PasswordInput, PhoneField } from "./fields.jsx";
import { DirectorioButton } from "./support.jsx";
import { C, BTN, CARD, LBL } from "../ui.js";
import { T, PICK } from "../i18n.js";

const AgendaTab = lazy(() => import("./AgendaTab.jsx"));
const MensajesTab = lazy(() => import("./MensajesTab.jsx"));

// Panel "Mi Cuenta": progreso, datos personales editables, constancias y
// las pestañas Agenda/Mensajes (diferidas). Extraído del monolito.
export default function Dashboard({formData,sequence,progress,onUpdate,onClose,initialTab}){
  const [tab,setTab]=useState(initialTab||"progress");
  const [edit,setEdit]=useState({});
  const [saved,setSaved]=useState(false);
  const [agendaPend,setAgendaPend]=useState(0); // sesiones próximas sin responder
  useEffect(()=>{
    let vivo=true;
    (async()=>{
      try{
        const {data}=await supabase.rpc("mi_agenda");
        if(!vivo) return;
        const ahora=new Date();
        const pend=(Array.isArray(data)?data:[]).filter(s=>!s.mi_estado && new Date(s.inicio)>ahora).length;
        setAgendaPend(pend);
      }catch(e){/* silencioso */}
    })();
    return ()=>{ vivo=false; };
  },[]);
  const setE=(k,v)=>setEdit(p=>({...p,[k]:v}));
  const handleSave=()=>{
    onUpdate(edit);
    setSaved(true);
    setTimeout(()=>setSaved(false),2000);
  };
  const totalItems=sequence.reduce((a,s)=>(SEC_META[s]?.videos?.length||0)+a,0);
  const doneItems=sequence.reduce((a,s)=>{
    const vids=SEC_META[s]?.videos||[];
    return a+vids.filter(v=>progress?.[s]?.[v.id]?.passed).length;
  },0);
  const pct=totalItems?Math.round((doneItems/totalItems)*100):0;
  const tabs=[
    {k:"progress",es:"Mi Progreso",en:"My Progress",fr:"Ma Progression",de:"Mein Fortschritt",pt:"Meu Progresso",it:"I Miei Progressi",icon:"📊"},
    {k:"account",es:"Mi Cuenta",en:"My Account",fr:"Mon Compte",de:"Mein Konto",pt:"Minha Conta",it:"Il Mio Account",icon:"👤"},
    {k:"certs",es:"Constancias",en:"Certificates",fr:"Attestations",de:"Bescheinigungen",pt:"Certificados",it:"Attestati",icon:"🏆"},
    {k:"agenda",es:"Agenda",en:"Agenda",fr:"Agenda",de:"Termine",pt:"Agenda",it:"Agenda",icon:"📅"},
    {k:"mensajes",es:"Mensajes",en:"Messages",fr:"Messages",de:"Nachrichten",pt:"Mensagens",it:"Messaggi",icon:"✉️"},
  ];
  return(
    <div style={{minHeight:"100vh",background:"rgba(250,247,240,0.82)",padding:"24px 16px",
      display:"flex",justifyContent:"center",alignItems:"flex-start"}}>
      <div className="catePanel" style={{maxWidth:700,width:"100%",
        background:`linear-gradient(160deg,var(--c-modalStart) 0%,${C.surface} 55%,var(--c-modalEnd) 100%)`,
        border:"1px solid rgba(200,169,81,0.18)",borderRadius:20,
        boxShadow:"0 24px 64px rgba(0,0,0,0.65)",
        padding:"26px clamp(14px,3vw,30px)",
        maxHeight:"calc(100dvh - 48px)",overflowY:"auto"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24,gap:8,flexWrap:"wrap"}}>
          <h1 style={{fontFamily:"'Cinzel',serif",color:C.gold,fontSize:20}}>👤 {T("Mi Cuenta","My Account","Mon compte","Mein Konto","Minha Conta","Il mio account")}</h1>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <DirectorioButton/>
            <button onClick={onClose} style={{...BTN("sec"),fontSize:12}}>✕ {T("Cerrar","Close","Fermer","Schließen","Fechar","Chiudi")}</button>
          </div>
        </div>
        {/* Tabs */}
        <div style={{display:"flex",gap:8,marginBottom:24}}>
          {tabs.map(t=>(
            <button key={t.k} onClick={()=>setTab(t.k)}
              style={{...BTN(tab===t.k?"pri":"sec"),flex:1,justifyContent:"center",fontSize:12,position:"relative"}}>
              {t.icon} {T(t.es,t.en,t.fr,t.de,t.pt,t.it)}
              {t.k==="agenda"&&agendaPend>0&&(
                <span style={{position:"absolute",top:-6,right:-6,background:"#D64545",color:"#fff",
                  borderRadius:"50%",minWidth:18,height:18,fontSize:11,fontWeight:700,
                  display:"flex",alignItems:"center",justifyContent:"center",padding:"0 5px"}}>{agendaPend}</span>
              )}
            </button>
          ))}
        </div>
        
        {/* PROGRESS TAB */}
        {tab==="progress"&&(
          <div>
            <div style={{...CARD,marginBottom:20}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <div>
                  <p style={{fontFamily:"'Cinzel',serif",color:C.gold,fontSize:16}}>
                    {T("Progreso Global","Global Progress","Progression globale","Gesamtfortschritt","Progresso Global","Progresso Globale")}
                  </p>
                  <p style={{color:C.ivoryM,fontSize:13,marginTop:2}}>
                    {doneItems}/{totalItems} {T("temas completados","topics completed","sujets terminés","abgeschlossene Themen","temas concluídos","argomenti completati")}
                  </p>
                </div>
                <div style={{fontFamily:"'Cinzel',serif",color:C.gold,fontSize:28,fontWeight:700}}>
                  {pct}%
                </div>
              </div>
              <div style={{background:"rgba(255,255,255,0.07)",borderRadius:8,height:10}}>
                <div style={{background:`linear-gradient(90deg,${C.gold},${C.goldL})`,
                  borderRadius:8,height:"100%",width:`${pct}%`,transition:"width .5s"}}/>
              </div>
            </div>
            {sequence.map(secId=>{
              const sec=SEC_META[secId];
              if(!sec) return null;
              const vids=sec.videos||[];
              const done=vids.filter(v=>progress?.[secId]?.[v.id]?.passed).length;
              const sPct=vids.length?Math.round((done/vids.length)*100):0;
              return(
                <div key={secId} style={{...CARD,marginBottom:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <SecIcon id={secId} size={20}/>
                      <span style={{color:C.ivory,fontFamily:"'Crimson Text',serif",fontSize:15}}>
                        {PICK(sec)}
                      </span>
                    </div>
                    <span style={{color:done===vids.length?C.green:C.ivoryM,fontSize:13}}>
                      {done}/{vids.length}
                    </span>
                  </div>
                  <div style={{background:"rgba(255,255,255,0.07)",borderRadius:4,height:6}}>
                    <div style={{background:done===vids.length?C.green:C.gold,
                      borderRadius:4,height:"100%",width:`${sPct}%`,transition:"width .5s"}}/>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* ACCOUNT TAB */}
        {tab==="account"&&(
          <div>
            {saved&&(
              <div style={{...CARD,background:"rgba(45,122,90,0.2)",marginBottom:16,textAlign:"center"}}>
                <p style={{color:C.green}}>✓ {T("Cambios guardados","Changes saved","Modifications enregistrées","Änderungen gespeichert","Alterações salvas","Modifiche salvate")}</p>
              </div>
            )}
            <div style={{...CARD,marginBottom:20}}>
              <p style={{fontFamily:"'Cinzel',serif",color:C.gold,fontSize:14,marginBottom:16}}>
                {T("Información registrada","Registered information","Informations enregistrées","Registrierte Informationen","Informações registradas","Informazioni registrate")}
              </p>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div>
                  <span style={LBL}>{T("Nombre","Name","Nom","Name","Nome","Nome")}</span>
                  <p style={{color:C.ivory,fontFamily:"'Crimson Text',serif"}}>{formData.nombre} {formData.apellido}</p>
                </div>
                <div>
                  <span style={LBL}>{T("País","Country","Pays","Land","País","Paese")}</span>
                  <p style={{color:C.ivory,fontFamily:"'Crimson Text',serif"}}>{formData.country}</p>
                </div>
                <div>
                  <span style={LBL}>{T("Edad","Age","Âge","Alter","Idade","Età")}</span>
                  <p style={{color:C.ivory,fontFamily:"'Crimson Text',serif"}}>{formData.age} {T("años","years","ans","Jahre","anos","anni")}</p>
                </div>
                <div>
                  <span style={LBL}>{T("Catequista asignada","Assigned catechist","Catéchiste assignée","Zugewiesene Katechetin","Catequista designada","Catechista assegnata")}</span>
                  <p style={{color:C.ivory,fontFamily:"'Crimson Text',serif"}}>Nelly Montoya</p>
                </div>
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <FRow label={T("Correo electrónico","Email","E-mail","E-Mail","E-mail","Email")}>
                <Input value={edit.email!==undefined?edit.email:formData.email}
                  onChange={v=>setE("email",v)} placeholder="nuevo@correo.com"/>
              </FRow>
              <FRow label={T("Teléfono","Phone","Téléphone","Telefon","Telefone","Telefono")}>
                <PhoneField phoneCode={edit.phoneCode||formData.phoneCode} phone={edit.phone!==undefined?edit.phone:formData.phone}
                  onChange={setE}/>
              </FRow>
              <FRow label={T("Parroquia","Parish","Paroisse","Pfarrei","Paróquia","Parrocchia")}>
                <Input value={edit.parroquia!==undefined?edit.parroquia:formData.parroquia}
                  onChange={v=>setE("parroquia",v)} placeholder={T("Nombre de la parroquia","Parish name","Nom de la paroisse","Name der Pfarrei","Nome da paróquia","Nome della parrocchia")}/>
              </FRow>
              <FRow label={T("Nueva contraseña (opcional)","New password (optional)","Nouveau mot de passe (facultatif)","Neues Passwort (optional)","Nova senha (opcional)","Nuova password (facoltativa)")}>
                <PasswordInput value={edit.newPassword||""}
                  onChange={v=>setE("newPassword",v)} placeholder={T("Dejar vacío para no cambiar","Leave blank to keep current","Laisser vide pour ne pas changer","Leer lassen, um nichts zu ändern","Deixe em branco para não alterar","Lascia vuoto per non modificare")}/>
              </FRow>
            </div>
            <button onClick={handleSave}
              style={{...BTN("pri"),width:"100%",justifyContent:"center",marginTop:16}}>
              💾 {T("Guardar cambios","Save changes","Enregistrer les modifications","Änderungen speichern","Salvar alterações","Salva modifiche")}
            </button>
          </div>
        )}
        
        {/* CERTS TAB */}
        {tab==="certs"&&(
          <div>
            <p style={{color:C.ivoryM,fontFamily:"'Crimson Text',serif",fontSize:15,marginBottom:16}}>
              {T("Descarga tus constancias de formación completadas.","Download your completed formation certificates.","Téléchargez vos attestations de formation terminées.","Laden Sie Ihre abgeschlossenen Ausbildungsbescheinigungen herunter.","Baixe seus certificados de formação concluídos.","Scarica i tuoi attestati di formazione completati.")}
            </p>
            {sequence.filter(s=>SEC_META[s]?.cert&&isSectionDone(s,progress)).map(secId=>(
              <div key={secId} style={{...CARD,display:"flex",alignItems:"center",gap:14,marginBottom:10,
                background:"rgba(200,169,81,0.06)",border:`1px solid ${C.gold}30`}}>
                <SecIcon id={secId} size={24}/>
                <span style={{color:C.ivory,fontFamily:"'Crimson Text',serif",fontSize:15,flex:1}}>
                  {PICK(SEC_META[secId])}
                </span>
                <button onClick={()=>alert(T("Constancia generada (demo)","Certificate generated (demo)","Attestation générée (démo)","Bescheinigung erstellt (Demo)","Certificado gerado (demo)","Attestato generato (demo)"))}
                  style={{...BTN("pri"),fontSize:12,padding:"8px 14px"}}>
                  ⬇ {T("Descargar","Download","Télécharger","Herunterladen","Baixar","Scarica")}
                </button>
              </div>
            ))}
            {sequence.filter(s=>SEC_META[s]?.cert&&isSectionDone(s,progress)).length===0&&(
              <p style={{color:C.ivoryM,fontFamily:"'Crimson Text',serif",fontSize:15,textAlign:"center"}}>
                {T("Completa tu formación para obtener tus constancias.","Complete your formation to receive your certificates.","Terminez votre formation pour obtenir vos attestations.","Schließen Sie Ihre Ausbildung ab, um Ihre Bescheinigungen zu erhalten.","Complete sua formação para obter seus certificados.","Completa la tua formazione per ottenere i tuoi attestati.")}
              </p>
            )}
          </div>
        )}
        {tab==="agenda"&&(
          <div>
            <p style={{color:C.ivoryM,fontFamily:"'Crimson Text',serif",fontSize:15,marginBottom:16}}>
              {T("Tus sesiones y reuniones programadas. Confirma tu asistencia o avisa si no podrás asistir.","Your scheduled sessions and meetings. Confirm your attendance or let us know if you can't make it.","Vos sessions et réunions programmées. Confirmez votre présence ou signalez votre absence.","Deine geplanten Sitzungen und Treffen. Bestätige deine Teilnahme oder sag ab.","Suas sessões e reuniões agendadas. Confirme sua presença ou avise se não poderá comparecer.","Le tue sessioni e riunioni programmate. Conferma la presenza o avvisa se non potrai partecipare.")}
            </p>
            <Suspense fallback={<div style={{color:C.ivoryM,padding:20,textAlign:"center"}}>{T("Cargando…","Loading…","Chargement…","Wird geladen…","Carregando…","Caricamento…")}</div>}>
              <AgendaTab/>
            </Suspense>
          </div>
        )}
        {tab==="mensajes"&&(
          <div>
            <p style={{color:C.ivoryM,fontFamily:"'Crimson Text',serif",fontSize:15,marginBottom:16}}>
              {T("Mensajes de la administración de Catecumen. Puedes responder aquí.","Messages from Catecumen administration. You can reply here.","Messages de l'administration de Catecumen. Vous pouvez répondre ici.","Nachrichten der Catecumen-Verwaltung. Sie können hier antworten.","Mensagens da administração do Catecumen. Você pode responder aqui.","Messaggi dall'amministrazione di Catecumen. Puoi rispondere qui.")}
            </p>
            <Suspense fallback={<div style={{color:C.ivoryM,padding:20,textAlign:"center"}}>{T("Cargando…","Loading…","Chargement…","Wird geladen…","Carregando…","Caricamento…")}</div>}>
              <MensajesTab/>
            </Suspense>
          </div>
        )}
      </div>
    </div>
  );
}
