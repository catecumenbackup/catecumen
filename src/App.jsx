// ╔══════════════════════════════════════════════════════════════════╗
// ║  Catecumen — Plataforma Sacramental Católica  v2.0                 ║
// ║  Requiere: react, @supabase/supabase-js                         ║
// ║  Video intro: coloca catecumenvideo.mp4 en /public              ║
// ╚══════════════════════════════════════════════════════════════════╝
import { useState, useEffect, useCallback, useRef, Fragment, lazy, Suspense } from "react";
import { createPortal } from "react-dom";
// ─── Imágenes servidas desde la carpeta public/ con rutas ABSOLUTAS estables ──
// (Antes eran imports ES que Vite renombraba con un hash distinto en cada build;
//  eso rompía las imágenes al redeplegar si no subías el assets/ nuevo completo.
//  Con rutas públicas fijas, las imágenes cargan siempre que los archivos estén
//  en la raíz del sitio — igual que /catecumenlogo.png, que nunca falló.)
//  IMPORTANTE: coloca estos 6 archivos en la carpeta `public/` de tu proyecto
//  Vite para que el build los copie a la raíz del dist.
// Imágenes en WebP (~60% más ligeras que los JPG originales, que quedan
// archivados). Soportado por todos los navegadores desde 2020.
const fondoBg = "/fondocatecumen.webp";
const fondoBgClaro = "/fondocatecumen-claro.webp";
const imgBienvenida = "/bienvenida-catequesis.webp";
const imgBienvenida2 = "/bienvenida-comunidad.webp";
// iconoBautismo/iconoConfirmacion, FlameIcon y CalizIcon viven en
// ./components/icons.jsx (importados abajo, compartidos con EncuadreModal).
import { buildSeq as buildSeqCore,
  calcularCuotaPais, aplicarBeca, formatSerie, cuotaFromRow, resolverCuota } from "./logic.js";
import { supabase } from "./supabaseClient.js";
import { SUPPORTED_LANGS, detectLang, LANG, setAppLanguage, T, PICK, SINO } from "./i18n.js";
import EstrellasInput from "./components/EstrellasInput.jsx";
import { FlameIcon, CalizIcon, iconoBautismo, iconoConfirmacion } from "./components/icons.jsx";
import SecIcon from "./components/SecIcon.jsx";
import { SoporteLink, DirectorioButton } from "./components/support.jsx";
import { SEC_META, Q, TEST_MODE, isSectionDone, videoState } from "./data/course.js";
import { appNav } from "./appNav.js";
import { CUOTAS } from "./data/pricing.js";
import { GoldenRain, StarRain } from "./components/effects.jsx";
import { FRow, Input, PasswordInput, PhoneField, CountrySelect } from "./components/fields.jsx";
import { CDOCS, COUNTRIES, COUNTRY_ISO, genRegistrationId } from "./data/countries.js";
// Carga diferida: estas pantallas solo se descargan al abrir su pestaña
// (quedan fuera del bundle inicial, sin añadir peticiones a la ruta crítica).
// AgendaTab y MensajesTab ahora se cargan (lazy) dentro de Dashboard.jsx,
// su único consumidor; ya no se importan aquí.
const EncuadreModal = lazy(() => import("./components/EncuadreModal.jsx"));
const LoginModal = lazy(() => import("./components/LoginModal.jsx"));
const ValidarConstanciaModal = lazy(() => import("./components/ValidarConstanciaModal.jsx"));
const CourseSectionView = lazy(() => import("./components/CourseSectionView.jsx"));
const SectionCompleteModal = lazy(() => import("./components/SectionCompleteModal.jsx"));
const VideoModal = lazy(() => import("./components/VideoModal.jsx"));
const EncuestaVideoModal = lazy(() => import("./components/EncuestaVideoModal.jsx"));
const EvalModal = lazy(() => import("./components/EvalModal.jsx"));
const ResultModal = lazy(() => import("./components/ResultModal.jsx"));
const CertificatesModal = lazy(() => import("./components/CertificatesModal.jsx"));
const Dashboard = lazy(() => import("./components/Dashboard.jsx"));
const FilterModal = lazy(() => import("./components/FilterModal.jsx"));
const SacSelectModal = lazy(() => import("./components/SacSelectModal.jsx"));
const PaymentModal = lazy(() => import("./components/PaymentModal.jsx"));
const RegisterForm = lazy(() => import("./components/RegisterForm.jsx"));
const RegisterParroquiaForm = lazy(() => import("./components/RegisterParroquiaForm.jsx"));
const RegisterDiocesisForm = lazy(() => import("./components/RegisterDiocesisForm.jsx"));
const RegisterCentroForm = lazy(() => import("./components/RegisterCentroForm.jsx"));
const RegisterOtroForm = lazy(() => import("./components/RegisterOtroForm.jsx"));
const PreinscripcionEspera = lazy(() => import("./components/PreinscripcionEspera.jsx"));
const PasswordModal = lazy(() => import("./components/PasswordModal.jsx"));
const ThankYouModal = lazy(() => import("./components/ThankYouModal.jsx"));
const OrgThankYouModal = lazy(() => import("./components/OrgThankYouModal.jsx"));
import { C, BTN, INP, LBL, checkStyle, radioStyle, CARD, MODAL, FONT_READ, READ, OVERLAY } from "./ui.js";

// El cliente Supabase vive en ./supabaseClient.js y el runtime i18n
// (SUPPORTED_LANGS, detectLang, LANG, setAppLanguage, T, PICK, SINO) en
// ./i18n.js — ambos importados arriba.

// Cuando redirigimos al pago de Stripe (acción intencional), evitamos que el
// navegador muestre el diálogo "¿Abandonar sitio?".
const Catecumen="Catecumen";

// Bandera representativa por idioma (para la lista del selector). El botón
// del selector, además, detecta el PAÍS real del navegador para mostrar la
// bandera correcta (México/España, USA/Reino Unido, Brasil/Portugal, etc.)
// Los emoji de bandera (🇲🇽 etc.) NO se renderizan en Windows con Chrome/Edge —
// es una limitación conocida de la fuente de emojis de Windows (Segoe UI Emoji),
// que no compone los "regional indicators" en banderas. Por eso guardamos solo
// el código ISO de 2 letras y dibujamos la bandera como imagen SVG real
// (ver FlagImg más abajo) — así se ve igual en Windows, Mac, Linux y móvil.
const LANG_FLAGS={es:"ES",en:"US",fr:"FR",de:"DE",pt:"PT",it:"IT"};
const LANG_NAMES={
  es:{es:"Español",en:"Spanish",fr:"Espagnol",de:"Spanisch",pt:"Espanhol",it:"Spagnolo"},
  en:{es:"Inglés",en:"English",fr:"Anglais",de:"Englisch",pt:"Inglês",it:"Inglese"},
  fr:{es:"Francés",en:"French",fr:"Français",de:"Französisch",pt:"Francês",it:"Francese"},
  de:{es:"Alemán",en:"German",fr:"Allemand",de:"Deutsch",pt:"Alemão",it:"Tedesco"},
  pt:{es:"Portugués",en:"Portuguese",fr:"Portugais",de:"Portugiesisch",pt:"Português",it:"Portoghese"},
  it:{es:"Italiano",en:"Italian",fr:"Italien",de:"Italienisch",pt:"Italiano",it:"Italiano"},
};
// Código de país detectado (más específico que la bandera genérica del idioma)
function detectCountryFlag(){
  const nav=(navigator.language||"").toUpperCase();
  const region=nav.split("-")[1]; // ej. "MX", "US", "GB", "BR", "PT"
  const MAP=[
    "MX","US","GB","UK","BR","PT","ES","FR","DE","IT","CA",
    "AR","CL","CO","PE","VE","EC","GT","HN","SV","NI","CR","PA",
    "DO","PR","UY","PY","BO",
  ];
  return MAP.includes(region)?(region==="UK"?"GB":region):null;
}
// Convierte un código ISO de 2 letras (ej. "MX") a la URL del SVG de bandera
// correspondiente en Twemoji (renderizado idéntico en cualquier SO/navegador).
function flagImgUrl(cc){
  if(!cc||cc.length!==2)return null;
  const cps=[...cc.toUpperCase()].map(c=>(0x1F1E6+c.charCodeAt(0)-65).toString(16)).join("-");
  return `https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/${cps}.svg`;
}
function FlagImg({code,size=18}){
  const [failed,setFailed]=useState(false);
  const url=flagImgUrl(code);
  if(!url||failed)return <span style={{fontSize:size*0.7,fontWeight:700,letterSpacing:"-0.02em"}}>{code||"🌐"}</span>;
  return <img src={url} alt={code} width={size} height={size}
    style={{borderRadius:3,display:"inline-block",objectFit:"cover",verticalAlign:"middle"}}
    onError={()=>setFailed(true)}/>;
}

// Estilos base (tema, botones, tarjetas, modales, lectura…) en src/ui.js.
// Se importan arriba junto con el resto de módulos.
// genCode/cargarScript/imgToDataURL/generarQRDataURL + CDNs viven en
// ./components/CertificatesModal.jsx (su único consumidor).

// ─── CLAVES TELEFÓNICAS INTERNACIONALES ───────────────────────────

// ─── DOCUMENTOS POR PAÍS ──────────────────────────────────────────
// PHONE_CODES, CDOCS y COUNTRIES viven en ./data/countries.js (importados abajo).

// ─── CONTENIDO TRONCO COMÚN 1 (5 módulos, 21 temas + repaso) ─────
// Contenido del curso (TC1_MODULES, TC2_*, KERIGMA, COURSES) y preguntas (Q)
// viven en ./data/course.js (importados abajo).

// ─── TEXTOS DE ENCUADRE ──────────────────────────────────────────
// ENCUADRES vive en ./data/encuadres.js; lo usa components/EncuadreModal.jsx.

// ─── SISTEMA DE PRECIOS PPP (Paridad de Poder Adquisitivo) — Niveles 1-4 ────
// Migrado desde la propuesta en sistema-precios-ppp/precios-ppp.js: las cuotas
// fijas manuales anteriores fueron reemplazadas por precios calculados según
// el nivel de ingreso/costo de vida de cada país. Las tasas de cambio (fx) son
// APROXIMADAS (referencia: primer semestre de 2026) — revisar periódicamente:
// cada 1-3 meses para monedas estables, cada 2-4 semanas para las volátiles
// (ARS, VES, CUP). Ver justificación de los casos chargeInUSD (AR/VE/CU/HT)
// en sistema-precios-ppp/precios-ppp.js.
// PPP_TIER_USD, RATIO_*, redondearCuota y calcularCuotaPais viven en logic.js
// (probados con Vitest). Aquí solo el mapa de países y la tabla derivada.

// País → { tier, moneda ISO a cobrar, tasa local por 1 USD, chargeInUSD }
// NOTA sobre monedas: la plataforma usa un solo campo `cur` tanto para mostrar
// como para cobrar en Stripe. Por eso, los países cuyas monedas Stripe no puede
// liquidar de forma fiable (VES, CUP) o que son demasiado volátiles para un
// precio fijo (ARS) se cobran en USD — es exactamente lo que hacía la versión
// en producción anterior y lo que recomienda la nota de precios-ppp.js
// (chargeInUSD). Solo se usan monedas que tu cuenta Stripe ya procesaba.

// ─── CUOTAS POR PAÍS (respaldo local; al iniciar se sobreescribe con Supabase cuotasporpais) ─
// Generadas a partir del sistema PPP de arriba (ya no son montos manuales fijos).
// PPP_PAISES y CUOTAS viven en ./data/pricing.js (CUOTAS mutable, importada abajo).


// ─── CÓDIGO ISO DE PAÍSES Y PREFIJOS DE ROL ───────────────────────
// COUNTRY_ISO, ROLE_PREFIX y genRegistrationId viven en ./data/countries.js.

// ─── BIBLIOTECA — Catecismo y Biblia (Santa Sede) ──────────────────
// LIBRARY_LINKS vive en ./components/support.jsx.

// ─── METADATOS DE SECCIONES ────────────────────────────────────────
// Video de prueba: una versión distinta por idioma (mismo mecanismo que usará
// el video real de cada lección — ver VideoModal, que resuelve con PICK()
// y cae de vuelta a español si un idioma todavía no tiene doblaje/versión).



// buildSeq vive en logic.js (probado con Vitest). Aquí solo se le pasa el
// TEST_MODE del módulo. Incluye el Módulo 0 "kerigma" para catecúmenos.
function buildSeq(uType, sacs){ return buildSeqCore(uType, sacs, TEST_MODE); }



// ─── FONDO SACRAMENTAL — símbolos dorados tenues ────────────────
function SacramentsBg(){
  return(
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden"}}>
      <svg width="100%" height="100%" style={{position:"absolute",inset:0}}
        viewBox="0 0 1200 900" preserveAspectRatio="xMidYMid slice"
        fill="none" stroke="#C8A951">
        {/* Cruz grande izquierda */}
        <g opacity="0.055" strokeWidth="14" strokeLinecap="round">
          <line x1="110" y1="30"  x2="110" y2="230"/>
          <line x1="55"  y1="90"  x2="165" y2="90"/>
        </g>
        {/* Cruz derecha arriba */}
        <g opacity="0.04" strokeWidth="9" strokeLinecap="round">
          <line x1="1060" y1="50"  x2="1060" y2="195"/>
          <line x1="1010" y1="95"  x2="1110" y2="95"/>
        </g>
        {/* Cruz centro abajo */}
        <g opacity="0.04" strokeWidth="8" strokeLinecap="round" transform="rotate(10,580,720)">
          <line x1="580" y1="660" x2="580" y2="780"/>
          <line x1="530" y1="695" x2="630" y2="695"/>
        </g>
        {/* Cruz pequeña derecha abajo */}
        <g opacity="0.035" strokeWidth="6" strokeLinecap="round" transform="rotate(-8,950,800)">
          <line x1="950" y1="755" x2="950" y2="845"/>
          <line x1="910" y1="785" x2="990" y2="785"/>
        </g>
        {/* Olas de agua (Bautismo) — izquierda abajo */}
        <g opacity="0.05" strokeWidth="5" strokeLinecap="round" fill="none">
          <path d="M20 680 Q55 655 90 680 Q125 705 160 680 Q195 655 230 680"/>
          <path d="M20 710 Q55 685 90 710 Q125 735 160 710 Q195 685 230 710"/>
          <path d="M20 740 Q55 715 90 740 Q125 765 160 740 Q195 715 230 740"/>
        </g>
        {/* Olas de agua — derecha */}
        <g opacity="0.04" strokeWidth="4" strokeLinecap="round" fill="none">
          <path d="M970 150 Q1005 128 1040 150 Q1075 172 1110 150 Q1145 128 1180 150"/>
          <path d="M970 178 Q1005 156 1040 178 Q1075 200 1110 178 Q1145 156 1180 178"/>
        </g>
        {/* Hostia (círculo con cruz) — esquina superior izquierda */}
        <g opacity="0.045" strokeWidth="5">
          <circle cx="880" cy="760" r="65"/>
          <line   x1="825" y1="760" x2="935" y2="760"/>
          <line   x1="880" y1="705" x2="880" y2="815"/>
        </g>
        {/* Hostia pequeña */}
        <g opacity="0.04" strokeWidth="4">
          <circle cx="120" cy="430" r="45"/>
          <line   x1="83"  y1="430" x2="157" y2="430"/>
          <line   x1="120" y1="393" x2="120" y2="467"/>
        </g>
        {/* Paloma simplificada — centro superior */}
        <g opacity="0.045" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M530 140 C512 128 498 124 488 130 C487 138 494 144 508 144 Q514 152 506 158 Q510 163 518 158 Q526 152 530 140Z"/>
          <path d="M518 130 C512 118 510 110 516 104 C520 118 524 122 518 130Z"/>
        </g>
        {/* Llama (Espíritu Santo / Confirmación) — derecha centro */}
        <g opacity="0.05" strokeWidth="4.5" strokeLinejoin="round">
          <path d="M1100 400 C1104 390 1108 380 1105 368 C1102 360 1104 354 1100 348 C1096 354 1098 360 1095 368 C1092 380 1096 390 1100 400Z"/>
          <path d="M1100 400 C1106 388 1114 376 1110 360 C1118 368 1120 380 1116 392 Q1108 404 1100 400Z"/>
          <path d="M1100 400 C1094 388 1086 376 1090 360 C1082 368 1080 380 1084 392 Q1092 404 1100 400Z"/>
        </g>
        {/* Pez Ichthys — centro */}
        <g opacity="0.04" strokeWidth="5" strokeLinecap="round">
          <path d="M540 480 C570 460 610 460 640 480 C610 500 570 500 540 480Z"/>
          <path d="M640 480 L665 464 M640 480 L665 496"/>
        </g>
        {/* Pez pequeño */}
        <g opacity="0.035" strokeWidth="4" strokeLinecap="round">
          <path d="M280 280 C302 267 328 267 350 280 C328 293 302 293 280 280Z"/>
          <path d="M350 280 L368 270 M350 280 L368 290"/>
        </g>
      </svg>
    </div>
  );
}

// ─── LLUVIA DORADA ─────────────────────────────────────────────────


// ─── LLUVIA DE ESTRELLAS DORADAS (giran y parpadean) — bienvenida tras pago ──
// GoldenRain y StarRain viven en ./components/effects.jsx.
// FlameIcon y CalizIcon → ./components/icons.jsx (importados arriba).

// (IntroVideo eliminado: era código muerto tras quitar el video intro.)


// ─── ESTILO DE BARRAS DE SCROLL (escritorio) ───────────────────────
function ScrollbarStyle(){
  return(
    <style>{`
      .catePanel{scrollbar-width:thin;scrollbar-color:rgba(200,169,81,.55) rgba(255,255,255,.05);}
      .catePanel::-webkit-scrollbar{width:10px;}
      .catePanel::-webkit-scrollbar-track{background:rgba(255,255,255,.04);border-radius:8px;}
      .catePanel::-webkit-scrollbar-thumb{background:rgba(200,169,81,.45);border-radius:8px;border:2px solid transparent;background-clip:content-box;}
      .catePanel::-webkit-scrollbar-thumb:hover{background:rgba(200,169,81,.7);background-clip:content-box;}
    `}</style>
  );
}

// ─── SOPORTE: contacto con admin@catecumen.com ─────────────────────


// Enlace discreto para el pie de los modales
// Botón flotante para el área de formación

// ─── LOGIN MODAL ─────────────────────────────────────────────
// ─── REANUDAR PAGO PENDIENTE ────────────────────────────────────────
function ResumePaymentModal({onBack}){
  const [email,setEmail]=useState("");
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState("");
  const canGo=email.includes("@");

  const handleResume=async()=>{
    if(!canGo)return;
    setLoading(true);setErr("");
    try{
      const{data,error}=await supabase.functions.invoke("reanudar-pago",{body:{
        email,retorno:window.location.origin,
      }});
      if(error||!data?.url){
        let msg=data?.mensaje;
        try{
          const body=await error?.context?.json?.();
          if(body?.mensaje)msg=body.mensaje;
        }catch{}
        throw new Error(msg||T(
          "No se pudo reanudar tu pago. Intenta de nuevo.",
          "We could not resume your payment. Please try again.",
          "Impossible de reprendre votre paiement. Réessayez.",
          "Ihre Zahlung konnte nicht fortgesetzt werden. Bitte versuchen Sie es erneut.",
          "Não foi possível retomar seu pagamento. Tente novamente.",
          "Non è stato possibile riprendere il pagamento. Riprova."));
      }
      appNav.bypassUnload=true; // no mostrar "¿Abandonar sitio?" al ir a Stripe
      window.location.href=data.url; // → Stripe Checkout
    }catch(e){setErr(e.message);setLoading(false);}
  };

  return(
    <div style={OVERLAY}>
      <div style={{...MODAL,maxWidth:420}}>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:36,marginBottom:8}}>🧾</div>
          <h2 style={{fontFamily:"'Cinzel',serif",color:C.gold,fontSize:20}}>
            {T("Reanudar pago pendiente","Resume pending payment","Reprendre un paiement en attente","Ausstehende Zahlung fortsetzen","Retomar pagamento pendente","Riprendi pagamento in sospeso")}
          </h2>
          <p style={{color:C.ivoryM,fontFamily:"'Crimson Text',serif",fontSize:14,marginTop:6}}>
            {T("Escribe el correo con el que iniciaste tu registro. No necesitas volver a llenar el formulario.","Enter the email you used to start your registration. You won't need to fill out the form again.","Indiquez l'e-mail avec lequel vous avez commencé votre inscription. Vous n'aurez pas besoin de remplir le formulaire à nouveau.","Geben Sie die E-Mail-Adresse ein, mit der Sie Ihre Registrierung begonnen haben. Sie müssen das Formular nicht erneut ausfüllen.","Digite o e-mail com o qual você iniciou seu registro. Não será necessário preencher o formulário novamente.","Inserisci l'email con cui hai iniziato la tua registrazione. Non dovrai compilare di nuovo il modulo.")}
          </p>
        </div>
        <FRow label={T("Correo electrónico","Email address","Adresse e-mail","E-Mail-Adresse","E-mail","Indirizzo email")}>
          <Input type="email" value={email} onChange={setEmail}
            placeholder="usuario@correo.com"/>
        </FRow>
        {err&&(
          <p style={{color:"#F87171",fontFamily:"'Crimson Text',serif",
            fontSize:14,marginBottom:12}}>⚠️ {err}</p>
        )}
        <button
          onClick={handleResume}
          disabled={!canGo||loading}
          style={{...BTN("pri"),width:"100%",justifyContent:"center",
            opacity:canGo&&!loading?1:0.4,
            cursor:canGo&&!loading?"pointer":"not-allowed",
            marginBottom:12}}>
          {loading
            ? T("Buscando…","Searching…","Recherche…","Wird gesucht…","Buscando…","Ricerca in corso…")
            : T("Continuar al pago","Continue to payment","Continuer vers le paiement","Weiter zur Zahlung","Continuar para o pagamento","Continua al pagamento")} →
        </button>
        <button onClick={onBack}
          style={{...BTN("sec"),width:"100%",justifyContent:"center"}}>
          ← {T("Regresar","Back","Retour","Zurück","Voltar","Indietro")}
        </button>
      </div>
    </div>
  );
}

// LoginModal → ./components/LoginModal.jsx (diferido con React.lazy).

// ─── WELCOME MODAL ─────────────────────────────────────────────────
// ─── CARRUSEL DE IMÁGENES DEL MODAL DE BIENVENIDA (fundido cruzado, 2s) ──
function WelcomeImageCarousel({images}){
  const [idx,setIdx]=useState(0);
  useEffect(()=>{
    const t=setInterval(()=>setIdx(i=>(i+1)%images.length),2000);
    return()=>clearInterval(t);
  },[images.length]);
  return(
    <div style={{position:"relative",width:"100%",height:170,borderRadius:12,
      overflow:"hidden",border:`1px solid ${C.border}`,boxShadow:"var(--c-cardShadow)",
      marginBottom:14}}>
      {images.map((src,i)=>(
        <img key={src} src={src} alt=""
          style={{
            position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",
            opacity:i===idx?1:0,transition:"opacity 1s ease",display:"block",
          }}/>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  WelcomeModal — TOUR de tarjetas. Cada punto es una tarjeta con una escena
//  animada por CSS (temática). Navegación: flechas (escritorio) + swipe (móvil)
//  + puntitos. Botón "Omitir" → Registrarme. Botones inferiores siempre fijos.
// ═══════════════════════════════════════════════════════════════════════════

// Escenas animadas por CSS, una por tarjeta. Ligeras, sin imágenes ni video.
// Escenas del tour: si existe un video para la escena lo reproduce (MP4+WebM);
// si el video no carga, cae automáticamente a la escena animada por CSS.
function TourScene({tipo,video,webm,poster}){
  const [videoFallo,setVideoFallo]=useState(false);
  // Escenas con video disponible en /tour/<escena>.(mp4|webm)
  const CON_VIDEO=["bienvenida","biblia","sacerdotes","ia","documentos","avatares","comunidad","muestra"];
  // Prioridad: lo que venga de la BD (editable desde el panel) y, si no hay,
  // la convención /tour/<escena>.(webm|mp4) de siempre.
  const srcWebm = webm || (CON_VIDEO.includes(tipo) ? `/tour/${tipo}.webm` : null);
  const srcMp4  = video || (CON_VIDEO.includes(tipo) ? `/tour/${tipo}.mp4`  : null);
  // Póster: imagen ligera (~20 KB) que se pinta de inmediato mientras el video
  // se descarga. Mejora mucho el LCP: sin él, el hueco queda vacío hasta que
  // llega el primer fotograma del video (~250 KB).
  const srcPoster = poster || (CON_VIDEO.includes(tipo) ? `/tour/${tipo}.webp` : null);
  if((srcWebm||srcMp4) && !videoFallo){
    return(
      <div style={{width:"100%",aspectRatio:"640 / 373",position:"relative",overflow:"hidden",
        borderRadius:14,marginBottom:4,border:"1px solid rgba(200,169,81,0.22)",
        background:"rgba(6,13,24,0.4)"}}>
        <video autoPlay loop muted playsInline preload="metadata" poster={srcPoster||undefined}
          onError={()=>setVideoFallo(true)}
          style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}>
          {srcWebm&&<source src={srcWebm} type="video/webm"/>}
          {srcMp4&&<source src={srcMp4} type="video/mp4"/>}
        </video>
      </div>
    );
  }
  const S={width:"100%",height:150,position:"relative",overflow:"hidden",
    borderRadius:14,marginBottom:4,
    background:"radial-gradient(120% 100% at 50% 0%, rgba(200,169,81,0.14), rgba(6,13,24,0.25))",
    border:"1px solid rgba(200,169,81,0.22)"};
  const common=(
    <style>{`
      @keyframes tFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
      @keyframes tFloat2{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
      @keyframes tPulse{0%,100%{opacity:.35;transform:scale(.9)}50%{opacity:.85;transform:scale(1.08)}}
      /* tGlow (animación de filter) eliminada: no se puede componer y Lighthouse
         la penaliza. Se usa un drop-shadow estático en .tbig en su lugar. */
      @keyframes tSpin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
      @keyframes tRise{0%{transform:translateY(12px);opacity:0}40%,100%{transform:translateY(0);opacity:1}}
      @keyframes tSweep{0%{transform:translateX(-120%)}100%{transform:translateX(120%)}}
      @keyframes tOrbit{from{transform:rotate(0) translateX(34px) rotate(0)}to{transform:rotate(360deg) translateX(34px) rotate(-360deg)}}
      @keyframes tBlink{0%,100%{opacity:.25}50%{opacity:1}}
      .tstar{position:absolute;color:#E5C97A;animation:tBlink 2.4s ease-in-out infinite}
      .tbig{font-size:52px;animation:tFloat 3.6s ease-in-out infinite;filter:drop-shadow(0 0 11px rgba(200,169,81,.8))}
    `}</style>
  );
  const center={position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"};
  const scenes={
    // 1 · Bienvenida / neuropedagogía base
    bienvenida:(<div style={S}>{common}
      <div style={center}><span className="tbig">✝️</span></div>
      <span className="tstar" style={{top:18,left:"18%",fontSize:12,animationDelay:".1s"}}>✦</span>
      <span className="tstar" style={{top:30,right:"20%",fontSize:16,animationDelay:".7s"}}>✦</span>
      <span className="tstar" style={{bottom:22,left:"28%",fontSize:10,animationDelay:"1.2s"}}>✦</span>
      <span className="tstar" style={{bottom:30,right:"26%",fontSize:13,animationDelay:"1.6s"}}>✦</span>
    </div>),
    // 2 · Institución / iglesia
    institucion:(<div style={S}>{common}
      <div style={center}><span className="tbig" style={{animationDelay:".2s"}}>⛪</span></div>
      <div style={{position:"absolute",bottom:0,left:0,right:0,height:40,
        background:"linear-gradient(0deg, rgba(200,169,81,.18), transparent)"}}/>
      <span className="tstar" style={{top:24,left:"22%",fontSize:12}}>✦</span>
      <span className="tstar" style={{top:20,right:"24%",fontSize:12,animationDelay:"1s"}}>✦</span>
    </div>),
    // 3 · Biblia / Escritura
    biblia:(<div style={S}>{common}
      <div style={center}><span className="tbig" style={{animationDelay:".1s"}}>📖</span></div>
      <div style={{position:"absolute",top:0,left:0,right:0,height:"100%",
        background:"linear-gradient(105deg, transparent 40%, rgba(229,201,122,.28) 50%, transparent 60%)",
        animation:"tSweep 4s ease-in-out infinite"}}/>
    </div>),
    // 4 · Dirección sacerdotal
    sacerdotes:(<div style={S}>{common}
      <div style={center}><span className="tbig" style={{animationDelay:".3s"}}>✝️</span></div>
      <span style={{position:"absolute",left:"26%",top:"50%",transform:"translateY(-50%)",fontSize:26,animation:"tFloat2 3s ease-in-out infinite"}}>🕊️</span>
      <span style={{position:"absolute",right:"26%",top:"50%",transform:"translateY(-50%)",fontSize:26,animation:"tFloat2 3s ease-in-out infinite .8s"}}>🕊️</span>
    </div>),
    // 5 · IA Magisterium
    ia:(<div style={S}>{common}
      <div style={center}><span className="tbig" style={{animationDelay:".15s"}}>✨</span></div>
      <span style={{position:"absolute",top:"50%",left:"50%",width:8,height:8,marginLeft:-4,marginTop:-4,
        borderRadius:"50%",background:"#E5C97A",animation:"tOrbit 5s linear infinite"}}/>
      <span style={{position:"absolute",top:"50%",left:"50%",width:6,height:6,marginLeft:-3,marginTop:-3,
        borderRadius:"50%",background:"#C8A951",animation:"tOrbit 3.4s linear infinite reverse"}}/>
    </div>),
    // 6 · Catecismo y Biblia digitales
    documentos:(<div style={S}>{common}
      <div style={center}>
        <span style={{fontSize:44,animation:"tFloat 3.4s ease-in-out infinite",marginRight:-8}}>📕</span>
        <span style={{fontSize:52,animation:"tFloat 3.4s ease-in-out infinite .5s",zIndex:2,filter:"drop-shadow(0 0 10px rgba(200,169,81,.7))"}}>📖</span>
      </div>
    </div>),
    // 7 · Global / aula mundial
    global:(<div style={S}>{common}
      <div style={center}><span className="tbig" style={{animationDelay:".2s"}}>🌎</span></div>
      <span className="tstar" style={{top:20,left:"20%",fontSize:12}}>✦</span>
      <span className="tstar" style={{bottom:24,right:"22%",fontSize:14,animationDelay:"1.1s"}}>✦</span>
    </div>),
    // 8 · Neuropedagogía / avatares bíblicos (NUEVA)
    avatares:(<div style={S}>{common}
      <div style={center}><span className="tbig" style={{animationDelay:".1s"}}>🧠</span></div>
      <span style={{position:"absolute",left:"20%",top:"32%",fontSize:24,animation:"tRise 3.2s ease-in-out infinite"}}>👤</span>
      <span style={{position:"absolute",right:"22%",top:"30%",fontSize:24,animation:"tRise 3.2s ease-in-out infinite .6s"}}>👤</span>
      <span style={{position:"absolute",left:"30%",bottom:"20%",fontSize:20,animation:"tRise 3.2s ease-in-out infinite 1.1s"}}>😇</span>
      <span style={{position:"absolute",right:"30%",bottom:"22%",fontSize:20,animation:"tRise 3.2s ease-in-out infinite 1.5s"}}>😇</span>
      <span className="tstar" style={{top:16,left:"48%",fontSize:12,animationDelay:".3s"}}>✦</span>
    </div>),
    // 9 · Comunidad / seguimiento pastoral (NUEVA)
    comunidad:(<div style={S}>{common}
      <div style={center}><span className="tbig" style={{animationDelay:".2s"}}>🤝</span></div>
      <span style={{position:"absolute",left:"22%",top:"52%",transform:"translateY(-50%)",fontSize:24,animation:"tFloat2 3s ease-in-out infinite"}}>👥</span>
      <span style={{position:"absolute",right:"22%",top:"52%",transform:"translateY(-50%)",fontSize:24,animation:"tFloat2 3s ease-in-out infinite .8s"}}>👥</span>
      <span className="tstar" style={{top:20,left:"26%",fontSize:12}}>✦</span>
      <span className="tstar" style={{bottom:24,right:"24%",fontSize:14,animationDelay:"1.1s"}}>✦</span>
    </div>),
    // 10 · Descarga de la app / video de muestra (video cargable desde el panel)
    muestra:(<div style={S}>{common}
      <div style={center}><span className="tbig" style={{animationDelay:".1s"}}>📲</span></div>
      <span style={{position:"absolute",left:"24%",top:"50%",transform:"translateY(-50%)",fontSize:26,animation:"tFloat2 3s ease-in-out infinite"}}>▶️</span>
      <span style={{position:"absolute",right:"24%",top:"50%",transform:"translateY(-50%)",fontSize:24,animation:"tFloat2 3s ease-in-out infinite .8s"}}>⬇️</span>
      <span className="tstar" style={{top:18,left:"46%",fontSize:12,animationDelay:".4s"}}>✦</span>
    </div>),
  };
  return scenes[tipo]||scenes.bienvenida;
}

function WelcomeModal({onContinue,onLogin}){
  // Tarjetas por defecto (respaldo). El panel de administración puede
  // sobrescribir videos y textos vía la tabla `tour_tarjetas`; si la BD no
  // responde o un campo viene vacío, se usa lo que está aquí.
  const cardsBase=[
    {scene:"bienvenida", t:T("Bienvenidos a la primera plataforma para formación sacramental católica basada en Neuropedagogía Catequética.","Welcome to the first Catholic sacramental formation platform based on catechetical neuropedagogy.","Bienvenue sur la première plateforme de formation sacramentelle catholique fondée sur la Neuropédagogie Catéchétique.","Willkommen auf der ersten katholischen Plattform für Sakramentenbildung auf Grundlage der Katechetischen Neuropädagogik.","Bem-vindos à primeira plataforma de formação sacramental católica baseada na Neuropedagogia Catequética.","Benvenuti nella prima piattaforma per la formazione sacramentale cattolica basata sulla Neuropedagogia Catechetica.")},
    {scene:"biblia", t:T("Basada completamente en la Revelación Bíblica, la Tradición y el Magisterio de la Iglesia Católica.","Fully based on Revelation, Tradition, and the Magisterium of the Catholic Church.","Entièrement fondée sur la Révélation biblique, la Tradition et le Magistère de l'Église catholique.","Vollständig gegründet auf der biblischen Offenbarung, der Tradition und dem Lehramt der katholischen Kirche.","Totalmente baseada na Revelação Bíblica, na Tradição e no Magistério da Igreja Católica.","Interamente basata sulla Rivelazione biblica, sulla Tradizione e sul Magistero della Chiesa Cattolica.")},
    {scene:"sacerdotes", t:T("En colaboración con diócesis, parroquias e instituciones católicas de todo el mundo.","In collaboration with dioceses, parishes, and Catholic institutions around the world.","En collaboration avec des diocèses, des paroisses et des institutions catholiques du monde entier.","In Zusammenarbeit mit Diözesen, Pfarreien und katholischen Einrichtungen aus aller Welt.","Em colaboração com dioceses, paróquias e instituições católicas de todo o mundo.","In collaborazione con diocesi, parrocchie e istituzioni cattoliche di tutto il mondo.")},
    {scene:"ia", t:T("Con el soporte y acervo digital de la AI Magisterium, la primera Inteligencia Artificial especializada en la fe católica.","With the support and digital archive of Magisterium AI, the first Artificial Intelligence specialized in the Catholic faith.","Avec le soutien et le fonds documentaire numérique de l'IA Magisterium, la première Intelligence Artificielle spécialisée dans la foi catholique.","Mit der Unterstützung und dem digitalen Bestand von Magisterium AI, der ersten auf den katholischen Glauben spezialisierten Künstlichen Intelligenz.","Com o apoio e o acervo digital da IA Magisterium, a primeira Inteligência Artificial especializada na fé católica.","Con il supporto e il patrimonio digitale dell'IA Magisterium, la prima Intelligenza Artificiale specializzata nella fede cattolica.")},
    {scene:"documentos", t:T("Y con acceso directo a las versiones digitales del Catecismo de la Iglesia Católica y la Biblia autorizadas por la Santa Sede.","And with direct access to the digital versions of the Catechism of the Catholic Church and the Bible authorized by the Holy See.","Et avec un accès direct aux versions numériques du Catéchisme de l'Église catholique et de la Bible autorisées par le Saint-Siège.","Und mit direktem Zugang zu den vom Heiligen Stuhl autorisierten digitalen Fassungen des Katechismus der katholischen Kirche und der Bibel.","E com acesso direto às versões digitais do Catecismo da Igreja Católica e da Bíblia autorizadas pela Santa Sé.","E con accesso diretto alle versioni digitali del Catechismo della Chiesa Cattolica e della Bibbia autorizzate dalla Santa Sede.")},
    // NUEVA tarjeta · neuropedagogía con avatares
    {scene:"avatares", t:T("Cada lección se convierte en una experiencia viva, guiada por avatares de personajes bíblicos y santos de la Iglesia Católica: una manera única de formarte en la fe.","Each lesson becomes a living experience, guided by avatars of biblical figures and saints of the Catholic Church: a unique way to grow in faith.","Chaque leçon devient une expérience vivante, guidée par des avatars de personnages bibliques et de saints de l'Église catholique : une façon unique de vous former dans la foi.","Jede Lektion wird zu einer lebendigen Erfahrung, begleitet von Avataren biblischer Gestalten und Heiliger der katholischen Kirche – ein einzigartiger Weg, im Glauben zu wachsen.","Cada lição torna-se uma experiência viva, guiada por avatares de personagens bíblicos e santos da Igreja Católica: uma forma única de crescer na fé.","Ogni lezione diventa un'esperienza viva, guidata da avatar di personaggi biblici e santi della Chiesa Cattolica: un modo unico per formarti nella fede.")},
    // NUEVA tarjeta final · comunidad y seguimiento pastoral
    {scene:"comunidad", t:T("Intégrate a una comunidad de formación sacramental. Recibirás seguimiento pastoral personalizado y en grupos donde profundizaremos las verdades de nuestra fe.","Join a community of sacramental formation. You will receive personalized pastoral guidance, individually and in groups, where we will deepen the truths of our faith.","Rejoignez une communauté de formation sacramentelle. Vous bénéficierez d'un accompagnement pastoral personnalisé et en groupe, où nous approfondirons les vérités de notre foi.","Werde Teil einer Gemeinschaft der Sakramentenbildung. Du erhältst eine persönliche und gemeinschaftliche seelsorgliche Begleitung, in der wir die Wahrheiten unseres Glaubens vertiefen.","Integre-se a uma comunidade de formação sacramental. Você receberá acompanhamento pastoral personalizado e em grupos, onde aprofundaremos as verdades da nossa fé.","Unisciti a una comunità di formazione sacramentale. Riceverai un accompagnamento pastorale personalizzato e di gruppo, in cui approfondiremo le verità della nostra fede.")},
    // Tarjeta final · video de bienvenida y muestra del curso.
    // El video se carga desde el panel (tabla tour_tarjetas, clave "muestra").
    {scene:"muestra", t:T("Descarga la aplicación y lleva tu formación católica a todos lados.","Download the app and take your Catholic formation everywhere.","Téléchargez l'application et emportez votre formation catholique partout.","Lade die App herunter und nimm deine katholische Bildung überallhin mit.","Baixe o aplicativo e leve sua formação católica para todos os lugares.","Scarica l'app e porta la tua formazione cattolica ovunque.")},
  ];

  // Tarjetas efectivas: las de la BD (si las hay) sobre las de respaldo.
  const [cards,setCards]=useState(cardsBase);
  useEffect(()=>{
    let vivo=true;
    (async()=>{
      try{
        const {data,error}=await supabase.rpc("obtener_tour");
        if(error||!Array.isArray(data)||!data.length||!vivo)return;
        const porClave={};
        cardsBase.forEach(c=>{porClave[c.scene]=c;});
        const fusion=data.map(r=>{
          const base=porClave[r.clave]||{};
          const txt=PICK({es:r.texto_es,en:r.texto_en,fr:r.texto_fr,
                          de:r.texto_de,pt:r.texto_pt,it:r.texto_it});
          return {
            scene: r.clave,
            t: (txt&&txt.trim())?txt:(base.t||""),
            video: r.video_url||null,
            webm:  r.video_webm_url||null,
            poster:r.poster_url||null,
          };
        }).filter(c=>c.t);           // descarta tarjetas sin texto utilizable
        if(vivo&&fusion.length)setCards(fusion);
      }catch{/* sin conexión: se queda el respaldo */}
    })();
    return()=>{vivo=false;};
  },[]);

  const [i,setI]=useState(0);
  const n=cards.length;
  // Índice seguro: la BD puede devolver más o menos tarjetas que el respaldo.
  const cur=cards[Math.min(i,Math.max(0,n-1))]||cardsBase[0];
  const go=(d)=>setI(p=>Math.max(0,Math.min(n-1,p+d)));
  const touch=useRef(null);
  const onTouchStart=e=>{touch.current=e.touches[0].clientX;};
  const onTouchEnd=e=>{
    if(touch.current==null)return;
    const dx=e.changedTouches[0].clientX-touch.current;
    if(Math.abs(dx)>45){ if(dx<0)go(1); else go(-1); }
    touch.current=null;
  };
  useEffect(()=>{
    const h=(e)=>{ if(e.key==="ArrowRight")go(1); if(e.key==="ArrowLeft")go(-1); };
    window.addEventListener("keydown",h); return()=>window.removeEventListener("keydown",h);
  },[n]);
  const [desktop,setDesktop]=useState(typeof window!=="undefined"&&window.innerWidth>=900);
  useEffect(()=>{ const h=()=>setDesktop(window.innerWidth>=900); window.addEventListener("resize",h); return()=>window.removeEventListener("resize",h); },[]);
  const arrowBtn=(dir,disabled)=>(
    <button aria-label={dir<0?"Anterior":"Siguiente"} onClick={()=>go(dir)} disabled={disabled}
      style={{width:38,height:38,borderRadius:"50%",flexShrink:0,cursor:disabled?"default":"pointer",
        border:`1px solid ${disabled?C.borderD:C.gold}`,background:disabled?"transparent":`${C.gold}18`,
        color:disabled?C.ivoryM:C.gold,fontSize:18,opacity:disabled?0.35:1,transition:"all .2s"}}>
      {dir<0?"‹":"›"}
    </button>
  );
  const branding=(
    <div style={{textAlign:"center"}}>
      <img src="/catecumenlogo.webp" alt="Logo Catecumen" width="300" height="100"
        style={{maxWidth:230,width:"100%",height:"auto",margin:"0 auto 2px",
          filter:"drop-shadow(0 2px 10px rgba(200,169,81,0.55)) drop-shadow(0 0 2px rgba(120,90,20,0.35))"}}/>
      <p style={{fontStyle:"italic",color:C.ivoryM,fontSize:16,marginTop:-2,marginBottom:0,letterSpacing:"0.04em"}}>
        {T("El Aula Global de la Catequesis","The Global Classroom of Catechesis","La Salle de Classe Mondiale de la Catéchèse","Das globale Klassenzimmer der Katechese","A Sala de Aula Global da Catequese","L'Aula Globale della Catechesi")}
      </p>
    </div>
  );

  const botones=(
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {desktop?(
        <>
          <button onClick={onContinue} style={{...BTN("pri"),width:"100%",justifyContent:"center",fontSize:15}}>
            ✝️ {T("Registrarme","Register","M'inscrire","Registrieren","Registrar-me","Registrati")}
          </button>
          <button onClick={onLogin} style={{width:"100%",justifyContent:"center",fontSize:14,cursor:"pointer",
            display:"inline-flex",alignItems:"center",gap:8,fontFamily:"'Cinzel',serif",fontWeight:700,letterSpacing:"0.05em",
            background:"rgba(70,120,190,0.18)",color:C.ivory,border:"1px solid rgba(70,120,190,0.55)",borderRadius:10,padding:"12px 14px"}}>
            🔑 {T("Iniciar sesión","Sign in","Se connecter","Anmelden","Entrar","Accedi")}
          </button>
        </>
      ):(
        <div style={{display:"flex",gap:10}}>
          <button onClick={onContinue} style={{...BTN("pri"),flex:"1.7 1 0",justifyContent:"center",fontSize:15}}>
            ✝️ {T("Registrarme","Register","M'inscrire","Registrieren","Registrar-me","Registrati")}
          </button>
          <button onClick={onLogin} style={{flex:"1 1 0",justifyContent:"center",fontSize:14,cursor:"pointer",
            display:"inline-flex",alignItems:"center",gap:8,fontFamily:"'Cinzel',serif",fontWeight:700,letterSpacing:"0.05em",
            background:"rgba(70,120,190,0.18)",color:C.ivory,border:"1px solid rgba(70,120,190,0.55)",borderRadius:10,padding:"12px 14px"}}>
            🔑 {T("Iniciar sesión","Sign in","Se connecter","Anmelden","Entrar","Accedi")}
          </button>
        </div>
      )}
      <DirectorioButton estilo={{width:"100%"}} tono="green"/>
    </div>
  );

  const tour=(
    <div style={{display:"flex",alignItems:"center",gap:8,width:"100%"}}>
      <div style={{display:desktop?"block":"none"}}>{arrowBtn(-1,i===0)}</div>
      <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
        style={{flex:1,minHeight:270,background:`linear-gradient(145deg,${C.card} 0%,rgba(200,169,81,0.06) 100%)`,
          border:`1px solid ${C.borderD}`,borderRadius:16,padding:"16px 18px 18px",
          display:"flex",flexDirection:"column",justifyContent:"flex-start"}}>
        <TourScene key={cur.scene} tipo={cur.scene} video={cur.video} webm={cur.webm} poster={cur.poster}/>
        <div style={{display:"flex",gap:9,alignItems:"flex-start",marginTop:12,textAlign:"left"}}>
          <span style={{color:C.gold,flexShrink:0,marginTop:2,fontSize:16}}>✦</span>
          <span style={{color:C.ivory,fontFamily:FONT_READ,fontSize:16.5,lineHeight:1.7}}>{cur.t}</span>
        </div>
      </div>
      <div style={{display:desktop?"block":"none"}}>{arrowBtn(1,i===n-1)}</div>
    </div>
  );

  const navegacion=(
    <>
      <div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:2,margin:"10px 0 4px"}}>
        {cards.map((_,k)=>(
          <button key={k} aria-label={`Ir a ${k+1}`} aria-current={k===i?"true":undefined} onClick={()=>setI(k)}
            style={{width:24,height:24,padding:0,border:"none",background:"none",cursor:"pointer",
              display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{width:k===i?22:8,height:8,borderRadius:99,display:"block",
              background:k===i?C.gold:`${C.gold}45`,transition:"all .25s"}}/>
          </button>
        ))}
      </div>
      <p style={{color:C.ivoryM,fontSize:12.5,marginBottom:4,textAlign:"center"}}>
        {i+1} / {n} · <span style={{opacity:.8}}>{T("desliza o usa las flechas","swipe or use arrows","glissez ou flèches","wischen oder Pfeile","deslize ou use as setas","scorri o usa le frecce")}</span>
      </p>
      {i<n-1&&(
        <button onClick={onContinue}
          style={{background:"none",border:"none",color:C.ivoryM,fontSize:13,cursor:"pointer",
            textDecoration:"underline",marginBottom:6,alignSelf:"center"}}>
          {T("Omitir presentación","Skip intro","Passer l'introduction","Einführung überspringen","Pular apresentação","Salta introduzione")}
        </button>
      )}
    </>
  );

  const conoceMas=(
    <p style={{marginTop:6,color:C.goldL,textAlign:"center",fontSize:14}}>
      {T("Conoce más en: ","Learn more at: ","En savoir plus sur : ","Mehr erfahren unter: ","Saiba mais em: ","Scopri di più su: ")}
      <a href="https://www.catecumen.com/info" target="_blank" rel="noreferrer" style={{color:C.gold}}>www.catecumen.com/info</a>
    </p>
  );

  return(
    <div style={OVERLAY}>
      <div style={{...MODAL, padding:0, maxWidth:desktop?1080:560, width:desktop?"min(1080px,96vw)":undefined,
        maxHeight:"92vh", display:"flex", flexDirection:"column", overflow:"hidden"}}>
        {desktop?(
          <div style={{display:"flex",flex:1,minHeight:0}}>
            {/* Izquierda: panel independiente de marca + acciones */}
            <div style={{flex:"0 0 380px",display:"flex",flexDirection:"column",justifyContent:"center",gap:22,
              padding:"28px 26px",borderRight:`1px solid ${C.gold}22`,background:"rgba(200,169,81,0.05)"}}>
              {branding}
              {botones}
            </div>
            {/* Derecha: presentación (tour) */}
            <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column",padding:"24px 28px",overflowY:"auto"}}>
              {tour}
              {navegacion}
              {conoceMas}
            </div>
          </div>
        ):(
          <div style={{padding:"32px 28px",display:"flex",flexDirection:"column",overflowY:"auto"}}>
            {branding}
            <div style={{height:12}}/>
            {tour}
            {navegacion}
            {conoceMas}
            <div style={{marginTop:14}}>{botones}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// Hook: etiquetas configurables por opción (ej. "Próximamente"), administradas
// desde el panel. Una opción con etiqueta ACTIVA queda además inhabilitada
// (no permite registrarse) hasta que el admin retira la etiqueta. Si la BD no
// responde, devuelve {} y todo funciona normal.
// useEtiquetasOpciones vive en ./hooks/useEtiquetasOpciones.js.

// ─── FILTER MODAL ──────────────────────────────────────────────────

// ─── SACRAMENTO SELECT MODAL ────────────────────────────────────────

// ─── ENCUADRE MODAL ────────────────────────────────────────────────
// EncuadreModal → ./components/EncuadreModal.jsx (diferido con React.lazy).

// ─── HELPERS DE FORMULARIO ─────────────────────────────────────────
// FRow, Input y PasswordInput → ./components/fields.jsx (importados arriba).


// PhoneField y CountrySelect viven en ./components/fields.jsx.


// pwdStrength vive en ./components/PasswordModal.jsx (su único consumidor).

// ─── REGISTRO CATECÚMENO / PAPÁS / PADRINO / CATEQUISTA ────────────

// ─── REGISTRO PARROQUIA ─────────────────────────────────────────────

// ─── REGISTRO DIÓCESIS ──────────────────────────────────────────────

// ─── PASSWORD MODAL ─────────────────────────────────────────────────

// ─── ALTA DE CUENTA Y PERFIL EN SUPABASE ──────────────────────────
// crearCuentaUsuario vive en ./components/PaymentModal.jsx (su único consumidor).

// ─── PAYMENT MODAL (Stripe Checkout vía Supabase Edge Function) ────
// ─── THANK YOU MODAL ───────────────────────────────────────────────

// ─── ORG THANK YOU (Parroquia / Diócesis) ─────────────────────────

// ─── SECTION COMPLETE MODAL ────────────────────────────────────────

// ─── VIDEO MODAL ───────────────────────────────────────────────────

// ─── EVAL MODAL ────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════
//  EncuestaVideoModal — encuesta de calidad OBLIGATORIA al terminar cada video,
//  antes de la evaluación. 4 parámetros (1–5 estrellas) + comentario opcional.
// ═══════════════════════════════════════════════════════════════════════════



// ─── RESULT MODAL ──────────────────────────────────────────────────

// ─── COURSE SECTION VIEW ───────────────────────────────────────────

// ─── CERTIFICATES MODAL ────────────────────────────────────────────

// ─── DASHBOARD ─────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════
//  MensajesTab — bandeja de mensajes del usuario con la administración.
//  Lee sus mensajes, los marca como leídos y permite responder.
// ═══════════════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════════════
//  AgendaTab — sesiones a las que el usuario fue invitado. Puede unirse,
//  confirmar asistencia o avisar que no asistirá (con justificación al admin).
// ════════════════════════════════════════════════════════════════════════════





// ─── REGISTRO CENTRO DE TRATAMIENTO DE ADICCIONES ────────────────


// ─── APP PRINCIPAL ─────────────────────────────────────────────────
// ─── SELECTOR DE TEMA (claro / oscuro / sistema) ───────────────────
// ─── SELECTOR DE IDIOMA (con bandera según país detectado) ─────────
function LanguageSwitcher(){
  const [open,setOpen]=useState(false);
  const currentCode=detectCountryFlag()||LANG_FLAGS[LANG]||null;
  return(
    <div style={{position:"relative"}}>
      <button
        onClick={()=>setOpen(o=>!o)}
        aria-label={T("Cambiar idioma","Change language","Changer de langue","Sprache ändern","Mudar idioma","Cambia lingua")}
        title={T("Cambiar idioma","Change language","Changer de langue","Sprache ändern","Mudar idioma","Cambia lingua")}
        style={{
          width:40,height:40,borderRadius:"50%",cursor:"pointer",
          background:"var(--c-card)",border:"1px solid var(--c-border)",
          display:"flex",alignItems:"center",justifyContent:"center",
          boxShadow:"0 4px 14px rgba(0,0,0,0.25)",
        }}><FlagImg code={currentCode} size={20}/></button>
      {open&&(
        <>
          <div onClick={()=>setOpen(false)} style={{position:"fixed",inset:0,zIndex:3000}}/>
          <div style={{
            position:"absolute",top:48,right:0,zIndex:3001,minWidth:190,
            background:"var(--c-card)",border:"1px solid var(--c-border)",borderRadius:12,
            padding:6,boxShadow:"var(--c-modalShadow)",
          }}>
            {SUPPORTED_LANGS.map(code=>(
              <button key={code} onClick={()=>{if(code!==LANG)setAppLanguage(code);setOpen(false);}}
                style={{
                  width:"100%",display:"flex",alignItems:"center",gap:10,
                  background:code===LANG?"rgba(200,169,81,0.14)":"transparent",
                  border:"none",borderRadius:8,padding:"9px 10px",cursor:"pointer",
                  color:"var(--c-ivory)",fontFamily:"'Crimson Text',serif",fontSize:14.5,
                  textAlign:"left",
                }}>
                <FlagImg code={LANG_FLAGS[code]} size={16}/>
                <span>{LANG_NAMES[code][LANG]||LANG_NAMES[code].es}</span>
                {code===LANG&&<span style={{marginLeft:"auto",color:"var(--c-gold)"}}>✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ThemeSwitcher({value,onChange}){
  const [open,setOpen]=useState(false);
  const OPTS=[
    {k:"light",ic:"☀️",es:"Claro",en:"Light",fr:"Clair",de:"Hell",pt:"Claro",it:"Chiaro"},
    {k:"dark", ic:"🌙",es:"Oscuro",en:"Dark",fr:"Sombre",de:"Dunkel",pt:"Escuro",it:"Scuro"},
    {k:"system",ic:"🖥️",es:"Sistema",en:"System",fr:"Système",de:"System",pt:"Sistema",it:"Sistema"},
  ];
  const current=OPTS.find(o=>o.k===value)||OPTS[2];
  return(
    <div style={{position:"relative"}}>
      <button
        onClick={()=>setOpen(o=>!o)}
        aria-label={T("Cambiar tema","Change theme","Changer de thème","Design ändern","Mudar tema","Cambia tema")}
        title={T("Cambiar tema","Change theme","Changer de thème","Design ändern","Mudar tema","Cambia tema")}
        style={{
          width:40,height:40,borderRadius:"50%",cursor:"pointer",
          background:"var(--c-card)",border:"1px solid var(--c-border)",
          color:"var(--c-gold)",fontSize:17,
          display:"flex",alignItems:"center",justifyContent:"center",
          boxShadow:"0 4px 14px rgba(0,0,0,0.25)",
        }}>{current.ic}</button>
      {open&&(
        <>
          <div onClick={()=>setOpen(false)} style={{position:"fixed",inset:0,zIndex:3000}}/>
          <div style={{
            position:"absolute",top:48,right:0,zIndex:3001,minWidth:150,
            background:"var(--c-card)",border:"1px solid var(--c-border)",borderRadius:12,
            padding:6,boxShadow:"0 12px 30px rgba(0,0,0,0.3)",
          }}>
            {OPTS.map(o=>(
              <button key={o.k} onClick={()=>{onChange(o.k);setOpen(false);}}
                style={{
                  width:"100%",display:"flex",alignItems:"center",gap:10,
                  background:o.k===value?"rgba(200,169,81,0.14)":"transparent",
                  border:"none",borderRadius:8,padding:"9px 10px",cursor:"pointer",
                  color:"var(--c-ivory)",fontFamily:"'Crimson Text',serif",fontSize:14.5,
                  textAlign:"left",
                }}>
                <span style={{fontSize:15}}>{o.ic}</span>
                <span>{T(o.es,o.en,o.fr,o.de,o.pt,o.it)}</span>
                {o.k===value&&<span style={{marginLeft:"auto",color:"var(--c-gold)"}}>✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── BOTÓN DE BIBLIOTECA (Catecismo + Biblia, Santa Sede) ──────────

// Ventana de validación de constancia (la abre el QR: /?validar=CODIGO).
// ValidarConstanciaModal → ./components/ValidarConstanciaModal.jsx (lazy).

// Botón "Consultar dudas" — abre la ventana de contacto (mismo diseño de soporte)
// para que el usuario escriba a admin@catecumen.com desde el área de estudio.

// ════════════════════════════════════════════════════════════════════════════
function InstallBar(){
  const [deferred,setDeferred]=useState(null);
  const [visible,setVisible]=useState(false);
  const [showIosHelp,setShowIosHelp]=useState(false);
  const [cerrada,setCerrada]=useState(false);
  const [yaInstalada,setYaInstalada]=useState(false); // detectada por getInstalledRelatedApps

  const isStandalone = typeof window!=="undefined" &&
    (window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone===true);
  const isIos = typeof navigator!=="undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
  const instalada = isStandalone || yaInstalada;

  useEffect(()=>{
    // Si el navegador soporta getInstalledRelatedApps, detecta la PWA instalada
    // AUNQUE se esté viendo desde el navegador (no solo en modo standalone).
    let cancelado=false;
    if(navigator.getInstalledRelatedApps){
      navigator.getInstalledRelatedApps()
        .then(apps=>{ if(!cancelado && apps && apps.length>0){ setYaInstalada(true); setVisible(false); } })
        .catch(()=>{});
    }
    return ()=>{ cancelado=true; };
  },[]);

  useEffect(()=>{
    if(instalada) return;
    const onPrompt=(e)=>{ e.preventDefault(); setDeferred(e); setVisible(true); };
    window.addEventListener("beforeinstallprompt",onPrompt);
    const onInstalled=()=>{ setVisible(false); setYaInstalada(true); };
    window.addEventListener("appinstalled",onInstalled);
    if(isIos) setVisible(true);
    return ()=>{ window.removeEventListener("beforeinstallprompt",onPrompt); window.removeEventListener("appinstalled",onInstalled); };
  },[instalada]);

  const barraActiva = !instalada && !cerrada && visible;
  useEffect(()=>{
    if(typeof document==="undefined") return;
    document.body.style.paddingBottom = barraActiva ? "56px" : "";
    document.documentElement.style.setProperty("--install-offset", barraActiva ? "56px" : "0px");
    return ()=>{ document.body.style.paddingBottom=""; document.documentElement.style.setProperty("--install-offset","0px"); };
  },[barraActiva]);

  if(instalada||cerrada||!visible) return null;

  const instalar=async()=>{
    if(isIos){ setShowIosHelp(true); return; }
    if(deferred){
      deferred.prompt();
      try{ await deferred.userChoice; }catch{}
      setDeferred(null); setVisible(false);
    }else{
      setShowIosHelp(true);
    }
  };

  // Se renderiza con createPortal directamente en <body>: así ningún contenedor
  // de la app (con transform, filtros o su propio z-index) puede taparlo ni
  // bloquear sus clics. paddingBottom con safe-area para móviles con barra.
  return createPortal(
    <>
      <div style={{
        position:"fixed", left:0, right:0, bottom:0, zIndex:1100,
        background:"linear-gradient(180deg,#12253F,#0A1626)",
        borderTop:`2px solid ${C.gold}`,
        display:"flex", alignItems:"center", justifyContent:"center", gap:12,
        padding:"10px 14px", paddingBottom:"calc(10px + env(safe-area-inset-bottom,0px))",
        boxShadow:"0 -6px 24px rgba(0,0,0,0.55)", flexWrap:"wrap",
        pointerEvents:"auto"}}>
        <span style={{fontSize:20}}>📲</span>
        <span style={{color:"#F0EAD6",fontFamily:"'Crimson Text',serif",fontSize:14.5,flex:"0 1 auto"}}>
          {T("Instala Catecumen en tu dispositivo","Install Catecumen on your device","Installez Catecumen sur votre appareil","Installiere Catecumen auf deinem Gerät","Instale o Catecumen no seu dispositivo","Installa Catecumen sul tuo dispositivo")}
        </span>
        <button onClick={instalar} style={{...BTN("pri"),fontSize:12,padding:"7px 16px"}}>
          {T("Descargar aplicación","Download app","Télécharger l'app","App herunterladen","Baixar aplicativo","Scarica app")}
        </button>
        <button onClick={()=>setCerrada(true)} aria-label="cerrar"
          style={{background:"none",border:"none",color:"#C9BEA3",fontSize:20,cursor:"pointer",lineHeight:1,padding:"0 4px"}}>×</button>
      </div>

      {showIosHelp&&(
        <div style={{...OVERLAY,zIndex:1200}} onClick={()=>setShowIosHelp(false)}>
          <div style={{...MODAL,maxWidth:400,textAlign:"center"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:34,marginBottom:8}}>📲</div>
            <h2 style={{fontFamily:"'Cinzel',serif",color:C.gold,fontSize:18,marginBottom:12}}>
              {T("Cómo instalar la app","How to install the app","Comment installer l'app","App installieren","Como instalar o app","Come installare l'app")}
            </h2>
            <div style={{color:C.ivory,fontFamily:"'Crimson Text',serif",fontSize:15,lineHeight:1.7,textAlign:"left"}}>
              {isIos ? (
                <ol style={{paddingLeft:20,margin:0}}>
                  <li>{T("Toca el botón Compartir en Safari.","Tap the Share button in Safari.","Touchez le bouton Partager dans Safari.","Tippe in Safari auf Teilen.","Toque no botão Compartilhar no Safari.","Tocca il pulsante Condividi in Safari.")}</li>
                  <li>{T("Elige «Añadir a pantalla de inicio».","Choose \"Add to Home Screen\".","Choisissez « Sur l'écran d'accueil ».","Wähle „Zum Home-Bildschirm“.","Escolha \"Adicionar à Tela de Início\".","Scegli \"Aggiungi a Home\".")}</li>
                  <li>{T("Confirma tocando «Añadir».","Confirm by tapping \"Add\".","Confirmez avec « Ajouter ».","Bestätige mit „Hinzufügen“.","Confirme tocando \"Adicionar\".","Conferma toccando \"Aggiungi\".")}</li>
                </ol>
              ) : (
                <ol style={{paddingLeft:20,margin:0}}>
                  <li>{T("Abre el menú del navegador (⋮).","Open the browser menu (⋮).","Ouvrez le menu du navigateur (⋮).","Öffne das Browser-Menü (⋮).","Abra o menu do navegador (⋮).","Apri il menu del browser (⋮).")}</li>
                  <li>{T("Elige «Instalar aplicación» o «Añadir a pantalla de inicio».","Choose \"Install app\" or \"Add to Home screen\".","Choisissez « Installer l'application ».","Wähle „App installieren“.","Escolha \"Instalar aplicativo\".","Scegli \"Installa app\".")}</li>
                </ol>
              )}
            </div>
            <button onClick={()=>setShowIosHelp(false)} style={{...BTN("pri"),marginTop:16}}>
              {T("Entendido","Got it","Compris","Verstanden","Entendi","Capito")}
            </button>
          </div>
        </div>
      )}
    </>
  , document.body);
}

export default function App(){
  // Arranca directo en el tour. La "intro" que ve el usuario es la pantalla de
  // carga con el monograma y la barra (#cat-splash en index.html), que React
  // reemplaza al montar. Se eliminó el video intro pesado (catecumenvideo.mp4,
  // 2.2 MB): era el recurso más lento del arranque.
  const [phase,setPhase]=useState("welcome");
  const [cuentaSuspendida,setCuentaSuspendida]=useState(null); // {motivo} si la cuenta está suspendida/eliminada
  const [msgNoLeidos,setMsgNoLeidos]=useState(0); // contador para la campana flotante
  const [dashTab,setDashTab]=useState(null); // pestaña inicial al abrir el dashboard (p.ej. "mensajes")
  // video|welcome|filter|sacSelect|encuadre|register|password|payment|thankYou|course|orgThankYou
  const [userType,setUserType]=useState(null);
  const [selectedSacs,setSelectedSacs]=useState([]);
  const [marriage,setMarriage]=useState(null);
  const [encuadreKey,setEncuadreKey]=useState(null);
  const [formData,setFormData]=useState({});
  const [sequence,setSequence]=useState([]);
  const [seqIdx,setSeqIdx]=useState(0);
  const [progress,setProgress]=useState({}); // {secId:{vidId:{visto,passed,score}}}
  const [bridge,setBridge]=useState(null);   // puente frontend↔BD (Parte B)
  // Modo preinscripción (ajuste global editable desde el panel). Si `activa`,
  // el flujo de alumno termina en "reserva sin costo" en vez de pago.
  const [preinsc,setPreinsc]=useState({activa:false,mensaje:null});
  const [conversion,setConversion]=useState(null); // {usuarioId} al convertir un preinscrito
  useEffect(()=>{(async()=>{
    try{ const {data}=await supabase.rpc("obtener_ajuste",{p_clave:"preinscripcion"});
      if(data) setPreinsc({activa:!!data.activa, mensaje:data.mensaje||null});
    }catch(e){ console.error("obtener_ajuste:",e); }
  })();},[]);
  const [insBySec,setInsBySec]=useState({}); // {secId: inscripcion_id} (Parte B)
  const [activeVideo,setActiveVideo]=useState(null); // {secId,vid}
  const [activeEval,setActiveEval]=useState(null);
  const [encuestasHechas,setEncuestasHechas]=useState(()=>new Set()); // claves "secId:vidId" ya encuestadas
  const [activeEncuesta,setActiveEncuesta]=useState(null); // {secId,vid} — encuesta previa a la evaluación
  const [lastResult,setLastResult]=useState(null);
  const [showResult,setShowResult]=useState(false);
  const [showSecComplete,setShowSecComplete]=useState(false);
  const [completedSecId,setCompletedSecId]=useState(null);
  const [showCerts,setShowCerts]=useState(false);
  const [showDash,setShowDash]=useState(false);
  const [goldRain,setGoldRain]=useState(false);
  const [starBurst,setStarBurst]=useState(false); // lluvia de estrellas (pago exitoso / evaluación aprobada)
  const [orgType,setOrgType]=useState(null);

  // ─── Tema: claro / oscuro / sistema ───
  const [themePref,setThemePref]=useState(()=>{
    try{return localStorage.getItem("catecumen_theme")||"light";}catch{return "light";}
  });
  const [systemDark,setSystemDark]=useState(()=>{
    try{return window.matchMedia("(prefers-color-scheme: dark)").matches;}catch{return true;}
  });
  useEffect(()=>{
    let mq;
    try{
      mq=window.matchMedia("(prefers-color-scheme: dark)");
      const onChange=(e)=>setSystemDark(e.matches);
      mq.addEventListener?mq.addEventListener("change",onChange):mq.addListener(onChange);
      return()=>{mq.removeEventListener?mq.removeEventListener("change",onChange):mq.removeListener(onChange);};
    }catch{}
  },[]);
  const effectiveTheme=themePref==="system"?(systemDark?"dark":"light"):themePref;
  useEffect(()=>{
    document.documentElement.setAttribute("data-theme",effectiveTheme);
    try{localStorage.setItem("catecumen_theme",themePref);}catch{}
  },[themePref,effectiveTheme]);

  // Contador de mensajes no leídos (campana): consulta al entrar al curso y cada 60s.
  useEffect(()=>{
    if(phase!=="course") return;
    let vivo=true;
    const consultar=async()=>{
      try{
        const {data}=await supabase.rpc("mis_mensajes_no_leidos");
        if(vivo)setMsgNoLeidos(typeof data==="number"?data:0);
      }catch(e){ /* silencioso */ }
    };
    consultar();
    const t=setInterval(consultar,60000);
    return()=>{ vivo=false; clearInterval(t); };
  },[phase]);

  // Back button warning
  useEffect(()=>{
    const handleBeforeUnload=e=>{
      if(appNav.bypassUnload) return; // redirección intencional al pago
      if(phase==="welcome"||phase==="orgThankYou") return;
      e.preventDefault();
      e.returnValue=T("¿Deseas abandonar la plataforma? Tu progreso podría no guardarse.","Do you want to leave the platform? Your progress may not be saved.","Voulez-vous quitter la plateforme ? Votre progression pourrait ne pas être enregistrée.","Möchten Sie die Plattform verlassen? Ihr Fortschritt wird möglicherweise nicht gespeichert.","Deseja sair da plataforma? Seu progresso pode não ser salvo.","Vuoi lasciare la piattaforma? I tuoi progressi potrebbero non essere salvati.");
      return e.returnValue;
    };
    const handlePopState=e=>{
      if(appNav.bypassUnload) return;
      if(phase==="welcome"||phase==="orgThankYou") return;
      const confirm=window.confirm(T("¿Deseas salir de la plataforma? Tu progreso podría no guardarse.","Do you want to leave the platform? Your progress may not be saved.","Voulez-vous quitter la plateforme ? Votre progression pourrait ne pas être enregistrée.","Möchten Sie die Plattform verlassen? Ihr Fortschritt wird möglicherweise nicht gespeichert.","Deseja sair da plataforma? Seu progresso pode não ser salvo.","Vuoi uscire dalla piattaforma? I tuoi progressi potrebbero non essere salvati."));
      if(!confirm){window.history.pushState(null,"",window.location.href);}
    };
    window.addEventListener("beforeunload",handleBeforeUnload);
    window.addEventListener("popstate",handlePopState);
    window.history.pushState(null,"",window.location.href);
    return()=>{
      window.removeEventListener("beforeunload",handleBeforeUnload);
      window.removeEventListener("popstate",handlePopState);
    };
  },[phase]);

  // ─── Retorno desde Stripe Checkout ───
  const [pagoRetorno,setPagoRetorno]=useState(()=>
    new URLSearchParams(window.location.search).get("pago"));
  const [pagoSessionId]=useState(()=>
    new URLSearchParams(window.location.search).get("session_id"));
  const [validarCodigo,setValidarCodigo]=useState(()=>
    new URLSearchParams(window.location.search).get("validar"));
  // Limpiar la URL SOLO DESPUÉS de haber leído AMBOS parámetros (antes se borraba
  // dentro del inicializador de pagoRetorno, lo que dejaba session_id en null y
  // rompía la verificación del pago).
  useEffect(()=>{
    if(pagoRetorno)window.history.replaceState({},"",window.location.pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);
  // "procesando" cubre tarjeta Y métodos de vale (OXXO/Boleto/Multibanco…) —
  // hay que preguntarle a Stripe el estado real antes de decidir qué mostrar.
  const [pagoEstadoReal,setPagoEstadoReal]=useState(null); // null=verificando | "paid" | "unpaid" | "error"
  // Lluvia de estrellas al confirmar el pago (fin del registro).
  useEffect(()=>{ if(pagoEstadoReal==="paid") setStarBurst(true); },[pagoEstadoReal]);
  // Apagar la lluvia de estrellas ~7 s después de encenderla.
  useEffect(()=>{
    if(!starBurst) return;
    const t=setTimeout(()=>setStarBurst(false),7000);
    return ()=>clearTimeout(t);
  },[starBurst]);
  useEffect(()=>{
    if(pagoRetorno!=="procesando"){return;}
    if(!pagoSessionId){setPagoEstadoReal("error");return;}
    let cancelado=false;
    (async()=>{
      // Reintentos para tolerar la CONDICIÓN DE CARRERA: al volver de Stripe la
      // cuenta puede tardar 1-4 s en quedar lista (latencia del webhook o de la
      // liquidación). Reintentamos hasta 5 veces (2 s c/u ≈ 10 s) antes de dar
      // el flujo por fallido. activar-pago es idempotente, así que reintentar
      // es seguro.
      const MAX=5, ESPERA=2000;
      for(let intento=0;intento<MAX&&!cancelado;intento++){
        try{
          const{data,error}=await supabase.functions.invoke("activar-pago",
            {body:{session_id:pagoSessionId}});
          if(!error&&data?.payment_status==="paid"){if(!cancelado)setPagoEstadoReal("paid");return;}
          if(!error&&data?.payment_status&&data.payment_status!=="paid"){
            // Pago asíncrono (OXXO/Boleto) aún sin liquidar: es un estado válido,
            // no un error → mostrar pantalla de "pendiente".
            if(!cancelado)setPagoEstadoReal("unpaid");return;
          }
          // error transitorio o sin payment_status → esperar y reintentar
        }catch{/* red/función caída → reintentar */}
        if(intento<MAX-1)await new Promise(r=>setTimeout(r,ESPERA));
      }
      if(!cancelado)setPagoEstadoReal("error");
    })();
    return ()=>{cancelado=true;};
  },[pagoRetorno,pagoSessionId]);

  // ─── Cuotas reales desde Supabase (sobrescribe el respaldo local) ───
  useEffect(()=>{(async()=>{
    try{
      const {data,error}=await supabase.from("cuotasporpais").select("*").eq("activo",true);
      if(error||!data?.length){console.error("Catecumen: usando cuotas de respaldo local",error);return;}
      data.forEach(r=>{ CUOTAS[r.pais]=cuotaFromRow(r); });
    }catch(e){console.error("Catecumen: usando cuotas de respaldo local",e);}
  })();},[]);

  // Helpers
  const currentSecId=sequence[seqIdx]||null;

  const markVideoWatched=(secId,vid)=>{
    setProgress(p=>{
      const sp=p[secId]||{};
      return{...p,[secId]:{...sp,[vid.id]:{...sp[vid.id],visto:true}}};
    });
    persistProgreso(secId,vid.id,{visto:true,fecha_inicio_vista:new Date().toISOString()});
  };

  const markEvalResult=(secId,vid,result)=>{
    if(result.passed) setStarBurst(true); // 🎉 lluvia de estrellas al aprobar
    setProgress(p=>{
      const sp=p[secId]||{};
      const newVp={...sp[vid.id],score:result.score,passed:result.passed,
        visto:result.passed?(sp[vid.id]?.visto||true):false};
      const newSp={...sp,[vid.id]:newVp};
      return{...p,[secId]:newSp};
    });
    // Persistir la aprobación (no bajamos `visto` en la BD si reprueba).
    persistProgreso(secId,vid.id, result.passed
      ? {aprobado:true, visto:true, fecha_aprobado:new Date().toISOString()}
      : {aprobado:false});
    // Registrar el INTENTO (aprobado o no) para el listado de Atención del panel.
    // Usa la tabla `intentos_evaluacion` existente, que enlaza por inscripcion_id.
    (async()=>{
      try{
        const videoUuid=bridge?.frontToUuid?.[secId]?.[vid.id];
        const insId=insBySec[secId];
        if(!videoUuid||!insId) return;
        await supabase.rpc("registrar_intento",{
          p_inscripcion_id:insId, p_video_id:videoUuid,
          p_aprobado:!!result.passed,
          p_puntaje:(typeof result.score==="number"?result.score:null),
          p_puntaje_maximo:(typeof result.total==="number"?result.total:null)});
      }catch(e){ console.error("registrar_intento:",e); }
    })();
  };

  const checkSectionComplete=(secId,updatedProgress)=>{
    const sec=SEC_META[secId];
    if(!sec) return false;
    return sec.videos.every(v=>updatedProgress?.[secId]?.[v.id]?.passed);
  };

  // Filter selection
  const handleFilterSelect=(uType)=>{
    setUserType(uType);
    if(uType==="catecumeno"){
      setOrgType(null); // limpiar flujo de organización previo
      setPhase("sacSelect");
    }
    else if(uType==="parroquia"||uType==="diocesis"||uType==="centroadiccion"||uType==="otro"){
      setOrgType(uType);
      setEncuadreKey(uType);
      setPhase("encuadre");
    } else {
      setOrgType(null); // limpiar flujo de organización previo
      setEncuadreKey(uType); // prebautismal | padrino | catequista
      setPhase("encuadre");
    }
  };

  const handleSacSelect=(sacs)=>{
    setSelectedSacs(sacs);
    const key=sacs.length>=3?"integral":
      sacs.length===2?"integral":sacs[0]||"bautismo";
    setEncuadreKey(key);
    setPhase("encuadre");
  };

  const handleEncuadreRegister=()=>{
    if(orgType==="parroquia"||orgType==="diocesis"){
      setPhase("register");
    } else {
      setPhase("register");
    }
  };

  const handleRegisterNext=(data)=>{
    setFormData(data);
    setPhase("password");
  };

  const handlePasswordNext=(pw)=>{
    setFormData(p=>({...p,password:pw}));
    setPhase("payment");
  };

  const handlePaymentSuccess=(info)=>{
    // Preinscripción: cuenta creada sin pago → pantalla de espera (no curso).
    if(info?.preinscrito){ setPhase("preinscritoEspera"); return; }
    if(orgType){setPhase("orgThankYou");return;}
    const regId=info?.registroId||genRegistrationId(formData.country||"XX",userType);
    setFormData(p=>({...p,registrationId:regId}));
    const seq=buildSeq(userType,selectedSacs);
    setSequence(seq);
    setSeqIdx(0);
    setPhase("thankYou");
  };

  const handleThankYouClose=()=>{
    setPhase("course");
  };

  // ─── PARTE A: al iniciar sesión, cargar el curso del usuario ────────────────
  // Sin esto, "course" quedaba en blanco porque `sequence` estaba vacío (solo se
  // llenaba durante el registro). Aquí leemos su fila en `usuarios`, construimos
  // formData + la secuencia de secciones con buildSeq, y entramos al curso.
  // ─── PARTE B: puente dinámico frontend ↔ BD ────────────────────────────────
  // Lee `sacramentos` y `videos` y construye el mapa por (slug, orden), sin
  // hardcodear UUIDs. slug de sacramento === secId del frontend; videos.orden
  // === el `o` de cada video en SEC_META. Devuelve:
  //   frontToUuid: {secId:{vidId: video_id_uuid}}   (para guardar progreso)
  //   uuidToFront: {video_id_uuid:{secId,vidId}}     (para leer progreso)
  //   slugToSacId: {slug: sacramento_id}             (para crear inscripciones)
  const loadBridge=async()=>{
    try{
      const [sacRes,vidRes]=await Promise.all([
        supabase.from("sacramentos").select("id,slug"),
        // Solo los videos del idioma activo del usuario (columna `idioma`).
        // Traemos también url_video para reproducir el video REAL cuando exista
        // (si no, el frontend usa el video de prueba local del idioma).
        supabase.from("videos").select("id,sacramento_id,orden,idioma,url_video").eq("idioma",LANG),
      ]);
      const sacs=sacRes.data, vids=vidRes.data;
      if(!sacs||!vids) return null;
      const slugToSacId={}, sacIdToSlug={};
      sacs.forEach(s=>{slugToSacId[s.slug]=s.id; sacIdToSlug[s.id]=s.slug;});
      const frontByOrden={};
      Object.keys(SEC_META).forEach(secId=>{
        frontByOrden[secId]={};
        (SEC_META[secId].videos||[]).forEach(v=>{frontByOrden[secId][v.o]=v.id;});
      });
      const frontToUuid={}, uuidToFront={}, frontToUrl={};
      vids.forEach(vr=>{
        const slug=sacIdToSlug[vr.sacramento_id];
        const vidId=frontByOrden[slug]?.[vr.orden];
        if(!slug||!vidId) return;
        (frontToUuid[slug]??={})[vidId]=vr.id;
        uuidToFront[vr.id]={secId:slug,vidId};
        // Guardar la URL real solo si es una URL válida (no 'PENDIENTE' ni vacía).
        if(vr.url_video && vr.url_video!=="PENDIENTE" && /^https?:\/\//i.test(vr.url_video)){
          (frontToUrl[slug]??={})[vidId]=vr.url_video;
        }
      });
      const b={frontToUuid,uuidToFront,slugToSacId,frontToUrl};
      setBridge(b);
      return b;
    }catch(e){ console.error("loadBridge:",e); return null; }
  };
  useEffect(()=>{ loadBridge(); },[]);

  const handleLoginSuccess=async(authUser)=>{
    try{
      const {data:u,error}=await supabase.from("usuarios")
        .select("*").eq("id",authUser?.id).maybeSingle();
      if(error||!u){
        console.error("login: no se encontró perfil para este usuario",error);
        // ¿Es una cuenta de ADMINISTRADOR? Los admins viven en public.admins y
        // normalmente NO tienen perfil de alumno en 'usuarios'. En ese caso, en
        // vez de rebotar a la bienvenida, los llevamos al panel de administración.
        let esAdmin=false;
        try{ const {data:ad}=await supabase.rpc("es_admin"); esAdmin=!!ad; }catch(e){ console.error("es_admin:",e); }
        if(esAdmin){ window.location.href="/admin/"; return; }
        // Sesión sin perfil (huérfana, p. ej. intento previo o cuenta borrada):
        // limpiar SOLO localmente. El signOut global puede dar 403 si el token
        // ya está invalidado; scope:"local" borra la sesión del navegador sin esa llamada.
        try{ await supabase.auth.signOut({scope:"local"}); }catch(e){ console.error("signOut:",e); }
        setSequence([]); setSeqIdx(0); setProgress({}); setInsBySec({});
        setPhase("welcome");
        return;
      }
      // Cuenta suspendida o eliminada por un administrador: no permitir el acceso.
      if(u.suspendido||u.eliminado){
        try{ await supabase.auth.signOut(); }catch(e){ console.error("signOut:",e); }
        setSequence([]); setSeqIdx(0); setProgress({}); setInsBySec({});
        setCuentaSuspendida({motivo:u.suspendido_motivo||null, eliminada:!!u.eliminado});
        setPhase("welcome");
        return;
      }
      // Usuario PREINSCRITO. Si el modo preinscripción sigue activo → pantalla de
      // espera. Si ya se abrió la plataforma → conversión: gratuita (beca 100%)
      // se activa sola; de pago va a PaymentModal en modo conversión.
      if((u.estado_inscripcion||"activo")==="preinscrito"){
        let activaModo=preinsc.activa;
        try{ const {data:aj}=await supabase.rpc("obtener_ajuste",{p_clave:"preinscripcion"}); if(aj) activaModo=!!aj.activa; }catch(e){ console.error("obtener_ajuste(login):",e); }
        setUserType(u.tipo_usuario||"catecumeno");
        setSelectedSacs(Array.isArray(u.sacramentos_elegidos)?u.sacramentos_elegidos:[]);
        if(activaModo){
          setFormData(p=>({...p, nombre:u.nombre||"", email:u.email||authUser?.email||""}));
          setPhase("preinscritoEspera");
          return;
        }
        if(!u.formacion_gratuita){
          // De pago → completar inscripción con el precio previsto guardado.
          setFormData(p=>({...p, nombre:u.nombre||"", apellido:u.apellido||"",
            email:u.email||authUser?.email||"", country:u.pais_residencia||"",
            priceBreakdown:u.importe_previsto||null,
            estaInternado:!!u.esta_internado, esPacienteRehabilitacion:!!u.es_paciente_rehab}));
          setConversion({usuarioId:u.id});
          setPhase("payment");
          return;
        }
        // Gratuita (beca 100%): activarse y continuar como alumno activo.
        try{ await supabase.rpc("activar_mi_preinscripcion"); }catch(e){ console.error("activar_mi_preinscripcion:",e); }
        // (sin return: cae al flujo normal de carga del curso)
      }
      setConversion(null);
      const uType=u.tipo_usuario||"catecumeno";
      const sacs=Array.isArray(u.sacramentos_elegidos)?u.sacramentos_elegidos:[];
      let age="";
      if(u.fecha_nacimiento){
        const d=new Date(u.fecha_nacimiento),n=new Date();
        age=n.getFullYear()-d.getFullYear();
        const m=n.getMonth()-d.getMonth();
        if(m<0||(m===0&&n.getDate()<d.getDate()))age--;
      }
      setFormData({
        nombre:u.nombre||"", apellido:u.apellido||"",
        email:u.email||authUser?.email||"",
        country:u.pais_residencia||"", dob:u.fecha_nacimiento||"",
        age, isAdult:age!==""&&age>=18,
        docNum:u.numero_documento||"", phoneCode:u.codigo_pais_tel||"", phone:u.telefono||"",
        parroquia:u.parroquia_nombre||"", noSure:!!u.parroquia_no_segura,
        estado:u.estado_residencia||u.par_estado||"",
        registrationId:u.registro_id||"",
        estaInternado:!!u.esta_internado,
        esPacienteRehabilitacion:!!u.es_paciente_rehab,
      });
      setUserType(uType);
      setSelectedSacs(sacs);
      const seq=buildSeq(uType,sacs);
      setSequence(seq);
      setSeqIdx(0);

      // Puente (usar el ya cargado o cargarlo ahora).
      const b=bridge||await loadBridge();
      if(b){
        // 1) Crear/obtener una inscripción por cada sección del curso del usuario.
        const insMap={};
        for(const secId of seq){
          const sacId=b.slugToSacId[secId];
          if(!sacId) continue;
          const {data:ins,error:insErr}=await supabase.from("inscripciones")
            .upsert({usuario_id:u.id,sacramento_id:sacId},{onConflict:"usuario_id,sacramento_id"})
            .select("id").maybeSingle();
          if(insErr){console.error("inscripcion",secId,insErr);continue;}
          if(ins?.id) insMap[secId]=ins.id;
        }
        setInsBySec(insMap);
        // 2) Cargar el progreso guardado y reconstruir `progress`.
        const insIds=Object.values(insMap);
        if(insIds.length){
          const {data:pv}=await supabase.from("progreso_videos")
            .select("inscripcion_id,video_id,visto,aprobado").in("inscripcion_id",insIds);
          if(pv?.length){
            const prog={};
            for(const row of pv){
              const map=b.uuidToFront[row.video_id];
              if(!map) continue;
              (prog[map.secId]??={})[map.vidId]={visto:!!row.visto,passed:!!row.aprobado};
            }
            setProgress(prog);
            // Colocar el índice en la primera sección no terminada.
            let idx=0;
            for(let i=0;i<seq.length;i++){ idx=i; if(!isSectionDone(seq[i],prog)) break; }
            setSeqIdx(idx);
          }
          // 3) Cargar las encuestas YA respondidas para no volver a pedirlas.
          try{
            const {data:enc}=await supabase.from("encuestas_video")
              .select("video_id").eq("usuario_id",u.id);
            if(enc?.length){
              const hechas=new Set();
              for(const row of enc){
                const map=b.uuidToFront[row.video_id];
                if(map) hechas.add(`${map.secId}:${map.vidId}`);
              }
              setEncuestasHechas(hechas);
            }
          }catch(encErr){ console.error("cargar encuestas hechas:",encErr); }
        }
      }
      setPhase("course");
    }catch(e){
      console.error("handleLoginSuccess:",e);
      setPhase("course");
    }
  };

  // Guarda (upsert) el avance de un video en progreso_videos. No bloquea la UI:
  // si algo falla, solo se registra en consola (el estado local sigue vigente).
  const persistProgreso=async(secId,vidId,fields)=>{
    try{
      const insId=insBySec[secId];
      const videoUuid=bridge?.frontToUuid?.[secId]?.[vidId];
      if(!insId||!videoUuid) return;
      await supabase.from("progreso_videos").upsert(
        {inscripcion_id:insId,video_id:videoUuid,...fields},
        {onConflict:"inscripcion_id,video_id"});
    }catch(e){ console.error("persistProgreso:",e); }
  };

  // Guarda TODO el progreso actual de una vez (red de seguridad al cerrar sesión).
  const flushProgress=async()=>{
    try{
      const rows=[];
      for(const secId of Object.keys(progress||{})){
        const insId=insBySec[secId];
        if(!insId) continue;
        for(const vidId of Object.keys(progress[secId]||{})){
          const uuid=bridge?.frontToUuid?.[secId]?.[vidId];
          if(!uuid) continue;
          const p=progress[secId][vidId]||{};
          rows.push({inscripcion_id:insId,video_id:uuid,
            visto:!!p.visto, aprobado:!!p.passed});
        }
      }
      if(rows.length){
        await supabase.from("progreso_videos")
          .upsert(rows,{onConflict:"inscripcion_id,video_id"});
      }
    }catch(e){ console.error("flushProgress:",e); }
  };

  // Cerrar sesión: primero asegura que el progreso quede guardado, luego signOut.
  const handleLogout=async()=>{
    await flushProgress();
    try{ await supabase.auth.signOut(); }catch(e){ console.error("signOut:",e); }
    setSequence([]); setSeqIdx(0); setProgress({}); setInsBySec({});
    setUserType(null); setSelectedSacs([]); setFormData({});
    setShowResult(false); setShowSecComplete(false); setShowCerts(false); setShowDash(false);
    setPhase("welcome");
  };

  // ─── Reanudar sesión automáticamente ────────────────────────────────────────
  // Si el usuario cerró el navegador SIN cerrar sesión, al volver retomamos su
  // curso directo (supabase-js persiste la sesión en localStorage por defecto).
  useEffect(()=>{
    (async()=>{
      if(pagoRetorno) return; // si viene de un pago, respetar ese flujo
      try{
        const {data}=await supabase.auth.getSession();
        if(data?.session?.user){
          handleLoginSuccess(data.session.user);
        }
      }catch(e){ console.error("getSession:",e); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  const handleOrgRegisterNext=async(data)=>{
    setFormData(data);
    try{
      const iso=COUNTRY_ISO[data.country]||"XX";
      // registro_id oficial (si la función falla, la fila queda sin él y se asigna después)
      let registro_id=null;
      try{
        const {data:rid,error:ridErr}=await supabase.rpc("generar_registro_id",
          {p_tipo_usuario:orgType,p_codigo_iso:iso});
        if(!ridErr&&rid)registro_id=rid;
      }catch(e){console.error("generar_registro_id:",e);}
      const comunes={
        registro_id, nombre:data.nombre, pais:data.country||"", codigo_iso:iso,
        nombre_contacto:data.contacto||"", email_contacto:data.email||"",
        codigo_pais_tel:data.phoneCode||null, telefono:data.phone||null,
        estado:data.estado||null, municipio:data.municipio||null,
      };
      let table,fila;
      if(orgType==="parroquia"){
        table="parroquias";
        fila={...comunes, direccion:data.calle||null, nombre_pastor:data.pastor||"",
          banco:data.banco||null, numero_cuenta:data.cuenta||null,
          clabe_swift:data.clabe||null, titular_cuenta:data.titular||null,
          emite_factura:!!data.emiteFactura};
      }else if(orgType==="diocesis"){
        table="diocesis";
        fila={...comunes, direccion:data.curia||null, nombre_obispo:data.obispo||""};
      }else if(orgType==="centroadiccion"){
        table="centros_adiccion";
        fila={...comunes, estado:data.estado||null, municipio:data.municipio||null,
          calle:data.calle||null, numero:data.numero||null};
      }else{
        // "otro": organización/institución no prevista; guarda el tipo que indicó.
        table="organizaciones_otro";
        fila={...comunes, tipo_organizacion:data.tipoOrg||"", direccion:data.direccion||null};
      }
      const {error}=await supabase.from(table).insert(fila);
      if(error)throw error;
      // Geocodificar en segundo plano (no bloquea el flujo). La función lee la
      // dirección de la BD por registro_id y guarda lat/lng para el directorio.
      if(registro_id&&(table==="parroquias"||table==="diocesis")){
        supabase.functions.invoke("geocodificar-uno",{body:{tabla:table,registro_id}}).catch(()=>{});
      }
    }catch(e){
      console.error("solicitud de afiliación:",e);
      alert(T("No se pudo enviar tu solicitud de afiliación. Por favor verifica tu conexión e intenta de nuevo. Si el problema persiste, escríbenos a admin@catecumen.com.","Your affiliation request could not be sent. Please check your connection and try again. If the problem persists, write to admin@catecumen.com.","Votre demande d'affiliation n'a pas pu être envoyée. Vérifiez votre connexion et réessayez. Si le problème persiste, écrivez-nous à admin@catecumen.com.","Ihr Antrag auf Anschluss konnte nicht gesendet werden. Bitte überprüfen Sie Ihre Verbindung und versuchen Sie es erneut. Wenn das Problem weiterhin besteht, schreiben Sie uns an admin@catecumen.com.","Não foi possível enviar sua solicitação de afiliação. Verifique sua conexão e tente novamente. Se o problema persistir, escreva para admin@catecumen.com.","Non è stato possibile inviare la tua richiesta di affiliazione. Controlla la tua connessione e riprova. Se il problema persiste, scrivici a admin@catecumen.com."));
      return;
    }
    setPhase("orgThankYou");
  };

  // Video actions
  const handleVideoAction=(secId,vid)=>{
    setActiveVideo({secId,vid});
  };

  const handleVideoWatched=()=>{
    const {secId,vid}=activeVideo;
    markVideoWatched(secId,vid);
    setActiveVideo(null);
    // Encuesta obligatoria antes de la evaluación, SOLO si no se ha respondido ya
    // para este video (evita re-preguntar cuando el usuario reintenta tras reprobar).
    if(encuestasHechas.has(`${secId}:${vid.id}`)){
      setActiveEval({secId,vid});
    }else{
      setActiveEncuesta({secId,vid});
    }
  };

  const handleEvalAction=(secId,vid)=>{
    // Si el usuario ya respondió la encuesta de este video, ir directo a la
    // evaluación (no repetir la encuesta al reintentar tras no aprobar).
    if(encuestasHechas.has(`${secId}:${vid.id}`)){
      setActiveEval({secId,vid});
    }else{
      setActiveEncuesta({secId,vid}); // encuesta obligatoria antes de la evaluación
    }
  };

  const handleEncuestaDone=()=>{
    const {secId,vid}=activeEncuesta;
    setEncuestasHechas(prev=>{ const n=new Set(prev); n.add(`${secId}:${vid.id}`); return n; });
    setActiveEncuesta(null);
    setActiveEval({secId,vid});
  };

  const handleEvalResult=(result)=>{
    const {secId,vid}=activeEval;
    markEvalResult(secId,vid,result);
    setActiveEval(null);
    setLastResult({result,vid,secId});
    setShowResult(true);
  };

  const handleResultClose=()=>{
    const {result,secId,vid}=lastResult;
    setShowResult(false);
    // check if section complete (using current progress + this result)
    const newP={...progress};
    if(!newP[secId]) newP[secId]={};
    newP[secId]={...newP[secId],[vid.id]:{...newP[secId][vid.id],
      score:result.score,passed:result.passed,visto:result.passed}};
    const done=checkSectionComplete(secId,newP);
    if(done){
      setCompletedSecId(secId);
      const scores=SEC_META[secId].videos.map(v=>newP[secId]?.[v.id]?.score||0);
      const avg=scores.reduce((a,b)=>a+b,0)/scores.length;
      setLastResult(p=>({...p,avgScore:avg}));
      setShowSecComplete(true);
      setGoldRain(true);
      setTimeout(()=>setGoldRain(false),4000);
    }
  };

  const handleSecCompleteNext=()=>{
    setShowSecComplete(false);
    const nextIdx=seqIdx+1;
    const isLast=nextIdx>=sequence.length;
    if(isLast){
      setShowCerts(true);
      setStarBurst(true); // 🎉 lluvia de estrellas al obtener la constancia
    } else {
      setSeqIdx(nextIdx);
    }
  };

  const calcAvgScore=(secId)=>{
    const sec=SEC_META[secId];
    if(!sec) return 0;
    const scores=sec.videos.map(v=>progress?.[secId]?.[v.id]?.score||0);
    return scores.reduce((a,b)=>a+b,0)/Math.max(scores.length,1);
  };

  // Determine if this is organization flow
  const isOrgFlow=orgType==="parroquia"||orgType==="diocesis"||orgType==="centroadiccion"||orgType==="otro";

  // RENDER
  return(
    <div role="main" style={{minHeight:"100vh",backgroundImage:`url(${effectiveTheme==="light"?fondoBgClaro:fondoBg})`,backgroundRepeat:"repeat",backgroundSize:"650px auto",backgroundPosition:"top left",fontFamily:"'Crimson Text',serif"}}>
      <style>{`
        :root, [data-theme="dark"]{
          --c-bg:#060D18; --c-surface:#0C1829; --c-card:#112038; --c-cardH:#162843;
          --c-border:rgba(200,169,81,0.18); --c-borderD:rgba(255,255,255,0.07);
          --c-gold:#C8A951; --c-goldL:#E5C97A; --c-goldDeep:#9A7A2A;
          --c-ivory:#F0EAD6; --c-ivoryM:#9A8F7A; --c-tM:#5A6070;
          --c-wine:#8B1A2E; --c-green:#2D7A5A; --c-greenB:#3DA070;
          --c-blue:#2058A8; --c-blueB:#3070D0; --c-gray:#3A4556;
          --c-inputBg:rgba(255,255,255,0.04); --c-label:#FFFFFF; --c-btnPriText:#060D18;
          --c-cardEnd:#0E1B2E; --c-cardShadow:0 4px 20px rgba(0,0,0,0.35);
          --c-modalStart:#0E1F36; --c-modalEnd:#09111E;
          --c-modalShadow:0 24px 64px rgba(0,0,0,0.7),0 1px 0 rgba(200,169,81,0.15) inset;
          --c-selectBg:#0C1829; --c-scrollTrack:#060D18; --c-scheme:dark;
        }
        [data-theme="light"]{
          --c-bg:#FBF6EA; --c-surface:#F5EDDA; --c-card:#FFFFFF; --c-cardH:#FAF2DF;
          --c-border:rgba(139,107,33,0.28); --c-borderD:rgba(90,70,20,0.14);
          --c-gold:#8A6A22; --c-goldL:#C8A951; --c-goldDeep:#7A5E1E;
          --c-ivory:#2A2116; --c-ivoryM:#6B5D45; --c-tM:#7A7566;
          --c-wine:#8B1A2E; --c-green:#1F7A4E; --c-greenB:#1F7A4E;
          --c-blue:#1B4C8C; --c-blueB:#1B4C8C; --c-gray:#8891A0;
          --c-inputBg:rgba(0,0,0,0.03); --c-label:#2A2116; --c-btnPriText:#2A1E05;
          --c-cardEnd:#F7EFDC; --c-cardShadow:0 4px 18px rgba(90,70,20,0.12);
          --c-modalStart:#FFFFFF; --c-modalEnd:#F5EBD2;
          --c-modalShadow:0 24px 56px rgba(60,45,10,0.22),0 1px 0 rgba(200,169,81,0.25) inset;
          --c-selectBg:#FFFFFF; --c-scrollTrack:#F0E7CF; --c-scheme:light;
        }
        *, *::before, *::after { box-sizing: border-box; margin:0; padding:0; }
        html, body { height:100%; margin:0!important; padding:0!important; overflow:hidden; }
        /* Desplegables: forzar contraste del menú en ambos temas */
        select { color-scheme: var(--c-scheme, dark); }
        #root { width:100%; min-height:100%; overflow-x:hidden; }
        body { background:var(--c-bg); transition:background-color .25s ease; }
        select option { background:var(--c-selectBg); color:var(--c-ivory); }
        ::-webkit-scrollbar{width:6px} ::-webkit-scrollbar-track{background:var(--c-scrollTrack)}
        ::-webkit-scrollbar-thumb{background:var(--c-gold);border-radius:3px}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        @keyframes modalIn{
          from{opacity:0;transform:translateY(22px) scale(0.97)}
          to{opacity:1;transform:translateY(0) scale(1)}
        }
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideUp{
          from{opacity:0;transform:translateY(30px)}
          to{opacity:1;transform:translateY(0)}
        }
        button:active:not(:disabled){transform:scale(0.97)!important}
        input:focus, select:focus{
          border-color:rgba(200,169,81,0.6)!important;
          box-shadow:0 0 0 3px rgba(200,169,81,0.12)!important;
          outline:none;
        }
        @media(max-width:480px){
          .modal-inner{padding:20px 16px!important;max-height:94vh!important;}
        }
      `}</style>

      <GoldenRain show={goldRain}/>
      <StarRain show={starBurst}/>
      {validarCodigo&&(
        <Suspense fallback={<div style={OVERLAY}><div style={{color:C.gold,fontFamily:"'Cinzel',serif"}}>{T("Cargando…","Loading…","Chargement…","Wird geladen…","Carregando…","Caricamento…")}</div></div>}>
          <ValidarConstanciaModal codigo={validarCodigo}
            onClose={()=>{setValidarCodigo(null);window.history.replaceState({},"",window.location.pathname);}}/>
        </Suspense>
      )}

      <div style={{position:"fixed",top:14,right:14,zIndex:3000,display:"flex",alignItems:"center",gap:8}}>
        {phase==="course"?(
          <button onClick={handleLogout}
            style={{
              height:40,padding:"0 16px",borderRadius:20,cursor:"pointer",
              background:"var(--c-card)",border:"1px solid var(--c-border)",
              color:"var(--c-gold)",fontFamily:"'Cinzel',serif",fontSize:12.5,
              fontWeight:700,letterSpacing:"0.05em",
              display:"flex",alignItems:"center",gap:6,
              boxShadow:"0 4px 14px rgba(0,0,0,0.25)",
            }}>
            {T("Cerrar sesión","Sign out","Se déconnecter","Abmelden","Sair","Esci")} ↪
          </button>
        ):phase!=="welcome"?(
          // En "welcome" NO se muestra: el modal de bienvenida ya tiene "Iniciar
          // sesión" (evita el botón "Ingresar" duplicado). En las demás fases sí,
          // porque ahí es el único acceso a login.
          <button onClick={()=>setPhase("login")}
            style={{
              height:40,padding:"0 16px",borderRadius:20,cursor:"pointer",
              background:"var(--c-card)",border:"1px solid var(--c-border)",
              color:"var(--c-gold)",fontFamily:"'Cinzel',serif",fontSize:12.5,
              fontWeight:700,letterSpacing:"0.05em",
              display:"flex",alignItems:"center",gap:6,
              boxShadow:"0 4px 14px rgba(0,0,0,0.25)",
            }}>
            🔑 {T("Ingresar","Sign in","Se connecter","Anmelden","Entrar","Accedi")}
          </button>
        ):null}
        <ThemeSwitcher value={themePref} onChange={setThemePref}/>
        <LanguageSwitcher/>
      </div>


      {/* MODALES DE FLUJO */}
      {cuentaSuspendida&&(
        <div style={OVERLAY}>
          <div style={{...MODAL,maxWidth:460,textAlign:"center"}}>
            <div style={{fontSize:40,marginBottom:10}}>⚠️</div>
            <h2 style={{fontFamily:"'Cinzel',serif",color:C.gold,fontSize:19,marginBottom:10}}>
              {cuentaSuspendida.eliminada
                ? T("Cuenta no disponible","Account unavailable","Compte indisponible","Konto nicht verfügbar","Conta indisponível","Account non disponibile")
                : T("Cuenta suspendida","Account suspended","Compte suspendu","Konto gesperrt","Conta suspensa","Account sospeso")}
            </h2>
            <p style={{color:C.ivory,fontFamily:"'Crimson Text',serif",fontSize:15,lineHeight:1.6,marginBottom:12}}>
              {cuentaSuspendida.eliminada
                ? T("Esta cuenta ya no está disponible. Si crees que es un error, comunícate con la administración.","This account is no longer available. If you believe this is an error, please contact the administration.","Ce compte n'est plus disponible. Si vous pensez qu'il s'agit d'une erreur, contactez l'administration.","Dieses Konto ist nicht mehr verfügbar. Wenn Sie glauben, dass dies ein Fehler ist, wenden Sie sich an die Verwaltung.","Esta conta não está mais disponível. Se você acredita que isto é um erro, entre em contato com a administração.","Questo account non è più disponibile. Se ritieni che si tratti di un errore, contatta l'amministrazione.")
                : T("Tu cuenta ha sido suspendida temporalmente. Para más información, comunícate con la administración.","Your account has been temporarily suspended. For more information, please contact the administration.","Votre compte a été temporairement suspendu. Pour plus d'informations, contactez l'administration.","Ihr Konto wurde vorübergehend gesperrt. Für weitere Informationen wenden Sie sich an die Verwaltung.","Sua conta foi suspensa temporariamente. Para mais informações, entre em contato com a administração.","Il tuo account è stato temporaneamente sospeso. Per maggiori informazioni, contatta l'amministrazione.")}
            </p>
            {cuentaSuspendida.motivo&&(
              <p style={{color:C.ivoryM,fontSize:13.5,fontStyle:"italic",marginBottom:14}}>
                {T("Motivo","Reason","Motif","Grund","Motivo","Motivo")}: {cuentaSuspendida.motivo}
              </p>
            )}
            <a href="mailto:admin@catecumen.com" style={{...BTN("sec"),textDecoration:"none",display:"inline-block",marginBottom:8}}>
              {T("Contactar administración","Contact administration","Contacter l'administration","Verwaltung kontaktieren","Contatar administração","Contattare amministrazione")}
            </a>
            <div>
              <button onClick={()=>setCuentaSuspendida(null)}
                style={{background:"none",border:"none",color:C.ivoryM,fontSize:13,cursor:"pointer",textDecoration:"underline",marginTop:4}}>
                {T("Volver al inicio","Back to start","Retour à l'accueil","Zurück zum Start","Voltar ao início","Torna all'inizio")}
              </button>
            </div>
          </div>
        </div>
      )}
      {phase==="welcome"&&<WelcomeModal
        onContinue={()=>setPhase("filter")}
        onLogin={()=>setPhase("login")}
      />}
      {phase==="login"&&(
        <Suspense fallback={<div style={OVERLAY}><div style={{color:C.gold,fontFamily:"'Cinzel',serif"}}>{T("Cargando…","Loading…","Chargement…","Wird geladen…","Carregando…","Caricamento…")}</div></div>}>
          <LoginModal
            onBack={()=>setPhase("welcome")}
            onSuccess={handleLoginSuccess}
            onResume={()=>setPhase("resume")}
          />
        </Suspense>
      )}

      {phase==="resume"&&<ResumePaymentModal onBack={()=>setPhase("login")}/>}

      {/* RETORNO DE STRIPE CHECKOUT */}
      {pagoRetorno&&(
        <div style={{...OVERLAY,zIndex:2000}}>
          <div style={{...MODAL,maxWidth:460,textAlign:"center"}}>
            {pagoRetorno==="procesando"&&pagoEstadoReal===null?(
              <>
                <div style={{fontSize:48,marginBottom:12}}>⏳</div>
                <h2 style={{fontFamily:"'Cinzel',serif",color:C.gold,fontSize:18,marginBottom:12}}>
                  {T("Verificando tu pago…","Checking your payment…","Vérification de votre paiement…","Ihre Zahlung wird überprüft…","Verificando seu pagamento…","Verifica del pagamento in corso…")}
                </h2>
                <p style={{color:C.ivoryM,fontFamily:"'Crimson Text',serif",fontSize:15}}>
                  {T("Un momento por favor.","One moment please.","Un instant, s'il vous plaît.","Einen Moment bitte.","Um momento, por favor.","Un momento per favore.")}
                </p>
              </>
            ):pagoRetorno==="cancelado"?(
              <>
                <div style={{fontSize:48,marginBottom:12}}>ℹ️</div>
                <h2 style={{fontFamily:"'Cinzel',serif",color:C.gold,fontSize:18,marginBottom:12}}>
                  {T("Pago no completado","Payment not completed","Paiement non finalisé","Zahlung nicht abgeschlossen","Pagamento não concluído","Pagamento non completato")}
                </h2>
                <p style={{color:C.ivory,fontFamily:"'Crimson Text',serif",fontSize:15.5,lineHeight:1.65,marginBottom:20}}>
                  {T("El pago fue cancelado y no se realizó ningún cargo. Tu registro quedó guardado — puedes retomarlo desde «Iniciar sesión → ¿Te registraste pero no completaste tu pago?» cuando gustes.","The payment was cancelled and you were not charged. Your registration was saved — you can resume it from “Sign in → Registered but never finished payment?” whenever you like.","Le paiement a été annulé et aucun montant n'a été débité. Votre inscription a été conservée — vous pouvez la reprendre depuis « Se connecter → Vous êtes inscrit(e) mais n'avez pas terminé le paiement ? » quand vous le souhaitez.","Die Zahlung wurde storniert und es wurde kein Betrag abgebucht. Ihre Registrierung wurde gespeichert — Sie können sie jederzeit über „Anmelden → Registriert, aber die Zahlung nicht abgeschlossen?“ fortsetzen.","O pagamento foi cancelado e nenhuma cobrança foi realizada. Seu registro foi salvo — você pode retomá-lo em «Entrar → Registrou-se mas não concluiu o pagamento?» quando quiser.","Il pagamento è stato annullato e non è stato addebitato alcun importo. La tua registrazione è stata salvata — puoi riprenderla da «Accedi → Ti sei registrato/a ma non hai completato il pagamento?» quando vuoi.")}
                </p>
                <button onClick={()=>{setPagoRetorno(null);setPhase("welcome");}}
                  style={{...BTN("pri"),width:"100%",justifyContent:"center"}}>
                  {T("Volver al inicio","Back to start","Retour à l'accueil","Zurück zum Start","Voltar ao início","Torna all'inizio")} →
                </button>
              </>
            ):(pagoEstadoReal==="paid"||pagoRetorno==="exitoso")?(
              <>
                <div style={{fontSize:48,marginBottom:12}}>🎉</div>
                <h2 style={{fontFamily:"'Cinzel',serif",color:C.gold,fontSize:19,marginBottom:10}}>
                  {T("¡Bienvenido/a a Catecumen!","Welcome to Catecumen!","Bienvenue à Catecumen !","Willkommen bei Catecumen!","Bem-vindo/a à Catecumen!","Benvenuto/a in Catecumen!")}
                </h2>
                <p style={{color:C.ivory,fontFamily:"'Crimson Text',serif",fontSize:15.5,lineHeight:1.65,marginBottom:20}}>
                  {T("Tu pago fue recibido y tu inscripción quedó registrada. Inicia sesión con tu correo y contraseña para comenzar tu formación.","Your payment was received and your registration is complete. Sign in with your email and password to begin your formation.","Votre paiement a été reçu et votre inscription est enregistrée. Connectez-vous avec votre e-mail et votre mot de passe pour commencer votre formation.","Ihre Zahlung ist eingegangen und Ihre Anmeldung ist registriert. Melden Sie sich mit Ihrer E-Mail und Ihrem Passwort an, um Ihre Ausbildung zu beginnen.","Seu pagamento foi recebido e sua inscrição foi registrada. Faça login com seu e-mail e senha para começar sua formação.","Il tuo pagamento è stato ricevuto e la tua iscrizione è registrata. Accedi con la tua email e password per iniziare la tua formazione.")}
                </p>
                <button onClick={()=>{setPagoRetorno(null);setPhase("login");}}
                  style={{...BTN("pri"),width:"100%",justifyContent:"center"}}>
                  🔑 {T("Iniciar sesión","Sign in","Se connecter","Anmelden","Entrar","Accedi")} →
                </button>
              </>
            ):pagoEstadoReal==="unpaid"?(
              <>
                <div style={{fontSize:48,marginBottom:12}}>🧾</div>
                <h2 style={{fontFamily:"'Cinzel',serif",color:C.gold,fontSize:18,marginBottom:12}}>
                  {T("Guarda tu comprobante de pago","Save your payment voucher","Conservez votre justificatif de paiement","Bewahren Sie Ihren Zahlungsbeleg auf","Guarde seu comprovante de pagamento","Conserva la tua ricevuta di pagamento")}
                </h2>
                <p style={{color:C.ivory,fontFamily:"'Crimson Text',serif",fontSize:15.5,lineHeight:1.65,marginBottom:14}}>
                  {T("Tu registro está reservado. Completa el pago en la tienda o banco indicado por Stripe antes de que venza tu comprobante.","Your registration is reserved. Complete the payment at the store or bank shown by Stripe before your voucher expires.","Votre inscription est réservée. Effectuez le paiement dans le magasin ou la banque indiqué par Stripe avant l'expiration de votre justificatif.","Ihre Registrierung ist reserviert. Schließen Sie die Zahlung im von Stripe angegebenen Geschäft oder bei der Bank ab, bevor Ihr Beleg abläuft.","Seu registro está reservado. Complete o pagamento na loja ou banco indicado pela Stripe antes que seu comprovante vença.","La tua registrazione è riservata. Completa il pagamento presso il negozio o la banca indicati da Stripe prima che la tua ricevuta scada.")}
                </p>
                <p style={{color:C.ivoryM,fontFamily:"'Crimson Text',serif",fontSize:14,lineHeight:1.6,marginBottom:20}}>
                  {T("En cuanto se confirme tu pago (normalmente el siguiente día hábil) te enviaremos un correo y tu cuenta quedará lista para iniciar sesión.","As soon as your payment is confirmed (usually the next business day) we'll send you an email and your account will be ready to sign in.","Dès que votre paiement sera confirmé (généralement le jour ouvrable suivant), nous vous enverrons un e-mail et votre compte sera prêt pour la connexion.","Sobald Ihre Zahlung bestätigt ist (in der Regel am nächsten Werktag), senden wir Ihnen eine E-Mail und Ihr Konto ist bereit zur Anmeldung.","Assim que seu pagamento for confirmado (normalmente no próximo dia útil), enviaremos um e-mail e sua conta estará pronta para login.","Non appena il tuo pagamento sarà confermato (di solito il giorno lavorativo successivo) ti invieremo un'email e il tuo account sarà pronto per l'accesso.")}
                </p>
                <button onClick={()=>{setPagoRetorno(null);setPhase("welcome");}}
                  style={{...BTN("sec"),width:"100%",justifyContent:"center"}}>
                  {T("Entendido","Got it","Compris","Verstanden","Entendido","Capito")}
                </button>
              </>
            ):(
              <>
                <div style={{fontSize:48,marginBottom:12}}>ℹ️</div>
                <h2 style={{fontFamily:"'Cinzel',serif",color:C.gold,fontSize:18,marginBottom:12}}>
                  {T("No pudimos verificar tu pago","We couldn't verify your payment","Nous n'avons pas pu vérifier votre paiement","Wir konnten Ihre Zahlung nicht überprüfen","Não conseguimos verificar seu pagamento","Non siamo riusciti a verificare il tuo pagamento")}
                </h2>
                <p style={{color:C.ivory,fontFamily:"'Crimson Text',serif",fontSize:15.5,lineHeight:1.65,marginBottom:20}}>
                  {T("Si ya pagaste, revisa tu correo en unos minutos o intenta iniciar sesión. Si el problema persiste, contáctanos.","If you already paid, check your email in a few minutes or try signing in. If the problem persists, contact us.","Si vous avez déjà payé, vérifiez votre e-mail dans quelques minutes ou essayez de vous connecter. Si le problème persiste, contactez-nous.","Wenn Sie bereits bezahlt haben, überprüfen Sie in ein paar Minuten Ihre E-Mail oder versuchen Sie sich anzumelden. Wenn das Problem weiterhin besteht, kontaktieren Sie uns.","Se você já pagou, verifique seu e-mail em alguns minutos ou tente fazer login. Se o problema persistir, entre em contato conosco.","Se hai già pagato, controlla la tua email tra qualche minuto o prova ad accedere. Se il problema persiste, contattaci.")}
                </p>
                <button onClick={()=>{setPagoRetorno(null);setPhase("login");}}
                  style={{...BTN("pri"),width:"100%",justifyContent:"center"}}>
                  🔑 {T("Iniciar sesión","Sign in","Se connecter","Anmelden","Entrar","Accedi")} →
                </button>
              </>
            )}
          </div>
        </div>
      )}
      
      {(phase==="filter"||phase==="sacSelect")&&(
        <Suspense fallback={<div style={OVERLAY}><div style={{color:C.gold,fontFamily:"'Cinzel',serif"}}>{T("Cargando…","Loading…","Chargement…","Wird geladen…","Carregando…","Caricamento…")}</div></div>}>
          {phase==="filter"&&<FilterModal onSelect={handleFilterSelect} onBack={()=>setPhase("welcome")}/>}
          {phase==="sacSelect"&&(
            <SacSelectModal onContinue={handleSacSelect} onBack={()=>setPhase("filter")}/>
          )}
        </Suspense>
      )}
      
      {phase==="encuadre"&&(
        <Suspense fallback={<div style={OVERLAY}><div style={{color:C.gold,fontFamily:"'Cinzel',serif"}}>{T("Cargando…","Loading…","Chargement…","Wird geladen…","Carregando…","Caricamento…")}</div></div>}>
          <EncuadreModal encKey={encuadreKey} onRegister={handleEncuadreRegister} onBack={()=>{
            if(userType==="catecumeno")setPhase("sacSelect");
            else setPhase("filter");
          }}/>
        </Suspense>
      )}

      {/* REGISTRO */}
      {phase==="register"&&isOrgFlow&&(
        <Suspense fallback={<div style={OVERLAY}><div style={{color:C.gold,fontFamily:"'Cinzel',serif"}}>{T("Cargando…","Loading…","Chargement…","Wird geladen…","Carregando…","Caricamento…")}</div></div>}>
          {orgType==="parroquia"&&<RegisterParroquiaForm onNext={handleOrgRegisterNext} onBack={()=>setPhase("encuadre")}/>}
          {orgType==="diocesis"&&<RegisterDiocesisForm onNext={handleOrgRegisterNext} onBack={()=>setPhase("encuadre")}/>}
          {orgType==="centroadiccion"&&<RegisterCentroForm onNext={handleOrgRegisterNext} onBack={()=>setPhase("encuadre")}/>}
          {orgType==="otro"&&<RegisterOtroForm onNext={handleOrgRegisterNext} onBack={()=>setPhase("encuadre")}/>}
        </Suspense>
      )}
      {phase==="register"&&!isOrgFlow&&(
        <Suspense fallback={<div style={OVERLAY}><div style={{color:C.gold,fontFamily:"'Cinzel',serif"}}>{T("Cargando…","Loading…","Chargement…","Wird geladen…","Carregando…","Caricamento…")}</div></div>}>
          <RegisterForm userType={userType} sacraments={selectedSacs}
            onNext={handleRegisterNext} onBack={()=>setPhase("encuadre")}/>
        </Suspense>
      )}

      {phase==="password"&&!isOrgFlow&&(
        <Suspense fallback={<div style={OVERLAY}><div style={{color:C.gold,fontFamily:"'Cinzel',serif"}}>{T("Cargando…","Loading…","Chargement…","Wird geladen…","Carregando…","Caricamento…")}</div></div>}>
          <PasswordModal email={formData.email} onNext={handlePasswordNext} onBack={()=>setPhase("register")}/>
        </Suspense>
      )}

      {phase==="payment"&&!isOrgFlow&&(
        <Suspense fallback={<div style={OVERLAY}><div style={{color:C.gold,fontFamily:"'Cinzel',serif"}}>{T("Cargando…","Loading…","Chargement…","Wird geladen…","Carregando…","Caricamento…")}</div></div>}>
          <PaymentModal formData={formData} userType={userType} selectedSacs={selectedSacs}
            preinscripcion={preinsc.activa&&!conversion}
            conversion={!!conversion} usuarioId={conversion?.usuarioId}
            onSuccess={handlePaymentSuccess}
            onBack={conversion?(async()=>{ try{await supabase.auth.signOut();}catch(e){console.error(e);} setConversion(null); setPhase("welcome"); }):()=>setPhase("password")}/>
        </Suspense>
      )}

      {phase==="preinscritoEspera"&&(
        <Suspense fallback={<div style={OVERLAY}><div style={{color:C.gold,fontFamily:"'Cinzel',serif"}}>{T("Cargando…","Loading…","Chargement…","Wird geladen…","Carregando…","Caricamento…")}</div></div>}>
          <PreinscripcionEspera mensaje={preinsc.mensaje} nombre={formData.nombre}
            onLogout={async()=>{ try{await supabase.auth.signOut();}catch(e){console.error(e);} setPhase("welcome"); }}/>
        </Suspense>
      )}

      {(phase==="thankYou"&&!isOrgFlow||phase==="orgThankYou")&&(
        <Suspense fallback={<div style={OVERLAY}><div style={{color:C.gold,fontFamily:"'Cinzel',serif"}}>{T("Cargando…","Loading…","Chargement…","Wird geladen…","Carregando…","Caricamento…")}</div></div>}>
          {phase==="thankYou"&&!isOrgFlow&&<ThankYouModal formData={formData} onClose={handleThankYouClose}/>}
          {phase==="orgThankYou"&&(
            <OrgThankYouModal orgType={orgType} formData={formData}
              onClose={()=>{setOrgType(null);setPhase("filter");}}/>
          )}
        </Suspense>
      )}

      <ScrollbarStyle/>

      {/* CURSO */}
      {phase==="course"&&currentSecId&&!showResult&&!showSecComplete&&!showCerts&&!showDash&&(
        <Suspense fallback={<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(250,247,240,0.82)"}}><div style={{color:C.gold,fontFamily:"'Cinzel',serif"}}>{T("Cargando…","Loading…","Chargement…","Wird geladen…","Carregando…","Caricamento…")}</div></div>}>
          <CourseSectionView secId={currentSecId} progress={progress}
            onVideoAction={handleVideoAction}
            onEvalAction={handleEvalAction}
            canBack={seqIdx>0}
            onBack={()=>setSeqIdx(i=>Math.max(0,i-1))}
            onDash={()=>{setDashTab(null);setShowDash(true);}}/>
        </Suspense>
      )}

      {/* OVERLAY MODALS — flujo de video/evaluación (chunks diferidos; solo uno
          se muestra a la vez, por eso comparten un único Suspense). */}
      {(activeVideo||activeEncuesta||activeEval||(showResult&&lastResult)||(showSecComplete&&completedSecId))&&(
        <Suspense fallback={<div style={OVERLAY}><div style={{color:C.gold,fontFamily:"'Cinzel',serif"}}>{T("Cargando…","Loading…","Chargement…","Wird geladen…","Carregando…","Caricamento…")}</div></div>}>
          {activeVideo&&(
            <VideoModal secId={activeVideo.secId} vid={activeVideo.vid} bridge={bridge}
              onWatched={handleVideoWatched} onClose={()=>setActiveVideo(null)}/>
          )}
          {activeEncuesta&&(
            <EncuestaVideoModal secId={activeEncuesta.secId} vid={activeEncuesta.vid}
              insBySec={insBySec} bridge={bridge} onDone={handleEncuestaDone}/>
          )}
          {activeEval&&(
            <EvalModal secId={activeEval.secId} vid={activeEval.vid}
              onResult={handleEvalResult} onClose={()=>setActiveEval(null)}/>
          )}
          {showResult&&lastResult&&(
            <ResultModal result={lastResult.result} vid={lastResult.vid} onClose={handleResultClose}/>
          )}
          {showSecComplete&&completedSecId&&(
            <SectionCompleteModal
              secId={completedSecId}
              avgScore={calcAvgScore(completedSecId)}
              nextSecId={sequence[seqIdx+1]||null}
              isLastBeforeCerts={seqIdx+1>=sequence.length}
              isAllDone={seqIdx+1>=sequence.length}
              onContinue={handleSecCompleteNext}/>
          )}
        </Suspense>
      )}

      {showCerts&&(
        <Suspense fallback={<div style={OVERLAY}><div style={{color:C.gold,fontFamily:"'Cinzel',serif"}}>{T("Cargando…","Loading…","Chargement…","Wird geladen…","Carregando…","Caricamento…")}</div></div>}>
          <CertificatesModal formData={formData} sequence={sequence} progress={progress} insBySec={insBySec}
            onClose={()=>{setShowCerts(false);setPhase("course");}}/>
        </Suspense>
      )}

      {showDash&&(
        <Suspense fallback={<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(250,247,240,0.82)"}}><div style={{color:C.gold,fontFamily:"'Cinzel',serif"}}>{T("Cargando…","Loading…","Chargement…","Wird geladen…","Carregando…","Caricamento…")}</div></div>}>
          <Dashboard formData={formData} sequence={sequence} progress={progress}
            userType={userType}
            initialTab={dashTab}
            onUpdate={updates=>setFormData(p=>({...p,...updates}))}
            onClose={()=>{setShowDash(false);setDashTab(null);
              supabase.rpc("mis_mensajes_no_leidos").then(({data})=>setMsgNoLeidos(typeof data==="number"?data:0)).catch(()=>{});
            }}/>
        </Suspense>
      )}
      {/* Campana flotante de mensajes (solo en el área de estudio) */}
      {phase==="course"&&!showDash&&(
        <button
          onClick={()=>{setDashTab("mensajes");setShowDash(true);}}
          title={T("Mensajes","Messages","Messages","Nachrichten","Mensagens","Messaggi")}
          style={{position:"fixed",bottom:"calc(74px + var(--install-offset, 0px))",right:18,zIndex:901,width:54,height:54,borderRadius:"50%",
            border:`1px solid ${C.gold}`,cursor:"pointer",
            background:`linear-gradient(135deg,${C.goldL},${C.gold})`,
            boxShadow:"0 6px 20px rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:23}}>
          ✉️
          {msgNoLeidos>0&&(
            <span style={{position:"absolute",top:-4,right:-4,minWidth:22,height:22,padding:"0 5px",
              borderRadius:11,background:"#C0392B",color:"#fff",fontSize:12,fontWeight:700,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontFamily:"'Cinzel',serif",border:"2px solid #0a1626"}}>
              {msgNoLeidos>99?"99+":msgNoLeidos}
            </span>
          )}
        </button>
      )}
      <InstallBar/>
    </div>
  );
}