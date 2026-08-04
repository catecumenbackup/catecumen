import { useState, lazy, Suspense } from "react";
import { SEC_META, isSectionDone } from "../data/course.js";
const Schola = lazy(() => import("./Schola.jsx"));
import SecIcon from "./SecIcon.jsx";
import { supabase } from "../supabaseClient.js";
import { formatSerie } from "../logic.js";
import { C, BTN, CARD, MODAL, OVERLAY } from "../ui.js";
import { LANG, T, PICK } from "../i18n.js";

// Constancias en PDF (jsPDF + QR por CDN). Estos helpers son exclusivos
// de esta pantalla, por eso viven aquí y no en el ámbito global.
const genCode=()=>[...Array(24)].map(()=>"ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random()*36)]).join("").match(/.{6}/g).join("-");

// Carga perezosa de una librería externa (UMD) por CDN. Devuelve una promesa.
function cargarScript(src){
  return new Promise((resolve,reject)=>{
    if([...document.scripts].some(s=>s.src===src)) return resolve();
    const s=document.createElement("script");
    s.src=src; s.async=true; s.onload=()=>resolve(); s.onerror=()=>reject(new Error("No se pudo cargar "+src));
    document.head.appendChild(s);
  });
}
const JSPDF_CDN="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
// Convierte una imagen (URL del sitio) a dataURL para incrustarla en el PDF.
async function imgToDataURL(src){
  try{
    const res=await fetch(src); const blob=await res.blob();
    return await new Promise((resolve,reject)=>{
      const r=new FileReader(); r.onload=()=>resolve(r.result); r.onerror=reject; r.readAsDataURL(blob);
    });
  }catch(e){ console.error("imgToDataURL:",e); return ""; }
}
const QRCODE_CDN="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
// Genera un dataURL PNG de un código QR usando la librería qrcodejs (UMD).
async function generarQRDataURL(texto,size=140){
  await cargarScript(QRCODE_CDN);
  return new Promise((resolve)=>{
    const cont=document.createElement("div"); cont.style.display="none"; document.body.appendChild(cont);
    /* global QRCode */
    new QRCode(cont,{text:texto,width:size,height:size,correctLevel:QRCode.CorrectLevel.M});
    setTimeout(()=>{
      const img=cont.querySelector("img"), cv=cont.querySelector("canvas");
      const url=img?.src||cv?.toDataURL("image/png")||"";
      document.body.removeChild(cont); resolve(url);
    },120);
  });
}

export default function CertificatesModal({formData,sequence,progress,insBySec,onClose}){
  const certSecs=sequence.filter(s=>SEC_META[s]?.cert&&isSectionDone(s,progress));
  const today=new Date().toLocaleDateString({es:"es-MX",en:"en-US",fr:"fr-FR",de:"de-DE",pt:"pt-BR",it:"it-IT"}[LANG]||"es-MX",{year:"numeric",month:"long",day:"numeric"});
  const [downloading,setDownloading]=useState(null);
  const [scholaOpen,setScholaOpen]=useState(false);
  const [series,setSeries]=useState({}); // {secId:{serie,codigo,vigencia}}

  const fmtFecha=(d)=>new Date(d).toLocaleDateString({es:"es-MX",en:"en-US",fr:"fr-FR",de:"de-DE",pt:"pt-BR",it:"it-IT"}[LANG]||"es-MX",{year:"numeric",month:"long",day:"numeric"});

  const downloadCert=async(secId)=>{
    setDownloading(secId);
    try{
      const sec=SEC_META[secId];
      const nombreSac=PICK(sec);
      const nombreCompleto=`${formData.nombre||""} ${formData.apellido||""}`.trim();
      // 1) Registrar (o recuperar) la constancia y su serie en Supabase.
      let serie="", codigo="", vigencia=null, emision=new Date().toISOString();
      try{
        const {data,error}=await supabase.rpc("registrar_constancia",{
          p_inscripcion_id: insBySec?.[secId]||null,
          p_slug: secId,
          p_nombre_sacramento: nombreSac,
          p_nombre: nombreCompleto,
          p_tipo_doc: formData.tipoDocumento||formData.tipo_documento||"ID",
          p_num_doc: formData.docNum||"",
          p_pais_origen: formData.country||"",
          p_pais_residencia: formData.country||"",
          p_estado: formData.parEstado||formData.estado||"",
          p_fecha_inicio: null,
          p_fecha_conclusion: null,
          p_horas: sec?.videos?.length? (sec.videos.length*1):10,
          p_puntaje: null,
        });
        if(error) throw error;
        const row=Array.isArray(data)?data[0]:data;
        if(row){ serie=row.serie; codigo=row.codigo_validacion; vigencia=row.fecha_vigencia; emision=row.fecha_emision||emision; }
      }catch(e){
        console.error("registrar_constancia:",e);
        // Respaldo: serie local si la RPC no está disponible (no bloquea la descarga).
        // formatSerie (logic.js, probado) garantiza el formato CAT-ISO-SAC-AÑO-NNNNNN.
        serie=formatSerie(formData.country, secId, new Date().getFullYear(), Math.floor(Math.random()*1000000));
        codigo=genCode().replace(/-/g,"").toLowerCase();
        vigencia=new Date(Date.now()+182*864e5).toISOString().slice(0,10);
      }
      setSeries(p=>({...p,[secId]:{serie,codigo,vigencia}}));

      // 2) Generar el QR de verificación.
      const urlVerif=`https://www.catecumen.com/?validar=${encodeURIComponent(codigo)}`;
      let qrDataUrl="";
      try{ qrDataUrl=await generarQRDataURL(urlVerif,150); }catch(e){ console.error("QR:",e); }

      // 3) Construir el PDF (A4 horizontal) con jsPDF.
      await cargarScript(JSPDF_CDN);
      const { jsPDF } = window.jspdf;
      const doc=new jsPDF({orientation:"landscape",unit:"mm",format:"a4"});
      const W=297, H=210, cx=W/2;
      const gold=[156,122,40], goldL=[200,169,81], ink=[42,36,24], soft=[90,83,66];

      // Fondo y marcos
      doc.setFillColor(252,249,242); doc.rect(0,0,W,H,"F");
      doc.setDrawColor(...goldL); doc.setLineWidth(1.4); doc.rect(10,10,W-20,H-20);
      doc.setLineWidth(0.4); doc.rect(13,13,W-26,H-26);

      // Encabezado con LOGO (catecumenlogo.png). Si no carga, cae al texto.
      const logoData=await imgToDataURL("/catecumenlogo.png");
      if(logoData){
        try{ doc.addImage(logoData,"PNG",cx-30,15,60,20); }catch(e){ console.error("logo pdf:",e); }
      }else{
        doc.setTextColor(...gold); doc.setFont("times","bold"); doc.setFontSize(13);
        doc.text("CATECUMEN",cx,26,{align:"center"});
      }
      doc.setFont("times","italic"); doc.setFontSize(10); doc.setTextColor(...soft);
      doc.text(T("El Aula Global de la Catequesis","The Global Classroom of Catechesis","La Salle de Classe Mondiale de la Catéchèse","Das globale Klassenzimmer der Katechese","A Sala de Aula Global da Catequese","L'Aula Globale della Catechesi"),cx,40,{align:"center"});

      doc.setFont("times","bold"); doc.setFontSize(24); doc.setTextColor(...gold);
      doc.text(T("CONSTANCIA DE FORMACIÓN","CERTIFICATE OF FORMATION","ATTESTATION DE FORMATION","AUSBILDUNGSBESCHEINIGUNG","CERTIFICADO DE FORMAÇÃO","ATTESTATO DI FORMAZIONE"),cx,50,{align:"center"});
      doc.setDrawColor(...goldL); doc.setLineWidth(0.6); doc.line(cx-45,54,cx+45,54);

      // Cuerpo
      doc.setFont("times","normal"); doc.setFontSize(12); doc.setTextColor(...soft);
      doc.text(T("Se otorga la presente constancia a","This certificate is awarded to","La présente attestation est décernée à","Diese Bescheinigung wird verliehen an","O presente certificado é concedido a","Il presente attestato è conferito a"),cx,66,{align:"center"});

      doc.setFont("times","bold"); doc.setFontSize(22); doc.setTextColor(...ink);
      doc.text(nombreCompleto||"—",cx,78,{align:"center"});

      // Identificación + residencia
      doc.setFont("times","normal"); doc.setFontSize(10.5); doc.setTextColor(...soft);
      const idLinea=`${T("Documento de identificación","Identification document","Document d'identification","Ausweisdokument","Documento de identificação","Documento di identificazione")}: ${formData.docNum||"—"}`;
      doc.text(idLinea,cx,86,{align:"center"});
      const resid=[formData.parEstado||formData.estado||"", formData.country||""].filter(Boolean).join(", ");
      if(resid) doc.text(`${T("Residencia","Residence","Résidence","Wohnsitz","Residência","Residenza")}: ${resid}`,cx,92,{align:"center"});

      doc.setFontSize(12); doc.setTextColor(...soft);
      doc.text(T("por haber completado satisfactoriamente la formación de:","for having satisfactorily completed the formation of:","pour avoir suivi avec succès la formation de :","für den erfolgreichen Abschluss der Ausbildung von:","por ter concluído satisfatoriamente a formação de:","per aver completato con successo la formazione di:"),cx,102,{align:"center"});

      doc.setFont("times","bold"); doc.setFontSize(17); doc.setTextColor(...gold);
      doc.text(nombreSac,cx,112,{align:"center"});

      // Firma catequista
      doc.setDrawColor(...soft); doc.setLineWidth(0.3); doc.line(cx-40,150,cx+40,150);
      doc.setFont("times","bold"); doc.setFontSize(11); doc.setTextColor(...ink);
      doc.text("Mtra. Nelly Rocio Montoya Freyre",cx,156,{align:"center"});
      doc.setFont("times","italic"); doc.setFontSize(9.5); doc.setTextColor(...soft);
      doc.text(T("Catequista que autoriza","Authorizing catechist","Catéchiste autorisant","Autorisierende Katechetin","Catequista que autoriza","Catechista che autorizza"),cx,161,{align:"center"});

      // Fechas (izquierda)
      doc.setFont("times","normal"); doc.setFontSize(9.5); doc.setTextColor(...soft);
      doc.text(`${T("Fecha de expedición","Date of issue","Date de délivrance","Ausstellungsdatum","Data de expedição","Data di rilascio")}: ${fmtFecha(emision)}`,20,180);
      doc.text(`${T("Vigencia (6 meses)","Valid until (6 months)","Validité (6 mois)","Gültig bis (6 Monate)","Validade (6 meses)","Validità (6 mesi)")}: ${vigencia?fmtFecha(vigencia):"—"}`,20,186);
      doc.setFont("times","bold"); doc.setTextColor(...gold);
      doc.text(`${T("N.º de serie","Serial No.","N° de série","Seriennr.","N.º de série","N. di serie")}: ${serie}`,20,192);
      // Número de identificación de la plataforma (registro_id del usuario)
      if(formData.registrationId){
        doc.text(`${T("N.º de identificación","ID number","N° d'identification","Ausweisnummer","N.º de identificação","N. di identificazione")}: ${formData.registrationId}`,20,198);
      }

      // QR (derecha) + leyenda
      if(qrDataUrl){ try{ doc.addImage(qrDataUrl,"PNG",W-52,168,28,28); }catch(e){} }
      doc.setFont("times","normal"); doc.setFontSize(7.5); doc.setTextColor(...soft);
      doc.text(T("Verifica su autenticidad","Verify its authenticity","Vérifiez son authenticité","Echtheit überprüfen","Verifique sua autenticidade","Verifica l'autenticità"),W-38,198,{align:"center"});

      // 4) Descargar
      doc.save(`Constancia_${(nombreCompleto||"Catecumen").replace(/\s+/g,"_")}_${serie}.pdf`);
    }catch(e){
      console.error("downloadCert:",e);
      alert(T("No se pudo generar la constancia. Intenta de nuevo.","Could not generate the certificate. Please try again.","Impossible de générer l'attestation. Réessayez.","Die Bescheinigung konnte nicht erstellt werden. Bitte erneut versuchen.","Não foi possível gerar o certificado. Tente novamente.","Impossibile generare l'attestato. Riprova."));
    }
    setDownloading(null);
  };
  return(
    <div style={OVERLAY}>
      <div style={{...MODAL,maxWidth:680}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:40,marginBottom:8}}>🏆</div>
          <h2 style={{fontFamily:"'Cinzel',serif",color:C.gold,fontSize:20}}>
            {T("Mis Constancias","My Certificates","Mes attestations","Meine Bescheinigungen","Meus Certificados","I miei attestati")}
          </h2>
          <p style={{color:C.ivoryM,fontSize:13,marginTop:4}}>
            {T("Descarga cada constancia de formación sacramental","Download each sacramental formation certificate","Téléchargez chaque attestation de formation sacramentelle","Laden Sie jede Bescheinigung der sakramentalen Ausbildung herunter","Baixe cada certificado de formação sacramental","Scarica ogni attestato di formazione sacramentale")}
          </p>
        </div>
        {certSecs.length===0&&(
          <p style={{color:C.ivoryM,textAlign:"center",fontFamily:"'Crimson Text',serif",fontSize:16,marginBottom:20}}>
            {T("Aún no hay constancias disponibles. Completa tu formación para obtenerlas.","No certificates available yet. Complete your formation to receive them.","Aucune attestation disponible pour l'instant. Terminez votre formation pour les obtenir.","Noch keine Bescheinigungen verfügbar. Schließen Sie Ihre Ausbildung ab, um sie zu erhalten.","Ainda não há certificados disponíveis. Complete sua formação para obtê-los.","Nessun attestato disponibile ancora. Completa la tua formazione per ottenerli.")}
          </p>
        )}
        <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:20}}>
          {certSecs.map(secId=>{
            const sec=SEC_META[secId];
            return(
              <div key={secId} style={{...CARD,display:"flex",alignItems:"center",gap:16,
                background:"rgba(200,169,81,0.06)",border:`1px solid ${C.gold}30`}}>
                <SecIcon id={secId} size={28}/>
                <div style={{flex:1}}>
                  <p style={{color:C.ivory,fontFamily:"'Cinzel',serif",fontSize:14}}>
                    {PICK(sec)}
                  </p>
                  <p style={{color:C.ivoryM,fontSize:12,marginTop:2}}>
                    {formData.nombre} {formData.apellido}
                  <span style={{color:C.gold,margin:"0 6px"}}>·</span>
                  {formData.docNum}
                  <span style={{color:C.gold,margin:"0 6px"}}>·</span>
                  {today}
                  </p>
                  {series[secId]?.serie&&(
                    <p style={{color:C.gold,fontSize:11,marginTop:3,fontFamily:"monospace",letterSpacing:"0.02em"}}>
                      {T("Serie","Serial","Série","Seriennr.","Série","Serie")}: {series[secId].serie}
                    </p>
                  )}
                  {!formData.isAdult&&(
                    <p style={{color:"#F87171",fontSize:11,marginTop:2}}>
                      ⚠️ {T("Solo válida para mayores de 18 años","Valid only for persons 18+","Valable uniquement pour les personnes de plus de 18 ans","Nur gültig für Personen über 18 Jahre","Válida apenas para maiores de 18 anos","Valido solo per i maggiori di 18 anni")}
                    </p>
                  )}
                </div>
                <button onClick={()=>downloadCert(secId)}
                  disabled={downloading===secId}
                  style={{...BTN("pri"),fontSize:12,padding:"8px 16px",whiteSpace:"nowrap"}}>
                  {downloading===secId?T("Generando…","Generating…","Génération…","Wird erstellt…","Gerando…","Generazione in corso…"):"⬇ "+T("Descargar","Download","Télécharger","Herunterladen","Baixar","Scarica")}
                </button>
              </div>
            );
          })}
        </div>
        <div style={{...CARD,background:"rgba(200,169,81,0.05)",marginBottom:20}}>
          <p style={{color:C.ivoryM,fontSize:12,lineHeight:1.6}}>
            🔐 {T("Cada constancia incluye un código QR único para verificar su autenticidad. La validez es de 6 meses a partir de la fecha de emisión. Válida únicamente para mayores de 18 años.","Each certificate includes a unique QR code for authenticity verification. Valid for 6 months from the date of issue. Valid only for persons 18 years of age or older.","Chaque attestation comprend un code QR unique pour vérifier son authenticité. Elle est valable 6 mois à compter de la date d'émission. Valable uniquement pour les personnes de plus de 18 ans.","Jede Bescheinigung enthält einen eindeutigen QR-Code zur Echtheitsprüfung. Die Gültigkeit beträgt 6 Monate ab Ausstellungsdatum. Nur gültig für Personen über 18 Jahre.","Cada certificado inclui um código QR único para verificar sua autenticidade. A validade é de 6 meses a partir da data de emissão. Válido apenas para maiores de 18 anos.","Ogni attestato include un codice QR unico per verificarne l'autenticità. La validità è di 6 mesi dalla data di emissione. Valido solo per i maggiori di 18 anni.")}
          </p>
        </div>
        {certSecs.length>0&&(
          <button onClick={()=>setScholaOpen(true)}
            style={{...BTN("pri"),width:"100%",justifyContent:"center",marginBottom:10}}>
            ✝️ {T("Continúa tu formación · Schola Fidei","Continue your formation · Schola Fidei","Poursuivez votre formation · Schola Fidei","Setze deine Ausbildung fort · Schola Fidei","Continue sua formação · Schola Fidei","Continua la tua formazione · Schola Fidei")}
          </button>
        )}
        <button onClick={onClose} style={{...BTN("sec"),width:"100%",justifyContent:"center"}}>
          {T("Cerrar","Close","Fermer","Schließen","Fechar","Chiudi")}
        </button>
      </div>
      {scholaOpen&&(
        <Suspense fallback={<div style={OVERLAY}><div style={{color:C.gold,fontFamily:"'Cinzel',serif"}}>{T("Cargando…","Loading…","Chargement…","Wird geladen…","Carregando…","Caricamento…")}</div></div>}>
          <Schola espacio="fidei" onClose={()=>setScholaOpen(false)}/>
        </Suspense>
      )}
    </div>
  );
}
