import { useState, useEffect, useRef } from "react";
import { SEC_META } from "../data/course.js";
import { supabase } from "../supabaseClient.js";
import { SoporteLink } from "./support.jsx";
import { C, BTN, MODAL, OVERLAY } from "../ui.js";
import { T, PICK, LANG } from "../i18n.js";
import * as videoStore from "../videoStore.js";

// hls.js (streaming adaptativo) se carga por CDN SOLO cuando una URL es HLS
// (.m3u8) — p. ej. Bunny Stream / Cloudflare Stream. Los .mp4 directos (Supabase
// Storage, videos de prueba locales) no lo necesitan. No engorda el bundle.
const HLS_CDN="https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js";
let hlsPromise=null;
function loadHls(){
  if(typeof window==="undefined") return Promise.reject(new Error("SSR"));
  if(window.Hls) return Promise.resolve(window.Hls);
  if(hlsPromise) return hlsPromise;
  hlsPromise=new Promise((resolve,reject)=>{
    const s=document.createElement("script");
    s.src=HLS_CDN; s.async=true;
    s.onload=()=>resolve(window.Hls);
    s.onerror=()=>reject(new Error("hls.js no cargó"));
    document.head.appendChild(s);
  });
  return hlsPromise;
}
const esHls=(url)=>/\.m3u8(\?|#|$)/i.test(url||"");
const esBunny=(url)=>/\.b-cdn\.net\//i.test(url||"");

// Firma las URLs de Bunny (contenido de pago) vía la edge function `firmar-video`.
// ENDURECIDO: si no se logra firmar un video de Bunny, NO se reproduce con la URL
// cruda (eso dejaría el contenido de pago desprotegido ante un fallo silencioso de
// configuración). Devuelve null → el reproductor muestra un aviso en vez de servir
// sin protección. Los .mp4 locales / de prueba / Supabase no se tocan (siguen igual).
async function resolverFuente(url){
  if(!esBunny(url)) return url;
  try{
    const {data,error}=await supabase.functions.invoke("firmar-video",{body:{url}});
    if(!error && data?.url) return data.url;
  }catch{/* sin conexión / función no desplegada */}
  return null; // Bunny sin firma válida: no reproducir crudo
}

export default function VideoModal({secId,vid,bridge,startAt=0,marca="",userId=null,onProgress,onWatched,onClose}){
  const [watching,setWatching]=useState(false);
  const [done,setDone]=useState(false);
  const [secs,setSecs]=useState(0);
  const [videoError,setVideoError]=useState(false); // el archivo de video no cargó (404)
  // Descarga offline (copia cifrada en el dispositivo, atada a la cuenta).
  const [offlineUrl,setOfflineUrl]=useState(null); // Blob URL de la copia descifrada
  const [descargado,setDescargado]=useState(false);
  const [descargando,setDescargando]=useState(false);
  const [descError,setDescError]=useState(false);
  // Control de acceso (ventana de 72 h + reapertura por admin).
  const [acceso,setAcceso]=useState(null);    // null = verificando; {puede_ver,...}
  const [cierre,setCierre]=useState(null);     // null | 'pendiente' | 'resuelto'
  const [solPend,setSolPend]=useState(false);  // solicitud de reapertura pendiente
  const [accBusy,setAccBusy]=useState(false);  // botón de acceso en curso
  // Marca de agua anti-fuga: muestra la identidad del alumno sobre el video y la
  // reposiciona cada pocos segundos (dificulta recortarla y disuade la grabación
  // de pantalla, porque quien reproduzca graba su propio nombre).
  const [wmPos,setWmPos]=useState({top:"8%",left:"6%"});
  useEffect(()=>{
    if(!marca) return;
    const spots=[{top:"8%",left:"6%"},{top:"8%",right:"6%"},{bottom:"20%",right:"6%"},
      {bottom:"20%",left:"6%"},{top:"45%",left:"34%"}];
    let i=0;
    const t=setInterval(()=>{ i=(i+1)%spots.length; setWmPos(spots[i]); },6000);
    return()=>clearInterval(t);
  },[marca]);
  const videoRef=useRef(null);
  const lastReport=useRef(0); // último segundo reportado (throttle del guardado)
  // Coloca el video en la posición guardada al cargar los metadatos, y reporta el
  // avance (cada ~5 s) para que el usuario retome donde lo dejó.
  const seekInicial=()=>{ const v=videoRef.current; if(v && startAt>0 && startAt<(v.duration||1e9)-2){ try{ v.currentTime=startAt; }catch{} } };
  const reportar=()=>{ const v=videoRef.current; if(!v||!onProgress) return; const t=Math.floor(v.currentTime||0); if(t>0 && Math.abs(t-lastReport.current)>=5){ lastReport.current=t; onProgress(t); } };
  // Prioridad: URL real del video en la BD (idioma del usuario) → video de prueba local.
  const urlReal=bridge?.frontToUrl?.[secId]?.[vid?.id]||null;
  const videoPrueba=urlReal||PICK(SEC_META[secId]?.videoPrueba)||null; // real o prueba, en el idioma activo
  const SIM_DUR=5; // seconds to simulate watching (usado solo si no hay video de prueba)

  // UUID real del video en la BD (para acceso/descargas); null en secciones sin puente.
  const videoUuid=bridge?.frontToUuid?.[secId]?.[vid?.id]||null;
  // ── Descarga offline (solo mp4 progresivo; HLS aún no) ──────────────────────
  const claveOffline=`${secId}|${vid?.id}|${LANG}`;
  const esDescargable=!!videoPrueba && !esHls(videoPrueba) && !!userId;

  // Si existe una copia offline de ESTA cuenta, la cargamos y la preferimos.
  useEffect(()=>{
    let url=null, vivo=true;
    (async()=>{
      if(!userId) return;
      const blob=await videoStore.obtenerBlob({clave:claveOffline,ownerId:userId});
      if(!vivo) return;
      if(blob){ url=URL.createObjectURL(blob); setOfflineUrl(url); setDescargado(true); }
    })();
    return()=>{ vivo=false; if(url) URL.revokeObjectURL(url); };
  },[claveOffline,userId]);

  const descargar=async()=>{
    if(!esDescargable||descargando) return;
    setDescError(false); setDescargando(true);
    // Rastreo: registra el INTENTO de descarga (con el usuario → correo en el panel).
    if(videoUuid){ try{ supabase.rpc("registrar_descarga",{p_video_id:videoUuid,p_resultado:"intento",p_ua:navigator.userAgent}).then(()=>{},()=>{}); }catch{} }
    try{
      const src=await resolverFuente(videoPrueba); // firma si es Bunny; null si no pudo
      if(!src) throw new Error("sin fuente");
      const resp=await fetch(src);
      if(!resp.ok) throw new Error("HTTP "+resp.status);
      const bytes=new Uint8Array(await resp.arrayBuffer());
      await videoStore.guardar({clave:claveOffline,ownerId:userId,bytes,
        mime:resp.headers.get("content-type")||"video/mp4",
        meta:{secId,vid:vid?.id,titulo:PICK(vid),lang:LANG}});
      const blob=await videoStore.obtenerBlob({clave:claveOffline,ownerId:userId});
      if(blob){ const u=URL.createObjectURL(blob); setOfflineUrl(u); setDescargado(true); }
      // Rastreo: descarga EXITOSA.
      if(videoUuid){ try{ supabase.rpc("registrar_descarga",{p_video_id:videoUuid,p_resultado:"exito",p_ua:navigator.userAgent}).then(()=>{},()=>{}); }catch{} }
    }catch(e){ console.error("descargar offline:",e); setDescError(true); }
    setDescargando(false);
  };
  const borrarDescarga=async()=>{
    await videoStore.borrar(claveOffline);
    setOfflineUrl(u=>{ if(u) URL.revokeObjectURL(u); return null; });
    setDescargado(false);
  };

  // ── Acceso (ventana de 72 h) ────────────────────────────────────────────────
  // Al abrir, verifica si el usuario puede ver el video. Ante error, NO bloquea
  // (para no dejar fuera por un fallo transitorio). Sin uuid, no hay control.
  useEffect(()=>{
    let vivo=true;
    if(!videoUuid){ setAcceso({puede_ver:true}); return; }
    (async()=>{
      try{
        const {data,error}=await supabase.rpc("mi_acceso_video",{p_video_id:videoUuid});
        if(!vivo) return;
        if(error||!data){ setAcceso({puede_ver:true}); return; }
        setAcceso(data); setSolPend(!!data.solicitud_pendiente);
      }catch{ if(vivo) setAcceso({puede_ver:true}); }
    })();
    return ()=>{vivo=false;};
  },[videoUuid]);

  // Al concluir el video (real o simulado), ofrecer conservar 72 h o cerrar.
  useEffect(()=>{ if(done && videoUuid && cierre===null) setCierre("pendiente"); },[done,videoUuid]);

  // Conclusión: conservar 72 h más (extender=true) o cerrar ya (false).
  const concluir=async(extender)=>{
    if(accBusy) return; setAccBusy(true);
    try{ if(videoUuid) await supabase.rpc("concluir_video",{p_video_id:videoUuid,p_extender:extender}); }
    catch(e){ console.warn("concluir_video:",e); }
    setCierre("resuelto"); setAccBusy(false);
  };
  // Solicitar al admin otra apertura de 72 h.
  const solicitarReapertura=async()=>{
    if(accBusy||!videoUuid) return; setAccBusy(true);
    try{ await supabase.rpc("solicitar_reapertura",{p_video_id:videoUuid}); setSolPend(true); }
    catch(e){ console.warn("solicitar_reapertura:",e); }
    setAccBusy(false);
  };

  // Conecta la fuente al <video>: HLS vía hls.js (o nativo en Safari) para .m3u8,
  // asignación directa de src para .mp4.
  useEffect(()=>{
    if(!videoRef.current||!videoPrueba||videoError) return;
    if(acceso&&acceso.puede_ver===false) return; // bloqueado: no cargar la fuente
    let hls, cancelado=false;
    (async()=>{
      const v=videoRef.current;
      if(cancelado||!v) return;
      if(offlineUrl){ v.src=offlineUrl; return; } // copia cifrada local: ver sin conexión
      const src=await resolverFuente(videoPrueba); // firma si es Bunny; null si no pudo firmarse
      if(cancelado) return;
      if(src===null){ setVideoError(true); return; } // Bunny sin firma: no servir crudo
      if(esHls(src)){
        if(v.canPlayType("application/vnd.apple.mpegurl")){
          v.src=src; // Safari / iOS reproducen HLS de forma nativa
        }else{
          const Hls=await loadHls().catch(()=>null);
          if(cancelado||!videoRef.current) return;
          if(Hls&&Hls.isSupported()){
            // Si la URL viene firmada (token=), propagar la MISMA query a cada
            // segmento/subplaylist: hls.js no arrastra el query string solo, y el
            // token de directorio de Bunny autoriza toda la carpeta con ese token.
            const qs=(/token=/.test(src)&&src.includes("?"))?src.split("?")[1]:null;
            hls=new Hls({maxBufferLength:30, ...(qs?{xhrSetup:(xhr,u)=>{
              const uu=/token=/.test(u)?u:(u+(u.includes("?")?"&":"?")+qs);
              xhr.open("GET",uu,true);
            }}:{})});
            hls.loadSource(src);
            hls.attachMedia(videoRef.current);
            hls.on(Hls.Events.ERROR,(_e,data)=>{ if(data?.fatal) setVideoError(true); });
          }else{
            videoRef.current.src=src; // último recurso
          }
        }
      }else{
        v.src=src; // .mp4 directo
      }
    })();
    return()=>{ cancelado=true; if(hls) hls.destroy(); };
  },[videoPrueba,videoError,offlineUrl,acceso]);
  useEffect(()=>{
    if(!watching||(videoPrueba&&!videoError)) return; // con video real cargando, el avance lo marca el <video>
    const t=setInterval(()=>{
      setSecs(s=>{
        if(s+1>=SIM_DUR){clearInterval(t);setDone(true);return SIM_DUR;}
        return s+1;
      });
    },1000);
    return()=>clearInterval(t);
  },[watching,videoPrueba,videoError]);
  const title=PICK(vid);
  return(
    <div style={OVERLAY}>
      <div className="catePanel" style={{...MODAL,maxWidth:580,textAlign:"center"}}>
        <div style={{fontSize:28,marginBottom:8}}>🎬</div>
        <h2 style={{fontFamily:"'Cinzel',serif",color:C.gold,fontSize:16,marginBottom:4}}>{title}</h2>
        <p style={{color:C.ivoryM,fontSize:13,marginBottom:12}}>⏱ {vid.dur}</p>
        {!urlReal&&videoPrueba&&!videoError&&(
          <div style={{
            display:"inline-flex",alignItems:"center",gap:6,marginBottom:12,
            background:"rgba(248,113,113,0.12)",border:"1px solid rgba(248,113,113,0.35)",
            borderRadius:999,padding:"4px 12px",color:"#F87171",
            fontFamily:"'Cinzel',serif",fontSize:11,letterSpacing:"0.06em",fontWeight:700,
          }}>⚠ {T("VIDEO DE PRUEBA — contenido provisional","TEST VIDEO — placeholder content","VIDÉO DE TEST — contenu provisoire","TESTVIDEO — vorläufiger Inhalt","VÍDEO DE TESTE — conteúdo provisório","VIDEO DI PROVA — contenuto provvisorio")}</div>
        )}
        <div style={{background:"#000",borderRadius:12,minHeight:200,display:"flex",flexDirection:"column",
          alignItems:"center",justifyContent:"center",marginBottom:20,position:"relative",overflow:"hidden"}}>
          {acceso===null?(
            <div style={{color:C.ivoryM,fontFamily:"'Crimson Text',serif",fontSize:14,padding:24}}>
              {T("Verificando acceso…","Checking access…","Vérification de l'accès…","Zugriff wird geprüft…","Verificando acesso…","Verifica accesso…")}
            </div>
          ):acceso.puede_ver===false?(
            <div style={{textAlign:"center",padding:"26px 18px"}}>
              <div style={{fontSize:40,marginBottom:10}} aria-hidden="true">🔒</div>
              <p style={{color:C.ivory,fontFamily:"'Crimson Text',serif",fontSize:15,lineHeight:1.6,maxWidth:380,margin:"0 auto 14px"}}>
                {T("El acceso a este video está cerrado. Para volver a verlo, solicita una nueva apertura por 72 horas; un administrador la revisará.","Access to this video is closed. To watch it again, request a new 72-hour opening; an administrator will review it.","L'accès à cette vidéo est fermé. Pour la revoir, demandez une nouvelle ouverture de 72 heures ; un administrateur l'examinera.","Der Zugriff auf dieses Video ist geschlossen. Um es erneut anzusehen, fordere eine neue 72-Stunden-Öffnung an; ein Administrator prüft sie.","O acesso a este vídeo está fechado. Para vê-lo novamente, solicite uma nova abertura de 72 horas; um administrador irá avaliá-la.","L'accesso a questo video è chiuso. Per rivederlo, richiedi una nuova apertura di 72 ore; un amministratore la esaminerà.")}
              </p>
              {solPend?(
                <p style={{color:C.gold,fontFamily:"'Cinzel',serif",fontSize:13}}>
                  ⏳ {T("Solicitud enviada. Te avisaremos cuando se apruebe.","Request sent. We'll let you know when it's approved.","Demande envoyée. Nous vous préviendrons de l'approbation.","Anfrage gesendet. Wir benachrichtigen dich bei Genehmigung.","Solicitação enviada. Avisaremos quando for aprovada.","Richiesta inviata. Ti avviseremo dell'approvazione.")}
                </p>
              ):(
                <button onClick={solicitarReapertura} disabled={accBusy}
                  style={{...BTN("pri"),fontSize:14,opacity:accBusy?0.6:1,cursor:accBusy?"default":"pointer"}}>
                  🔓 {T("Solicitar reapertura (72 h)","Request reopening (72 h)","Demander une réouverture (72 h)","Erneute Öffnung anfordern (72 Std.)","Solicitar reabertura (72 h)","Richiedi riapertura (72 h)")}
                </button>
              )}
            </div>
          ):videoPrueba&&!videoError?(
            <>
            <video
              key={videoPrueba}
              ref={videoRef}
              controls
              controlsList="nodownload"
              disablePictureInPicture
              onContextMenu={(e)=>e.preventDefault()}
              playsInline
              style={{width:"100%",maxHeight:320,display:"block",borderRadius:12}}
              onLoadedMetadata={seekInicial}
              onPlay={()=>setWatching(true)}
              onTimeUpdate={reportar}
              onPause={reportar}
              onEnded={()=>{ setDone(true); if(onProgress) onProgress(0); }}
              onError={()=>setVideoError(true)}
            />
            {marca&&(
              <div aria-hidden="true" style={{position:"absolute",...wmPos,pointerEvents:"none",
                color:"rgba(255,255,255,0.30)",fontFamily:"Arial,sans-serif",fontSize:12,fontWeight:700,
                textShadow:"0 1px 2px rgba(0,0,0,0.7)",letterSpacing:"0.04em",maxWidth:"72%",
                transform:"rotate(-16deg)",whiteSpace:"nowrap",userSelect:"none",
                transition:"top .6s ease,left .6s ease,right .6s ease,bottom .6s ease"}}>{marca}</div>
            )}
            </>
          ):(<>
            {videoError&&!watching&&!done&&(
              <p style={{color:C.ivoryM,fontSize:12.5,marginBottom:12,maxWidth:340}}>
                {T("El video aún no está disponible. Puedes marcarlo como visto para continuar con tu evaluación.","The video is not available yet. You can mark it as watched to continue to your evaluation.","La vidéo n'est pas encore disponible. Vous pouvez la marquer comme vue pour continuer.","Das Video ist noch nicht verfügbar. Sie können es als angesehen markieren, um fortzufahren.","O vídeo ainda não está disponível. Você pode marcá-lo como visto para continuar.","Il video non è ancora disponibile. Puoi contrassegnarlo come visto per continuare.")}
              </p>
            )}
            {!watching&&!done&&(
              <button onClick={()=>setWatching(true)}
                style={{...BTN("pri"),fontSize:18,padding:"16px 32px"}}>▶ {videoError?T("Marcar como visto","Mark as watched","Marquer comme vu","Als angesehen markieren","Marcar como visto","Segna come visto"):T("Ver video","Watch video","Voir la vidéo","Video ansehen","Ver vídeo","Guarda il video")}</button>
            )}
            {watching&&!done&&(
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:40,marginBottom:8,animation:"pulse 1s infinite"}}>▶️</div>
                <div style={{background:"rgba(255,255,255,0.1)",borderRadius:4,height:6,width:240,margin:"0 auto"}}>
                  <div style={{background:C.gold,borderRadius:4,height:6,
                    width:`${(secs/SIM_DUR)*100}%`,transition:"width 1s"}}/>
                </div>
                <p style={{color:C.ivoryM,fontSize:13,marginTop:8}}>
                  {T("Reproduciendo…","Playing…","Lecture en cours…","Wird abgespielt…","Reproduzindo…","Riproduzione in corso…")} {secs}/{SIM_DUR}s
                </p>
              </div>
            )}
            {done&&(
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:40,marginBottom:8}}>✅</div>
                <p style={{color:"#22C55E",fontFamily:"'Crimson Text',serif",fontSize:16}}>
                  {T("Video completado","Video completed","Vidéo terminée","Video abgeschlossen","Vídeo concluído","Video completato")}
                </p>
              </div>
            )}
          </>)}
        </div>
        {(esDescargable||descargado)&&(
          <div style={{marginBottom:14,fontSize:13}}>
            {descargado?(
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,flexWrap:"wrap"}}>
                <span style={{color:"#22C55E",fontFamily:"'Crimson Text',serif"}}>
                  ⬇️ {T("Disponible sin conexión","Available offline","Disponible hors ligne","Offline verfügbar","Disponível offline","Disponibile offline")}
                </span>
                <button onClick={borrarDescarga} style={{background:"none",border:"none",cursor:"pointer",
                  color:C.ivoryM,textDecoration:"underline",fontSize:12.5,fontFamily:"'Crimson Text',serif"}}>
                  {T("Borrar descarga","Delete download","Supprimer le téléchargement","Download löschen","Excluir download","Elimina download")}
                </button>
              </div>
            ):(
              <div style={{textAlign:"center"}}>
                <button onClick={descargar} disabled={descargando}
                  style={{...BTN("sec"),fontSize:12,opacity:descargando?0.6:1,cursor:descargando?"default":"pointer"}}>
                  {descargando
                    ? T("Descargando…","Downloading…","Téléchargement…","Wird heruntergeladen…","Baixando…","Scaricamento…")
                    : "⬇️ "+T("Descargar para ver sin conexión","Download to watch offline","Télécharger pour voir hors ligne","Zum Offline-Ansehen herunterladen","Baixar para ver offline","Scarica per vedere offline")}
                </button>
                <p style={{color:C.ivoryM,fontSize:11.5,marginTop:6,lineHeight:1.4,maxWidth:360,marginLeft:"auto",marginRight:"auto"}}>
                  {T("Se guarda cifrado en este dispositivo y ligado a tu cuenta.","Saved encrypted on this device and tied to your account.","Enregistré chiffré sur cet appareil et lié à votre compte.","Verschlüsselt auf diesem Gerät gespeichert und mit deinem Konto verknüpft.","Salvo criptografado neste dispositivo e vinculado à sua conta.","Salvato cifrato su questo dispositivo e legato al tuo account.")}
                </p>
                {descError&&(
                  <p style={{color:"#F87171",fontSize:12,marginTop:4}}>
                    {T("No se pudo descargar. Revisa tu conexión e inténtalo de nuevo.","Download failed. Check your connection and try again.","Échec du téléchargement. Vérifiez votre connexion et réessayez.","Download fehlgeschlagen. Prüfe deine Verbindung und versuche es erneut.","Falha no download. Verifique sua conexão e tente novamente.","Download non riuscito. Controlla la connessione e riprova.")}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
        {done&&cierre==="pendiente"&&(
          <div style={{background:"rgba(200,169,81,0.10)",border:`1px solid ${C.gold}44`,borderRadius:12,
            padding:"14px 16px",marginBottom:16}}>
            <p style={{color:C.ivory,fontFamily:"'Crimson Text',serif",fontSize:14.5,lineHeight:1.55,margin:"0 0 12px"}}>
              {T("Terminaste este video. ¿Deseas conservar el acceso 72 horas más, o cerrarlo ahora? Cerrado, para volver a verlo tendrás que solicitar una nueva apertura.","You finished this video. Keep access for 72 more hours, or close it now? Once closed, you'll need to request a new opening to watch it again.","Vous avez terminé cette vidéo. Conserver l'accès 72 heures de plus, ou le fermer maintenant ? Une fois fermé, il faudra demander une nouvelle ouverture pour la revoir.","Du hast dieses Video beendet. Zugriff 72 Stunden länger behalten oder jetzt schließen? Nach dem Schließen musst du eine neue Öffnung anfordern, um es erneut anzusehen.","Você terminou este vídeo. Deseja manter o acesso por mais 72 horas ou fechá-lo agora? Fechado, para vê-lo novamente será preciso solicitar uma nova abertura.","Hai finito questo video. Vuoi mantenere l'accesso per altre 72 ore o chiuderlo ora? Una volta chiuso, per rivederlo dovrai richiedere una nuova apertura.")}
            </p>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              <button onClick={()=>concluir(true)} disabled={accBusy}
                style={{...BTN("pri"),flex:1,justifyContent:"center",fontSize:12.5,opacity:accBusy?0.6:1}}>
                ⏳ {T("Conservar 72 h","Keep 72 h","Garder 72 h","72 Std. behalten","Manter 72 h","Mantieni 72 h")}
              </button>
              <button onClick={()=>concluir(false)} disabled={accBusy}
                style={{...BTN("sec"),flex:1,justifyContent:"center",fontSize:12.5,opacity:accBusy?0.6:1}}>
                🔒 {T("Cerrar ahora","Close now","Fermer maintenant","Jetzt schließen","Fechar agora","Chiudi ora")}
              </button>
            </div>
          </div>
        )}
        {videoPrueba&&done&&cierre!=="pendiente"&&(
          <p style={{color:"#22C55E",fontFamily:"'Crimson Text',serif",fontSize:14.5,marginTop:-10,marginBottom:16}}>
            ✅ {T("Video completado","Video completed","Vidéo terminée","Video abgeschlossen","Vídeo concluído","Video completato")}
          </p>
        )}
        <div style={{display:"flex",gap:12}}>
          <button onClick={onClose} style={{...BTN("sec"),flex:1,justifyContent:"center"}}>
            ✕ {T("Cerrar","Close","Fermer","Schließen","Fechar","Chiudi")}
          </button>
          {done&&cierre!=="pendiente"&&(
            <button onClick={onWatched} style={{...BTN("pri"),flex:2,justifyContent:"center"}}>
              {T("Realizar evaluación","Take evaluation","Passer l'évaluation","Bewertung durchführen","Realizar avaliação","Esegui la valutazione")} →
            </button>
          )}
        </div>
        <SoporteLink contexto={T("Video — ","Video — ","Vidéo — ","Video — ","Vídeo — ","Video — ")+(vid?.es||vid?.id||"")}/>
      </div>
    </div>
  );
}
