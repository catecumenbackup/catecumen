import { useState, useEffect, useRef } from "react";
import { SEC_META } from "../data/course.js";
import { supabase } from "../supabaseClient.js";
import { SoporteLink } from "./support.jsx";
import { C, BTN, MODAL, OVERLAY } from "../ui.js";
import { T, PICK } from "../i18n.js";

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
// Si el token está apagado o la función no responde, devuelve la URL cruda (que
// reproduce igual). Los .mp4 locales / Supabase no se tocan.
async function resolverFuente(url){
  if(!esBunny(url)) return url;
  try{
    const {data,error}=await supabase.functions.invoke("firmar-video",{body:{url}});
    if(!error && data?.url) return data.url;
  }catch{/* sin conexión / función no desplegada: se usa la URL cruda */}
  return url;
}

export default function VideoModal({secId,vid,bridge,startAt=0,onProgress,onWatched,onClose}){
  const [watching,setWatching]=useState(false);
  const [done,setDone]=useState(false);
  const [secs,setSecs]=useState(0);
  const [videoError,setVideoError]=useState(false); // el archivo de video no cargó (404)
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

  // Conecta la fuente al <video>: HLS vía hls.js (o nativo en Safari) para .m3u8,
  // asignación directa de src para .mp4.
  useEffect(()=>{
    if(!videoRef.current||!videoPrueba||videoError) return;
    let hls, cancelado=false;
    (async()=>{
      const src=await resolverFuente(videoPrueba); // firma si es Bunny; si no, igual
      const v=videoRef.current;
      if(cancelado||!v) return;
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
  },[videoPrueba,videoError]);
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
          {videoPrueba&&!videoError?(
            <video
              key={videoPrueba}
              ref={videoRef}
              controls
              playsInline
              style={{width:"100%",maxHeight:320,display:"block",borderRadius:12}}
              onLoadedMetadata={seekInicial}
              onPlay={()=>setWatching(true)}
              onTimeUpdate={reportar}
              onPause={reportar}
              onEnded={()=>{ setDone(true); if(onProgress) onProgress(0); }}
              onError={()=>setVideoError(true)}
            />
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
        {videoPrueba&&done&&(
          <p style={{color:"#22C55E",fontFamily:"'Crimson Text',serif",fontSize:14.5,marginTop:-10,marginBottom:16}}>
            ✅ {T("Video completado","Video completed","Vidéo terminée","Video abgeschlossen","Vídeo concluído","Video completato")}
          </p>
        )}
        <div style={{display:"flex",gap:12}}>
          <button onClick={onClose} style={{...BTN("sec"),flex:1,justifyContent:"center"}}>
            ✕ {T("Cerrar","Close","Fermer","Schließen","Fechar","Chiudi")}
          </button>
          {done&&(
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
