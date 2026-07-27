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
import { FRow, Input, PasswordInput } from "./components/fields.jsx";
// Carga diferida: estas pantallas solo se descargan al abrir su pestaña
// (quedan fuera del bundle inicial, sin añadir peticiones a la ruta crítica).
const AgendaTab = lazy(() => import("./components/AgendaTab.jsx"));
const MensajesTab = lazy(() => import("./components/MensajesTab.jsx"));
const EncuadreModal = lazy(() => import("./components/EncuadreModal.jsx"));
const LoginModal = lazy(() => import("./components/LoginModal.jsx"));
import { C, BTN, INP, LBL, checkStyle, radioStyle, CARD, MODAL, FONT_READ, READ, OVERLAY } from "./ui.js";

// El cliente Supabase vive en ./supabaseClient.js y el runtime i18n
// (SUPPORTED_LANGS, detectLang, LANG, setAppLanguage, T, PICK, SINO) en
// ./i18n.js — ambos importados arriba.

// Cuando redirigimos al pago de Stripe (acción intencional), evitamos que el
// navegador muestre el diálogo "¿Abandonar sitio?".
let bypassUnload = false;
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

// ─── CLAVES TELEFÓNICAS INTERNACIONALES ───────────────────────────
const PHONE_CODES=[
  {c:"Antigua y Barbuda",code:"+1 268"},{c:"Argentina",code:"+54"},
  {c:"Aruba",code:"+297"},{c:"Bahamas",code:"+1 242"},
  {c:"Barbados",code:"+1 246"},{c:"Belice",code:"+501"},
  {c:"Bolivia",code:"+591"},{c:"Brasil",code:"+55"},
  {c:"Canadá",code:"+1"},{c:"Chile",code:"+56"},
  {c:"Colombia",code:"+57"},{c:"Costa Rica",code:"+506"},
  {c:"Cuba",code:"+53"},{c:"Curaçao",code:"+599"},
  {c:"Dominica",code:"+1 767"},{c:"Ecuador",code:"+593"},
  {c:"El Salvador",code:"+503"},{c:"España",code:"+34"},
  {c:"Estados Unidos",code:"+1"},{c:"Granada",code:"+1 473"},
  {c:"Guatemala",code:"+502"},{c:"Guyana",code:"+592"},
  {c:"Haití",code:"+509"},{c:"Honduras",code:"+504"},
  {c:"Jamaica",code:"+1 876"},{c:"México",code:"+52"},
  {c:"Nicaragua",code:"+505"},{c:"Panamá",code:"+507"},
  {c:"Paraguay",code:"+595"},{c:"Perú",code:"+51"},
  {c:"Puerto Rico",code:"+1 787"},{c:"Rep. Dominicana",code:"+1 809"},
  {c:"San Cristóbal y Nieves",code:"+1 869"},{c:"San Vicente",code:"+1 784"},
  {c:"Santa Lucía",code:"+1 758"},{c:"Surinam",code:"+597"},
  {c:"Trinidad y Tobago",code:"+1 868"},{c:"Uruguay",code:"+598"},
  {c:"Venezuela",code:"+58"},
];

// ─── DOCUMENTOS POR PAÍS ──────────────────────────────────────────
const CDOCS={
  "México":{l:"CURP",f:"Clave Única de Registro de Población",ph:"LOAM931018HDFRRS01"},
  "Argentina":{l:"DNI",f:"Documento Nacional de Identidad",ph:"12.345.678"},
  "España":{l:"DNI/NIE",f:"Documento Nacional de Identidad / NIE",ph:"12345678Z"},
  "Colombia":{l:"Cédula",f:"Cédula de Ciudadanía",ph:"1234567890"},
  "Chile":{l:"RUT",f:"Rol Único Tributario",ph:"12.345.678-9"},
  "Perú":{l:"DNI",f:"Documento Nacional de Identidad",ph:"12345678"},
  "Venezuela":{l:"CI",f:"Cédula de Identidad",ph:"V-12345678"},
  "Ecuador":{l:"CI",f:"Cédula de Identidad",ph:"1234567890"},
  "Bolivia":{l:"CI",f:"Cédula de Identidad",ph:"1234567"},
  "Paraguay":{l:"CI",f:"Cédula de Identidad",ph:"1234567"},
  "Uruguay":{l:"CI",f:"Cédula de Identidad",ph:"1.234.567-8"},
  "Brasil":{l:"CPF",f:"Cadastro de Pessoas Físicas",ph:"123.456.789-09"},
  "Cuba":{l:"CI",f:"Carnet de Identidad",ph:"90123456789"},
  "Rep. Dominicana":{l:"CIE",f:"Cédula de Identidad y Electoral",ph:"001-1234567-1"},
  "Guatemala":{l:"DPI",f:"Documento Personal de Identificación",ph:"1234 12345 1234"},
  "Honduras":{l:"DNI",f:"Tarjeta de Identidad Nacional",ph:"0101-1990-12345"},
  "El Salvador":{l:"DUI",f:"Documento Único de Identidad",ph:"00123456-7"},
  "Nicaragua":{l:"CI",f:"Cédula de Identidad Ciudadana",ph:"001-010190-0001X"},
  "Costa Rica":{l:"CI",f:"Cédula de Identidad",ph:"1-0123-0456"},
  "Panamá":{l:"CI",f:"Cédula de Identidad Personal",ph:"8-123-4567"},
  "Estados Unidos":{l:"SSN",f:"Social Security Number o State ID",ph:"123-45-6789"},
  "Canadá":{l:"SIN",f:"Social Insurance Number",ph:"123 456 789"},
  "Puerto Rico":{l:"SSN",f:"Social Security Number",ph:"123-45-6789"},
  "Haití":{l:"CIN",f:"Carte d'Identification Nationale",ph:"123-456-789-0"},
  "Jamaica":{l:"TRN",f:"Tax Registration Number",ph:"123-456-789"},
  "Trinidad y Tobago":{l:"ID Card",f:"National ID Card",ph:"12345678901"},
};
const COUNTRIES=Object.keys(CDOCS).sort();

// ─── CONTENIDO TRONCO COMÚN 1 (5 módulos, 21 temas + repaso) ─────
const TC1_MODULES=[
  {id:"m1",num:"I",
   es:"La Revelación y la Respuesta (El Encuentro)",
   en:"Revelation and Response (The Encounter)",
   videos:[
    {id:"t1",o:1,es:"El anhelo de Dios",en:"The Longing for God",dur:"30 min",mod:"I"},
    {id:"t2",o:2,es:"La Revelación Divina",en:"Divine Revelation",dur:"30 min",mod:"I"},
    {id:"t3",o:3,es:"La Fe: Respuesta al llamado de Dios",en:"Faith: Response to God's Call",dur:"30 min",mod:"I"},
  ]},
  {id:"m2",num:"II",
   es:"La Profesión de Fe (El Credo)",
   en:"The Profession of Faith (The Creed)",
   videos:[
    {id:"t4",o:4,es:"Dios Padre: Creador y Providencia",en:"God the Father: Creator",dur:"30 min",mod:"II"},
    {id:"t5",o:5,es:"Jesucristo: Verdadero Dios y Verdadero Hombre",en:"Jesus Christ: True God and True Man",dur:"30 min",mod:"II"},
    {id:"t6",o:6,es:"El Misterio Pascual: Pasión, Muerte y Resurrección",en:"The Paschal Mystery",dur:"30 min",mod:"II"},
    {id:"t7",o:7,es:"El Espíritu Santo: Señor y Dador de Vida",en:"The Holy Spirit: Lord and Giver of Life",dur:"30 min",mod:"II"},
    {id:"t8",o:8,es:"La Iglesia: Una, Santa, Católica y Apostólica",en:"The Church: One, Holy, Catholic, Apostolic",dur:"30 min",mod:"II"},
    {id:"t9",o:9,es:"María: Madre de Dios y Madre de la Iglesia",en:"Mary: Mother of God and the Church",dur:"30 min",mod:"II"},
  ]},
  {id:"m3",num:"III",
   es:"La Celebración del Misterio Cristiano (Los Sacramentos)",
   en:"The Celebration of the Christian Mystery",
   videos:[
    {id:"t10",o:10,es:"La Liturgia y los Sacramentos",en:"Liturgy and the Sacraments",dur:"30 min",mod:"III"},
    {id:"t11",o:11,es:"Introducción al Bautismo",en:"Introduction to Baptism",dur:"30 min",mod:"III"},
    {id:"t12",o:12,es:"Introducción a la Confirmación",en:"Introduction to Confirmation",dur:"30 min",mod:"III"},
    {id:"t13",o:13,es:"Introducción a la Eucaristía",en:"Introduction to the Eucharist",dur:"30 min",mod:"III"},
    {id:"t14",o:14,es:"Sacramentos de Sanación: Reconciliación y Unción",en:"Sacraments of Healing",dur:"30 min",mod:"III"},
  ]},
  {id:"m4",num:"IV",
   es:"La Vida en Cristo (La Moral Cristiana)",
   en:"Life in Christ (Christian Morality)",
   videos:[
    {id:"t15",o:15,es:"Dignidad de la persona y libertad humana",en:"Human Dignity and Freedom",dur:"30 min",mod:"IV"},
    {id:"t16",o:16,es:"El pecado y la gracia de Dios",en:"Sin and God's Grace",dur:"30 min",mod:"IV"},
    {id:"t17",o:17,es:"Los Diez Mandamientos",en:"The Ten Commandments",dur:"30 min",mod:"IV"},
    {id:"t18",o:18,es:"La Ley Evangélica y las Bienaventuranzas",en:"The Gospel Law and the Beatitudes",dur:"30 min",mod:"IV"},
  ]},
  {id:"m5",num:"V",
   es:"La Oración Cristiana (El Diálogo íntimo)",
   en:"Christian Prayer (The Intimate Dialogue)",
   videos:[
    {id:"t19",o:19,es:"¿Qué es la oración? Tipos de oración",en:"What is Prayer? Types of Prayer",dur:"30 min",mod:"V"},
    {id:"t20",o:20,es:"Formas de expresión: Oración, Meditación y Contemplación",en:"Forms of Prayer",dur:"30 min",mod:"V"},
    {id:"t21",o:21,es:"El Padre Nuestro: El resumen del Evangelio",en:"The Our Father: Summary of the Gospel",dur:"30 min",mod:"V"},
  ]},
  {id:"mR",num:"★",es:"Evaluación Final",en:"Final Evaluation",
   videos:[{id:"t_rep",o:22,es:"Repaso Final — Tronco Común 1",en:"Final Review — Common Core 1",dur:"45 min",mod:"★",repaso:true}]},
];
const TC1_ALL = TC1_MODULES.flatMap(m=>m.videos);

// ─── CONTENIDO TC2 (Confesión + Unción) ───────────────────────────
const TC2_CONFESION=[
  {id:"cf1",o:1,es:"¿Qué es el Sacramento de la Reconciliación?",en:"The Sacrament of Reconciliation",dur:"30 min"},
  {id:"cf2",o:2,es:"Los actos del penitente: Contrición, Confesión y Satisfacción",en:"Acts of the Penitent",dur:"30 min"},
  {id:"cf3",o:3,es:"Los efectos de la Confesión",en:"Effects of Confession",dur:"30 min"},
  {id:"cf4",o:4,es:"Cómo hacer una buena Confesión",en:"How to Make a Good Confession",dur:"30 min"},
  {id:"cf_r",o:5,es:"Repaso Final — La Confesión",en:"Final Review — Confession",dur:"30 min",repaso:true},
];
const TC2_UNCION=[
  {id:"un1",o:1,es:"¿Qué es el Sacramento de la Unción de los Enfermos?",en:"The Sacrament of Anointing of the Sick",dur:"30 min"},
  {id:"un2",o:2,es:"Los efectos de la Unción y quiénes lo reciben",en:"Effects and Recipients",dur:"30 min"},
  {id:"un3",o:3,es:"La celebración de la Unción de los Enfermos",en:"Celebrating the Anointing",dur:"30 min"},
  {id:"un_r",o:4,es:"Repaso Final — La Unción",en:"Final Review — Anointing",dur:"30 min",repaso:true},
];

// ─── CURSOS SACRAMENTOS ESPECÍFICOS ───────────────────────────────
// ─── MÓDULO 0 · KERIGMA ───────────────────────────────────────────
// Cimiento espiritual previo a TC1. Aplica SOLO a catecúmenos de Bautismo,
// Confirmación y Primera Comunión (una sola vez, aunque cursen los 3). No
// aplica a papás (prebautismal) ni padrinos. Por ahora 1 video con evaluación;
// ampliable desde el panel admin.
const KERIGMA=[
  {id:"kg1",o:1,es:"El Kerigma: el primer anuncio del Evangelio",en:"The Kerygma: the first proclamation of the Gospel",fr:"Le Kérygme : la première annonce de l'Évangile",de:"Das Kerygma: die erste Verkündigung des Evangeliums",pt:"O Querigma: o primeiro anúncio do Evangelho",it:"Il Kerygma: il primo annuncio del Vangelo",dur:"30 min"},
];
const COURSES={
  bautismo:[
    {id:"bv1",o:1,es:"¿Qué es el Bautismo?",en:"What is Baptism?",dur:"30 min"},
    {id:"bv2",o:2,es:"El Agua: Símbolo de vida nueva",en:"Water: Symbol of New Life",dur:"30 min"},
    {id:"bv3",o:3,es:"El Rito Bautismal y sus signos",en:"The Baptismal Rite and Its Signs",dur:"30 min"},
    {id:"bv_r",o:4,es:"Repaso Final — Bautismo",en:"Final Review — Baptism",dur:"30 min",repaso:true},
  ],
  primera_comunion:[
    {id:"pv1",o:1,es:"La Eucaristía en la historia de la salvación",en:"The Eucharist in Salvation History",dur:"30 min"},
    {id:"pv2",o:2,es:"La Presencia Real: La Transubstanciación",en:"The Real Presence: Transubstantiation",dur:"30 min"},
    {id:"pv3",o:3,es:"Preparación espiritual para la Primera Comunión",en:"Spiritual Preparation",dur:"30 min"},
    {id:"pv4",o:4,es:"La Santa Misa: El Sacrificio Eucarístico",en:"Holy Mass: The Eucharistic Sacrifice",dur:"30 min"},
    {id:"pv_r",o:5,es:"Repaso Final — Primera Comunión",en:"Final Review — First Communion",dur:"30 min",repaso:true},
  ],
  confirmacion:[
    {id:"cv1",o:1,es:"El Espíritu Santo en la Iglesia y en el creyente",en:"The Holy Spirit in the Church",dur:"30 min"},
    {id:"cv2",o:2,es:"Los 7 Dones del Espíritu Santo",en:"The 7 Gifts of the Holy Spirit",dur:"30 min"},
    {id:"cv3",o:3,es:"La Confirmación en la Sagrada Escritura",en:"Confirmation in Scripture",dur:"30 min"},
    {id:"cv4",o:4,es:"Ser testigo de Cristo en el mundo",en:"Being a Witness of Christ",dur:"30 min"},
    {id:"cv5",o:5,es:"El Rito de la Confirmación",en:"The Rite of Confirmation",dur:"30 min"},
    {id:"cv_r",o:6,es:"Repaso Final — Confirmación",en:"Final Review — Confirmation",dur:"30 min",repaso:true},
  ],
  prebautismal:[
    {id:"pb1",o:1,es:"El sentido y propósito del Bautismo Infantil",en:"The Meaning of Infant Baptism",dur:"30 min"},
    {id:"pb2",o:2,es:"El papel de los padres en el Bautismo",en:"Parents' Role in Baptism",dur:"30 min"},
    {id:"pb3",o:3,es:"Los signos y símbolos del Bautismo",en:"Signs and Symbols of Baptism",dur:"30 min"},
    {id:"pb_r",o:4,es:"Repaso Final — Formación Prebautismal",en:"Final Review — Pre-Baptismal",dur:"30 min",repaso:true},
  ],
  catequista:[
    {id:"cq1",o:1,es:"1.1 ¿Qué es la Neuropedagogía? Definición, neuromitos y neuroplasticidad",en:"1.1 What is Neuropedagogy? Definition, neuromyths and neuroplasticity",dur:"30 min"},
    {id:"cq2",o:2,es:"1.2 El encuentro entre Ciencia y Fe. Evitar el reduccionismo biológico",en:"1.2 The Encounter between Science and Faith. Avoiding biological reductionism",dur:"30 min"},
    {id:"cq3",o:3,es:"1.3 Anatomía básica para catequistas. El cerebro triuno simplificado",en:"1.3 Basic Anatomy for Catechists. The simplified triune brain",dur:"30 min"},
    {id:"cq_r",o:4,es:"Repaso Final — Módulo I",en:"Final Review — Module I",dur:"30 min",repaso:true},
  ],
};

// ─── PREGUNTAS TC1 (5 por tema, escala 10 pts, necesita ≥8) ──────
// Formato: {id, q, o:{a,b,c,d}, k:"letra_correcta"}
const Q={
  t1:[
    {id:1,q:"¿Qué afirma San Agustín sobre el corazón humano?",o:{a:"Es naturalmente bueno",b:"Está inquieto hasta descansar en Dios",c:"Es autosuficiente",d:"Busca solo el placer"},k:"b"},
    {id:2,q:"¿Por qué puede el hombre conocer a Dios por la razón?",o:{a:"Por revelación especial únicamente",b:"Es imposible sin la fe",c:"Porque las obras visibles revelan al Creador invisible",d:"Solo mediante la filosofía moderna"},k:"c"},
    {id:3,q:"¿Qué significa que Dios 'toma la iniciativa' con el hombre?",o:{a:"Que el hombre crea a Dios",b:"Que Dios nos busca antes de que lo busquemos",c:"Que la religión es obra humana",d:"Que Dios necesita al hombre"},k:"b"},
    {id:4,q:"Según el CIC n.27, el deseo de Dios en el hombre es...",o:{a:"Un invento de la Iglesia",b:"Opcional y personal",c:"Natural e inscrito en su corazón",d:"Solo emocional"},k:"c"},
    {id:5,q:"La 'vía cosmológica' para conocer a Dios argumenta que...",o:{a:"La Biblia prueba a Dios",b:"Todo efecto tiene una Causa Primera",c:"La ciencia confirma la fe",d:"El universo es eterno"},k:"b"},
  ],
  t2:[
    {id:1,q:"¿Cuáles son las dos fuentes de la Palabra de Dios?",o:{a:"La razón y la fe",b:"Los Evangelios y las cartas de Pablo",c:"La Sagrada Escritura y la Sagrada Tradición",d:"El Papa y los Concilios"},k:"c"},
    {id:2,q:"El Concilio Vaticano II sobre la Revelación se expresó en la Constitución...",o:{a:"Gaudium et Spes",b:"Lumen Gentium",c:"Dei Verbum",d:"Sacrosanctum Concilium"},k:"c"},
    {id:3,q:"La inspiración bíblica significa que...",o:{a:"Los autores inventaron los relatos",b:"Dios es el autor principal y los humanos sus instrumentos",c:"Todo es alegoría",d:"Solo el NT es inspirado"},k:"b"},
    {id:4,q:"¿Qué es el 'Depósito de la fe'?",o:{a:"Los objetos sagrados de la Iglesia",b:"Los fondos económicos del Vaticano",c:"Las verdades reveladas por Dios entregadas a la Iglesia",d:"Los documentos del Concilio Vaticano I"},k:"c"},
    {id:5,q:"El Magisterio tiene autoridad para...",o:{a:"Crear nuevos dogmas a su arbitrio",b:"Interpretar auténticamente la Palabra de Dios",c:"Cambiar la Sagrada Escritura",d:"Suprimir libros bíblicos"},k:"b"},
  ],
  t3:[
    {id:1,q:"La fe teológica es ante todo...",o:{a:"Un sentimiento religioso",b:"Un don gratuito de Dios",c:"Una conclusión filosófica",d:"Una obligación cultural"},k:"b"},
    {id:2,q:"¿Qué es el acto de fe?",o:{a:"Recitar el Credo",b:"Ir a Misa todos los domingos",c:"La libre adhesión personal a Dios y su Revelación",d:"Recibir los sacramentos"},k:"c"},
    {id:3,q:"La carta de Santiago enseña que la fe sin obras es...",o:{a:"Suficiente para salvarse",b:"La fe más pura",c:"Fe muerta",d:"El ideal cristiano"},k:"c"},
    {id:4,q:"¿Cuál es el objeto formal de la fe?",o:{a:"La Biblia",b:"La Iglesia",c:"Los milagros",d:"Dios mismo, verdad primera que no puede engañar"},k:"d"},
    {id:5,q:"La fe salva porque...",o:{a:"Nos hace mejores personas",b:"Une al hombre con Cristo y le da vida divina",c:"Nos da tranquilidad emocional",d:"Es una virtud moral"},k:"b"},
  ],
  t4:[
    {id:1,q:"¿Qué significa 'Creador ex nihilo'?",o:{a:"Dios usó materia preexistente",b:"La creación es un proceso evolutivo",c:"Dios creó todo de la nada",d:"El universo siempre existió"},k:"c"},
    {id:2,q:"La Providencia divina significa que Dios...",o:{a:"Abandona su creación al azar",b:"Conduce todas las cosas hacia su fin con sabiduría y amor",c:"Solo interviene en los milagros",d:"Permite el mal sin razón"},k:"b"},
    {id:3,q:"¿Cuántas Personas hay en la Santísima Trinidad?",o:{a:"Una",b:"Dos",c:"Tres",d:"Cuatro"},k:"c"},
    {id:4,q:"¿Por qué Dios es llamado 'Padre'?",o:{a:"Porque tiene género masculino",b:"Porque nos creó y nos sostiene con amor paternal",c:"Es solo una metáfora social",d:"Porque Jesús lo eligió arbitrariamente"},k:"b"},
    {id:5,q:"La creación es...",o:{a:"Una necesidad de Dios",b:"Un acto de amor gratuito de Dios",c:"Un error que necesita redención",d:"Obra de ángeles"},k:"b"},
  ],
  t5:[
    {id:1,q:"¿Qué enseña el dogma de la 'Unión Hipostática'?",o:{a:"Jesús tiene dos personas y dos naturalezas",b:"Jesús es solo Dios, no hombre",c:"Jesús es una sola Persona con dos naturalezas completas",d:"Jesús tiene una naturaleza mixta"},k:"c"},
    {id:2,q:"La Encarnación del Hijo de Dios fue...",o:{a:"Un espejismo",b:"Real: el Verbo tomó verdadera naturaleza humana",c:"Solo simbólica",d:"Temporal, sin cuerpo real"},k:"b"},
    {id:3,q:"¿Qué significa 'Emmanuel'?",o:{a:"Señor salva",b:"Rey de reyes",c:"Dios con nosotros",d:"Hijo del hombre"},k:"c"},
    {id:4,q:"¿En qué ciudad nació Jesús?",o:{a:"Nazaret",b:"Jerusalén",c:"Cafarnaúm",d:"Belén"},k:"d"},
    {id:5,q:"El concilio que definió las dos naturalezas de Cristo fue...",o:{a:"Nicea (325)",b:"Constantinopla (381)",c:"Éfeso (431)",d:"Calcedonia (451)"},k:"d"},
  ],
  t6:[
    {id:1,q:"¿Qué evento constituye el 'núcleo del Evangelio'?",o:{a:"El Sermón del Monte",b:"La multiplicación de panes",c:"La Pasión, Muerte y Resurrección de Jesús",d:"La Última Cena únicamente"},k:"c"},
    {id:2,q:"La Resurrección de Jesús fue...",o:{a:"Un mito para dar esperanza",b:"Solo espiritual, no corporal",c:"Un hecho histórico: su cuerpo glorificado resucitó",d:"Una visión de los apóstoles"},k:"c"},
    {id:3,q:"¿Qué significa la Ascensión de Jesús?",o:{a:"Que Jesús desapareció para siempre",b:"Que Jesús subió en cuerpo glorificado a la derecha del Padre",c:"Que su espíritu subió al cielo",d:"Que los apóstoles perdieron su guía"},k:"b"},
    {id:4,q:"Con su muerte, Jesús...",o:{a:"Demostró que era humano",b:"Fracasó en su misión",c:"Nos redimió del pecado y de la muerte",d:"Fue abandonado definitivamente por Dios"},k:"c"},
    {id:5,q:"'Misterio Pascual' se refiere a...",o:{a:"Solo a la Pascua judía",b:"La Pasión, Muerte, Resurrección y Ascensión de Cristo",c:"La última Cena únicamente",d:"La Navidad de Jesús"},k:"b"},
  ],
  t7:[
    {id:1,q:"¿A qué fiesta conmemora la venida del Espíritu Santo?",o:{a:"Navidad",b:"Pascua",c:"Pentecostés",d:"Epifanía"},k:"c"},
    {id:2,q:"¿Cuántos son los dones del Espíritu Santo?",o:{a:"Tres",b:"Cinco",c:"Siete",d:"Nueve"},k:"c"},
    {id:3,q:"El Espíritu Santo procede del Padre...",o:{a:"Solo",b:"Y del Hijo (Filioque)",c:"Y de los apóstoles",d:"Y de María"},k:"b"},
    {id:4,q:"¿Cuál es el símbolo bíblico más conocido del Espíritu Santo?",o:{a:"El cordero",b:"El pez",c:"La paloma",d:"El pan"},k:"c"},
    {id:5,q:"El Espíritu Santo actúa principalmente...",o:{a:"En los milagros visibles únicamente",b:"En los apóstoles solamente",c:"Animando a la Iglesia y santificando a los creyentes",d:"En el Antiguo Testamento"},k:"c"},
  ],
  t8:[
    {id:1,q:"¿Cuáles son las cuatro marcas de la Iglesia?",o:{a:"Romana, Apostólica, Latina y Misionera",b:"Una, Santa, Católica y Apostólica",c:"Bíblica, Sacramental, Jerárquica y Misionera",d:"Papal, Conciliar, Universal y Local"},k:"b"},
    {id:2,q:"¿Quién es la cabeza visible de la Iglesia en la tierra?",o:{a:"Los cardenales",b:"El concilio ecuménico",c:"El Papa",d:"Los obispos en conjunto"},k:"c"},
    {id:3,q:"El 'Cuerpo Místico de Cristo' se refiere a...",o:{a:"Las reliquias de Jesús",b:"La Iglesia, unida a Cristo como su cabeza",c:"La Eucaristía únicamente",d:"Los mártires de la Iglesia"},k:"b"},
    {id:4,q:"La 'comunión de los santos' incluye...",o:{a:"Solo a los canonizados",b:"A los fieles en la tierra, en el purgatorio y en el cielo",c:"Solo a los sacerdotes",d:"Solo a los que viven virtuosamente"},k:"b"},
    {id:5,q:"La sucesión apostólica garantiza...",o:{a:"Que los sacerdotes son perfectos",b:"La continuidad del ministerio de los apóstoles en la Iglesia",c:"Que el Papa siempre tiene razón",d:"Que los dogmas cambian con el tiempo"},k:"b"},
  ],
  t9:[
    {id:1,q:"¿Qué es la Inmaculada Concepción?",o:{a:"La concepción virginal de Jesús",b:"María fue concebida sin pecado original por gracia de Dios",c:"María es Dios",d:"María no tuvo hijos"},k:"b"},
    {id:2,q:"¿Qué proclama el dogma de la Asunción de María?",o:{a:"María fue al cielo en espíritu solamente",b:"María murió y sus restos están en Jerusalén",c:"Al fin de su vida, María fue asunta en cuerpo y alma al cielo",d:"María aún vive en la tierra"},k:"c"},
    {id:3,q:"En el Concilio de Éfeso (431), María fue proclamada...",o:{a:"Reina del Universo",b:"Theotokos (Madre de Dios)",c:"Mediadora de todas las gracias",d:"Corredentora"},k:"b"},
    {id:4,q:"¿Cuál es el papel de María en la salvación?",o:{a:"Igual al de Cristo",b:"Solo fue madre biológica de Jesús",c:"Colaboradora y Madre del Redentor y de la Iglesia",d:"No tiene papel específico"},k:"c"},
    {id:5,q:"La devoción mariana en la Iglesia Católica incluye...",o:{a:"Adoración igual a la de Dios",b:"Solo el rezo del Rosario",c:"Veneración (hiperdulía) y petición de intercesión",d:"Creer que María es divina"},k:"c"},
  ],
  t10:[
    {id:1,q:"Un sacramento es...",o:{a:"Un rito inventado por la Iglesia",b:"Un signo eficaz de la gracia instituido por Cristo",c:"Una ceremonia de tradición cultural",d:"Solo un símbolo sin efecto real"},k:"b"},
    {id:2,q:"¿Cuántos sacramentos hay en la Iglesia Católica?",o:{a:"Cinco",b:"Seis",c:"Siete",d:"Doce"},k:"c"},
    {id:3,q:"'Ex opere operato' significa que los sacramentos...",o:{a:"Dependen de la virtud del sacerdote",b:"Producen su efecto por el rito mismo, por la acción de Cristo",c:"Son solo simbólicos",d:"Solo funcionan con fe perfecta"},k:"b"},
    {id:4,q:"¿Qué es la liturgia?",o:{a:"Solo la Misa dominical",b:"La participación del Pueblo de Dios en la obra de Dios",c:"Los cantos religiosos",d:"El vestido del sacerdote"},k:"b"},
    {id:5,q:"Los sacramentos de iniciación son...",o:{a:"Bautismo, Eucaristía y Matrimonio",b:"Bautismo, Confirmación y Eucaristía",c:"Bautismo, Penitencia y Unción",d:"Solo el Bautismo"},k:"b"},
  ],
  t11:[
    {id:1,q:"¿Qué efecto principal tiene el Bautismo?",o:{a:"La ordenación sacerdotal",b:"El perdón del pecado original y la incorporación a la Iglesia",c:"La confirmación en la fe",d:"El acceso a la Eucaristía únicamente"},k:"b"},
    {id:2,q:"¿Cuál es la materia del Bautismo?",o:{a:"El aceite",b:"La sal",c:"El agua",d:"El pan"},k:"c"},
    {id:3,q:"El carácter bautismal es...",o:{a:"Temporal, dura un año",b:"Imborrable e irrepetible",c:"Solo espiritual, sin efecto real",d:"Se pierde con el pecado mortal"},k:"b"},
    {id:4,q:"¿Por qué el Bautismo es 'la puerta de la fe'?",o:{a:"Porque da acceso al templo",b:"Porque sin él no se puede recibir ningún otro sacramento",c:"Porque se recita el Credo",d:"Porque es el más antiguo"},k:"b"},
    {id:5,q:"¿Quién puede bautizar en caso de necesidad?",o:{a:"Solo el obispo",b:"Solo sacerdotes ordenados",c:"Cualquier persona con agua e intención debida",d:"Solo los diáconos"},k:"c"},
  ],
  t12:[
    {id:1,q:"La Confirmación perfecciona...",o:{a:"El Matrimonio",b:"La gracia bautismal y une más plenamente a la Iglesia",c:"La Eucaristía",d:"El Orden sacerdotal"},k:"b"},
    {id:2,q:"El signo externo de la Confirmación es...",o:{a:"El agua",b:"El pan y el vino",c:"La imposición de manos y la unción con el Santo Crisma",d:"La sal y el aceite de oliva"},k:"c"},
    {id:3,q:"¿Qué significa 'Confirmación'?",o:{a:"Confirmación de los votos bautismales únicamente",b:"El 'sello' del Espíritu Santo que fortalece y envía",c:"Aprobación de los estudios religiosos",d:"Ratificación del Bautismo recibido de infante"},k:"b"},
    {id:4,q:"La Confirmación deja...",o:{a:"Una mancha en el alma",b:"Un carácter espiritual imborrable",c:"Solo un recuerdo",d:"Una deuda con la Iglesia"},k:"b"},
    {id:5,q:"El ministro ordinario de la Confirmación es...",o:{a:"El sacerdote párroco",b:"El Papa",c:"El obispo",d:"El diácono"},k:"c"},
  ],
  t13:[
    {id:1,q:"La Eucaristía es 'fuente y culmen' de la vida cristiana porque...",o:{a:"Es la más antigua",b:"Contiene y da a Cristo mismo",c:"Es obligatoria los domingos",d:"Fue la última institución de Jesús"},k:"b"},
    {id:2,q:"La Transubstanciación enseña que...",o:{a:"El pan y el vino son símbolos de Cristo",b:"La sustancia del pan y el vino se convierten real y verdaderamente en el Cuerpo y Sangre de Cristo",c:"Cristo está presente solo espiritualmente",d:"Solo el sacerdote puede recibir el Cuerpo de Cristo"},k:"b"},
    {id:3,q:"¿Cuándo instituyó Jesús la Eucaristía?",o:{a:"En las bodas de Caná",b:"En la multiplicación de los panes",c:"En la Última Cena",d:"En la Ascensión"},k:"c"},
    {id:4,q:"Para recibir la Comunión se requiere...",o:{a:"Ser sacerdote",b:"Estar en gracia de Dios y en ayuno eucarístico",c:"Solo ser bautizado",d:"Saber leer la Biblia"},k:"b"},
    {id:5,q:"El sacrificio de la Misa es...",o:{a:"Una repetición del Calvario",b:"Una representación teatral",c:"La actualización del único sacrificio de Cristo",d:"Un sacrificio nuevo cada domingo"},k:"c"},
  ],
  t14:[
    {id:1,q:"¿Para qué es necesaria la Confesión antes de la Eucaristía?",o:{a:"Es solo una tradición opcional",b:"Para estar en estado de gracia y evitar la comunión indigna",c:"Solo si se tiene pecado mortal público",d:"El sacerdote lo decide caso por caso"},k:"b"},
    {id:2,q:"¿Quiénes pueden recibir la Unción de los Enfermos?",o:{a:"Solo los que van a morir en horas",b:"Solo los que tienen más de 70 años",c:"Los fieles en peligro de muerte por enfermedad o vejez",d:"Cualquier cristiano que lo pida"},k:"c"},
    {id:3,q:"Los efectos de la Reconciliación incluyen...",o:{a:"Solo el perdón externo",b:"El perdón de los pecados, reconciliación con Dios y la Iglesia",c:"Solo la tranquilidad psicológica",d:"La eliminación de las consecuencias civiles del pecado"},k:"b"},
    {id:4,q:"La Unción de los Enfermos fue instituida por...",o:{a:"San Pablo",b:"La Iglesia primitiva",c:"Jesucristo, referida en Santiago 5,14",d:"El Concilio de Trento"},k:"c"},
    {id:5,q:"El signo externo de la Unción es...",o:{a:"Agua bendita",b:"Imposición de manos y unción con Óleo de enfermos",c:"Incienso",d:"Pan sin levadura"},k:"b"},
  ],
  t15:[
    {id:1,q:"¿En qué se basa la dignidad de la persona humana?",o:{a:"En sus logros personales",b:"En haber sido creada a imagen y semejanza de Dios",c:"En su inteligencia",d:"En su posición social"},k:"b"},
    {id:2,q:"La libertad humana en la perspectiva cristiana es...",o:{a:"Hacer lo que quiero sin restricciones",b:"Un don para el bien, orientada hacia Dios",c:"Solo una ilusión",d:"Condicionada solo por las leyes civiles"},k:"b"},
    {id:3,q:"¿Qué es la ley moral natural?",o:{a:"Las leyes del Estado",b:"Una regla inventada por la Iglesia",c:"La participación de la criatura racional en la ley eterna de Dios",d:"Los instintos humanos básicos"},k:"c"},
    {id:4,q:"La conciencia moral es...",o:{a:"La voz de la sociedad",b:"La opinión personal sin restricciones",c:"El juicio de la razón que reconoce la bondad moral de un acto",d:"El sentimiento de culpa únicamente"},k:"c"},
    {id:5,q:"'Imago Dei' significa que el hombre...",o:{a:"Es un dios menor",b:"Fue creado a imagen y semejanza de Dios",c:"Puede conocer todo como Dios",d:"Tiene naturaleza divina"},k:"b"},
  ],
  t16:[
    {id:1,q:"¿Cuáles son las tres condiciones del pecado mortal?",o:{a:"Intención, acción y resultado",b:"Materia grave, pleno conocimiento y deliberado consentimiento",c:"Frecuencia, gravedad e impacto social",d:"Voluntad, emoción y circunstancias"},k:"b"},
    {id:2,q:"¿Qué es la gracia santificante?",o:{a:"Un premio por buenas obras",b:"La participación en la vida divina que hace al hombre hijo de Dios",c:"La iluminación intelectual",d:"Un sentimiento de paz interior"},k:"b"},
    {id:3,q:"¿Qué es la justificación?",o:{a:"Demostrar que no se pecó",b:"El proceso por el que Dios por su gracia hace justo al hombre",c:"El juicio final",d:"La declaración de inocencia en el juicio"},k:"b"},
    {id:4,q:"El pecado venial...",o:{a:"No daña la relación con Dios",b:"Rompe totalmente la comunión con Dios",c:"Debilita la caridad y el amor a Dios sin destruirlos",d:"Tiene consecuencias solo en esta vida"},k:"c"},
    {id:5,q:"¿Qué es la gracia actual?",o:{a:"La gracia que se recibe en la Misa",b:"Una ayuda transitoria de Dios para obrar el bien",c:"El estado permanente de santidad",d:"La gracia recibida en el Bautismo"},k:"b"},
  ],
  t17:[
    {id:1,q:"¿Cuáles son los tres primeros mandamientos?",o:{a:"Amar a Dios, al prójimo y a la naturaleza",b:"Amor a Dios: No tener dioses ajenos, no usar el nombre en vano, santificar el día del Señor",c:"No matar, no robar, no mentir",d:"Fe, Esperanza y Caridad"},k:"b"},
    {id:2,q:"El cuarto mandamiento ordena...",o:{a:"No codiciar los bienes ajenos",b:"No cometer adulterio",c:"Honrar al padre y a la madre",d:"No jurar en falso"},k:"c"},
    {id:3,q:"¿Qué prohíbe el quinto mandamiento?",o:{a:"El matrimonio fuera de la Iglesia",b:"Cualquier daño a la vida humana",c:"El consumo de alcohol",d:"El divorcio"},k:"b"},
    {id:4,q:"El octavo mandamiento prohíbe...",o:{a:"El robo de bienes materiales",b:"La fornicación",c:"El falso testimonio y la mentira",d:"La idolatría"},k:"c"},
    {id:5,q:"Jesús resumió el Decálogo en...",o:{a:"Las Bienaventuranzas",b:"El mandamiento del amor a Dios y al prójimo",c:"El Padrenuestro",d:"Las obras de misericordia"},k:"b"},
  ],
  t18:[
    {id:1,q:"¿Cuántas Bienaventuranzas proclamó Jesús en el Sermón del Monte?",o:{a:"Cinco",b:"Siete",c:"Ocho",d:"Diez"},k:"c"},
    {id:2,q:"El 'mandamiento nuevo' de Jesús es...",o:{a:"Observar los diez mandamientos",b:"Amarnos los unos a los otros como Él nos amó",c:"Hacer el bien y evitar el mal",d:"Respetar a los sacerdotes"},k:"b"},
    {id:3,q:"La primera Bienaventuranza dice...",o:{a:"Bienaventurados los que lloran",b:"Bienaventurados los misericordiosos",c:"Bienaventurados los pobres de espíritu, porque de ellos es el Reino",d:"Bienaventurados los mansos"},k:"c"},
    {id:4,q:"¿Cuál es la diferencia entre la ley de Moisés y la Ley Evangélica?",o:{a:"La Ley de Moisés es más exigente",b:"La Ley Evangélica pide más: actitudes del corazón y amor sin límites",c:"Son prácticamente iguales",d:"La Ley Evangélica anuló completamente la de Moisés"},k:"b"},
    {id:5,q:"Las Bienaventuranzas enseñan el camino a...",o:{a:"El éxito mundano",b:"La prosperidad económica",c:"La verdadera felicidad y la vida eterna",d:"El reconocimiento social"},k:"c"},
  ],
  t19:[
    {id:1,q:"¿Cómo define el Catecismo la oración?",o:{a:"Una actividad religiosa opcional",b:"La elevación del alma a Dios o la petición de bienes convenientes",c:"Solo la recitación del Rosario",d:"Un ritual litúrgico obligatorio"},k:"b"},
    {id:2,q:"¿Cuáles son los seis tipos de oración según el CIC?",o:{a:"Matutina, vespertina, del mediodía, nocturna, de ayuno y de acción",b:"Bendición, adoración, petición, intercesión, acción de gracias y alabanza",c:"Personal, comunitaria, litúrgica, espontánea, formal y contemplativa",d:"Vocal, mental, afectiva, de súplica, de agradecimiento y de amor"},k:"b"},
    {id:3,q:"La oración de 'petición' se diferencia de la 'intercesión' en que...",o:{a:"No hay diferencia real",b:"La petición es para uno mismo; la intercesión es pedir por otros",c:"La intercesión es solo para los sacerdotes",d:"La petición es solo para necesidades materiales"},k:"b"},
    {id:4,q:"¿Qué es la 'oración de alabanza'?",o:{a:"Pedir cosas a Dios",b:"Agradecer los bienes recibidos",c:"Reconocer a Dios por quien Él es, sin pedir nada",d:"Confesar los pecados"},k:"c"},
    {id:5,q:"¿Por qué Jesús se retiraba a orar?",o:{a:"Para descansar de la multitud",b:"Para dar ejemplo y mantener su comunión con el Padre",c:"Era una obligación cultural de su tiempo",d:"Para memorizar la Escritura"},k:"b"},
  ],
  t20:[
    {id:1,q:"¿Qué es la Lectio Divina?",o:{a:"Leer la Biblia rápidamente",b:"Lectura orante de la Escritura: leer, meditar, orar y contemplar",c:"Un curso bíblico académico",d:"Solo para religiosos y sacerdotes"},k:"b"},
    {id:2,q:"La oración vocal se caracteriza por...",o:{a:"No necesitar palabras",b:"Usar palabras (habladas o pensadas) para dirigirse a Dios",c:"Ser únicamente la oración litúrgica",d:"Solo rezar fórmulas aprendidas"},k:"b"},
    {id:3,q:"La meditación cristiana busca...",o:{a:"El vaciamiento de la mente",b:"Estados alterados de conciencia",c:"Aplicar la inteligencia, imaginación y afecto a la Palabra de Dios",d:"La relajación física únicamente"},k:"c"},
    {id:4,q:"La contemplación es...",o:{a:"Una forma de filosofía",b:"Un reposo orante en Dios, fruto de la meditación sostenida",c:"Solo para místicos",d:"La oración litúrgica pública"},k:"b"},
    {id:5,q:"La Liturgia de las Horas (Breviario) es...",o:{a:"Solo para religiosos",b:"La oración oficial de la Iglesia que santifica las horas del día",c:"Un libro opcional de devociones",d:"Un sustituto de la Misa"},k:"b"},
  ],
  t21:[
    {id:1,q:"Tertuliano llamó al Padrenuestro...",o:{a:"La oración de los mártires",b:"El resumen de todo el Evangelio",c:"La oración más larga de la Biblia",d:"La primera oración cristiana"},k:"b"},
    {id:2,q:"¿Cuántas peticiones tiene el Padrenuestro?",o:{a:"Cinco",b:"Seis",c:"Siete",d:"Nueve"},k:"c"},
    {id:3,q:"'Hágase tu voluntad en la tierra como en el cielo' expresa...",o:{a:"Una resignación pasiva",b:"La adhesión activa al proyecto amoroso de Dios",c:"La aceptación del sufrimiento",d:"El deseo de ir al cielo"},k:"b"},
    {id:4,q:"'Perdónanos nuestras ofensas como también nosotros perdonamos' enseña que...",o:{a:"El perdón de Dios es condicional a nuestro perdón",b:"El perdón de Dios está vinculado a nuestra disposición de perdonar",c:"Dios perdona sin importar nuestras acciones",d:"Solo los sacerdotes pueden perdonar"},k:"b"},
    {id:5,q:"¿Por qué el Padrenuestro dice 'Padre nuestro' y no 'Padre mío'?",o:{a:"Es una fórmula heredada del judaísmo",b:"Porque la oración cristiana es siempre comunitaria y eclesial",c:"Para incluir a los no creyentes",d:"Es solo una traducción convencional"},k:"b"},
  ],
  t_rep:[
    {id:1,q:"¿Cuáles son los tres pilares de la fe cristiana según el CIC?",o:{a:"Fe, esperanza y caridad",b:"La oración, los sacramentos y la moral",c:"El Credo, los sacramentos, la oración y la moral",d:"La Biblia, la Tradición y el Magisterio"},k:"c"},
    {id:2,q:"La Trinidad es...",o:{a:"Tres dioses diferentes",b:"Un solo Dios en tres Personas distintas",c:"Una sola persona con tres funciones",d:"Dios, María y los ángeles"},k:"b"},
    {id:3,q:"¿Cuál es el sacramento que completa la iniciación cristiana?",o:{a:"El Matrimonio",b:"La Penitencia",c:"La Eucaristía",d:"La Confirmación"},k:"c"},
    {id:4,q:"La moral cristiana se fundamenta en...",o:{a:"Las leyes civiles",b:"La dignidad humana, el amor a Dios y al prójimo",c:"Las tradiciones culturales",d:"La opinión de la mayoría"},k:"b"},
    {id:5,q:"La oración del Padrenuestro fue enseñada por...",o:{a:"San Pablo",b:"Los apóstoles",c:"El mismo Jesucristo",d:"La Iglesia primitiva"},k:"c"},
  ],
  // TC2 - Confesión
  cf1:[
    {id:1,q:"¿Cuál es el nombre completo de este sacramento?",o:{a:"Sacramento de Perdón",b:"Sacramento de la Penitencia y la Reconciliación",c:"Sacramento del Arrepentimiento",d:"Sacramento de la Absolución"},k:"b"},
    {id:2,q:"¿Quién instituyó el sacramento de la Confesión?",o:{a:"Los apóstoles en Pentecostés",b:"La Iglesia primitiva",c:"El mismo Jesucristo resucitado",d:"El Concilio de Trento"},k:"c"},
    {id:3,q:"¿Cuándo instituyó Jesús el sacramento de la Confesión?",o:{a:"En la Última Cena",b:"Al resucitar, al soplar sobre los apóstoles (Jn 20,22-23)",c:"En el Sermón del Monte",d:"En la Transfiguración"},k:"b"},
    {id:4,q:"El ministro del sacramento de la Reconciliación es...",o:{a:"Cualquier creyente con fe",b:"El sacerdote con facultad de absolver",c:"El diácono",d:"El obispo únicamente"},k:"b"},
    {id:5,q:"El secreto de la Confesión (sigilo sacramental) es...",o:{a:"Solo una tradición recomendable",b:"Absoluto e inviolable bajo cualquier circunstancia",c:"Válido solo para pecados graves",d:"Puede romperse ante la justicia civil"},k:"b"},
  ],
  cf2:[
    {id:1,q:"¿Cuáles son los tres actos del penitente?",o:{a:"Rezar, ayunar y dar limosna",b:"Confesar, comulgar y rezar",c:"Contrición, confesión oral y satisfacción (penitencia)",d:"Arrepentimiento, propósito y promesa"},k:"c"},
    {id:2,q:"¿Qué es la contrición perfecta?",o:{a:"Arrepentirse por miedo al infierno",b:"Arrepentirse por amor a Dios, por quien es Él",c:"El dolor más intenso posible",d:"Llorar por los pecados cometidos"},k:"b"},
    {id:3,q:"La 'integridad de la confesión' requiere...",o:{a:"Confesar solo los pecados mortales",b:"Confesar todos los pecados mortales en especie y número",c:"Confesar los pecados según la gravedad",d:"Confesar lo que el sacerdote pregunte"},k:"b"},
    {id:4,q:"La 'satisfacción' o penitencia busca...",o:{a:"Pagar a Dios por los pecados",b:"Reparar el daño causado y fortalecer la conversión",c:"Demostrar que uno es sincero",d:"Sustituir el purgatorio"},k:"b"},
    {id:5,q:"¿Qué es el 'propósito de enmienda'?",o:{a:"Promesa de no pecar nunca más",b:"Decisión firme de evitar el pecado y sus ocasiones",c:"Un período de prueba",d:"Solo aplica para pecados habituales"},k:"b"},
  ],
  cf3:[
    {id:1,q:"¿Cuál es el efecto principal de la Confesión?",o:{a:"La tranquilidad psicológica",b:"El perdón de los pecados y la restauración de la amistad con Dios",c:"La eliminación del purgatorio",d:"La gracia sacramental permanente"},k:"b"},
    {id:2,q:"La Confesión también perdona...",o:{a:"Solo los pecados mortales",b:"Solo los pecados veniales",c:"Todos los pecados confesados con contrición",d:"Solo los pecados que uno recuerda"},k:"c"},
    {id:3,q:"¿Qué significa que la Confesión reconcilia con la Iglesia?",o:{a:"Que el sacerdote acepta al penitente de nuevo",b:"Que restaura la comunión plena rota por el pecado grave",c:"Que se vuelve a registrar en la parroquia",d:"Que se obtiene el perdón de los otros fieles"},k:"b"},
    {id:4,q:"Los efectos espirituales de la Confesión incluyen...",o:{a:"Solo el perdón externo",b:"Paz espiritual, fuerza para combatir el pecado y aumento de la gracia",c:"Solo la reconciliación social",d:"La garantía de no pecar más"},k:"b"},
    {id:5,q:"¿Con qué frecuencia recomienda la Iglesia confesarse?",o:{a:"Una vez al año es suficiente",b:"Solo ante pecado mortal",c:"Al menos una vez al año, con frecuencia regular recomendada",d:"Cada semana obligatoriamente"},k:"c"},
  ],
  cf4:[
    {id:1,q:"Para hacer una buena Confesión, el primer paso es...",o:{a:"Elegir bien al sacerdote confesor",b:"Hacer un examen de conciencia",c:"Aprender las fórmulas de memoria",d:"Tener lista la penitencia"},k:"b"},
    {id:2,q:"El 'examen de conciencia' consiste en...",o:{a:"Recordar los pecados del año",b:"Reflexionar sobre los actos propios a la luz de la ley de Dios",c:"Leer un libro de pecados",d:"Preguntar a otro lo que debo confesar"},k:"b"},
    {id:3,q:"¿Cuándo es válida la absolución general sin confesión individual?",o:{a:"Siempre que haya muchos penitentes",b:"Solo en situaciones de peligro de muerte inminente de muchos",c:"En Navidad y Pascua",d:"Nunca, siempre es inválida"},k:"b"},
    {id:4,q:"Después de confesar, ¿qué debe hacer el penitente?",o:{a:"Ir a la Comunión inmediatamente",b:"Cumplir la penitencia impuesta lo antes posible",c:"Confesar de nuevo para estar más seguro",d:"Contárselo a un familiar"},k:"b"},
    {id:5,q:"Si uno olvida confesar un pecado mortal...",o:{a:"La Confesión es inválida",b:"El pecado olvidado queda perdonado indirectamente; debe confesarlo luego",c:"Debe volver a confesar todo desde el principio",d:"Queda condenado por ese pecado"},k:"b"},
  ],
  cf_r:[
    {id:1,q:"¿Por qué la Confesión frecuente es recomendable incluso sin pecado mortal?",o:{a:"Es solo una tradición sin valor real",b:"Aumenta la gracia, fortalece la virtud y da paz espiritual",c:"Es obligatoria para todos los católicos",d:"Porque el sacerdote lo necesita"},k:"b"},
    {id:2,q:"¿Qué diferencia hay entre contrición perfecta e imperfecta (atrición)?",o:{a:"No hay diferencia teológica",b:"La perfecta nace del amor a Dios; la imperfecta, del miedo a los castigos",c:"La imperfecta es inválida",d:"La perfecta no necesita Confesión"},k:"b"},
    {id:3,q:"Los frutos de la Confesión frecuente incluyen...",o:{a:"Solo el perdón de pecados",b:"Conocimiento propio, conversión continua y formación de la conciencia",c:"La garantía de ir al cielo",d:"Solo beneficios psicológicos"},k:"b"},
    {id:4,q:"¿Qué es un 'confesor espiritual'?",o:{a:"Cualquier sacerdote disponible",b:"Un sacerdote que guía habitualmente la vida espiritual del penitente",c:"El sacerdote del barrio",d:"El obispo de la diócesis"},k:"b"},
    {id:5,q:"El sacramento de la Reconciliación es un acto de...",o:{a:"Justicia retributiva",b:"Misericordia divina que restaura la relación con Dios",c:"Obligación legal eclesiástica",d:"Pura psicología religiosa"},k:"b"},
  ],
  un1:[
    {id:1,q:"¿Qué es el Sacramento de la Unción de los Enfermos?",o:{a:"Solo la Extremaunción para los moribundos",b:"Un sacramento para fortalecer a los fieles en peligro de muerte por enfermedad o vejez",c:"Una bendición especial del sacerdote",d:"Un rito de despedida"},k:"b"},
    {id:2,q:"¿En qué texto bíblico se funda la Unción de los Enfermos?",o:{a:"Lucas 10",b:"Romanos 8",c:"Santiago 5,14-15",d:"Juan 11"},k:"c"},
    {id:3,q:"¿Quién puede recibir la Unción de los Enfermos?",o:{a:"Solo los que están muriendo",b:"Cualquier fiel enfermo en peligro grave o vejez",c:"Solo los mayores de 80 años",d:"Solo en hospitales"},k:"b"},
    {id:4,q:"¿Quién es el ministro de la Unción de los Enfermos?",o:{a:"Cualquier creyente",b:"El diácono",c:"El sacerdote o el obispo",d:"El enfermero cristiano"},k:"c"},
    {id:5,q:"La materia de la Unción de los Enfermos es...",o:{a:"Agua bendita",b:"Óleo de enfermos bendecido por el obispo",c:"El Santo Crisma",d:"Aceite de oliva sin bendecir"},k:"b"},
  ],
  un2:[
    {id:1,q:"¿Cuáles son los efectos de la Unción de los Enfermos?",o:{a:"Solo la curación física si Dios lo quiere",b:"Fortaleza espiritual, perdón de pecados, salud corporal (si conveniente) y preparación para el paso a la vida eterna",c:"La remisión de todas las penas del purgatorio",d:"Solo la paz psicológica del enfermo"},k:"b"},
    {id:2,q:"¿Se puede recibir la Unción más de una vez?",o:{a:"Solo una vez en la vida",b:"Sí, en enfermedades o peligros distintos",c:"Solo si el enfermo se recuperó y se enferma de nuevo",d:"Nunca, es como el Bautismo"},k:"b"},
    {id:3,q:"La Unción de los Enfermos une al enfermo con...",o:{a:"Los santos del cielo",b:"La Pasión de Cristo de manera especial",c:"Los demás enfermos del mundo",d:"El sacerdote que lo unge"},k:"b"},
    {id:4,q:"¿Qué es el 'Viático'?",o:{a:"Un libro de oraciones para enfermos",b:"La Eucaristía recibida en peligro de muerte como provisión para el camino",c:"La última absolución antes de morir",d:"La Unción de los Enfermos"},k:"b"},
    {id:5,q:"¿Cuándo es apropiado llamar al sacerdote para la Unción?",o:{a:"Solo cuando el médico confirme que el paciente va a morir",b:"Al inicio de una enfermedad grave, sin esperar a que empeore",c:"Solo si el enfermo lo pide explícitamente",d:"Cuando el enfermo ya no puede hablar"},k:"b"},
  ],
  un3:[
    {id:1,q:"La celebración de la Unción puede incluir...",o:{a:"Solo la unción del enfermo",b:"La escucha de la Palabra de Dios, la Confesión, la unción, y si es posible la Eucaristía",c:"Un rosario y la unción",d:"Solo oraciones del sacerdote"},k:"b"},
    {id:2,q:"¿En qué partes del cuerpo se hace la unción?",o:{a:"Solo la frente",b:"La frente y las manos del enfermo",c:"Todo el cuerpo",d:"Solo el pecho"},k:"b"},
    {id:3,q:"La fórmula de la Unción dice: 'Por esta santa unción...'",o:{a:"el Señor te libre del pecado original",b:"el Señor, en su amor y misericordia, te ayude con la gracia del Espíritu Santo",c:"Dios te concede la vida eterna",d:"queden borrados tus pecados confesados"},k:"b"},
    {id:4,q:"¿Es necesaria la Confesión antes de la Unción?",o:{a:"Siempre, sin excepción",b:"Sí, si el enfermo puede confesarse; si no puede, la Unción suple",c:"No, no existe ninguna relación entre ambos",d:"Solo si hay pecados mortales conocidos"},k:"b"},
    {id:5,q:"La Unción de los Enfermos contribuye a...",o:{a:"Curar siempre físicamente al enfermo",b:"La salvación integral del enfermo: cuerpo y alma",c:"Acelerar la muerte natural",d:"Solo calmar la angustia"},k:"b"},
  ],
  un_r:[
    {id:1,q:"Los sacramentos de la iniciación son: Bautismo, Confirmación y...",o:{a:"Matrimonio",b:"Orden Sagrado",c:"Eucaristía",d:"Penitencia"},k:"c"},
    {id:2,q:"Los sacramentos de sanación son...",o:{a:"Bautismo y Confirmación",b:"Penitencia y Unción de los Enfermos",c:"Eucaristía y Matrimonio",d:"Orden y Confirmación"},k:"b"},
    {id:3,q:"El sacramento que completa la formación sacramental de iniciación es...",o:{a:"El Matrimonio",b:"El Orden Sagrado",c:"La Eucaristía",d:"La Confirmación"},k:"c"},
    {id:4,q:"La Iglesia recomienda recibir la Unción de los Enfermos...",o:{a:"Solo en agonía",b:"Al inicio de una enfermedad grave o vejez",c:"Una sola vez en la vida",d:"Solo si no hay sacerdote disponible"},k:"b"},
    {id:5,q:"¿Cuál es la base del amor cristiano al enfermo?",o:{a:"La compasión natural",b:"La identificación de Cristo con el que sufre: 'Estuve enfermo y me visitaron'",c:"La solidaridad social",d:"El temor a la muerte"},k:"b"},
  ],
};
// Para videos de sacramentos específicos reutilizamos preguntas de TC1 en el demo
// (en producción se cargan de Supabase)
["bv1","bv2","bv3","bv_r","pv1","pv2","pv3","pv4","pv_r","cv1","cv2","cv3","cv4","cv5","cv_r",
 "pb1","pb2","pb3","pb_r","cq1","cq2","cq3","cq4","cq_r"].forEach((id,i)=>{
  const src=Object.keys(Q)[i%10];
  Q[id]=Q[src];
});

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
const PPP_PAISES={
  // ── Nivel 1 — Alto ingreso (~$130 USD) ──────────────────────────────
  "Estados Unidos":{tier:1,cur:"USD",fx:1},
  "Canadá":{tier:1,cur:"CAD",fx:1.377},
  "España":{tier:1,cur:"EUR",fx:0.923},

  // ── Nivel 2 — Ingreso medio-alto (~$66 USD) ─────────────────────────
  "México":{tier:2,cur:"MXN",fx:17.58},
  "Chile":{tier:2,cur:"CLP",fx:953.0},
  "Uruguay":{tier:2,cur:"UYU",fx:40.0},
  "Costa Rica":{tier:2,cur:"CRC",fx:504.5},
  "Panamá":{tier:2,cur:"USD",fx:1},
  "Puerto Rico":{tier:2,cur:"USD",fx:1},
  "Trinidad y Tobago":{tier:2,cur:"TTD",fx:6.80},
  "Jamaica":{tier:2,cur:"USD",fx:1}, // se cobra en USD (evita riesgo de liquidación JMD)

  // ── Nivel 3 — Ingreso medio (~$30 USD) ──────────────────────────────
  "Colombia":{tier:3,cur:"COP",fx:4100.0},
  "Perú":{tier:3,cur:"PEN",fx:3.73},
  "Ecuador":{tier:3,cur:"USD",fx:1},
  "Brasil":{tier:3,cur:"BRL",fx:5.60},
  "Rep. Dominicana":{tier:3,cur:"DOP",fx:60.0},
  "Guatemala":{tier:3,cur:"GTQ",fx:7.80},
  "Bolivia":{tier:3,cur:"BOB",fx:6.91},
  "El Salvador":{tier:3,cur:"USD",fx:1},
  "Honduras":{tier:3,cur:"HNL",fx:24.7},
  "Nicaragua":{tier:3,cur:"USD",fx:1}, // se cobra en USD (evita riesgo de liquidación NIO)
  "Paraguay":{tier:3,cur:"PYG",fx:7500.0},

  // ── Nivel 4 — Economías complejas / alta inflación (~$10 USD, cobro en USD) ─
  "Argentina":{tier:4,cur:"USD",fx:1,chargeInUSD:true},
  "Venezuela":{tier:4,cur:"USD",fx:1,chargeInUSD:true},
  "Cuba":{tier:4,cur:"USD",fx:1,chargeInUSD:true},
  "Haití":{tier:4,cur:"USD",fx:1,chargeInUSD:true},
};

// ─── CUOTAS POR PAÍS (respaldo local; al iniciar se sobreescribe con Supabase cuotasporpais) ─
// Generadas a partir del sistema PPP de arriba (ya no son montos manuales fijos).
const CUOTAS=Object.fromEntries(
  Object.entries(PPP_PAISES).map(([pais,info])=>[pais,calcularCuotaPais(info)])
);


// ─── CÓDIGO ISO DE PAÍSES Y PREFIJOS DE ROL ───────────────────────
const COUNTRY_ISO={
  "México":"MX","Argentina":"AR","Bolivia":"BO","Brasil":"BR","Canadá":"CA",
  "Chile":"CL","Colombia":"CO","Costa Rica":"CR","Cuba":"CU","Ecuador":"EC",
  "El Salvador":"SV","España":"ES","Estados Unidos":"US","Guatemala":"GT",
  "Haití":"HT","Honduras":"HN","Jamaica":"JM","Nicaragua":"NI","Panamá":"PA",
  "Paraguay":"PY","Perú":"PE","Puerto Rico":"PR","Rep. Dominicana":"DO",
  "Trinidad y Tobago":"TT","Uruguay":"UY","Venezuela":"VE","Antigua y Barbuda":"AG",
  "Aruba":"AW","Bahamas":"BS","Barbados":"BB","Belice":"BZ","Dominica":"DM",
  "Granada":"GD","Groenlandia":"GL","Guyana":"GY","Surinam":"SR",
};
const ROLE_PREFIX={
  catecumeno:"CTM",prebautismal:"FAM",padrino:"PDR",
  catequista:"CTQ",parroquia:"PAR",diocesis:"DIO"
};
function genRegistrationId(country,userType){
  const cc=COUNTRY_ISO[country]||"XX";
  const rp=ROLE_PREFIX[userType]||"USR";
  const yr=String(new Date().getFullYear()).slice(-2);
  const isInst=userType==="parroquia"||userType==="diocesis";
  const maxNum=isInst?899:8999;
  const startNum=isInst?100:1000;
  const seq=startNum+Math.floor(Math.random()*maxNum);
  const seqStr=String(seq);
  return `${cc}-${rp}-${yr}-${seqStr}`;
}

// ─── BIBLIOTECA — Catecismo y Biblia (Santa Sede) ──────────────────
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

// ─── METADATOS DE SECCIONES ────────────────────────────────────────
// Video de prueba: una versión distinta por idioma (mismo mecanismo que usará
// el video real de cada lección — ver VideoModal, que resuelve con PICK()
// y cae de vuelta a español si un idioma todavía no tiene doblaje/versión).
const videoPruebaUrls=(section)=>({
  es:`/videos-prueba/es/${section}.mp4`, en:`/videos-prueba/en/${section}.mp4`,
  fr:`/videos-prueba/fr/${section}.mp4`, de:`/videos-prueba/de/${section}.mp4`,
  pt:`/videos-prueba/pt/${section}.mp4`, it:`/videos-prueba/it/${section}.mp4`,
});
const SEC_META={
  kerigma:   {es:"Kerigma",                       en:"Kerygma",                    icon:"__flame__", cert:false, videos:KERIGMA, videoPrueba:videoPruebaUrls("tc1")},
  tc1:       {es:"Tronco Común 1",               en:"Common Core 1",              icon:"✝️",  cert:false, videos:TC1_ALL, videoPrueba:videoPruebaUrls("tc1")},
  bautismo:  {es:"Bautismo",                      en:"Baptism",                    icon:"__bautismo_img__",cert:true,videos:COURSES.bautismo, videoPrueba:videoPruebaUrls("bautismo")},
  confirmacion:{es:"Confirmación",                en:"Confirmation",               icon:"__confirmacion_img__",cert:true,videos:COURSES.confirmacion, videoPrueba:videoPruebaUrls("confirmacion")},
  primera_comunion:{es:"Primera Comunión",        en:"First Communion",            icon:"__caliz__",cert:true,videos:COURSES.primera_comunion, videoPrueba:videoPruebaUrls("primera_comunion")},
  presacramental:{es:"Formación Pre-Sacramental",     en:"Pre-Sacramental Formation",    icon:"👨‍👩‍👧",cert:true,  videos:COURSES.presacramental, videoPrueba:videoPruebaUrls("presacramental")},
  catequista:{es:"Neuropedagogía Catequética — Módulo I: Fundamentos y Conceptos", en:"Catechetical Neuropedagogy — Module I: Foundations and Concepts", icon:"🧠", cert:true, videos:COURSES.catequista, videoPrueba:videoPruebaUrls("catequista")},
  tc2_confesion:{es:"La Confesión (TC2)",         en:"Confession (TC2)",           icon:"🙏",  cert:true,  videos:TC2_CONFESION, videoPrueba:videoPruebaUrls("tc2_confesion")},
  tc2_uncion:{es:"Unción de los Enfermos (TC2)", en:"Anointing of the Sick (TC2)",icon:"✨",  cert:true,  videos:TC2_UNCION, videoPrueba:videoPruebaUrls("tc2_uncion")},
};

// ⚠️ MODO DE PRUEBA — fase de pruebas: el usuario ve 1 solo video, acredita 1
// sola evaluación y obtiene su constancia. La secuencia se reduce a una sección.
// Poner en false para PRODUCCIÓN (restaura el curso completo).
const TEST_MODE = false;
if (TEST_MODE) {
  Object.keys(SEC_META).forEach(k => {
    const m = SEC_META[k];
    if (m.videos && m.videos.length > 1) m.videos = [m.videos[0]]; // solo el 1er video
    m.cert = true; // asegurar constancia en modo prueba
  });
}

function SecIcon({id,size=36}){
  const ic=SEC_META[id]?.icon;
  if(ic==="__caliz__") return <CalizIcon size={size}/>;
  if(ic==="__flame__")   return <FlameIcon size={size}/>;
  if(ic==="__bautismo_img__") return <img src={iconoBautismo} width={size} height={size} style={{objectFit:"contain",filter:"sepia(1) saturate(3) brightness(0.95)",display:"block"}}/>;
  if(ic==="__confirmacion_img__") return <img src={iconoConfirmacion} width={size} height={size} style={{objectFit:"contain",filter:"sepia(1) saturate(3) brightness(0.95)",display:"block"}}/>;
  return <span style={{fontSize:size,display:"inline-block",lineHeight:1}}>{ic}</span>;
}

// buildSeq vive en logic.js (probado con Vitest). Aquí solo se le pasa el
// TEST_MODE del módulo. Incluye el Módulo 0 "kerigma" para catecúmenos.
function buildSeq(uType, sacs){ return buildSeqCore(uType, sacs, TEST_MODE); }

function isSectionDone(secId, prog){
  const vids=SEC_META[secId]?.videos||[];
  return vids.length>0 && vids.every(v=>prog?.[secId]?.[v.id]?.passed);
}

function videoState(secId, vid, prog, vids){
  const p=prog?.[secId]?.[vid.id];
  if(p?.passed) return "passed";
  if(p?.visto) return "watched";
  const idx=vids.findIndex(v=>v.id===vid.id);
  if(idx===0) return "available";
  return prog?.[secId]?.[vids[idx-1].id]?.passed ? "available" : "locked";
}

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
const RAIN_SYMS=["✝","🕊️","✨","🌟","💧","✝️","👑","⛪","🙏","🌺"];

function GoldenRain({show}){
  if(!show) return null;
  const drops=Array.from({length:30},(_,i)=>({
    sym:RAIN_SYMS[i%RAIN_SYMS.length],
    left:Math.random()*100,
    delay:Math.random()*2,
    dur:2+Math.random()*2,
    size:16+Math.random()*20,
  }));
  return(
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:9999,overflow:"hidden"}}>
      <style>{`
        @keyframes goldFall{0%{transform:translateY(-80px) rotate(0deg);opacity:1}
          100%{transform:translateY(110vh) rotate(720deg);opacity:0}}
      `}</style>
      {drops.map((d,i)=>(
        <span key={i} style={{
          position:"absolute",top:-80,left:`${d.left}%`,fontSize:d.size,
          animation:`goldFall ${d.dur}s ${d.delay}s ease-in forwards`,
          filter:"sepia(1) saturate(3) hue-rotate(15deg)",
        }}>{d.sym}</span>
      ))}
    </div>
  );
}

// ─── LLUVIA DE ESTRELLAS DORADAS (giran y parpadean) — bienvenida tras pago ──
function StarRain({show}){
  if(!show) return null;
  const stars=Array.from({length:44},(_,i)=>({
    left:Math.random()*100,
    delay:Math.random()*2.2,
    dur:3+Math.random()*3,
    size:11+Math.random()*15,
    tw:0.7+Math.random()*0.8,
  }));
  return(
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:10000,overflow:"hidden"}}>
      <style>{`
        @keyframes starFall{0%{transform:translateY(-10vh) rotate(0deg)}100%{transform:translateY(112vh) rotate(720deg)}}
        @keyframes starTwinkle{0%,100%{opacity:.45;transform:scale(.8)}50%{opacity:1;transform:scale(1.25)}}
      `}</style>
      {stars.map((s,i)=>(
        <span key={i} style={{
          position:"absolute",top:0,left:`${s.left}%`,
          animation:`starFall ${s.dur}s ${s.delay}s linear forwards`,
        }}>
          <span style={{
            display:"inline-block",fontSize:s.size,
            color:i%2?"#E5C97A":"#C8A951",
            filter:"drop-shadow(0 0 5px rgba(200,169,81,0.9))",
            animation:`starTwinkle ${s.tw}s ${s.delay}s ease-in-out infinite`,
          }}>★</span>
        </span>
      ))}
    </div>
  );
}
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

function SoporteModal({contexto,onClose}){
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

// Enlace discreto para el pie de los modales
function SoporteLink({contexto,style={}}){
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
// Botón flotante para el área de formación
function SoporteFloat({contexto}){
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
      bypassUnload=true; // no mostrar "¿Abandonar sitio?" al ir a Stripe
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
  const CON_VIDEO=["bienvenida","institucion","biblia","sacerdotes","ia","documentos","avatares","comunidad"];
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
      @keyframes tGlow{0%,100%{filter:drop-shadow(0 0 4px rgba(200,169,81,.5))}50%{filter:drop-shadow(0 0 16px rgba(200,169,81,.95))}}
      @keyframes tSpin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
      @keyframes tRise{0%{transform:translateY(12px);opacity:0}40%,100%{transform:translateY(0);opacity:1}}
      @keyframes tSweep{0%{transform:translateX(-120%)}100%{transform:translateX(120%)}}
      @keyframes tOrbit{from{transform:rotate(0) translateX(34px) rotate(0)}to{transform:rotate(360deg) translateX(34px) rotate(-360deg)}}
      @keyframes tBlink{0%,100%{opacity:.25}50%{opacity:1}}
      .tstar{position:absolute;color:#E5C97A;animation:tBlink 2.4s ease-in-out infinite}
      .tbig{font-size:52px;animation:tFloat 3.6s ease-in-out infinite, tGlow 3.6s ease-in-out infinite}
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
    {scene:"institucion", t:T("Impulsada por el Centro Internacional de Catequesis a Distancia, un proyecto bajo el auspicio y la guía de la Parroquia de Nuestra Señora de la Esperanza perteneciente a la Diócesis de Querétaro, México.","Powered by the International Center for Distance Catechesis, a project under the auspices and guidance of the Parish of Nuestra Señora de la Esperanza, belonging to the Diocese of Querétaro, Mexico.","Propulsée par le Centre International de Catéchèse à Distance, un projet placé sous les auspices et la direction de la Paroisse Nuestra Señora de la Esperanza, appartenant au Diocèse de Querétaro, au Mexique.","Angetrieben vom Internationalen Zentrum für Fernkatechese, einem Projekt unter der Schirmherrschaft und Leitung der Pfarrei Nuestra Señora de la Esperanza, die zur Diözese Querétaro, Mexiko, gehört.","Impulsionada pelo Centro Internacional de Catequese a Distância, um projeto sob os auspícios e orientação da Paróquia de Nuestra Señora de la Esperanza, pertencente à Diocese de Querétaro, México.","Promossa dal Centro Internazionale di Catechesi a Distanza, un progetto sotto gli auspici e la guida della Parrocchia di Nuestra Señora de la Esperanza, appartenente alla Diocesi di Querétaro, Messico.")},
    {scene:"biblia", t:T("Basada completamente en la Revelación Bíblica, la Tradición y el Magisterio de la Iglesia Católica.","Fully based on Revelation, Tradition, and the Magisterium of the Catholic Church.","Entièrement fondée sur la Révélation biblique, la Tradition et le Magistère de l'Église catholique.","Vollständig gegründet auf der biblischen Offenbarung, der Tradition und dem Lehramt der katholischen Kirche.","Totalmente baseada na Revelação Bíblica, na Tradição e no Magistério da Igreja Católica.","Interamente basata sulla Rivelazione biblica, sulla Tradizione e sul Magistero della Chiesa Cattolica.")},
    {scene:"sacerdotes", t:T("Bajo la dirección de sacerdotes afiliados a CICADI/ICDC y catequistas experimentados.","Under the direction of priests affiliated with CICADI/ICDC and experienced catechists.","Sous la direction de prêtres affiliés à l'ICDC et de catéchistes expérimentés.","Unter der Leitung von mit dem ICDC verbundenen Priestern und erfahrenen Katecheten.","Sob a direção de sacerdotes afiliados à ICDC e catequistas experientes.","Sotto la direzione di sacerdoti affiliati all'ICDC e catechisti esperti.")},
    {scene:"ia", t:T("Con el soporte y acervo digital de la AI Magisterium, la primera Inteligencia Artificial especializada en la fe católica.","With the support and digital archive of Magisterium AI, the first Artificial Intelligence specialized in the Catholic faith.","Avec le soutien et le fonds documentaire numérique de l'IA Magisterium, la première Intelligence Artificielle spécialisée dans la foi catholique.","Mit der Unterstützung und dem digitalen Bestand von Magisterium AI, der ersten auf den katholischen Glauben spezialisierten Künstlichen Intelligenz.","Com o apoio e o acervo digital da IA Magisterium, a primeira Inteligência Artificial especializada na fé católica.","Con il supporto e il patrimonio digitale dell'IA Magisterium, la prima Intelligenza Artificiale specializzata nella fede cattolica.")},
    {scene:"documentos", t:T("Y con acceso directo a las versiones digitales del Catecismo de la Iglesia Católica y la Biblia autorizadas por la Santa Sede.","And with direct access to the digital versions of the Catechism of the Catholic Church and the Bible authorized by the Holy See.","Et avec un accès direct aux versions numériques du Catéchisme de l'Église catholique et de la Bible autorisées par le Saint-Siège.","Und mit direktem Zugang zu den vom Heiligen Stuhl autorisierten digitalen Fassungen des Katechismus der katholischen Kirche und der Bibel.","E com acesso direto às versões digitais do Catecismo da Igreja Católica e da Bíblia autorizadas pela Santa Sé.","E con accesso diretto alle versioni digitali del Catechismo della Chiesa Cattolica e della Bibbia autorizzate dalla Santa Sede.")},
    // NUEVA tarjeta · neuropedagogía con avatares
    {scene:"avatares", t:T("Cada lección se convierte en una experiencia viva, guiada por avatares de personajes bíblicos y santos de la Iglesia Católica: una manera única de formarte en la fe.","Each lesson becomes a living experience, guided by avatars of biblical figures and saints of the Catholic Church: a unique way to grow in faith.","Chaque leçon devient une expérience vivante, guidée par des avatars de personnages bibliques et de saints de l'Église catholique : une façon unique de vous former dans la foi.","Jede Lektion wird zu einer lebendigen Erfahrung, begleitet von Avataren biblischer Gestalten und Heiliger der katholischen Kirche – ein einzigartiger Weg, im Glauben zu wachsen.","Cada lição torna-se uma experiência viva, guiada por avatares de personagens bíblicos e santos da Igreja Católica: uma forma única de crescer na fé.","Ogni lezione diventa un'esperienza viva, guidata da avatar di personaggi biblici e santi della Chiesa Cattolica: un modo unico per formarti nella fede.")},
    // NUEVA tarjeta final · comunidad y seguimiento pastoral
    {scene:"comunidad", t:T("Intégrate a una comunidad de formación sacramental. Recibirás seguimiento pastoral personalizado y en grupos donde profundizaremos las verdades de nuestra fe.","Join a community of sacramental formation. You will receive personalized pastoral guidance, individually and in groups, where we will deepen the truths of our faith.","Rejoignez une communauté de formation sacramentelle. Vous bénéficierez d'un accompagnement pastoral personnalisé et en groupe, où nous approfondirons les vérités de notre foi.","Werde Teil einer Gemeinschaft der Sakramentenbildung. Du erhältst eine persönliche und gemeinschaftliche seelsorgliche Begleitung, in der wir die Wahrheiten unseres Glaubens vertiefen.","Integre-se a uma comunidade de formação sacramental. Você receberá acompanhamento pastoral personalizado e em grupos, onde aprofundaremos as verdades da nossa fé.","Unisciti a una comunità di formazione sacramentale. Riceverai un accompagnamento pastorale personalizzato e di gruppo, in cui approfondiremo le verità della nostra fede.")},
    // Tarjeta final · video de bienvenida y muestra del curso.
    // El video se carga desde el panel (tabla tour_tarjetas, clave "muestra").
    {scene:"muestra", t:T("Descarga la app y accede al video de muestra","Download the app and watch the sample video","Téléchargez l'application et accédez à la vidéo de démonstration","Lade die App herunter und sieh dir das Beispielvideo an","Baixe o aplicativo e acesse o vídeo de demonstração","Scarica l'app e accedi al video di esempio")},
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
  const arrowBtn=(dir,disabled)=>(
    <button aria-label={dir<0?"Anterior":"Siguiente"} onClick={()=>go(dir)} disabled={disabled}
      style={{width:38,height:38,borderRadius:"50%",flexShrink:0,cursor:disabled?"default":"pointer",
        border:`1px solid ${disabled?C.borderD:C.gold}`,background:disabled?"transparent":`${C.gold}18`,
        color:disabled?C.ivoryM:C.gold,fontSize:18,opacity:disabled?0.35:1,transition:"all .2s"}}>
      {dir<0?"‹":"›"}
    </button>
  );
  return(
    <div style={OVERLAY}>
      <div style={{...MODAL, textAlign:"center", maxWidth:560, display:"flex", flexDirection:"column"}}>
        <img src="/catecumenlogo.png" alt="Logo Catecumen"
          style={{maxWidth:230,width:"100%",height:"auto",margin:"0 auto 2px",
            filter:"drop-shadow(0 2px 10px rgba(200,169,81,0.55)) drop-shadow(0 0 2px rgba(120,90,20,0.35))"}}/>
        <p style={{fontStyle:"italic",color:C.ivoryM,fontSize:16,marginTop:-2,marginBottom:12,letterSpacing:"0.04em"}}>
          {T("El Aula Global de la Catequesis","The Global Classroom of Catechesis","La Salle de Classe Mondiale de la Catéchèse","Das globale Klassenzimmer der Katechese","A Sala de Aula Global da Catequese","L'Aula Globale della Catechesi")}
        </p>

        {/* Tarjeta del tour */}
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{display:window.innerWidth>560?"block":"none"}}>{arrowBtn(-1,i===0)}</div>
          <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
            style={{flex:1,minHeight:270,background:`linear-gradient(145deg,${C.card} 0%,rgba(200,169,81,0.06) 100%)`,
              border:`1px solid ${C.borderD}`,borderRadius:16,padding:"16px 18px 18px",
              display:"flex",flexDirection:"column",justifyContent:"flex-start"}}>
            <TourScene key={cur.scene} tipo={cur.scene}
              video={cur.video} webm={cur.webm} poster={cur.poster}/>
            <div style={{display:"flex",gap:9,alignItems:"flex-start",marginTop:12,textAlign:"left"}}>
              <span style={{color:C.gold,flexShrink:0,marginTop:2,fontSize:16}}>✦</span>
              <span style={{color:C.ivory,fontFamily:FONT_READ,fontSize:16.5,lineHeight:1.7}}>{cur.t}</span>
            </div>
          </div>
          <div style={{display:window.innerWidth>560?"block":"none"}}>{arrowBtn(1,i===n-1)}</div>
        </div>

        {/* Puntitos indicadores + contador. El botón mide 24x24 (objetivo
            táctil accesible) con el punto visible pequeño dentro. */}
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
        <p style={{color:C.ivoryM,fontSize:12.5,marginBottom:4}}>
          {i+1} / {n} · <span style={{opacity:.8}}>{T("desliza o usa las flechas","swipe or use arrows","glissez ou flèches","wischen oder Pfeile","deslize ou use as setas","scorri o usa le frecce")}</span>
        </p>

        {/* Conoce más (se mantiene visible) */}
        <p style={{marginTop:6,color:C.goldL,textAlign:"center",fontSize:14}}>
          {T("Conoce más en: ","Learn more at: ","En savoir plus sur : ","Mehr erfahren unter: ","Saiba mais em: ","Scopri di più su: ")}
          <a href="https://www.catecumen.com/info" target="_blank" rel="noreferrer" style={{color:C.gold}}>www.catecumen.com/info</a>
        </p>

        {/* Botones fijos (siempre a la vista) */}
        <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:14}}>
          <button onClick={onContinue} style={{...BTN("pri"),width:"100%",justifyContent:"center",fontSize:15}}>
            ✝️ {T("Registrarme","Register","M'inscrire","Registrieren","Registrar-me","Registrati")}
          </button>
          <button onClick={onLogin} style={{...BTN("sec"),width:"100%",justifyContent:"center",fontSize:15}}>
            🔑 {T("Iniciar sesión","Sign in","Se connecter","Anmelden","Entrar","Accedi")}
          </button>
          {i<n-1&&(
            <button onClick={onContinue}
              style={{background:"none",border:"none",color:C.ivoryM,fontSize:13,cursor:"pointer",
                textDecoration:"underline",marginTop:2}}>
              {T("Omitir presentación","Skip intro","Passer l'introduction","Einführung überspringen","Pular apresentação","Salta introduzione")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Hook: etiquetas configurables por opción (ej. "Próximamente"), administradas
// desde el panel. Una opción con etiqueta ACTIVA queda además inhabilitada
// (no permite registrarse) hasta que el admin retira la etiqueta. Si la BD no
// responde, devuelve {} y todo funciona normal.
function useEtiquetasOpciones(){
  const [etiquetas,setEtiquetas]=useState({});
  useEffect(()=>{
    let vivo=true;
    (async()=>{
      try{
        const {data,error}=await supabase.rpc("obtener_etiquetas_opciones");
        if(error||!Array.isArray(data)||!vivo)return;
        const m={};
        data.forEach(e=>{
          const txt=PICK({es:e.texto_es,en:e.texto_en,fr:e.texto_fr,
                          de:e.texto_de,pt:e.texto_pt,it:e.texto_it});
          if(txt&&txt.trim())m[e.clave]={txt:txt.trim(),
            bg:e.color_fondo||"#B3261E", fg:e.color_texto||"#E5C97A"};
        });
        if(vivo)setEtiquetas(m);
      }catch{/* sin conexión: sin etiquetas */}
    })();
    return()=>{vivo=false;};
  },[]);
  return etiquetas;
}

// ─── FILTER MODAL ──────────────────────────────────────────────────
function FilterModal({onSelect}){
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

// ─── SACRAMENTO SELECT MODAL ────────────────────────────────────────
function SacSelectModal({onContinue,onBack}){
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
            const etq=etiquetas[s.k];   // etiqueta activa → sacramento inhabilitado
            return(
            <button key={s.k} onClick={etq?undefined:()=>toggle(s.k)}
              disabled={!!etq} aria-disabled={!!etq}
              style={{...CARD,cursor:etq?"not-allowed":"pointer",display:"flex",alignItems:"center",gap:14,
                border:`1.5px solid ${sel.includes(s.k)?C.gold:C.borderD}`,opacity:etq?0.55:1,
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
              {etq?<span style={{marginLeft:"auto",fontSize:16}}>🔒</span>
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

// ─── ENCUADRE MODAL ────────────────────────────────────────────────
// EncuadreModal → ./components/EncuadreModal.jsx (diferido con React.lazy).

// ─── HELPERS DE FORMULARIO ─────────────────────────────────────────
// FRow, Input y PasswordInput → ./components/fields.jsx (importados arriba).

function PhoneField({phoneCode,phone,onChange}){
  return(
    <div style={{display:"flex",gap:8}}>
      <select value={phoneCode||""} onChange={e=>onChange("phoneCode",e.target.value)}
        style={{...INP,width:140,flex:"none"}}>
        <option value="">{T("País","Country","Pays","Land","País","Paese")}</option>
        {PHONE_CODES.map(p=>(
          <option key={p.code+p.c} value={p.code}>{p.code} {p.c}</option>
        ))}
      </select>
      <Input value={phone} onChange={v=>onChange("phone",v)}
        placeholder={T("Número telefónico","Phone number","Numéro de téléphone","Telefonnummer","Número de telefone","Numero di telefono")} style={{flex:1}}/>
    </div>
  );
}

function CountrySelect({value,onChange}){
  return(
    <select value={value||""} onChange={e=>onChange(e.target.value)} style={INP}>
      <option value="">{T("Selecciona tu país","Select your country","Sélectionnez votre pays","Wählen Sie Ihr Land","Selecione seu país","Seleziona il tuo paese")}</option>
      {COUNTRIES.map(c=><option key={c} value={c}>{c}</option>)}
    </select>
  );
}


function pwdStrength(pw){
  let s=0;
  if(pw.length>=8)s++;
  if(/[A-Z]/.test(pw))s++;
  if(/[0-9]/.test(pw))s++;
  if(/[^A-Za-z0-9]/.test(pw))s++;
  return s; // 0-4
}

// ─── REGISTRO CATECÚMENO / PAPÁS / PADRINO / CATEQUISTA ────────────
function RegisterForm({userType,sacraments,onNext,onBack}){
  const [d,setD]=useState({});
  const [localRain,setLocalRain]=useState(false);
  const set=(k,v)=>setD(p=>({...p,[k]:v}));

  const country=d.country||"";
  const docInfo=CDOCS[country]||{l:T("Documento Oficial","Official Document","Document officiel","Amtliches Dokument","Documento Oficial","Documento ufficiale"),f:"",ph:""};
  const cuota=resolverCuota(country,CUOTAS);
  
  const getPriceBreakdown=()=>{
    if(!cuota) return null;
    if(userType==="catecumeno"){
      if(sacraments.length===0) return null;
      const map={bautismo:{k:"b",es:"Bautismo",en:"Baptism",fr:"Baptême",de:"Taufe",pt:"Batismo",it:"Battesimo"},
                 confirmacion:{k:"c",es:"Confirmación",en:"Confirmation",fr:"Confirmation",de:"Firmung",pt:"Crisma",it:"Cresima"},
                 primera_comunion:{k:"p",es:"Primera Comunión",en:"First Communion",fr:"Première Communion",de:"Erstkommunion",pt:"Primeira Comunhão",it:"Prima Comunione"}};
      const esRehab=!!d.esPacienteRehabilitacion;
      const lines=sacraments.map(s=>{
        const m=map[s];
        if(!m) return null;
        const base=cuota[m.k];
        return{label:T(m.es,m.en,m.fr,m.de,m.pt,m.it),amt:aplicarBeca(base,esRehab),cur:cuota.cur,
               original:esRehab?base:undefined};
      }).filter(Boolean);
      const total=lines.reduce((a,l)=>a+l.amt,0);
      return{lines,total,cur:cuota.cur,becaDesc:d.esPacienteRehabilitacion?20:0};
    }
    if(userType==="prebautismal"||userType==="padrino"){
      const sacMap={
        bautismo:     {es:"Bautismo",              en:"Baptism",fr:"Baptême",de:"Taufe",pt:"Batismo",it:"Battesimo"},
        confirmacion: {es:"Confirmación",           en:"Confirmation",fr:"Confirmation",de:"Firmung",pt:"Crisma",it:"Cresima"},
        primera_comunion:{es:"Eucaristía/Primera Comunión",en:"Eucharist/First Communion",fr:"Eucharistie/Première Communion",de:"Eucharistie/Erstkommunion",pt:"Eucaristia/Primeira Comunhão",it:"Eucaristia/Prima Comunione"},
      };
      const selSacs=(d.sacsBeneficiario||[]);
      const sacLabel=selSacs.length>0
        ? selSacs.map(k=>PICK(sacMap[k])||k).join(" · ")
        : T("Formación","Formation","Formation","Ausbildung","Formação","Formazione");
      const lineLabel=T(`Cuota única — ${sacLabel}`,`Flat fee — ${sacLabel}`,`Tarif unique — ${sacLabel}`,`Einmalige Gebühr — ${sacLabel}`,`Taxa única — ${sacLabel}`,`Tariffa unica — ${sacLabel}`);
      const esRehab=!!d.esPacienteRehabilitacion;
      const base=cuota.pre||0;
      const monto=aplicarBeca(base,esRehab);
      return{
        lines:[{label:lineLabel,amt:monto,cur:cuota.cur,original:esRehab?base:undefined}],
        total:monto, cur:cuota.cur, flatFee:true,
        becaDesc:d.esPacienteRehabilitacion?20:0,
      };
    }
    if(userType==="catequista")
      return{lines:[{label:T("Formación Catequística","Catechetical Formation","Formation Catéchétique","Katechetische Bildung","Formação Catequética","Formazione Catechetica"),amt:cuota.cat,cur:cuota.cur}],total:cuota.cat,cur:cuota.cur};
    return null;
  };
  const pb=getPriceBreakdown();
  
  const courseLabel=()=>{
    if(userType==="catecumeno"){
      const names={bautismo:T("Bautismo","Baptism","Baptême","Taufe","Batismo","Battesimo"),confirmacion:T("Confirmación","Confirmation","Confirmation","Firmung","Crisma","Cresima"),primera_comunion:T("Primera Comunión","First Communion","Première Communion","Erstkommunion","Primeira Comunhão","Prima Comunione")};
      return sacraments.map(s=>names[s]).join(" + ");
    }
    if(userType==="presacramental") return T("Formación Pre-Sacramentall","Pre-Sacramental Formation","Formation Pré-Sacramentelle","Vorsakramentale Bildung","Formação Pré-Sacramental","Formazione Pre-Sacramentale");
    if(userType==="padrino") return T("Formación para Padrinos","Godparent Formation","Formation pour Parrains et Marraines","Bildung für Paten","Formação para Padrinhos","Formazione per Padrini e Madrine");
    if(userType==="catequista") return T("Neuropedagogía Catequética","Catechetical Neuropedagogy","Neuropédagogie Catéchétique","Katechetische Neuropädagogik","Neuropedagogia Catequética","Neuropedagogia Catechetica");
    return "";
  };
  
  const totalHours=()=>{
    if(userType==="catecumeno"){
      let h=0;
      if(sacraments.includes("bautismo")) h+=2;
      if(sacraments.includes("confirmacion")) h+=3;
      if(sacraments.includes("primera_comunion")) h+=2.5;
      return h+12; // TC1 (10.5h) + TC2 (4.5h) + sacramentos
    }
    if(userType==="prebautismal") return 14;
    if(userType==="padrino") return 14;
    if(userType==="catequista") return 15;
    return 0;
  };

  // Etiqueta de duración para pantalla (rango cuando hay múltiples sacramentos)
  const hoursDisplay=()=>{
    if(userType==="prebautismal"||userType==="padrino"){
      const numSacs=(d.sacsBeneficiario||[]).length;
      if(numSacs>1) return T("14 a 18 horas","14 to 18 hours","14 à 18 heures","14 bis 18 Stunden","14 a 18 horas","Da 14 a 18 ore");
      return "14h";
    }
    return totalHours()+"h";
  };
  
  const calcAge=dob=>{
    if(!dob) return "";
    const b=new Date(dob), n=new Date();
    let age=n.getFullYear()-b.getFullYear();
    const m=n.getMonth()-b.getMonth();
    if(m<0||(m===0&&n.getDate()<b.getDate())) age--;
    return age;
  };
  const age=calcAge(d.dob);
  const isAdult=age>=18;
  
  const ageOk=userType==="catequista"||!age||age>=17;
  const sacsBenefOk=!["prebautismal","padrino"].includes(userType)||((d.sacsBeneficiario||[]).length>0);
  // ¿Vive con una pareja? — verdadero en cualquiera de las tres ramas de estado
  // civil cuando la respuesta de convivencia es "Sí". Se usa para mostrar y
  // exigir la pregunta de matrimonio por la Iglesia en los próximos 6 meses.
  const viveConAlguien=
    (d.estadoCivil==="Casado/a sólo por el civil"&&d.viveConPareja==="Sí")||
    (d.estadoCivil==="Soltero/a"&&d.viveConParejaSoltero==="Sí")||
    (d.estadoCivil==="Divorciado/a"&&d.viveNuevaPareja==="Sí");
  const maritalFollowupOk=
    !["catecumeno","padrino"].includes(userType)||!d.estadoCivil||(
      (
        d.estadoCivil==="Soltero/a"                   ? !!d.viveConParejaSoltero :
        d.estadoCivil==="Casado/a sólo por el civil"  ? !!d.viveConPareja :
        d.estadoCivil==="Divorciado/a"                ? !!d.viveNuevaPareja :
        true
      )
      // Si vive con pareja, la pregunta de matrimonio por la Iglesia es obligatoria.
      && (!viveConAlguien || !!d.planCasarseIglesia)
    );
  const maritalOk=!["catecumeno","padrino"].includes(userType)||(!!d.estadoCivil&&maritalFollowupOk);
  // ── Verificación del identificador de parroquia/diócesis (catequistas) ──
  // orgVerif: null | "verificando" | "valido" | "invalido" | "errorDB"
  const [orgVerif,setOrgVerif]=useState(null);
  const [orgNombre,setOrgNombre]=useState("");
  const verificarOrg=async()=>{
    const rid=(d.orgRegistroId||"").trim().toUpperCase();
    if(!rid)return;
    setOrgVerif("verificando");
    try{
      const {data,error}=await supabase.rpc("verificar_org_registro",{p_registro_id:rid});
      if(error)throw error;
      if(data&&data.length){
        setOrgNombre(data[0].nombre||"");
        setOrgVerif("valido");
        set("orgRegistroId",rid);
        set("orgVerificada",true);
        set("orgNombreVerificado",data[0].nombre||"");
      }else{
        setOrgVerif("invalido");set("orgVerificada",false);
      }
    }catch(e){
      console.error("verificar_org_registro:",e);
      setOrgVerif("errorDB");set("orgVerificada",false);set("orgPendiente",true);
    }
  };
  const catequistaAfilOk=userType!=="catequista"||d.afiliadaOrg!=="si"||
    orgVerif==="valido"||orgVerif==="errorDB";
  const canSubmit=d.nombre&&d.apellido&&d.email&&d.country&&d.estado&&d.dob&&d.phone&&d.docNum&&d.phoneCode&&
    (userType==="catequista" ? !!d.parroquia : (d.parroquia||d.noSure))&&d.terms&&ageOk&&maritalOk&&sacsBenefOk&&
    catequistaAfilOk;
  const isFree=(userType==="catequista"&&d.afiliadaOrg==="si"&&orgVerif==="valido")||!!d.estaInternado;
  
  return(
    <div className="_regform_wrap">
      <GoldenRain show={localRain}/>
    <div style={OVERLAY}>
      <div style={{...MODAL,maxWidth:680}}>
        <h2 style={{fontFamily:"'Cinzel',serif",color:C.gold,fontSize:17,marginBottom:20}}>
          ✝ {T("Formulario de Inscripción","Registration Form","Formulaire d'inscription","Anmeldeformular","Formulário de Inscrição","Modulo di iscrizione")}
        </h2>
        
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <FRow label={T("Nombre(s)","First Name(s)","Prénom(s)","Vorname(n)","Nome(s)","Nome/i")}>
            <Input value={d.nombre} onChange={v=>set("nombre",v)} placeholder={T("Tu nombre","Your name","Votre prénom","Ihr Vorname","Seu nome","Il tuo nome")}/>
          </FRow>
          <FRow label={T("Apellido(s)","Last Name(s)","Nom(s) de famille","Nachname(n)","Sobrenome(s)","Cognome/i")}>
            <Input value={d.apellido} onChange={v=>set("apellido",v)} placeholder={T("Tu apellido","Your surname","Votre nom de famille","Ihr Nachname","Seu sobrenome","Il tuo cognome")}/>
          </FRow>
        </div>
        
        <FRow label={T("Correo electrónico","Email address","Adresse e-mail","E-Mail-Adresse","E-mail","Indirizzo email")}>
          <Input type="email" value={d.email} onChange={v=>set("email",v)} placeholder="nombre@ejemplo.com"/>
        </FRow>
        
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <FRow label={T("Fecha de nacimiento","Date of birth","Date de naissance","Geburtsdatum","Data de nascimento","Data di nascita")}>
            <Input type="date" value={d.dob} onChange={v=>set("dob",v)}/>
          </FRow>
          <FRow label={T("Edad","Age","Âge","Alter","Idade","Età")}>
            <div style={{...INP,cursor:"default",color:age?C.ivory:C.ivoryM}}>
              {age||T("(calculada automáticamente)","(auto-calculated)","(calculé automatiquement)","(automatisch berechnet)","(calculada automaticamente)","(calcolata automaticamente)")}
              {age&&!isAdult&&<span style={{color:"#F87171",marginLeft:8,fontSize:12}}>
                {T("Menor de edad — constancia no válida","Minor — certificate not valid","Mineur — attestation non valide","Minderjährig — Bescheinigung ungültig","Menor de idade — certificado inválido","Minorenne — attestato non valido")}
              </span>}
            {age&&age<17&&userType!=="catequista"&&(
              <div style={{...CARD,background:"rgba(248,113,113,0.1)",
                border:"1px solid #F87171",marginTop:4,padding:"10px 14px"}}>
                <p style={{color:"#F87171",fontFamily:"'Crimson Text',serif",
                  fontSize:15,lineHeight:1.55}}>
                  ⚠️ {T("La formación es exclusivamente para personas de 17 años o más. No es posible continuar con el registro.","This formation is exclusively for persons aged 17 or older. Registration cannot proceed.","La formation est exclusivement réservée aux personnes de 17 ans ou plus. Il n'est pas possible de poursuivre l'inscription.","Die Ausbildung ist ausschließlich für Personen ab 17 Jahren. Eine Fortsetzung der Registrierung ist nicht möglich.","A formação é exclusivamente para pessoas de 17 anos ou mais. Não é possível continuar com o registro.","La formazione è esclusivamente per persone di 17 anni o più. Non è possibile proseguire con la registrazione.")}
                </p>
              </div>
            )}
            </div>
          </FRow>
        </div>
        
        <FRow label={T("País de residencia","Country of residence","Pays de résidence","Wohnsitzland","País de residência","Paese di residenza")}>
          <CountrySelect value={d.country} onChange={v=>set("country",v)}/>
        </FRow>

        <FRow label={T("Estado o provincia de residencia","State or province of residence","État ou province de résidence","Bundesland oder Provinz","Estado ou província de residência","Stato o provincia di residenza")}>
          <Input value={d.estado} onChange={v=>set("estado",v)} placeholder={T("Ej. Querétaro","e.g. Querétaro","p. ex. Querétaro","z. B. Querétaro","ex. Querétaro","es. Querétaro")}/>
        </FRow>
        
        <FRow label={T("Número telefónico","Phone number","Numéro de téléphone","Telefonnummer","Número de telefone","Numero di telefono")}>
          <PhoneField phoneCode={d.phoneCode} phone={d.phone} onChange={set}/>
        </FRow>
        
        <FRow label={`${docInfo.l} — ${docInfo.f}`}>
          <Input value={d.docNum} onChange={v=>set("docNum",v)} placeholder={docInfo.ph||""}/>
          <p style={{color:C.ivoryM,fontSize:12,marginTop:5,lineHeight:1.4}}>
            ⚠️ {userType==="catequista"
              ? T("Este dato debe ser exactamente el que aparece en tu documento oficial, ya que será utilizado para confirmar tu identidad en tu Constancia de formación.","This must exactly match your official document, as it will be used to confirm your identity on your Formation Certificate.","Cette information doit correspondre exactement à celle figurant sur votre document officiel, car elle sera utilisée pour confirmer votre identité sur votre attestation de formation.","Diese Angabe muss exakt mit Ihrem amtlichen Dokument übereinstimmen, da sie zur Identitätsbestätigung auf Ihrer Ausbildungsbescheinigung verwendet wird.","Este dado deve ser exatamente igual ao que aparece no seu documento oficial, pois será usado para confirmar sua identidade no seu Certificado de formação.","Questo dato deve corrispondere esattamente a quello riportato sul tuo documento ufficiale, poiché verrà utilizzato per confermare la tua identità sull'Attestato di formazione.")
              : userType==="padrino"
              ? T("Este dato debe ser exactamente el que aparece en tu documento oficial, ya que será utilizado para confirmar tu identidad en la parroquia donde tu ahijado/a recibirá el Bautismo.","This must exactly match your official document, as it will be used to confirm your identity at the parish where your godchild will receive Baptism.","Cette information doit correspondre exactement à celle figurant sur votre document officiel, car elle sera utilisée pour confirmer votre identité dans la paroisse où votre filleul(e) recevra le Baptême.","Diese Angabe muss exakt mit Ihrem amtlichen Dokument übereinstimmen, da sie zur Identitätsbestätigung in der Pfarrei verwendet wird, in der Ihr Patenkind die Taufe empfängt.","Este dado deve ser exatamente igual ao que aparece no seu documento oficial, pois será usado para confirmar sua identidade na paróquia onde seu afilhado/a receberá o Batismo.","Questo dato deve corrispondere esattamente a quello riportato sul tuo documento ufficiale, poiché verrà utilizzato per confermare la tua identità nella parrocchia dove il tuo figlioccio/a riceverà il Battesimo.")
              : userType==="prebautismal"
              ? T("Este dato debe ser exactamente el que aparece en tu documento oficial, ya que será utilizado para confirmar tu identidad en la parroquia donde tu hijo/a recibirá el Bautismo.","This must exactly match your official document, as it will be used to confirm your identity at the parish where your child will receive Baptism.","Cette information doit correspondre exactement à celle figurant sur votre document officiel, car elle sera utilisée pour confirmer votre identité dans la paroisse où votre enfant recevra le Baptême.","Diese Angabe muss exakt mit Ihrem amtlichen Dokument übereinstimmen, da sie zur Identitätsbestätigung in der Pfarrei verwendet wird, in der Ihr Kind die Taufe empfängt.","Este dado deve ser exatamente igual ao que aparece no seu documento oficial, pois será usado para confirmar sua identidade na paróquia onde seu filho/a receberá o Batismo.","Questo dato deve corrispondere esattamente a quello riportato sul tuo documento ufficiale, poiché verrà utilizzato per confermare la tua identità nella parrocchia dove tuo figlio/a riceverà il Battesimo.")
              : T("Este dato debe ser exactamente el que aparece en tu documento oficial, ya que será utilizado para confirmar tu identidad en la parroquia donde recibirás tu sacramento.","This must exactly match your official document, as it will be used to confirm your identity at the parish where you will receive your sacrament.","Cette information doit correspondre exactement à celle figurant sur votre document officiel, car elle sera utilisée pour confirmer votre identité dans la paroisse où vous recevrez votre sacrement.","Diese Angabe muss exakt mit Ihrem amtlichen Dokument übereinstimmen, da sie zur Identitätsbestätigung in der Pfarrei verwendet wird, in der Sie Ihr Sakrament empfangen.","Este dado deve ser exatamente igual ao que aparece no seu documento oficial, pois será usado para confirmar sua identidade na paróquia onde você receberá seu sacramento.","Questo dato deve corrispondere esattamente a quello riportato sul tuo documento ufficiale, poiché verrà utilizzato per confermare la tua identità nella parrocchia dove riceverai il tuo sacramento.")}
          </p>
        </FRow>
        
        <FRow label={userType==="catequista"
          ? T("Parroquia donde presta su catequesis","Parish where you serve as catechist","Paroisse où vous exercez votre catéchèse","Pfarrei, in der Sie Katechese unterrichten","Paróquia onde você exerce sua catequese","Parrocchia dove svolgi la tua catechesi")
          : userType==="padrino"
          ? T("Parroquia donde tu ahijado/a recibirá el Bautismo","Parish where your godchild will receive Baptism","Paroisse où votre filleul(e) recevra le Baptême","Pfarrei, in der Ihr Patenkind die Taufe empfängt","Paróquia onde seu afilhado/a receberá o Batismo","Parrocchia dove il tuo figlioccio/a riceverà il Battesimo")
          : userType==="prebautismal"
          ? T("Parroquia donde tu hijo/a recibirá el Bautismo","Parish where your child will receive Baptism","Paroisse où votre enfant recevra le Baptême","Pfarrei, in der Ihr Kind die Taufe empfängt","Paróquia onde seu filho/a receberá o Batismo","Parrocchia dove tuo figlio/a riceverà il Battesimo")
          : T("Parroquia donde realizará su(s) sacramento(s)","Parish where you will receive your sacrament(s)","Paroisse où vous recevrez votre/vos sacrement(s)","Pfarrei, in der Sie Ihr(e) Sakrament(e) empfangen","Paróquia onde realizará seu(s) sacramento(s)","Parrocchia dove riceverai il/i tuo/i sacramento/i")}>
          <Input value={d.noSure?"":d.parroquia} onChange={v=>set("parroquia",v)}
            placeholder={T("Nombre completo y exacto de la parroquia","Full and exact name of the parish","Nom complet et exact de la paroisse","Vollständiger und genauer Name der Pfarrei","Nome completo e exato da paróquia","Nome completo ed esatto della parrocchia")}
            style={{opacity:d.noSure?0.4:1}}/>
          {userType!=="catequista"&&(
            <label style={{marginTop:8,display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}>
              <input type="checkbox" checked={d.noSure||false}
                onChange={e=>set("noSure",e.target.checked)}
                style={checkStyle(d.noSure||false,16)}/>
              <span style={{color:C.ivoryM,fontFamily:"'Crimson Text',serif",fontSize:15}}>
                {T("No estoy seguro/a de mi parroquia","I'm not sure about my parish","Je ne suis pas sûr(e) de ma paroisse","Ich bin mir bei meiner Pfarrei nicht sicher","Não tenho certeza da minha paróquia","Non sono sicuro/a della mia parrocchia")}
              </span>
            </label>
          )}
        </FRow>
        
        {/* ─── Sacramentos del beneficiario (prebautismal y padrino) ─── */}
        {(userType==="prebautismal"||userType==="padrino")&&(
          <div style={{...CARD,marginBottom:16,padding:"16px 18px",
            border:`1px solid ${C.gold}30`,background:"rgba(200,169,81,0.04)"}}>
            <p style={{fontFamily:"'Cinzel',serif",color:C.goldL,fontSize:12,
              letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:8}}>
              {userType==="prebautismal"
                ? T("Sacramento(s) que recibirá su hijo/a","Sacrament(s) your child will receive","Sacrement(s) que recevra votre enfant","Sakrament(e), das/die Ihr Kind empfängt","Sacramento(s) que seu filho/a receberá","Sacramento/i che riceverà tuo figlio/a")
                : T("Sacramento(s) que recibirá su ahijado/a","Sacrament(s) your godchild will receive","Sacrement(s) que recevra votre filleul(e)","Sakrament(e), das/die Ihr Patenkind empfängt","Sacramento(s) que seu afilhado/a receberá","Sacramento/i che riceverà il tuo figlioccio/a")}
            </p>
            <p style={{color:C.ivoryM,fontFamily:"'Crimson Text',serif",fontSize:13,
              lineHeight:1.5,marginBottom:14}}>
              {T("Puedes elegir uno o más. Se aplica una cuota única independientemente de la cantidad seleccionada.","You can choose one or more. A single flat fee applies regardless of the number selected.","Vous pouvez en choisir un ou plusieurs. Un tarif unique s'applique quel que soit le nombre sélectionné.","Sie können eines oder mehrere auswählen. Es gilt eine einmalige Gebühr, unabhängig von der Anzahl der ausgewählten Sakramente.","Você pode escolher um ou mais. Aplica-se uma taxa única independentemente da quantidade selecionada.","Puoi sceglierne uno o più. Si applica una tariffa unica indipendentemente dal numero selezionato.")}
            </p>
            {[
              {k:"bautismo",        es:"Bautismo",                         en:"Baptism",               icon:"__bautismo_img__",fr:"Baptême",de:"Taufe",pt:"Batismo",it:"Battesimo"},
              {k:"confirmacion",    es:"Confirmación",                     en:"Confirmation",           icon:"__confirmacion_img__",fr:"Confirmation",de:"Firmung",pt:"Crisma",it:"Cresima"},
              {k:"primera_comunion",es:"Eucaristía / Primera Comunión",    en:"Eucharist / First Communion", icon:"__caliz__",fr:"Eucharistie / Première Communion",de:"Eucharistie / Erstkommunion",pt:"Eucaristia / Primeira Comunhão",it:"Eucaristia / Prima Comunione"},
            ].map(sac=>{
              const isSel=(d.sacsBeneficiario||[]).includes(sac.k);
              return(
                <label key={sac.k}
                  onClick={()=>{
                    const cur=d.sacsBeneficiario||[];
                    set("sacsBeneficiario",
                      cur.includes(sac.k)?cur.filter(x=>x!==sac.k):[...cur,sac.k]);
                  }}
                  style={{display:"flex",alignItems:"center",gap:12,cursor:"pointer",
                    padding:"10px 14px",borderRadius:10,marginBottom:8,transition:"all .2s",
                    background:isSel?"rgba(200,169,81,0.13)":"rgba(255,255,255,0.03)",
                    border:`1.5px solid ${isSel?C.gold:C.borderD}`}}>
                  <input type="checkbox" checked={isSel} readOnly
                    style={checkStyle(isSel,17)}/>
                  <span style={{width:28,height:28,display:"flex",alignItems:"center",
                    justifyContent:"center",flexShrink:0}}>
                    {sac.icon==="__bautismo_img__"
                      ?<img src={iconoBautismo} width={26} height={26}
                          style={{objectFit:"contain",filter:"sepia(1) saturate(3) brightness(0.95)"}}/>
                      :sac.icon==="__confirmacion_img__"
                      ?<img src={iconoConfirmacion} width={26} height={26}
                          style={{objectFit:"contain",filter:"sepia(1) saturate(3) brightness(0.95)"}}/>
                      :sac.icon==="__caliz__"
                      ?<CalizIcon size={26}/>
                      :<span style={{fontSize:22}}>{sac.icon}</span>}
                  </span>
                  <span style={{color:C.ivory,fontFamily:"'Crimson Text',serif",fontSize:16.5,flex:1}}>
                    {T(sac.es,sac.en,sac.fr,sac.de,sac.pt,sac.it)}
                  </span>
                  {isSel&&<span style={{color:C.gold,fontSize:16,fontWeight:700}}>✓</span>}
                </label>
              );
            })}
            {!(d.sacsBeneficiario||[]).length&&(
              <p style={{color:"#F87171",fontSize:12,marginTop:4}}>
                ⚠️ {T("Selecciona al menos un sacramento para continuar.","Select at least one sacrament to continue.","Sélectionnez au moins un sacrement pour continuer.","Wählen Sie mindestens ein Sakrament aus, um fortzufahren.","Selecione ao menos um sacramento para continuar.","Seleziona almeno un sacramento per continuare.")}
              </p>
            )}
            {(d.sacsBeneficiario||[]).length>0&&(
              <p style={{color:C.green,fontSize:12,marginTop:4}}>
                ★ {T("Cuota única — el importe no varía por la cantidad de sacramentos seleccionados.","Flat fee — the amount does not change based on the number of sacraments selected.","Tarif unique — le montant ne varie pas selon le nombre de sacrements sélectionnés.","Einmalige Gebühr — der Betrag ändert sich nicht je nach Anzahl der ausgewählten Sakramente.","Taxa única — o valor não varia conforme a quantidade de sacramentos selecionados.","Tariffa unica — l'importo non varia in base al numero di sacramenti selezionati.")}
              </p>
            )}
          </div>
        )}
        {/* Curso y precio */}
        <div style={{...CARD,background:"rgba(200,169,81,0.07)",border:`1px solid ${C.gold}40`,marginBottom:16}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
            <div>
              <span style={LBL}>{T("Curso seleccionado","Selected course","Cours sélectionné","Ausgewählter Kurs","Curso selecionado","Corso selezionato")}</span>
              <p style={{color:C.ivory,fontFamily:"'Crimson Text',serif",fontSize:15}}>{courseLabel()}</p>
            </div>
            <div>
              <span style={LBL}>{T("Duración total","Total duration","Durée totale","Gesamtdauer","Duração total","Durata totale")}</span>
              <p style={{color:C.ivory,fontFamily:"'Crimson Text',serif",fontSize:15}}>{hoursDisplay()}</p>
            </div>
            <div>
              <span style={LBL}>{T("Cuota total","Total fee","Montant total","Gesamtgebühr","Taxa total","Quota totale")}</span>
              {d.estaInternado?(
                <p style={{color:"#3DA070",fontFamily:"'Cinzel',serif",fontSize:13,
                  fontWeight:700,letterSpacing:"0.04em"}}>
                  🏆 {T("Beca aplicada","Scholarship applied","Bourse appliquée","Angewendetes Stipendium","Bolsa aplicada","Borsa applicata")}
                </p>
              ):pb?(
                <p style={{color:C.gold,fontFamily:"'Cinzel',serif",fontSize:15,fontWeight:700}}>
                  {pb.total.toLocaleString()} {pb.cur}
                  {pb.becaDesc===20&&(
                    <span style={{display:"block",color:C.goldL,
                      fontFamily:"'Crimson Text',serif",fontSize:11,fontWeight:400}}>
                      💊 {T("Incluye 20% de descuento","Includes 20% discount","Comprend 20 % de réduction","Enthält 20 % Rabatt","Inclui 20% de desconto","Include il 20% di sconto")}
                    </span>
                  )}
                </p>
              ):(
                <p style={{color:C.ivoryM,fontFamily:"'Crimson Text',serif",
                  fontSize:13,fontStyle:"italic"}}>
                  {T("Selecciona tu país","Select your country","Sélectionnez votre pays","Wählen Sie Ihr Land","Selecione seu país","Seleziona il tuo paese")}
                </p>
              )}
            </div>
          </div>
          {/* Becas: ocultar precio y mostrar mensaje de beca */}
          {d.estaInternado?(
            <div style={{marginTop:12,borderTop:`1px solid ${C.borderD}`,paddingTop:14,
              background:"rgba(45,122,90,0.10)",borderRadius:8,padding:"12px 14px",marginTop:12}}>
              <p style={{color:"#3DA070",fontFamily:"'Cinzel',serif",fontSize:13,
                letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:6}}>
                🏆 {T("Beca Solidaria del 100%","100% Solidarity Scholarship","Bourse de Solidarité de 100 %","Solidaritätsstipendium von 100 %","Bolsa Solidária de 100%","Borsa di Solidarietà del 100%")}
              </p>
              <p style={{color:C.ivory,fontFamily:"'Crimson Text',serif",fontSize:15,lineHeight:1.6}}>
                {T("Tu formación es completamente gratuita por encontrarte en una institución de readaptación social. No se realizará ningún cobro.","Your formation is completely free because you are in a social rehabilitation institution. No charge will be made.","Votre formation est entièrement gratuite car vous vous trouvez dans un établissement de réinsertion sociale. Aucun frais ne sera facturé.","Ihre Ausbildung ist vollständig kostenlos, da Sie sich in einer Einrichtung zur sozialen Wiedereingliederung befinden. Es wird keine Gebühr erhoben.","Sua formação é totalmente gratuita por você estar em uma instituição de readaptação social. Nenhuma cobrança será realizada.","La tua formazione è completamente gratuita poiché ti trovi in un'istituzione di riadattamento sociale. Non verrà addebitato alcun costo.")}
              </p>
            </div>
          ):(
            <>
              {/* Nota de Beca de Esperanza 20% sobre el precio con descuento */}
              {d.esPacienteRehabilitacion&&(
                <div style={{marginTop:10,background:"rgba(200,169,81,0.08)",
                  borderRadius:8,padding:"8px 12px",border:`1px solid ${C.gold}30`}}>
                  <p style={{color:C.goldL,fontFamily:"'Cinzel',serif",fontSize:12,
                    letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:3}}>
                    💊 {T("Beca de Esperanza del 20%","20% Hope Scholarship","Bourse d'Espérance de 20 %","Hoffnungsstipendium von 20 %","Bolsa Esperança de 20%","Borsa di Speranza del 20%")}
                  </p>
                  <p style={{color:C.ivoryM,fontFamily:"'Crimson Text',serif",fontSize:13}}>
                    {T("El importe ya refleja el 20% de descuento aplicado a tu cuota.","The amount already reflects the 20% discount applied to your fee.","Le montant reflète déjà les 20 % de réduction appliqués à votre contribution.","Der Betrag berücksichtigt bereits den 20%igen Rabatt auf Ihre Gebühr.","O valor já reflete o desconto de 20% aplicado à sua taxa.","L'importo riflette già lo sconto del 20% applicato alla tua quota.")}
                  </p>
                </div>
              )}
              {pb&&(
                <div style={{marginTop:12,borderTop:`1px solid ${C.borderD}`,paddingTop:12}}>
                  <span style={LBL}>{T("Aportación económica","Economic contribution","Contribution financière","Finanzieller Beitrag","Contribuição econômica","Contributo economico")}</span>
                  {pb.lines.map((l,i)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",
                      color:C.ivoryM,fontFamily:"'Crimson Text',serif",fontSize:14}}>
                      <span>{l.label}</span>
                      <span>{l.amt.toLocaleString()} {l.cur}</span>
                    </div>
                  ))}
                  {pb.lines.length>1&&(
                    <div style={{display:"flex",justifyContent:"space-between",marginTop:6,
                      color:C.gold,fontFamily:"'Cinzel',serif",fontSize:15,fontWeight:700}}>
                      <span>{T("Total","Total","Total","Gesamt","Total","Totale")}</span>
                      <span>{pb.total.toLocaleString()} {pb.cur}</span>
                    </div>
                  )}
                </div>
              )}
              {!pb&&country&&(
                <p style={{color:C.ivoryM,fontSize:13,marginTop:8}}>
                  {T("Selecciona tu país para ver el importe","Select your country to see the amount","Sélectionnez votre pays pour voir le montant","Wählen Sie Ihr Land, um den Betrag zu sehen","Selecione seu país para ver o valor","Seleziona il tuo paese per vedere l'importo")}
                </p>
              )}
              {pb?.flatFee&&(
                <p style={{color:C.goldL,fontSize:12,marginTop:8}}>
                  ★ {T("Cuota única — el importe no varía por la cantidad de sacramentos seleccionados.","Flat fee — the amount does not change based on the number of sacraments selected.","Tarif unique — le montant ne varie pas selon le nombre de sacrements sélectionnés.","Einmalige Gebühr — der Betrag ändert sich nicht je nach Anzahl der ausgewählten Sakramente.","Taxa única — o valor não varia conforme a quantidade de sacramentos selecionados.","Tariffa unica — l'importo non varia in base al numero di sacramenti selezionati.")}
                </p>
              )}
            </>
          )}
          {userType!=="catequista"&&(
            <p style={{color:C.ivoryM,fontSize:12,marginTop:8}}>
              ℹ️ {T("La constancia tiene validez únicamente para mayores de 18 años.","The certificate is valid only for persons 18 years of age or older.","L'attestation n'est valable que pour les personnes de plus de 18 ans.","Die Bescheinigung ist nur für Personen über 18 Jahre gültig.","O certificado tem validade apenas para maiores de 18 anos.","L'attestato è valido solo per i maggiori di 18 anni.")}
            </p>
          )}
        </div>
        
        {/* ─── Dirección de Parroquia (solo catequistas) ─── */}
        {userType==="catequista"&&(
          <div style={{...CARD,border:`1px solid ${C.gold}20`,marginBottom:16,padding:"14px 16px"}}>
            <p style={{...LBL,color:C.goldL,marginBottom:12,fontSize:12}}>
              {T("Dirección de su parroquia","Address of your parish","Adresse de votre paroisse","Adresse Ihrer Pfarrei","Endereço da sua paróquia","Indirizzo della tua parrocchia")}
            </p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <FRow label={T("Estado / Provincia","State / Province","État / Province","Bundesland / Provinz","Estado / Província","Stato / Provincia")}>
                <Input value={d.parEstado} onChange={v=>set("parEstado",v)} placeholder={T("Estado o Provincia","State or Province","État ou Province","Bundesland oder Provinz","Estado ou Província","Stato o Provincia")}/>
              </FRow>
              <FRow label={T("Municipio / Alcaldía","Municipality / Borough","Municipalité / Arrondissement","Gemeinde / Bezirk","Município / Distrito","Comune / Circoscrizione")}>
                <Input value={d.parMunicipio} onChange={v=>set("parMunicipio",v)} placeholder={T("Municipio o Alcaldía","Municipality","Municipalité ou Arrondissement","Gemeinde oder Bezirk","Município ou Distrito","Comune o Circoscrizione")}/>
              </FRow>
              <FRow label={T("Calle","Street","Rue","Straße","Rua","Via")}>
                <Input value={d.parCalle} onChange={v=>set("parCalle",v)} placeholder={T("Nombre de la calle","Street name","Nom de la rue","Straßenname","Nome da rua","Nome della via")}/>
              </FRow>
              <FRow label={T("Número","Number","Numéro","Nummer","Número","Numero")}>
                <Input value={d.parNumero} onChange={v=>set("parNumero",v)} placeholder="123"/>
              </FRow>
            </div>
          </div>
        )}
        {/* ─── Parroquia/Diócesis afiliada (solo catequistas) ─── */}
        {userType==="catequista"&&(
          <div style={{...CARD,border:`1px solid ${C.gold}30`,marginBottom:16,padding:"14px 16px",background:"rgba(200,169,81,0.05)"}}>
            <p style={{color:C.ivory,fontFamily:"'Crimson Text',serif",fontSize:15.5,marginBottom:12}}>
              {T("¿Tu parroquia o diócesis ya está afiliada a la plataforma Catecumen?","Is your parish or diocese already affiliated with the Catecumen platform?","Votre paroisse ou diocèse est-il déjà affilié à la plateforme Catecumen ?","Ist Ihre Pfarrei oder Diözese bereits mit der Catecumen-Plattform verbunden?","Sua paróquia ou diocese já está afiliada à plataforma Catecumen?","La tua parrocchia o diocesi è già affiliata alla piattaforma Catecumen?")}
            </p>
            <div style={{display:"flex",gap:12,marginBottom:10}}>
              {["si","no"].map(v=>(
                <button key={v} type="button" onClick={()=>{set("afiliadaOrg",v);if(v==="si"){setLocalRain(true);setTimeout(()=>setLocalRain(false),4000);}}}
                  style={{...BTN(d.afiliadaOrg===v?"pri":"sec"),flex:1,justifyContent:"center",padding:"9px 14px"}}>
                  {v==="si"?T("Sí — está afiliada","Yes — it is affiliated","Oui — elle est affiliée","Ja — sie ist angeschlossen","Sim — está afiliada","Sì — è affiliata"):T("No","No","Non","Nein","Não","No")}
                </button>
              ))}
            </div>
            {d.afiliadaOrg==="si"&&(
              <div>
                <p style={{color:C.goldL,fontSize:13,marginBottom:8}}>
                  🎉 {T("¡Excelente! Ingresa el identificador de registro de tu parroquia o diócesis para verificar su afiliación.","Excellent! Enter your parish's or diocese's registration ID to verify its affiliation.","Excellent ! Saisissez l'identifiant d'enregistrement de votre paroisse ou diocèse pour vérifier son affiliation.","Ausgezeichnet! Geben Sie die Registrierungskennung Ihrer Pfarrei oder Diözese ein, um deren Zugehörigkeit zu bestätigen.","Excelente! Digite o identificador de registro da sua paróquia ou diocese para verificar sua afiliação.","Ottimo! Inserisci l'identificativo di registrazione della tua parrocchia o diocesi per verificarne l'affiliazione.")}
                </p>
                <FRow label={T("Identificador de registro de tu parroquia o diócesis","Registration ID of your parish or diocese","Identifiant d'enregistrement de votre paroisse ou diocèse","Registrierungskennung Ihrer Pfarrei oder Diözese","Identificador de registro da sua paróquia ou diocese","Identificativo di registrazione della tua parrocchia o diocesi")}>
                  <div style={{display:"flex",gap:10}}>
                    <div style={{flex:1}}>
                      <Input value={d.orgRegistroId}
                        onChange={v=>{set("orgRegistroId",v);setOrgVerif(null);}}
                        placeholder="MX-PAR-26-001"/>
                    </div>
                    <button type="button" onClick={verificarOrg}
                      disabled={!d.orgRegistroId||orgVerif==="verificando"}
                      style={{...BTN("sec"),padding:"10px 18px",fontSize:12,
                        opacity:(!d.orgRegistroId||orgVerif==="verificando")?0.5:1}}>
                      {orgVerif==="verificando"
                        ?T("Verificando…","Verifying…","Vérification…","Wird überprüft…","Verificando…","Verifica in corso…")
                        :T("Verificar","Verify","Vérifier","Überprüfen","Verificar","Verifica")}
                    </button>
                  </div>
                </FRow>
                {orgVerif==="valido"&&(
                  <p style={{color:"#3DA070",fontSize:13.5,marginTop:8,
                    fontFamily:"'Crimson Text',serif"}}>
                    ✅ {T(`Identificador verificado: ${orgNombre}. Al completar tu registro se te otorgará el acceso al área de formación.`,
                          `ID verified: ${orgNombre}. Upon completing your registration you will be granted access to the formation area.`,
                          `Identifiant vérifié : ${orgNombre}. Une fois votre inscription terminée, vous aurez accès à l'espace de formation.`,
                          `Kennung bestätigt: ${orgNombre}. Nach Abschluss Ihrer Anmeldung erhalten Sie Zugang zum Ausbildungsbereich.`,
                          `Identificador verificado: ${orgNombre}. Ao concluir seu registro, você terá acesso à área de formação.`,
                          `Identificativo verificato: ${orgNombre}. Al completamento della registrazione ti verrà concesso l'accesso all'area di formazione.`)}
                  </p>
                )}
                {orgVerif==="invalido"&&(
                  <p style={{color:"#F87171",fontSize:13.5,marginTop:8,
                    fontFamily:"'Crimson Text',serif"}}>
                    ⚠️ {T("El identificador no coincide con ninguna parroquia o diócesis registrada. Verifícalo con tu párroco o con la oficina parroquial e intenta de nuevo.","The ID does not match any registered parish or diocese. Please verify it with your pastor or the parish office and try again.","L'identifiant ne correspond à aucune paroisse ou diocèse enregistré. Vérifiez-le auprès de votre curé ou du bureau paroissial et réessayez.","Die Kennung stimmt mit keiner registrierten Pfarrei oder Diözese überein. Überprüfen Sie sie bei Ihrem Pfarrer oder im Pfarrbüro und versuchen Sie es erneut.","O identificador não corresponde a nenhuma paróquia ou diocese registrada. Verifique com seu pároco ou com o escritório paroquial e tente novamente.","L'identificativo non corrisponde a nessuna parrocchia o diocesi registrata. Verificalo con il tuo parroco o con l'ufficio parrocchiale e riprova.")}
                  </p>
                )}
                {orgVerif==="errorDB"&&(
                  <p style={{color:C.goldL,fontSize:13.5,marginTop:8,
                    fontFamily:"'Crimson Text',serif"}}>
                    ℹ️ {T("No fue posible consultar la base de datos en este momento. Puedes continuar con tu registro; en breve recibirás la confirmación de Catecumen en tu correo electrónico.","It was not possible to query the database at this moment. You may continue with your registration; you will shortly receive confirmation from Catecumen by email.","Il n'a pas été possible de consulter la base de données pour le moment. Vous pouvez poursuivre votre inscription ; vous recevrez sous peu la confirmation de Catecumen par e-mail.","Die Datenbank konnte derzeit nicht abgefragt werden. Sie können mit Ihrer Registrierung fortfahren; Sie erhalten in Kürze die Bestätigung von Catecumen per E-Mail.","Não foi possível consultar o banco de dados neste momento. Você pode continuar com seu registro; em breve receberá a confirmação da Catecumen por e-mail.","Non è stato possibile consultare il database in questo momento. Puoi proseguire con la tua registrazione; riceverai a breve la conferma di Catecumen via email.")}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
        {/* ─── Institución de readaptación social (beca 100%) ─── */}
        {["catecumeno","padrino","prebautismal"].includes(userType)&&!d.esPacienteRehabilitacion&&(
          <div style={{...CARD,marginBottom:16,padding:"16px 18px",
            border:`1px solid ${C.borderD}`,background:"rgba(255,255,255,0.02)"}}>
            <label style={{display:"flex",alignItems:"flex-start",gap:12,cursor:"pointer"}}
              onClick={()=>{const v=!d.estaInternado;set("estaInternado",v);if(v)set("esPacienteRehabilitacion",false);}}>
              <input type="checkbox" checked={d.estaInternado||false} readOnly
                style={{...checkStyle(d.estaInternado||false,18),marginTop:3}}/>
              <span style={{color:C.ivory,fontFamily:"'Crimson Text',serif",fontSize:15.5,lineHeight:1.55}}>
                {T("Estoy actualmente internado/a en una institución de readaptación social, correccional, albergue, asilo o casa hogar.","I am currently in a social rehabilitation, correctional, shelter, nursing home, or group home institution.","Je suis actuellement interné(e) dans un établissement de réinsertion sociale, un centre correctionnel, un foyer, une maison de retraite ou un foyer d'accueil.","Ich befinde mich derzeit in einer Einrichtung zur sozialen Wiedereingliederung, einer Erziehungseinrichtung, einem Heim, einem Altenheim oder einem Kinderheim.","Estou atualmente internado/a em uma instituição de readaptação social, centro correcional, abrigo, asilo ou casa lar.","Sono attualmente recluso/a in un'istituzione di riadattamento sociale, riformatorio, rifugio, casa di riposo o casa famiglia.")}
              </span>
            </label>
            {d.estaInternado&&(
              <div style={{marginTop:16}}>
                <div style={{...CARD,background:"rgba(45,122,90,0.12)",border:"1px solid #2D7A5A",
                  marginBottom:16,padding:"12px 16px"}}>
                  <p style={{color:"#3DA070",fontFamily:"'Crimson Text',serif",fontSize:15,lineHeight:1.6}}>
                    🎓 {T("¡Tienes acceso a una beca del 100%! Podrás iniciar tu formación sin costo alguno una vez completado el registro.","You qualify for a 100% scholarship! You can begin your formation at no cost once registration is complete.","Vous avez accès à une bourse de 100 % ! Vous pourrez commencer votre formation gratuitement une fois l'inscription terminée.","Sie haben Zugang zu einem 100%-Stipendium! Sie können Ihre Ausbildung nach Abschluss der Registrierung kostenlos beginnen.","Você tem acesso a uma bolsa de 100%! Poderá iniciar sua formação sem nenhum custo assim que o registro for concluído.","Hai accesso a una borsa di studio del 100%! Potrai iniziare la tua formazione gratuitamente una volta completata la registrazione.")}
                  </p>
                </div>
                {/* Tipo de institución */}
                <FRow label={T("Tipo de institución","Type of institution","Type d'établissement","Art der Einrichtung","Tipo de instituição","Tipo di istituzione")}>
                  <select value={d.tipoInstInternado||""} onChange={e=>set("tipoInstInternado",e.target.value)} style={INP}>
                    <option value="">{T("Selecciona...","Select...","Sélectionnez...","Auswählen...","Selecione...","Seleziona...")}</option>
                    {[T("Reclusorio / Centro penitenciario","Correctional / Penitentiary center","Établissement pénitentiaire","Justizvollzugsanstalt","Presídio / Centro penitenciário","Carcere / Istituto penitenziario"),
                      T("Centro correccional","Correctional center","Centre correctionnel","Erziehungseinrichtung","Centro correcional","Riformatorio"),
                      T("Albergue","Shelter","Foyer","Heim","Abrigo","Rifugio"),
                      T("Asilo / Casa de reposo","Nursing home","Maison de retraite","Altenheim","Asilo / Lar de idosos","Casa di riposo"),
                      T("Casa hogar","Group home","Foyer d'accueil","Kinderheim","Casa lar","Casa famiglia")].map(t=>(
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </FRow>
                {/* Nombre de la institución */}
                <FRow label={T("Nombre de la institución","Institution name","Nom de l'établissement","Name der Einrichtung","Nome da instituição","Nome dell'istituzione")}>
                  <Input value={d.nombreInst} onChange={v=>set("nombreInst",v)}
                    placeholder={T("Nombre oficial de la institución","Official institution name","Nom officiel de l'établissement","Offizieller Name der Einrichtung","Nome oficial da instituição","Nome ufficiale dell'istituzione")}/>
                </FRow>
                {/* Ubicación */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  <FRow label={T("País","Country","Pays","Land","País","Paese")}>
                    <select value={d.paisInst||""} onChange={e=>set("paisInst",e.target.value)} style={INP}>
                      <option value="">{T("País","Country","Pays","Land","País","Paese")}</option>
                      {COUNTRIES.map(c=><option key={c} value={c}>{c}</option>)}
                    </select>
                  </FRow>
                  <FRow label={T("Estado / Provincia","State / Province","État / Province","Bundesland / Provinz","Estado / Província","Stato / Provincia")}>
                    <Input value={d.estadoInst} onChange={v=>set("estadoInst",v)}
                      placeholder={T("Estado o Provincia","State or Province","État ou Province","Bundesland oder Provinz","Estado ou Província","Stato o Provincia")}/>
                  </FRow>
                  <FRow label={T("Municipio / Alcaldía","Municipality","Municipalité","Gemeinde","Município","Comune")}>
                    <Input value={d.municipioInst} onChange={v=>set("municipioInst",v)}
                      placeholder={T("Municipio o Alcaldía","Municipality","Municipalité ou Arrondissement","Gemeinde oder Bezirk","Município ou Distrito","Comune o Circoscrizione")}/>
                  </FRow>
                  <FRow label={T("Nombre de la instalación","Facility name","Nom de l'installation","Name der Anlage","Nome da instalação","Nome della struttura")}>
                    <Input value={d.instalacionInst} onChange={v=>set("instalacionInst",v)}
                      placeholder={T("Nombre del módulo o pabellón","Module or ward name","Nom du module ou pavillon","Name des Trakts oder Flügels","Nome do módulo ou pavilhão","Nome del modulo o padiglione")}/>
                  </FRow>
                </div>
                {/* Teléfono de la institución */}
                <FRow label={T("Teléfono de contacto de la institución","Institution contact phone","Téléphone de contact de l'établissement","Kontakttelefon der Einrichtung","Telefone de contato da instituição","Telefono di contatto dell'istituzione")}>
                  <PhoneField phoneCode={d.telInstCode} phone={d.telInst}
                    onChange={(k,v)=>set(k==="phoneCode"?"telInstCode":"telInst",v)}/>
                </FRow>
                {/* Familiar de contacto */}
                <FRow label={T("Nombre de familiar de contacto","Family contact name","Nom du proche à contacter","Name des Familienkontakts","Nome do familiar de contato","Nome del familiare di contatto")}>
                  <Input value={d.familiarNombre} onChange={v=>set("familiarNombre",v)}
                    placeholder={T("Nombre completo del familiar","Full name of family member","Nom complet du proche","Vollständiger Name des Familienangehörigen","Nome completo do familiar","Nome completo del familiare")}/>
                </FRow>
                <FRow label={T("Teléfono de familiar de contacto","Family contact phone","Téléphone du proche à contacter","Telefon des Familienkontakts","Telefone do familiar de contato","Telefono del familiare di contatto")}>
                  <PhoneField phoneCode={d.familiarTelCode} phone={d.familiarTel}
                    onChange={(k,v)=>set(k==="phoneCode"?"familiarTelCode":"familiarTel",v)}/>
                </FRow>
              </div>
            )}
          </div>
        )}
        {/* ─── Paciente en Centro de Rehabilitación de Adicciones (Beca 20%) ─── */}
        {["catecumeno","padrino","prebautismal"].includes(userType)&&!d.estaInternado&&(
          <div style={{...CARD,marginBottom:16,padding:"16px 18px",
            border:`1px solid ${C.borderD}`,background:"rgba(255,255,255,0.02)"}}>
            <label style={{display:"flex",alignItems:"flex-start",gap:12,cursor:"pointer"}}
              onClick={()=>{const v=!d.esPacienteRehabilitacion;set("esPacienteRehabilitacion",v);if(v)set("estaInternado",false);}}>
              <input type="checkbox" checked={d.esPacienteRehabilitacion||false} readOnly
                style={{...checkStyle(d.esPacienteRehabilitacion||false,18),marginTop:3}}/>
              <span style={{color:C.ivory,fontFamily:"'Crimson Text',serif",fontSize:15.5,lineHeight:1.55}}>
                {T("Soy paciente activo en un Centro de Rehabilitación de Adicciones.","I am an active patient at an Addiction Rehabilitation Center.","Je suis actuellement patient(e) dans un Centre de Réhabilitation des Addictions.","Ich bin aktiver Patient/aktive Patientin in einem Suchtrehabilitationszentrum.","Sou paciente ativo/a em um Centro de Reabilitação de Dependências.","Sono paziente attivo/a in un Centro di Riabilitazione delle Dipendenze.")}
              </span>
            </label>
            {d.esPacienteRehabilitacion&&(
              <div style={{marginTop:16}}>
                <div style={{...CARD,background:"rgba(200,169,81,0.1)",
                  border:`1px solid ${C.gold}50`,marginBottom:14,padding:"12px 16px"}}>
                  <p style={{color:C.goldL,fontFamily:"'Crimson Text',serif",fontSize:15,lineHeight:1.6}}>
                    💊 {T("¡Tienes derecho a la Beca de Esperanza del 20%! Se aplicará automáticamente un descuento del 20% sobre tu cuota de recuperación.","You qualify for the 20% Hope Scholarship! A 20% discount will be automatically applied to your recovery fee.","Vous avez droit à la Bourse d'Espérance de 20 % ! Une réduction de 20 % sera automatiquement appliquée à votre contribution.","Sie haben Anspruch auf das Hoffnungsstipendium von 20 %! Ein Rabatt von 20 % wird automatisch auf Ihren Genesungsbeitrag angewendet.","Você tem direito à Bolsa Esperança de 20%! Um desconto de 20% será aplicado automaticamente à sua taxa de recuperação.","Hai diritto alla Borsa di Speranza del 20%! Uno sconto del 20% verrà applicato automaticamente alla tua quota di recupero.")}
                  </p>
                </div>
                <FRow label={T("Nombre del Centro de Rehabilitación","Rehabilitation Center Name","Nom du Centre de Réhabilitation","Name des Rehabilitationszentrums","Nome do Centro de Reabilitação","Nome del Centro di Riabilitazione")}>
                  <Input value={d.nombreCentroRehab} onChange={v=>set("nombreCentroRehab",v)}
                    placeholder={T("Nombre oficial del Centro","Official name of the Center","Nom officiel du Centre","Offizieller Name des Zentrums","Nome oficial do Centro","Nome ufficiale del Centro")}/>
                </FRow>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  <FRow label={T("País","Country","Pays","Land","País","Paese")}>
                    <select value={d.paisCentroRehab||""} onChange={e=>set("paisCentroRehab",e.target.value)} style={INP}>
                      <option value="">{T("País","Country","Pays","Land","País","Paese")}</option>
                      {COUNTRIES.map(c=><option key={c} value={c}>{c}</option>)}
                    </select>
                  </FRow>
                  <FRow label={T("Estado / Provincia","State / Province","État / Province","Bundesland / Provinz","Estado / Província","Stato / Provincia")}>
                    <Input value={d.estadoCentroRehab} onChange={v=>set("estadoCentroRehab",v)}
                      placeholder={T("Estado o Provincia","State or Province","État ou Province","Bundesland oder Provinz","Estado ou Província","Stato o Provincia")}/>
                  </FRow>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── Estado Civil (catecúmeno y padrino) ─── */}
        {(userType==="catecumeno"||userType==="padrino")&&(
          <div style={{...CARD,marginBottom:16,padding:"16px 18px",
            border:`1px solid ${C.gold}28`,background:"rgba(200,169,81,0.04)"}}>
            <p style={{fontFamily:"'Cinzel',serif",color:C.goldL,fontSize:12,
              letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:14}}>
              {T("Estado Civil","Marital Status","État civil","Familienstand","Estado Civil","Stato Civile")}
            </p>
            {/* Campo 1: Estado civil legal */}
            <div style={{marginBottom:16}}>
              <label style={LBL}>
                {T("¿Cuál es su estado civil legal?","What is your legal marital status?","Quel est votre état civil légal ?","Wie lautet Ihr rechtlicher Familienstand?","Qual é o seu estado civil legal?","Qual è il tuo stato civile legale?")}
              </label>
              <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:4}}>
                {(userType==="catecumeno"
                  ? [
                      {k:"Soltero/a",                es:"Soltero/a",                   en:"Single",fr:"Célibataire",de:"Ledig",pt:"Solteiro/a",it:"Celibe/Nubile"},
                      {k:"Casado/a sólo por el civil",es:"Casado/a sólo por el civil", en:"Married (civil only)",fr:"Marié(e) civilement seulement",de:"Nur standesamtlich verheiratet",pt:"Casado/a só no civil",it:"Sposato/a solo civilmente"},
                      {k:"Divorciado/a",              es:"Divorciado/a",                en:"Divorced",fr:"Divorcé(e)",de:"Geschieden",pt:"Divorciado/a",it:"Divorziato/a"},
                    ]
                  : [
                      {k:"Soltero/a",                es:"Soltero/a",                   en:"Single",fr:"Célibataire",de:"Ledig",pt:"Solteiro/a",it:"Celibe/Nubile"},
                      {k:"Casado/a sólo por el civil",es:"Casado/a sólo por el civil", en:"Married (civil only)",fr:"Marié(e) civilement seulement",de:"Nur standesamtlich verheiratet",pt:"Casado/a só no civil",it:"Sposato/a solo civilmente"},
                      {k:"Casado/a por la Iglesia",   es:"Casado/a por la Iglesia",    en:"Married in the Church",fr:"Marié(e) à l'Église",de:"Kirchlich verheiratet",pt:"Casado/a pela Igreja",it:"Sposato/a in Chiesa"},
                      {k:"Divorciado/a",              es:"Divorciado/a",                en:"Divorced",fr:"Divorcé(e)",de:"Geschieden",pt:"Divorciado/a",it:"Divorziato/a"},
                    ]
                ).map(opt=>(
                  <label key={opt.k}
                    style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",
                      padding:"8px 12px",borderRadius:8,transition:"background .2s",
                      background:d.estadoCivil===opt.k?"rgba(200,169,81,0.12)":"transparent"}}
                    onClick={()=>{set("estadoCivil",opt.k);set("viveConPareja",null);set("planCasarseIglesia",null);set("viveNuevaPareja",null);set("viveConParejaSoltero",null);}}>
                    <input type="radio" name="estadoCivil" value={opt.k}
                      checked={d.estadoCivil===opt.k} readOnly
                      style={radioStyle(d.estadoCivil===opt.k,16)}/>
                    <span style={{color:C.ivory,fontFamily:"'Crimson Text',serif",fontSize:16}}>
                      {T(opt.es,opt.en,opt.fr,opt.de,opt.pt,opt.it)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            {/* Campo 2: ¿Vive con su pareja? — solo visible con "casado/a sólo por el civil" */}
            {d.estadoCivil==="Casado/a sólo por el civil"&&(
              <div style={{marginTop:14,paddingTop:14,borderTop:`1px solid ${C.borderD}`}}>
                <label style={LBL}>
                  {T("¿Vive actualmente con su pareja?","Do you currently live with your partner?","Vivez-vous actuellement avec votre partenaire ?","Leben Sie derzeit mit Ihrem Partner/Ihrer Partnerin zusammen?","Você vive atualmente com seu(sua) parceiro(a)?","Vivi attualmente con il tuo/la tua partner?")}
                </label>
                <div style={{display:"flex",gap:12,marginTop:6}}>
                  {["Sí","No"].map(val=>(
                    <button key={val} type="button"
                      onClick={()=>{set("viveConPareja",val);set("planCasarseIglesia",null);}}
                      style={{...BTN(d.viveConPareja===val?"pri":"sec"),
                        flex:1,justifyContent:"center",padding:"10px 14px"}}>
                      {SINO(val)}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {/* Cond-S: Soltero/a → ¿vive con alguna pareja? */}
            {d.estadoCivil==="Soltero/a"&&(
              <div style={{marginTop:14,paddingTop:14,borderTop:`1px solid ${C.borderD}`}}>
                <label style={LBL}>
                  {T("¿Vive con alguna pareja?","Do you live with a partner?","Vivez-vous avec un(e) partenaire ?","Leben Sie mit einem Partner/einer Partnerin zusammen?","Você vive com algum(a) parceiro(a)?","Vivi con un/una partner?")}
                </label>
                <div style={{display:"flex",gap:12,marginTop:6}}>
                  {["Sí","No"].map(val=>(
                    <button key={val} type="button"
                      onClick={()=>{set("viveConParejaSoltero",val);set("planCasarseIglesia",null);}}
                      style={{...BTN(d.viveConParejaSoltero===val?"pri":"sec"),
                        flex:1,justifyContent:"center",padding:"10px 14px"}}>
                      {SINO(val)}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {/* Cond-B: Divorciado/a → ¿viviendo con nueva pareja? */}
            {d.estadoCivil==="Divorciado/a"&&(
              <div style={{marginTop:14,paddingTop:14,borderTop:`1px solid ${C.borderD}`}}>
                <label style={LBL}>
                  {T("¿Estás viviendo con una nueva pareja?","Are you currently living with a new partner?","Vivez-vous actuellement avec un(e) nouveau/nouvelle partenaire ?","Leben Sie derzeit mit einem neuen Partner/einer neuen Partnerin zusammen?","Você está vivendo com um(a) novo(a) parceiro(a)?","Stai vivendo con un/una nuovo/a partner?")}
                </label>
                <div style={{display:"flex",gap:12,marginTop:6}}>
                  {["Sí","No"].map(val=>(
                    <button key={val} type="button"
                      onClick={()=>{set("viveNuevaPareja",val);set("planCasarseIglesia",null);}}
                      style={{...BTN(d.viveNuevaPareja===val?"pri":"sec"),
                        flex:1,justifyContent:"center",padding:"10px 14px"}}>
                      {SINO(val)}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {/* Compartida: si vive con pareja (cualquier estado civil) → ¿casarse por la Iglesia en 6 meses? */}
            {viveConAlguien&&(
              <div style={{marginTop:14,paddingTop:14,borderTop:`1px solid ${C.borderD}`}}>
                <label style={LBL}>
                  {T("¿Piensas casarte por la Iglesia en los próximos 6 meses?","Are you planning to get married in the Church in the next 6 months?","Prévoyez-vous de vous marier à l'Église dans les 6 prochains mois ?","Planen Sie, in den nächsten 6 Monaten kirchlich zu heiraten?","Você pretende se casar pela Igreja nos próximos 6 meses?","Pensi di sposarti in chiesa nei prossimi 6 mesi?")}
                </label>
                <div style={{display:"flex",gap:12,marginTop:6}}>
                  {["Sí","No"].map(val=>(
                    <button key={val} type="button"
                      onClick={()=>set("planCasarseIglesia",val)}
                      style={{...BTN(d.planCasarseIglesia===val?"pri":"sec"),
                        flex:1,justifyContent:"center",padding:"10px 14px"}}>
                      {SINO(val)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {/* ─── Términos y Condiciones ─── */}
        <div style={{borderTop:`1px solid ${C.borderD}`,paddingTop:16,marginBottom:16}}>
          <label style={{display:"flex",alignItems:"flex-start",gap:12,cursor:"pointer"}}>
            <input type="checkbox" checked={d.terms||false}
              onChange={e=>set("terms",e.target.checked)}
              style={{...checkStyle(d.terms||false,18),marginTop:3}}/>
            <span style={{color:C.ivoryM,fontFamily:"'Crimson Text',serif",fontSize:15,lineHeight:1.55}}>
              {T("He leído y acepto el ","I have read and accept the ","J'ai lu et j'accepte le ","Ich habe gelesen und akzeptiere die ","Li e aceito o ","Ho letto e accetto il ")}
              <a href={T("/normatividad_catecumen.pdf","/norms_catecumen_en.pdf","/norms_catecumen_en.pdf","/norms_catecumen_en.pdf","/norms_catecumen_en.pdf","/norms_catecumen_en.pdf")}
                target="_blank" rel="noopener noreferrer"
                style={{color:C.gold,textDecoration:"underline",textUnderlineOffset:3}}>
                {T("Reglamento de la Plataforma, Términos y Condiciones y Aviso de Privacidad","Platform Rules, Terms & Conditions and Privacy Notice","Règlement de la plateforme, Conditions générales et Politique de confidentialité","Plattformregeln, Allgemeine Geschäftsbedingungen und Datenschutzerklärung","Regulamento da Plataforma, Termos e Condições e Aviso de Privacidade","Regolamento della piattaforma, Termini e Condizioni e Informativa sulla privacy")}
              </a>
            </span>
          </label>
          {!d.terms&&d.nombre&&(
            <p style={{color:"#F87171",fontSize:12,marginTop:6,marginLeft:30}}>
              {T("Debes aceptar los términos para continuar","You must accept the terms to continue","Vous devez accepter les conditions pour continuer","Sie müssen die Bedingungen akzeptieren, um fortzufahren","Você deve aceitar os termos para continuar","Devi accettare i termini per continuare")}
            </p>
          )}
        </div>
        <div style={{display:"flex",gap:12}}>
          {/* Lista de campos pendientes — ayuda al usuario a saber qué falta */}
          {!canSubmit&&(d.nombre||d.email)&&(
            <div style={{background:"rgba(248,113,113,0.08)",border:"1px solid #F8717150",
              borderRadius:8,padding:"8px 12px",marginBottom:10,fontSize:12,
              color:"#F87171",fontFamily:"'Crimson Text',serif",lineHeight:1.8}}>
              <strong style={{display:"block",marginBottom:4,fontFamily:"'Cinzel',serif",
                fontSize:11,letterSpacing:"0.05em"}}>
                {T("Completa los siguientes campos:","Please complete the following fields:","Complétez les champs suivants :","Füllen Sie die folgenden Felder aus:","Preencha os seguintes campos:","Completa i seguenti campi:")}
              </strong>
              {!d.nombre&&<span>• {T("Nombre","First name","Prénom","Vorname","Nome","Nome")}<br/></span>}
              {!d.apellido&&<span>• {T("Apellido","Last name","Nom","Nachname","Sobrenome","Cognome")}<br/></span>}
              {!d.email&&<span>• {T("Correo electrónico","Email","E-mail","E-Mail","E-mail","Email")}<br/></span>}
              {!d.country&&<span>• {T("País de residencia","Country of residence","Pays de résidence","Wohnsitzland","País de residência","Paese di residenza")}<br/></span>}
              {!d.dob&&<span>• {T("Fecha de nacimiento","Date of birth","Date de naissance","Geburtsdatum","Data de nascimento","Data di nascita")}<br/></span>}
              {!d.phoneCode&&<span>• {T("Código de país (teléfono)","Phone country code","Indicatif du pays (téléphone)","Ländervorwahl (Telefon)","Código do país (telefone)","Prefisso internazionale (telefono)")}<br/></span>}
              {!d.phone&&<span>• {T("Teléfono","Phone number","Numéro de téléphone","Telefonnummer","Número de telefone","Numero di telefono")}<br/></span>}
              {!d.docNum&&<span>• {T("Número de documento","Document number","Numéro de document","Dokumentennummer","Número do documento","Numero di documento")}<br/></span>}
              {!(d.parroquia||d.noSure)&&userType!=="catequista"&&<span>• {T("Parroquia (o marcar 'no estoy seguro')","Parish (or check 'not sure')","Paroisse (ou cocher « pas sûr(e) »)","Pfarrei (oder „nicht sicher“ ankreuzen)","Paróquia (ou marcar 'não tenho certeza')","Parrocchia (o seleziona 'non sono sicuro/a')")}<br/></span>}
              {!d.parroquia&&userType==="catequista"&&<span>• {T("Parroquia donde presta catequesis","Parish where you serve","Paroisse où vous exercez la catéchèse","Pfarrei, in der Sie Katechese unterrichten","Paróquia onde exerce catequese","Parrocchia dove svolgi la catechesi")}<br/></span>}
              {!maritalOk&&["catecumeno","padrino"].includes(userType)&&<span>• {T("Estado civil","Marital status","État civil","Familienstand","Estado civil","Stato civile")}<br/></span>}
              {maritalOk&&!maritalFollowupOk&&<span>• {T("Responde todas las preguntas de estado civil","Answer all marital status questions","Répondez à toutes les questions sur l'état civil","Beantworten Sie alle Fragen zum Familienstand","Responda todas as perguntas sobre estado civil","Rispondi a tutte le domande sullo stato civile")}<br/></span>}
              {!sacsBenefOk&&<span>• {T("Sacramento(s) del beneficiario","Beneficiary sacrament(s)","Sacrement(s) du bénéficiaire","Sakrament(e) des Begünstigten","Sacramento(s) do beneficiário","Sacramento/i del beneficiario")}<br/></span>}
              {!d.terms&&<span>• {T("Acepta el Reglamento y Términos","Accept the Rules and Terms","Accepter le règlement et les conditions","Regeln und Bedingungen akzeptieren","Aceitar o Regulamento e os Termos","Accetta il Regolamento e i Termini")}<br/></span>}
              {!ageOk&&<span>• {T("Debes ser mayor de 17 años","Must be 17 or older","Vous devez avoir plus de 17 ans","Sie müssen älter als 17 Jahre sein","Você deve ter mais de 17 anos","Devi avere più di 17 anni")}<br/></span>}
            </div>
          )}
          <button onClick={onBack} style={{...BTN("sec"),flex:1,justifyContent:"center"}}>
            ← {T("Regresar","Back","Retour","Zurück","Voltar","Indietro")}
          </button>
          <button onClick={()=>canSubmit&&onNext({...d,age,isAdult,courseLabel:courseLabel(),hours:hoursDisplay(),priceBreakdown:pb,freeRegistration:isFree})}
            disabled={!canSubmit}
            style={{...BTN("pri"),flex:2,justifyContent:"center",
              opacity:canSubmit?1:0.4,cursor:canSubmit?"pointer":"not-allowed"}}>
            {T("Continuar al registro de contraseña","Continue to password setup","Continuer vers la création du mot de passe","Weiter zur Passwortvergabe","Continuar para o cadastro de senha","Continua alla creazione della password")} →
          </button>
        </div>
        <SoporteLink contexto={T("Modal de registro — ","Registration form — ","Formulaire d'inscription — ","Anmeldeformular — ","Formulário de registro — ","Modulo di registrazione — ")+userType}/>
      </div>
    </div>
    </div>
  );
}

// ─── REGISTRO PARROQUIA ─────────────────────────────────────────────
function RegisterParroquiaForm({onNext,onBack}){
  const [d,setD]=useState({});
  const set=(k,v)=>setD(p=>({...p,[k]:v}));

  const can=d.nombre&&d.country&&d.calle&&d.pastor&&d.banco&&d.cuenta&&d.titular&&d.contacto&&d.email&&d.phone&&d.phoneCode;
  // emiteFactura puede ser true/false; no bloquea el envío pero se guarda
  return(
    <div style={OVERLAY}>
      <div style={{...MODAL,maxWidth:680}}>
        <h2 style={{fontFamily:"'Cinzel',serif",color:C.gold,fontSize:17,marginBottom:20}}>
          ⛪ {T("Registro de Parroquia","Parish Registration","Inscription de la paroisse","Pfarreiregistrierung","Registro de Paróquia","Registrazione della parrocchia")}
        </h2>
        <FRow label={T("Nombre de la Parroquia","Parish Name","Nom de la paroisse","Name der Pfarrei","Nome da Paróquia","Nome della parrocchia")}>
          <Input value={d.nombre} onChange={v=>set("nombre",v)} placeholder={T("Nombre completo de la parroquia","Full parish name","Nom complet de la paroisse","Vollständiger Name der Pfarrei","Nome completo da paróquia","Nome completo della parrocchia")}/>
        </FRow>
        <FRow label={T("País","Country","Pays","Land","País","Paese")}>
          <select value={d.country||""} onChange={e=>set("country",e.target.value)} style={INP}>
            <option value="">{T("Selecciona el país","Select country","Sélectionnez le pays","Land auswählen","Selecione o país","Seleziona il paese")}</option>
            {COUNTRIES.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
        </FRow>
        <FRow label={T("Dirección completa","Full address","Adresse complète","Vollständige Adresse","Endereço completo","Indirizzo completo")}>
          <Input value={d.calle} onChange={v=>set("calle",v)}
            placeholder={T("Calle, número, municipio/alcaldía, estado/provincia","Street, number, municipality, state","Rue, numéro, municipalité, état/province","Straße, Nummer, Gemeinde, Bundesland/Provinz","Rua, número, município, estado/província","Via, numero, comune, stato/provincia")}/>
        </FRow>
        <FRow label={T("Nombre completo del Párroco","Full name of Parish Priest","Nom complet du curé","Vollständiger Name des Pfarrers","Nome completo do Pároco","Nome completo del parroco")}>
          <Input value={d.pastor} onChange={v=>set("pastor",v)} placeholder="P. Juan Ejemplo García"/>
        </FRow>
        <div style={{...CARD,background:"rgba(200,169,81,0.06)",border:`1px solid ${C.gold}30`,marginBottom:16}}>
          <p style={{...LBL,marginBottom:12,fontSize:13}}>{T("Datos bancarios para depósito de participación económica","Bank details for economic participation deposit","Coordonnées bancaires pour le dépôt de la contribution financière","Bankverbindung für die Einzahlung des finanziellen Beitrags","Dados bancários para depósito da contribuição econômica","Dati bancari per il deposito del contributo economico")}</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <FRow label={T("Banco","Bank","Banque","Bank","Banco","Banca")}>
              <Input value={d.banco} onChange={v=>set("banco",v)} placeholder={T("Nombre del banco","Bank name","Nom de la banque","Name der Bank","Nome do banco","Nome della banca")}/>
            </FRow>
            <FRow label={T("Número de cuenta","Account number","Numéro de compte","Kontonummer","Número da conta","Numero di conto")}>
              <Input value={d.cuenta} onChange={v=>set("cuenta",v)} placeholder="1234567890"/>
            </FRow>
            <FRow label="CLABE / SWIFT">
              <Input value={d.clabe} onChange={v=>set("clabe",v)} placeholder="18 dígitos / SWIFT code"/>
            </FRow>
            <FRow label={T("Titular de la cuenta","Account holder","Titulaire du compte","Kontoinhaber","Titular da conta","Titolare del conto")}>
              <Input value={d.titular} onChange={v=>set("titular",v)} placeholder={T("Nombre del titular","Account holder name","Nom du titulaire","Name des Inhabers","Nome do titular","Nome del titolare")}/>
            </FRow>
          </div>
        </div>
        <FRow label={T("Persona de contacto","Contact person","Personne de contact","Kontaktperson","Pessoa de contato","Persona di contatto")}>
          <Input value={d.contacto} onChange={v=>set("contacto",v)} placeholder={T("Nombre completo","Full name","Nom complet","Vollständiger Name","Nome completo","Nome completo")}/>
        </FRow>
        <FRow label={T("Correo electrónico de contacto","Contact email","E-mail de contact","Kontakt-E-Mail","E-mail de contato","Email di contatto")}>
          <Input type="email" value={d.email} onChange={v=>set("email",v)} placeholder="correo@parroquia.org"/>
        </FRow>
        <FRow label={T("Teléfono de contacto","Contact phone","Téléphone de contact","Kontakttelefon","Telefone de contato","Telefono di contatto")}>
          <PhoneField phoneCode={d.phoneCode} phone={d.phone} onChange={set}/>
        </FRow>
        {/* ─── Comprobante fiscal deducible ─── */}
        <div style={{...CARD,background:"rgba(200,169,81,0.06)",
          border:`1px solid ${C.gold}30`,marginBottom:16,padding:"14px 16px"}}>
          <label style={{display:"flex",alignItems:"flex-start",gap:12,cursor:"pointer"}}>
            <input type="checkbox" checked={!!d.emiteFactura}
              onChange={e=>set("emiteFactura",e.target.checked)}
              style={{...checkStyle(!!d.emiteFactura,18),marginTop:3}}/>
            <span style={{color:C.ivory,fontFamily:"'Crimson Text',serif",fontSize:15,lineHeight:1.6}}>
              {T("Nuestra parroquia emitirá a favor de Catecumen un comprobante fiscal deducible de impuestos por concepto de la ofrenda económica que Catecumen nos depositará.","Our parish will issue Catecumen a tax-deductible fiscal receipt for the economic offering that Catecumen will deposit to us.","Notre paroisse délivrera à Catecumen un reçu fiscal déductible pour l'offrande économique que Catecumen nous versera.","Unsere Pfarrei stellt Catecumen eine steuerlich absetzbare Quittung für die wirtschaftliche Spende aus, die Catecumen uns überweist.","Nossa paróquia emitirá em favor da Catecumen um comprovante fiscal dedutível de impostos referente à oferta econômica que a Catecumen nos depositará.","La nostra parrocchia emetterà a favore di Catecumen una ricevuta fiscale deducibile per l'offerta economica che Catecumen ci depositerà.")}
            </span>
          </label>
          {d.emiteFactura&&(
            <p style={{color:"#3DA070",fontFamily:"'Crimson Text',serif",
              fontSize:13.5,lineHeight:1.6,marginTop:10}}>
              🎉 {T("¡Excelente! Al emitir el comprobante fiscal, la ofrenda económica que Catecumen deposita a su parroquia se incrementa del 30% al 40% del importe total que cada catecúmeno o fiel pague a la plataforma.","Excellent! By issuing the fiscal receipt, the economic offering Catecumen deposits to your parish increases from 30% to 40% of the total amount paid by each catechumen or faithful person.","Excellent ! En délivrant le reçu fiscal, l'offrande économique que Catecumen verse à votre paroisse passe de 30 % à 40 % du montant total payé par chaque catéchumène ou fidèle à la plateforme.","Ausgezeichnet! Durch die Ausstellung der Steuerquittung erhöht sich die wirtschaftliche Spende, die Catecumen an Ihre Pfarrei überweist, von 30 % auf 40 % des Gesamtbetrags, den jeder Katechumene oder Gläubige an die Plattform zahlt.","Excelente! Ao emitir o comprovante fiscal, a oferta econômica que a Catecumen deposita à sua paróquia aumenta de 30% para 40% do valor total que cada catecúmeno ou fiel paga à plataforma.","Ottimo! Emettendo la ricevuta fiscale, l'offerta economica che Catecumen deposita alla tua parrocchia aumenta dal 30% al 40% dell'importo totale pagato da ogni catecumeno o fedele alla piattaforma.")}
            </p>
          )}
        </div>
        <div style={{display:"flex",gap:12}}>
          <button onClick={onBack} style={{...BTN("sec"),flex:1,justifyContent:"center"}}>
            ← {T("Regresar","Back","Retour","Zurück","Voltar","Indietro")}
          </button>
          <button onClick={()=>can&&onNext(d)} disabled={!can}
            style={{...BTN("pri"),flex:2,justifyContent:"center",opacity:can?1:0.4,cursor:can?"pointer":"not-allowed"}}>
            {T("Enviar Solicitud de Afiliación","Send Affiliation Request","Envoyer la demande d'affiliation","Antrag auf Anschluss senden","Enviar Solicitação de Afiliação","Invia richiesta di affiliazione")} →
          </button>
        </div>
        <SoporteLink contexto={T("Registro de Parroquia","Parish registration","Inscription de la paroisse","Pfarreiregistrierung","Registro de paróquia","Registrazione della parrocchia")}/>
      </div>
    </div>
  );
}

// ─── REGISTRO DIÓCESIS ──────────────────────────────────────────────
function RegisterDiocesisForm({onNext,onBack}){
  const [d,setD]=useState({});
  const set=(k,v)=>setD(p=>({...p,[k]:v}));

  const can=d.nombre&&d.country&&d.curia&&d.obispo&&d.contacto&&d.email&&d.phone&&d.phoneCode;
  return(
    <div style={OVERLAY}>
      <div style={{...MODAL,maxWidth:680}}>
        <h2 style={{fontFamily:"'Cinzel',serif",color:C.gold,fontSize:17,marginBottom:20}}>
          🏛️ {T("Registro de Diócesis","Diocese Registration","Inscription du diocèse","Diözesenregistrierung","Registro de Diocese","Registrazione della diocesi")}
        </h2>
        <FRow label={T("Nombre de la Diócesis","Diocese Name","Nom du diocèse","Name der Diözese","Nome da Diocese","Nome della diocesi")}>
          <Input value={d.nombre} onChange={v=>set("nombre",v)} placeholder={T("Nombre completo de la diócesis","Full diocese name","Nom complet du diocèse","Vollständiger Name der Diözese","Nome completo da diocese","Nome completo della diocesi")}/>
        </FRow>
        <FRow label={T("País","Country","Pays","Land","País","Paese")}>
          <select value={d.country||""} onChange={e=>set("country",e.target.value)} style={INP}>
            <option value="">{T("Selecciona el país","Select country","Sélectionnez le pays","Land auswählen","Selecione o país","Seleziona il paese")}</option>
            {COUNTRIES.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
        </FRow>
        <FRow label={T("Dirección de la Curia Diocesana","Address of the Diocesan Curia","Adresse de la Curie diocésaine","Adresse der Diözesankurie","Endereço da Cúria Diocesana","Indirizzo della Curia diocesana")}>
          <Input value={d.curia} onChange={v=>set("curia",v)}
            placeholder={T("Calle, número, municipio, estado","Street, number, municipality, state","Rue, numéro, municipalité, état","Straße, Nummer, Gemeinde, Bundesland","Rua, número, município, estado","Via, numero, comune, stato")}/>
        </FRow>
        <FRow label={T("Nombre completo del Señor Obispo","Full name of the Bishop","Nom complet de Monseigneur l'Évêque","Vollständiger Name des Bischofs","Nome completo do Senhor Bispo","Nome completo di Sua Eccellenza il Vescovo")}>
          <Input value={d.obispo} onChange={v=>set("obispo",v)} placeholder="Mons. Juan Ejemplo García"/>
        </FRow>
                <FRow label={T("Persona de contacto","Contact person","Personne de contact","Kontaktperson","Pessoa de contato","Persona di contatto")}>
          <Input value={d.contacto} onChange={v=>set("contacto",v)} placeholder={T("Nombre completo","Full name","Nom complet","Vollständiger Name","Nome completo","Nome completo")}/>
        </FRow>
        <FRow label={T("Correo electrónico","Email","E-mail","E-Mail","E-mail","Email")}>
          <Input type="email" value={d.email} onChange={v=>set("email",v)} placeholder="cancilleria@diocesis.org"/>
        </FRow>
        <FRow label={T("Teléfono","Phone","Téléphone","Telefon","Telefone","Telefono")}>
          <PhoneField phoneCode={d.phoneCode} phone={d.phone} onChange={set}/>
        </FRow>
        <div style={{display:"flex",gap:12}}>
          <button onClick={onBack} style={{...BTN("sec"),flex:1,justifyContent:"center"}}>← {T("Regresar","Back","Retour","Zurück","Voltar","Indietro")}</button>
          <button onClick={()=>can&&onNext(d)} disabled={!can}
            style={{...BTN("pri"),flex:2,justifyContent:"center",opacity:can?1:0.4,cursor:can?"pointer":"not-allowed"}}>
            {T("Enviar Solicitud de Afiliación","Send Affiliation Request","Envoyer la demande d'affiliation","Antrag auf Anschluss senden","Enviar Solicitação de Afiliação","Invia richiesta di affiliazione")} →
          </button>
        </div>
        <SoporteLink contexto={T("Registro de Diócesis","Diocese registration","Inscription du diocèse","Diözesenregistrierung","Registro de diocese","Registrazione della diocesi")}/>
      </div>
    </div>
  );
}

// ─── PASSWORD MODAL ─────────────────────────────────────────────────
function PasswordModal({onNext,onBack,email}){
  const [pw,setPw]=useState("");
  const [pw2,setPw2]=useState("");
  const [checking,setChecking]=useState(false);
  const [dupErr,setDupErr]=useState("");
  const str=pwdStrength(pw);
  const strLabels=[T("Muy débil","Very weak","Très faible","Sehr schwach","Muito fraca","Molto debole"),T("Débil","Weak","Faible","Schwach","Fraca","Debole"),T("Regular","Fair","Moyen","Mittel","Regular","Discreta"),T("Buena","Good","Bon","Gut","Boa","Buona"),T("Excelente","Excellent","Excellent","Ausgezeichnet","Excelente","Eccellente")];
  const strColors=["#EF4444","#F97316","#EAB308","#22C55E","#10B981"];
  const match=pw&&pw2&&pw===pw2;
  const valid=str>=3&&match;
  const handleNext=async()=>{
    if(!valid)return;
    setChecking(true);setDupErr("");
    try{
      if(email){
        const{data,error}=await supabase.rpc("email_registrado",{p_email:email});
        if(!error&&data===true){
          setDupErr(T("Ya existe una cuenta con este correo. Inicia sesión o recupera tu contraseña.","An account with this email already exists. Sign in or reset your password.","Un compte existe déjà avec cet e-mail. Connectez-vous ou réinitialisez votre mot de passe.","Es existiert bereits ein Konto mit dieser E-Mail-Adresse. Melden Sie sich an oder setzen Sie Ihr Passwort zurück.","Já existe uma conta com este e-mail. Faça login ou recupere sua senha.","Esiste già un account con questa email. Accedi oppure recupera la password."));
          setChecking(false);
          return;
        }
      }
      onNext(pw);
    }catch{
      onNext(pw); // si la verificación falla por red, no bloqueamos el flujo —
                  // crear-sesion-pago vuelve a comprobarlo de todas formas.
    }
    setChecking(false);
  };
  return(
    <div style={OVERLAY}>
      <div style={{...MODAL,maxWidth:460}}>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:32,marginBottom:8}}>🔐</div>
          <h2 style={{fontFamily:"'Cinzel',serif",color:C.gold,fontSize:17}}>
            {T("Crea tu contraseña","Create your password","Créez votre mot de passe","Erstellen Sie Ihr Passwort","Crie sua senha","Crea la tua password")}
          </h2>
          <p style={{color:C.ivoryM,fontSize:13,marginTop:6}}>
            {T("Mínimo 8 caracteres, 1 mayúscula, 1 número y 1 carácter especial","Minimum 8 characters, 1 uppercase, 1 number, 1 special character","Minimum 8 caractères, 1 majuscule, 1 chiffre et 1 caractère spécial","Mindestens 8 Zeichen, 1 Großbuchstabe, 1 Zahl und 1 Sonderzeichen","Mínimo de 8 caracteres, 1 maiúscula, 1 número e 1 caractere especial","Minimo 8 caratteri, 1 maiuscola, 1 numero e 1 carattere speciale")}
          </p>
        </div>
        <FRow label={T("Contraseña","Password","Mot de passe","Passwort","Senha","Password")}>
          <PasswordInput value={pw} onChange={setPw} placeholder={T("Ingresa tu contraseña","Enter your password","Saisissez votre mot de passe","Geben Sie Ihr Passwort ein","Digite sua senha","Inserisci la tua password")}/>
          {pw&&(
            <div style={{marginTop:8}}>
              <div style={{display:"flex",gap:4,marginBottom:4}}>
                {[0,1,2,3].map(i=>(
                  <div key={i} style={{flex:1,height:4,borderRadius:2,
                    background:str>i?strColors[str]:"rgba(255,255,255,0.1)"}}/>
                ))}
              </div>
              <p style={{color:strColors[str],fontSize:12}}>{strLabels[str]}</p>
            </div>
          )}
        </FRow>
        <FRow label={T("Confirmar contraseña","Confirm password","Confirmer le mot de passe","Passwort bestätigen","Confirmar senha","Conferma password")}>
          <PasswordInput value={pw2} onChange={setPw2} placeholder={T("Repite tu contraseña","Repeat your password","Répétez votre mot de passe","Wiederholen Sie Ihr Passwort","Repita sua senha","Ripeti la password")}/>
          {pw2&&!match&&<p style={{color:"#F87171",fontSize:12,marginTop:4}}>
            {T("Las contraseñas no coinciden","Passwords do not match","Les mots de passe ne correspondent pas","Die Passwörter stimmen nicht überein","As senhas não coincidem","Le password non corrispondono")}
          </p>}
          {match&&<p style={{color:"#22C55E",fontSize:12,marginTop:4}}>
            ✓ {T("Las contraseñas coinciden","Passwords match","Les mots de passe correspondent","Die Passwörter stimmen überein","As senhas coincidem","Le password corrispondono")}
          </p>}
        </FRow>
        {dupErr&&<p style={{color:"#F87171",fontFamily:"'Crimson Text',serif",
          fontSize:14,marginTop:4,marginBottom:4}}>⚠️ {dupErr}</p>}
        <div style={{display:"flex",gap:12,marginTop:8}}>
          <button onClick={onBack} style={{...BTN("sec"),flex:1,justifyContent:"center"}}>← {T("Regresar","Back","Retour","Zurück","Voltar","Indietro")}</button>
          <button onClick={handleNext} disabled={!valid||checking}
            style={{...BTN("pri"),flex:2,justifyContent:"center",opacity:(valid&&!checking)?1:0.4,cursor:(valid&&!checking)?"pointer":"not-allowed"}}>
            {checking?T("Verificando…","Checking…","Vérification…","Wird geprüft…","Verificando…","Verifica in corso…"):T("Proceder al Pago","Proceed to Payment","Procéder au paiement","Zur Zahlung fortfahren","Prosseguir para o Pagamento","Procedi al pagamento")} →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ALTA DE CUENTA Y PERFIL EN SUPABASE ──────────────────────────
async function crearCuentaUsuario(formData,userType,selectedSacs){
  // 1) Cuenta en Supabase Auth
  const {data:auth,error:authErr}=await supabase.auth.signUp({
    email:formData.email,password:formData.password});
  if(authErr){
    if(/already|registered|exists/i.test(authErr.message||""))
      throw new Error(T("Ya existe una cuenta con este correo. Inicia sesión o recupera tu contraseña.","An account with this email already exists. Sign in or reset your password.","Un compte existe déjà avec cet e-mail. Connectez-vous ou réinitialisez votre mot de passe.","Es existiert bereits ein Konto mit dieser E-Mail-Adresse. Melden Sie sich an oder setzen Sie Ihr Passwort zurück.","Já existe uma conta com este e-mail. Faça login ou recupere sua senha.","Esiste già un account con questa email. Accedi oppure recupera la password."));
    throw new Error(authErr.message);
  }
  const uid=auth.user?.id;
  if(!auth.session){
    throw new Error(T("Tu cuenta fue creada. Revisa tu correo para confirmarla y después inicia sesión para completar tu inscripción.","Your account was created. Check your email to confirm it, then sign in to complete your registration.","Votre compte a été créé. Vérifiez votre e-mail pour le confirmer, puis connectez-vous pour finaliser votre inscription.","Ihr Konto wurde erstellt. Überprüfen Sie Ihre E-Mail, um es zu bestätigen, und melden Sie sich dann an, um Ihre Anmeldung abzuschließen.","Sua conta foi criada. Verifique seu e-mail para confirmá-la e depois faça login para concluir sua inscrição.","Il tuo account è stato creato. Controlla la tua email per confermarlo e poi accedi per completare la tua iscrizione."));
  }
  // 2) Registro ID oficial generado por la base de datos
  const iso=COUNTRY_ISO[formData.country]||"XX";
  let registroId=null;
  try{
    const {data:rid,error:ridErr}=await supabase.rpc("generar_registro_id",
      {p_tipo_usuario:userType,p_codigo_iso:iso});
    if(!ridErr&&rid)registroId=rid;
  }catch(e){console.error("generar_registro_id:",e);}
  // 3) Perfil en la tabla usuarios (RLS: id = auth.uid())
  const pb=formData.priceBreakdown;
  const fila={
    id:uid, tipo_usuario:userType,
    nombre:formData.nombre||"", apellido:formData.apellido||"",
    email:formData.email, fecha_nacimiento:formData.dob||null,
    pais_residencia:formData.country||"", codigo_iso_pais:iso,
    idioma:LANG,
    tipo_documento:(CDOCS[formData.country]?.l)||"", numero_documento:formData.docNum||"",
    codigo_pais_tel:formData.phoneCode||null, telefono:formData.phone||null,
    parroquia_nombre:formData.parroquia||null, parroquia_no_segura:!!formData.noSure,
    par_estado:formData.parEstado||null, par_municipio:formData.parMunicipio||null,
    par_calle:formData.parCalle||null, par_numero:formData.parNumero||null,
    afiliada_org:formData.afiliadaOrg||null, org_registro_id:formData.orgRegistroId||null,
    estado_civil:formData.estadoCivil||null,
    vive_con_pareja:formData.viveConPareja||null,
    vive_con_pareja_soltero:formData.viveConParejaSoltero||null,
    plan_casarse_iglesia:formData.planCasarseIglesia||null,
    vive_nueva_pareja:formData.viveNuevaPareja||null,
    esta_internado:!!formData.estaInternado,
    tipo_inst_internado:formData.tipoInstInternado||null,
    nombre_inst:formData.nombreInst||null, pais_inst:formData.paisInst||null,
    estado_inst:formData.estadoInst||null, municipio_inst:formData.municipioInst||null,
    instalacion_inst:formData.instalacionInst||null,
    tel_inst_codigo:formData.telInstCodigo||null, tel_inst:formData.telInst||null,
    familiar_nombre:formData.familiarNombre||null,
    familiar_tel_codigo:formData.familiarTelCodigo||null, familiar_tel:formData.familiarTel||null,
    es_paciente_rehab:!!formData.esPacienteRehabilitacion,
    nombre_centro_rehab:formData.nombreCentroRehab||null,
    pais_centro_rehab:formData.paisCentroRehab||null,
    estado_centro_rehab:formData.estadoCentroRehab||null,
    sacs_beneficiario:formData.sacsBeneficiario||null,
    sacramentos_elegidos:(selectedSacs&&selectedSacs.length?selectedSacs:null),
    registro_id:registroId,
    formacion_gratuita:!!formData.freeRegistration,
    beca_solidaria:!!formData.estaInternado,
    beca_esperanza:!!formData.esPacienteRehabilitacion,
    pago_realizado:false,
    importe_pagado:formData.freeRegistration?0:null,
    moneda_pago:pb?.cur||null,
  };
  const {error:insErr}=await supabase.from("usuarios").insert(fila);
  if(insErr){
    console.error("insert usuarios:",insErr);
    throw new Error(T("No se pudo guardar tu perfil. Intenta de nuevo o contacta soporte.","Your profile could not be saved. Try again or contact support.","Votre profil n'a pas pu être enregistré. Réessayez ou contactez le support.","Ihr Profil konnte nicht gespeichert werden. Versuchen Sie es erneut oder kontaktieren Sie den Support.","Não foi possível salvar seu perfil. Tente novamente ou entre em contato com o suporte.","Non è stato possibile salvare il tuo profilo. Riprova o contatta l'assistenza."));
  }
  return {uid,registroId};
}

// ─── PAYMENT MODAL (Stripe Checkout vía Supabase Edge Function) ────
function PaymentModal({formData,userType,selectedSacs,onSuccess,onBack}){
  const [loading,setLoading]=useState(false);
  const [payingMethod,setPayingMethod]=useState(null); // "online" | "voucher"
  const [err,setErr]=useState("");
  const pb=formData.priceBreakdown;
  const isFree=!!formData.freeRegistration;
  const esBeca=!!formData.estaInternado;

  // Métodos de pago en tienda/banco disponibles por moneda (Stripe):
  //   MXN → OXXO · BRL → Boleto · EUR → Multibanco. En cualquier otra moneda
  //   (p. ej. las que se cobran en USD) no hay método de vale, así que solo se
  //   ofrece pago en línea (tarjeta).
  const VOUCHER_METHOD={MXN:"oxxo",BRL:"boleto",EUR:"multibanco"};
  const VOUCHER_BRAND={oxxo:"OXXO",boleto:"Boleto",multibanco:"Multibanco"};
  const voucherMethod=pb?VOUCHER_METHOD[String(pb.cur).toUpperCase()]:null;

  // ── Ruta gratuita (beca 100% o afiliación): crea cuenta y entra ──
  const handleFree=async()=>{
    setLoading(true);setErr("");
    try{
      const res=await crearCuentaUsuario(formData,userType,selectedSacs);
      onSuccess(res);
    }catch(e){setErr(e.message);}
    finally{setLoading(false);}
  };

  // ── Ruta de pago: NO crea la cuenta todavía — solo guarda el registro
  //    como pendiente y redirige a Stripe. La cuenta se crea únicamente
  //    cuando el webhook confirma el pago. ──
  const handlePay=async(metodo)=>{
    setLoading(true);setPayingMethod(metodo);setErr("");
    try{
      const iso=COUNTRY_ISO[formData.country]||"XX";
      const tipoDocumento=(CDOCS[formData.country]?.l)||"";
      const {data,error}=await supabase.functions.invoke("crear-sesion-pago",{body:{
        formData:{...formData,codigo_iso_pais:iso,tipo_documento:tipoDocumento,idioma:LANG},
        userType,
        selectedSacs,
        importe:pb.total,
        moneda:pb.cur,
        descuento_pct:pb.becaDesc||0,
        metodo:metodo||"online",
        retorno:window.location.origin,
      }});
      if(error||!data?.url){
        // supabase.functions.invoke no expone el mensaje personalizado del
        // cuerpo de error directamente en `error.message` — hay que leerlo
        // de la respuesta HTTP original (error.context) cuando existe.
        let msg=error?.message;
        try{
          const body=await error?.context?.json?.();
          if(body?.error)msg=body.error;
        }catch{}
        throw new Error(msg||
          T("No se pudo iniciar el pago. Intenta de nuevo.","Payment could not be started. Please try again.","Le paiement n'a pas pu être lancé. Réessayez.","Die Zahlung konnte nicht gestartet werden. Versuchen Sie es erneut.","Não foi possível iniciar o pagamento. Tente novamente.","Non è stato possibile avviare il pagamento. Riprova."));
      }
      bypassUnload=true; // no mostrar "¿Abandonar sitio?" al ir a Stripe
      window.location.href=data.url; // → Stripe Checkout
    }catch(e){setErr(e.message);setLoading(false);setPayingMethod(null);}
  };

  const esCatequistaVerificado=!esBeca&&formData.orgVerificada;
  if(isFree){
    return(
      <div style={OVERLAY}>
        <div style={{...MODAL,maxWidth:480,textAlign:"center"}}>
          <div style={{fontSize:48,marginBottom:12}}>{esBeca?"🎓":"✅"}</div>
          <h2 style={{fontFamily:"'Cinzel',serif",color:C.gold,fontSize:18,marginBottom:12}}>
            {esBeca
              ? T("Beca del 100%","100% Scholarship","Bourse de 100 %","100%-Stipendium","Bolsa de 100%","Borsa del 100%")
              : T("Parroquia verificada","Parish verified","Paroisse vérifiée","Pfarrei bestätigt","Paróquia verificada","Parrocchia verificata")}
          </h2>
          <div style={{...CARD,background:"rgba(200,169,81,0.08)",marginBottom:20}}>
            <p style={{color:C.ivory,fontFamily:"'Crimson Text',serif",fontSize:16,lineHeight:1.65}}>
              {esBeca
                ? T(
                    `Has calificado para una beca del 100%. Tu formación es completamente gratuita. ¡Que Dios te bendiga en tu camino!`,
                    `You qualify for a 100% scholarship. Your formation is completely free. God bless you on your journey!`,
                    `Vous avez obtenu une bourse de 100 %. Votre formation est entièrement gratuite. Que Dieu vous bénisse sur votre chemin !`,
                    `Sie haben ein 100%-Stipendium erhalten. Ihre Ausbildung ist vollständig kostenlos. Gott segne Sie auf Ihrem Weg!`,
                    `Você se qualificou para uma bolsa de 100%. Sua formação é totalmente gratuita. Que Deus te abençoe em teu caminho!`,
                    `Hai ottenuto una borsa di studio del 100%. La tua formazione è completamente gratuita. Che Dio ti benedica nel tuo cammino!`
                  )
                : esCatequistaVerificado
                ? T(
                    `Hemos confirmado el identificador de ${formData.orgNombreVerificado||"tu parroquia"} (${formData.orgRegistroId||""}). Al pulsar el botón se te otorgará el acceso al área de formación. ¡Bienvenido/a!`,
                    `We have confirmed the ID of ${formData.orgNombreVerificado||"your parish"} (${formData.orgRegistroId||""}). Press the button to be granted access to the formation area. Welcome!`,
                    `Nous avons confirmé l'identifiant de ${formData.orgNombreVerificado||"votre paroisse"} (${formData.orgRegistroId||""}). En appuyant sur le bouton, vous aurez accès à l'espace de formation. Bienvenue !`,
                    `Wir haben die Kennung von ${formData.orgNombreVerificado||"Ihrer Pfarrei"} (${formData.orgRegistroId||""}) bestätigt. Mit einem Klick auf die Schaltfläche erhalten Sie Zugang zum Ausbildungsbereich. Willkommen!`,
                    `Confirmamos o identificador de ${formData.orgNombreVerificado||"sua paróquia"} (${formData.orgRegistroId||""}). Ao clicar no botão, você terá acesso à área de formação. Bem-vindo/a!`,
                    `Abbiamo confermato l'identificativo di ${formData.orgNombreVerificado||"la tua parrocchia"} (${formData.orgRegistroId||""}). Premendo il pulsante ti verrà concesso l'accesso all'area di formazione. Benvenuto/a!`
                  )
                : T(
                    `Tu registro fue recibido. En breve recibirás la confirmación de Catecumen en tu correo electrónico.`,
                    `Your registration was received. You will shortly receive confirmation from Catecumen by email.`,
                    `Votre inscription a été reçue. Vous recevrez sous peu la confirmation de Catecumen par e-mail.`,
                    `Ihre Anmeldung ist eingegangen. Sie erhalten in Kürze die Bestätigung von Catecumen per E-Mail.`,
                    `Seu registro foi recebido. Em breve você receberá a confirmação da Catecumen por e-mail.`,
                    `La tua registrazione è stata ricevuta. Riceverai a breve la conferma di Catecumen via email.`
                  )
              }
            </p>
          </div>
          {err&&<p style={{color:"#F87171",fontFamily:"'Crimson Text',serif",
            fontSize:14,marginBottom:14}}>⚠️ {err}</p>}
          <div style={{display:"flex",gap:12}}>
            <button onClick={onBack} disabled={loading}
              style={{...BTN("sec"),flex:1,justifyContent:"center",opacity:loading?0.4:1}}>
              ← {T("Regresar","Back","Retour","Zurück","Voltar","Indietro")}
            </button>
            <button onClick={handleFree} disabled={loading}
              style={{...BTN("pri"),flex:2,justifyContent:"center",
                opacity:loading?0.5:1,cursor:loading?"wait":"pointer"}}>
              {loading?T("Creando tu cuenta…","Creating your account…","Création de votre compte…","Ihr Konto wird erstellt…","Criando sua conta…","Creazione dell'account in corso…")
                :esCatequistaVerificado
                ?T("Acceder al área de formación","Access the formation area","Accéder à l'espace de formation","Zum Ausbildungsbereich","Acessar a área de formação","Accedi all'area di formazione")
                :T("Comenzar formación","Begin formation","Commencer la formation","Ausbildung beginnen","Começar formação","Inizia la formazione")} →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return(
    <div style={OVERLAY}>
      <div style={{...MODAL,maxWidth:480}}>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:28,marginBottom:8}}>💳</div>
          <h2 style={{fontFamily:"'Cinzel',serif",color:C.gold,fontSize:17}}>
            {T("Realizar mi Inscripción y Pago","Complete My Registration & Payment","Effectuer mon inscription et paiement","Meine Anmeldung und Zahlung abschließen","Realizar minha Inscrição e Pagamento","Completa la mia iscrizione e il pagamento")}
          </h2>
        </div>
        {pb&&(
          <div style={{...CARD,background:"rgba(200,169,81,0.08)",marginBottom:18}}>
            {pb.lines.map((l,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",
                color:C.ivoryM,fontFamily:"'Crimson Text',serif",fontSize:14,marginBottom:4}}>
                <span>{l.label}</span><span>{l.amt.toLocaleString()} {l.cur}</span>
              </div>
            ))}
            <div style={{display:"flex",justifyContent:"space-between",marginTop:8,
              color:C.gold,fontFamily:"'Cinzel',serif",fontSize:16,fontWeight:700}}>
              <span>{T("Total","Total","Total","Gesamt","Total","Totale")}</span>
              <span>{pb.total.toLocaleString()} {pb.cur}</span>
            </div>
            {pb.flatFee&&(
              <p style={{color:C.goldL,fontSize:12,marginTop:8}}>
                ★ {T("Cuota única sin importar cuántos sacramentos se seleccionen.","Single flat fee regardless of the number of sacraments selected.","Tarif unique quel que soit le nombre de sacrements sélectionnés.","Einmalige Gebühr unabhängig von der Anzahl der ausgewählten Sakramente.","Taxa única independentemente de quantos sacramentos sejam selecionados.","Tariffa unica indipendentemente dal numero di sacramenti selezionati.")}
              </p>
            )}
          </div>
        )}
        <p style={{color:C.ivory,fontFamily:"'Crimson Text',serif",fontSize:15,
          lineHeight:1.6,marginBottom:16,textAlign:"center"}}>
          {T("Serás dirigido/a a la página de pago seguro de Stripe para completar tu pago. Al terminar regresarás automáticamente a la plataforma.","You will be redirected to Stripe's secure payment page to complete your payment. When finished you will automatically return to the platform.","Vous serez redirigé(e) vers la page de paiement sécurisée de Stripe pour finaliser votre paiement. Une fois terminé, vous reviendrez automatiquement sur la plateforme.","Sie werden zur sicheren Zahlungsseite von Stripe weitergeleitet, um Ihre Zahlung abzuschließen. Danach kehren Sie automatisch zur Plattform zurück.","Você será direcionado(a) à página de pagamento seguro da Stripe para concluir seu pagamento. Ao terminar, você retornará automaticamente à plataforma.","Sarai reindirizzato/a alla pagina di pagamento sicura di Stripe per completare il pagamento. Al termine tornerai automaticamente alla piattaforma.")}
        </p>
        {err&&<p style={{color:"#F87171",fontFamily:"'Crimson Text',serif",
          fontSize:14,marginBottom:14,textAlign:"center"}}>⚠️ {err}</p>}
        <p style={{color:C.ivoryM,fontSize:12,marginBottom:16,textAlign:"center"}}>
          🔒 {T("Pago procesado de forma segura por Stripe. Catecumen nunca ve ni almacena los datos de tu tarjeta.","Payment securely processed by Stripe. Catecumen never sees nor stores your card details.","Paiement traité en toute sécurité par Stripe. Catecumen ne voit ni ne stocke jamais les données de votre carte.","Zahlung sicher von Stripe verarbeitet. Catecumen sieht oder speichert Ihre Kartendaten niemals.","Pagamento processado com segurança pela Stripe. A Catecumen nunca vê nem armazena os dados do seu cartão.","Pagamento elaborato in modo sicuro da Stripe. Catecumen non vede né memorizza mai i dati della tua carta.")}
        </p>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <button onClick={()=>handlePay("online")} disabled={loading}
            style={{...BTN("pri"),width:"100%",justifyContent:"center",
              opacity:loading&&payingMethod!=="online"?0.4:1,cursor:loading?"wait":"pointer"}}>
            {loading&&payingMethod==="online"
              ?T("Preparando pago seguro…","Preparing secure payment…","Préparation du paiement sécurisé…","Sichere Zahlung wird vorbereitet…","Preparando pagamento seguro…","Preparazione del pagamento sicuro…")
              :"💳 "+T("Pagar en línea con tarjeta","Pay online by card","Payer en ligne par carte","Online mit Karte bezahlen","Pagar online com cartão","Paga online con carta")} →
          </button>

          {voucherMethod&&(
            <button onClick={()=>handlePay("voucher")} disabled={loading}
              style={{...BTN("sec"),width:"100%",justifyContent:"center",flexDirection:"column",gap:2,paddingTop:10,paddingBottom:10,
                opacity:loading&&payingMethod!=="voucher"?0.4:1,cursor:loading?"wait":"pointer"}}>
              <span>
                {loading&&payingMethod==="voucher"
                  ?T("Generando tu comprobante…","Generating your voucher…","Génération de votre justificatif…","Ihr Beleg wird erstellt…","Gerando seu comprovante…","Generazione della tua ricevuta…")
                  :"🏦 "+T("Pagar en efectivo, tienda o banco","Pay with cash, store or bank","Payer en espèces, en magasin ou en banque","Bar, im Geschäft oder bei der Bank bezahlen","Pagar em dinheiro, loja ou banco","Paga in contanti, in negozio o in banca")}
              </span>
              {!(loading&&payingMethod==="voucher")&&(
                <span style={{fontSize:11,color:C.ivoryM,fontWeight:400}}>
                  {T("Recibirás un comprobante de","You'll get a voucher for","Vous recevrez un justificatif","Sie erhalten einen Beleg für","Você receberá um comprovante de","Riceverai una ricevuta per")} {VOUCHER_BRAND[voucherMethod]}
                </span>
              )}
            </button>
          )}

          <button onClick={onBack} disabled={loading}
            style={{...BTN("sec"),width:"100%",justifyContent:"center",opacity:loading?0.4:1,marginTop:2,background:"transparent"}}>
            ← {T("Regresar","Back","Retour","Zurück","Voltar","Indietro")}
          </button>
        </div>
      </div>
    </div>
  );
}
// ─── THANK YOU MODAL ───────────────────────────────────────────────
function ThankYouModal({formData,onClose}){
  return(
    <div style={OVERLAY}>
      <div style={{...MODAL,maxWidth:500,textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:12}}>🙏</div>
        <h2 style={{fontFamily:"'Cinzel',serif",color:C.gold,fontSize:22,marginBottom:12}}>
          {T("¡Bienvenido/a!","Welcome!","Bienvenue !","Willkommen!","Bem-vindo/a!","Benvenuto/a!")}
        </h2>
        <p style={{color:C.ivory,fontFamily:"'Crimson Text',serif",fontSize:17,lineHeight:1.7,marginBottom:16}}>
          {T(
            `Gracias por tu inscripción, ${formData.nombre||""}. Tu pago ha sido procesado exitosamente. Hemos enviado la confirmación y tus datos de registro al correo ${formData.email||""}. Tu catequista asignada es Nelly Montoya.`,
            `Thank you for registering, ${formData.nombre||""}. Your payment was processed successfully. We sent confirmation to ${formData.email||""}. Your assigned catechist is Nelly Montoya.`,
            `Merci pour votre inscription, ${formData.nombre||""}. Votre paiement a été traité avec succès. Nous avons envoyé la confirmation et vos données d'inscription à l'adresse ${formData.email||""}. Votre catéchiste assignée est Nelly Montoya.`,
            `Vielen Dank für Ihre Anmeldung, ${formData.nombre||""}. Ihre Zahlung wurde erfolgreich verarbeitet. Wir haben die Bestätigung und Ihre Anmeldedaten an ${formData.email||""} gesendet. Ihre zugewiesene Katechetin ist Nelly Montoya.`,
            `Obrigado pela sua inscrição, ${formData.nombre||""}. Seu pagamento foi processado com sucesso. Enviamos a confirmação e seus dados de registro para o e-mail ${formData.email||""}. Sua catequista designada é Nelly Montoya.`,
            `Grazie per la tua iscrizione, ${formData.nombre||""}. Il tuo pagamento è stato elaborato con successo. Abbiamo inviato la conferma e i tuoi dati di registrazione all'indirizzo ${formData.email||""}. La tua catechista assegnata è Nelly Montoya.`
          )}
        </p>
        <div style={{...CARD,background:"rgba(200,169,81,0.08)",marginBottom:20,textAlign:"left"}}>
          <p style={{color:C.goldL,fontFamily:"'Cinzel',serif",fontSize:14,marginBottom:8}}>
            {T("Tu catequista asignada:","Your assigned catechist:","Votre catéchiste assignée :","Ihre zugewiesene Katechetin:","Sua catequista designada:","La tua catechista assegnata:")}
          </p>
          <p style={{color:C.ivory,fontFamily:"'Crimson Text',serif",fontSize:17}}>🧑‍🏫 Nelly Montoya</p>
          {formData.registrationId&&(
            <div style={{marginTop:12,borderTop:`1px solid ${C.borderD}`,paddingTop:10}}>
              <p style={{color:C.goldL,fontFamily:"'Cinzel',serif",fontSize:12,letterSpacing:"0.08em",marginBottom:4}}>
                {T("IDENTIFICADOR DE REGISTRO","REGISTRATION ID","IDENTIFIANT D'INSCRIPTION","REGISTRIERUNGSKENNUNG","IDENTIFICADOR DE REGISTRO","IDENTIFICATIVO DI REGISTRAZIONE")}
              </p>
              <p style={{color:C.gold,fontFamily:"'Cinzel',serif",fontSize:16,fontWeight:700,letterSpacing:"0.12em"}}>
                {formData.registrationId}
              </p>
              <p style={{color:C.ivoryM,fontSize:11,marginTop:4}}>
                {T("Este identificador se ha enviado a tu correo junto con los datos de tu registro.","This ID has been sent to your email along with your registration details.","Cet identifiant a été envoyé à votre e-mail avec les données de votre inscription.","Diese Kennung wurde zusammen mit Ihren Anmeldedaten an Ihre E-Mail gesendet.","Este identificador foi enviado ao seu e-mail junto com os dados do seu registro.","Questo identificativo è stato inviato alla tua email insieme ai dati della tua registrazione.")}
              </p>
            </div>
          )}
        </div>
        <button onClick={onClose} style={{...BTN("pri"),width:"100%",justifyContent:"center"}}>
          {T("Comenzar mi formación en Tronco Común 1","Begin my formation in Common Core 1","Commencer ma formation en Tronc Commun 1","Meine Ausbildung in Gemeinsamer Grundlagenkurs 1 beginnen","Começar minha formação no Tronco Comum 1","Inizia la mia formazione nel Tronco Comune 1")} →
        </button>
      </div>
    </div>
  );
}

// ─── ORG THANK YOU (Parroquia / Diócesis) ─────────────────────────
function OrgThankYouModal({orgType,formData,onClose}){
  return(
    <div style={OVERLAY}>
      <div style={{...MODAL,maxWidth:500,textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:12}}>{orgType==="parroquia"?"⛪":orgType==="centroadiccion"?"🏥":"🏛️"}</div>
        <h2 style={{fontFamily:"'Cinzel',serif",color:C.gold,fontSize:20,marginBottom:12}}>
          {T("¡Solicitud Recibida!","Request Received!","Demande reçue !","Antrag erhalten!","Solicitação Recebida!","Richiesta ricevuta!")}
        </h2>
        <p style={{color:C.ivory,fontFamily:"'Crimson Text',serif",fontSize:16,lineHeight:1.7}}>
          {T(
            `Hemos recibido la solicitud de afiliación de ${formData.nombre||""}. En breve nos pondremos en contacto al correo ${formData.email||""} para finalizar el proceso.`,
            `We have received the affiliation request for ${formData.nombre||""}. We will contact you at ${formData.email||""} shortly to complete the process.`,
            `Nous avons reçu la demande d'affiliation de ${formData.nombre||""}. Nous vous contacterons sous peu à l'adresse ${formData.email||""} pour finaliser le processus.`,
            `Wir haben den Antrag auf Anschluss von ${formData.nombre||""} erhalten. Wir werden Sie in Kürze unter ${formData.email||""} kontaktieren, um den Vorgang abzuschließen.`,
            `Recebemos a solicitação de afiliação de ${formData.nombre||""}. Em breve entraremos em contato pelo e-mail ${formData.email||""} para finalizar o processo.`,
            `Abbiamo ricevuto la richiesta di affiliazione di ${formData.nombre||""}. Ti contatteremo a breve all'indirizzo ${formData.email||""} per completare il processo.`
          )}
        </p>
        <button onClick={onClose} style={{...BTN("pri"),marginTop:24,width:"100%",justifyContent:"center"}}>
          {T("Cerrar","Close","Fermer","Schließen","Fechar","Chiudi")}
        </button>
      </div>
    </div>
  );
}

// ─── SECTION COMPLETE MODAL ────────────────────────────────────────
function SectionCompleteModal({secId,avgScore,nextSecId,isLastBeforeCerts,isAllDone,onContinue}){
  const sec=SEC_META[secId];
  const next=nextSecId?SEC_META[nextSecId]:null;
  return(
    <div style={OVERLAY}>
      <div style={{...MODAL,maxWidth:520,textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:8}}><SecIcon id={secId} size={48}/></div>
        <h2 style={{fontFamily:"'Cinzel',serif",color:C.gold,fontSize:20,marginBottom:8}}>
          🎉 {T("¡Sección completada!","Section completed!","Section terminée !","Abschnitt abgeschlossen!","Seção concluída!","Sezione completata!")}
        </h2>
        <p style={{color:C.ivory,fontFamily:"'Crimson Text',serif",fontSize:18,marginBottom:8}}>
          {PICK(sec)}
        </p>
        <div style={{...CARD,background:"rgba(200,169,81,0.1)",marginBottom:20,display:"inline-block",padding:"16px 32px"}}>
          <p style={{color:C.gold,fontFamily:"'Cinzel',serif",fontSize:28,fontWeight:700}}>
            {avgScore?.toFixed(1)||"—"}/10
          </p>
          <p style={{color:C.ivoryM,fontSize:13}}>{T("Puntuación promedio","Average score","Score moyen","Durchschnittliche Punktzahl","Pontuação média","Punteggio medio")}</p>
        </div>
        {isAllDone&&(
          <p style={{color:C.goldL,fontFamily:"'Crimson Text',serif",fontSize:17,marginBottom:16}}>
            🌟 {T("¡Has completado toda tu formación sacramental! Ahora puedes descargar tus constancias.","You have completed your entire sacramental formation! You can now download your certificates.","Vous avez terminé toute votre formation sacramentelle ! Vous pouvez maintenant télécharger vos attestations.","Sie haben Ihre gesamte sakramentale Ausbildung abgeschlossen! Sie können jetzt Ihre Bescheinigungen herunterladen.","Você concluiu toda a sua formação sacramental! Agora você pode baixar seus certificados.","Hai completato tutta la tua formazione sacramentale! Ora puoi scaricare i tuoi attestati.")}
          </p>
        )}
        {!isAllDone&&next&&(
          <p style={{color:C.ivory,fontFamily:"'Crimson Text',serif",fontSize:16,marginBottom:16}}>
            {T(
              "A continuación comenzarás la formación en: ",
              "You will now begin formation in: ",
              "Vous allez maintenant commencer la formation : ",
              "Sie beginnen jetzt die Ausbildung in: ",
              "Você agora começará a formação em: ",
              "Ora inizierai la formazione in: "
            )}{PICK(next)}
          </p>
        )}
        <button onClick={onContinue} style={{...BTN("pri"),width:"100%",justifyContent:"center"}}>
          {isAllDone?T("Ver mis Constancias","View My Certificates","Voir mes attestations","Meine Bescheinigungen ansehen","Ver meus Certificados","Vedi i miei attestati"):T("Continuar","Continue","Continuer","Weiter","Continuar","Continua")} →
        </button>
      </div>
    </div>
  );
}

// ─── VIDEO MODAL ───────────────────────────────────────────────────
function VideoModal({secId,vid,bridge,onWatched,onClose}){
  const [watching,setWatching]=useState(false);
  const [done,setDone]=useState(false);
  const [secs,setSecs]=useState(0);
  const [videoError,setVideoError]=useState(false); // el archivo de video no cargó (404)
  // Prioridad: URL real del video en la BD (idioma del usuario) → video de prueba local.
  const urlReal=bridge?.frontToUrl?.[secId]?.[vid?.id]||null;
  const videoPrueba=urlReal||PICK(SEC_META[secId]?.videoPrueba)||null; // real o prueba, en el idioma activo
  const SIM_DUR=5; // seconds to simulate watching (usado solo si no hay video de prueba)
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
        {videoPrueba&&!videoError&&(
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
              src={videoPrueba}
              controls
              playsInline
              style={{width:"100%",maxHeight:320,display:"block",borderRadius:12}}
              onPlay={()=>setWatching(true)}
              onEnded={()=>setDone(true)}
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

// ─── EVAL MODAL ────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════
//  EncuestaVideoModal — encuesta de calidad OBLIGATORIA al terminar cada video,
//  antes de la evaluación. 4 parámetros (1–5 estrellas) + comentario opcional.
// ═══════════════════════════════════════════════════════════════════════════

function EncuestaVideoModal({secId,vid,insBySec,bridge,onDone}){
  const [claridad,setClaridad]=useState(0);
  const [contenido,setContenido]=useState(0);
  const [audiovideo,setAudiovideo]=useState(0);
  const [utilidad,setUtilidad]=useState(0);
  const [comentario,setComentario]=useState("");
  const [enviando,setEnviando]=useState(false);
  const title=PICK(vid);
  const completa=claridad&&contenido&&audiovideo&&utilidad;

  const params=[
    {v:claridad,  set:setClaridad,   lbl:T("Claridad de la exposición","Clarity of the presentation","Clarté de l'exposé","Klarheit der Darstellung","Clareza da exposição","Chiarezza dell'esposizione")},
    {v:contenido, set:setContenido,  lbl:T("Calidad del contenido","Quality of the content","Qualité du contenu","Qualität des Inhalts","Qualidade do conteúdo","Qualità del contenuto")},
    {v:audiovideo,set:setAudiovideo, lbl:T("Calidad de audio y video","Audio and video quality","Qualité audio et vidéo","Audio- und Videoqualität","Qualidade de áudio e vídeo","Qualità audio e video")},
    {v:utilidad,  set:setUtilidad,   lbl:T("Utilidad para tu formación","Usefulness for your formation","Utilité pour votre formation","Nutzen für Ihre Ausbildung","Utilidade para sua formação","Utilità per la tua formazione")},
  ];

  const enviar=async()=>{
    if(!completa) return;
    setEnviando(true);
    try{
      // Traducir el id del frontend (p.ej. "tc-01") al UUID real de la tabla
      // `videos` mediante el puente. Sin esto, la encuesta no se guarda.
      const videoUuid = bridge?.frontToUuid?.[secId]?.[vid.id] || null;
      if(videoUuid){
        await supabase.rpc("guardar_encuesta_video",{
          p_video_id: videoUuid,
          p_claridad: claridad, p_contenido: contenido,
          p_audiovideo: audiovideo, p_utilidad: utilidad,
          p_comentario: comentario||null,
        });
      }else{
        console.warn("encuesta: no se encontró UUID para", secId, vid.id, "— no se guardó");
      }
    }catch(e){ console.error("guardar_encuesta_video:",e); }
    setEnviando(false);
    onDone(); // continúa a la evaluación
  };

  return(
    <div style={OVERLAY}>
      <div style={{...MODAL,maxWidth:560}}>
        <div style={{textAlign:"center",marginBottom:16}}>
          <div style={{fontSize:28,marginBottom:8}}>⭐</div>
          <h2 style={{fontFamily:"'Cinzel',serif",color:C.gold,fontSize:17}}>
            {T("Antes de tu evaluación","Before your evaluation","Avant votre évaluation","Vor Ihrer Bewertung","Antes da sua avaliação","Prima della tua valutazione")}
          </h2>
          <p style={{color:C.ivoryM,fontSize:13,marginTop:4}}>{title}</p>
          <p style={{color:C.ivoryM,fontSize:12.5,marginTop:6,lineHeight:1.5}}>
            {T("Tu opinión nos ayuda a mejorar la formación. Califica esta lección para continuar.","Your feedback helps us improve the formation. Rate this lesson to continue.","Votre avis nous aide à améliorer la formation. Évaluez cette leçon pour continuer.","Ihr Feedback hilft uns, die Ausbildung zu verbessern. Bewerten Sie diese Lektion, um fortzufahren.","Sua opinião nos ajuda a melhorar a formação. Avalie esta lição para continuar.","Il tuo parere ci aiuta a migliorare la formazione. Valuta questa lezione per continuare.")}
          </p>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {params.map((p,idx)=>(
            <div key={idx} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,
              padding:"10px 14px",borderRadius:12,background:`${C.card}`,border:`1px solid ${C.borderD}`}}>
              <span style={{color:C.ivory,fontFamily:"'Crimson Text',serif",fontSize:15}}>{p.lbl}</span>
              <EstrellasInput valor={p.v} onChange={p.set}/>
            </div>
          ))}

          <div>
            <label style={{color:C.ivoryM,fontSize:13,fontFamily:"'Crimson Text',serif",display:"block",marginBottom:6}}>
              {T("Comentario o sugerencia (opcional)","Comment or suggestion (optional)","Commentaire ou suggestion (facultatif)","Kommentar oder Vorschlag (optional)","Comentário ou sugestão (opcional)","Commento o suggerimento (facoltativo)")}
            </label>
            <textarea value={comentario} onChange={e=>setComentario(e.target.value)} rows={3} maxLength={600}
              placeholder={T("Escribe aquí…","Write here…","Écrivez ici…","Hier schreiben…","Escreva aqui…","Scrivi qui…")}
              style={{width:"100%",resize:"vertical",background:C.card,color:C.ivory,
                border:`1px solid ${C.borderD}`,borderRadius:10,padding:"10px 12px",
                fontFamily:"'Crimson Text',serif",fontSize:14.5,outline:"none"}}/>
          </div>
        </div>

        <button onClick={enviar} disabled={!completa||enviando}
          style={{...BTN("pri"),width:"100%",justifyContent:"center",fontSize:15,marginTop:16,
            opacity:(!completa||enviando)?0.5:1,cursor:(!completa||enviando)?"default":"pointer"}}>
          {enviando
            ? T("Guardando…","Saving…","Enregistrement…","Speichern…","Salvando…","Salvataggio…")
            : (completa
                ? T("Continuar a la evaluación","Continue to evaluation","Continuer vers l'évaluation","Weiter zur Bewertung","Continuar para a avaliação","Continua alla valutazione")+" →"
                : T("Califica los 4 aspectos","Rate all 4 aspects","Évaluez les 4 aspects","Bewerten Sie alle 4 Aspekte","Avalie os 4 aspectos","Valuta tutti e 4 gli aspetti"))}
        </button>
      </div>
    </div>
  );
}

function EvalModal({secId,vid,onResult,onClose}){
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

// ─── RESULT MODAL ──────────────────────────────────────────────────
function ResultModal({result,vid,onClose}){
  const {score,passed,correct,total}=result;
  const title=PICK(vid);
  return(
    <div style={OVERLAY}>
      <div style={{...MODAL,maxWidth:460,textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:8}}>{passed?"🏆":"📚"}</div>
        <h2 style={{fontFamily:"'Cinzel',serif",color:passed?C.green:"#F87171",fontSize:20,marginBottom:8}}>
          {passed?T("¡Aprobado!","Passed!","Réussi !","Bestanden!","Aprovado!","Superato!"):T("No aprobado","Not passed","Non réussi","Nicht bestanden","Não aprovado","Non superato")}
        </h2>
        <p style={{color:C.ivoryM,fontSize:14,marginBottom:12}}>{title}</p>
        <div style={{...CARD,background:passed?"rgba(45,122,90,0.12)":"rgba(248,113,113,0.12)",
          marginBottom:16,display:"inline-block",padding:"16px 40px"}}>
          <p style={{color:passed?C.green:"#F87171",fontFamily:"'Cinzel',serif",fontSize:32,fontWeight:700}}>
            {score.toFixed(1)}/10
          </p>
          <p style={{color:C.ivoryM,fontSize:13}}>{correct}/{total} {T("correctas","correct","correctes","richtig","corretas","corrette")}</p>
        </div>
        {!passed&&(
          <p style={{color:"#FCA5A5",fontFamily:"'Crimson Text',serif",fontSize:15,marginBottom:16}}>
            {T("Necesitas 8/10 para aprobar. El video ha sido marcado como no visto para que puedas revisarlo antes de intentar de nuevo.","You need 8/10 to pass. The video has been marked as unwatched so you can review it before trying again.","Vous avez besoin de 8/10 pour réussir. La vidéo a été marquée comme non visionnée afin que vous puissiez la revoir avant de réessayer.","Sie benötigen 8/10, um zu bestehen. Das Video wurde als ungesehen markiert, damit Sie es vor dem nächsten Versuch erneut ansehen können.","Você precisa de 8/10 para ser aprovado. O vídeo foi marcado como não assistido para que você possa revisá-lo antes de tentar novamente.","Ti servono 8/10 per superare la prova. Il video è stato contrassegnato come non visto, così puoi rivederlo prima di riprovare.")}
          </p>
        )}
        {passed&&(
          <p style={{color:"#86EFAC",fontFamily:"'Crimson Text',serif",fontSize:15,marginBottom:16}}>
            {T("¡Excelente! Puedes continuar con el siguiente tema.","Excellent! You may continue to the next topic.","Excellent ! Vous pouvez passer au sujet suivant.","Ausgezeichnet! Sie können mit dem nächsten Thema fortfahren.","Excelente! Você pode continuar para o próximo tema.","Ottimo! Puoi proseguire con l'argomento successivo.")}
          </p>
        )}
        <button onClick={onClose} style={{...BTN("pri"),width:"100%",justifyContent:"center"}}>
          {T("Continuar","Continue","Continuer","Weiter","Continuar","Continua")} →
        </button>
      </div>
    </div>
  );
}

// ─── COURSE SECTION VIEW ───────────────────────────────────────────
function CourseSectionView({secId,progress,onVideoAction,onEvalAction,onBack,onDash,canBack=true}){
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

// ─── CERTIFICATES MODAL ────────────────────────────────────────────
function CertificatesModal({formData,sequence,progress,insBySec,onClose}){
  const certSecs=sequence.filter(s=>SEC_META[s]?.cert&&isSectionDone(s,progress));
  const today=new Date().toLocaleDateString({es:"es-MX",en:"en-US",fr:"fr-FR",de:"de-DE",pt:"pt-BR",it:"it-IT"}[LANG]||"es-MX",{year:"numeric",month:"long",day:"numeric"});
  const [downloading,setDownloading]=useState(null);
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
        <button onClick={onClose} style={{...BTN("sec"),width:"100%",justifyContent:"center"}}>
          {T("Cerrar","Close","Fermer","Schließen","Fechar","Chiudi")}
        </button>
      </div>
    </div>
  );
}

// ─── DASHBOARD ─────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════
//  MensajesTab — bandeja de mensajes del usuario con la administración.
//  Lee sus mensajes, los marca como leídos y permite responder.
// ═══════════════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════════════
//  AgendaTab — sesiones a las que el usuario fue invitado. Puede unirse,
//  confirmar asistencia o avisar que no asistirá (con justificación al admin).
// ════════════════════════════════════════════════════════════════════════════


function Dashboard({formData,sequence,progress,onUpdate,onClose,initialTab}){
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
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24}}>
          <h1 style={{fontFamily:"'Cinzel',serif",color:C.gold,fontSize:20}}>👤 {T("Mi Cuenta","My Account","Mon compte","Mein Konto","Minha Conta","Il mio account")}</h1>
          <button onClick={onClose} style={{...BTN("sec"),fontSize:12}}>✕ {T("Cerrar","Close","Fermer","Schließen","Fechar","Chiudi")}</button>
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



// ─── REGISTRO CENTRO DE TRATAMIENTO DE ADICCIONES ────────────────
function RegisterCentroForm({onNext,onBack}){
  const [d,setD]=useState({});
  const set=(k,v)=>setD(p=>({...p,[k]:v}));

  const can=d.nombre&&d.contacto&&d.email&&d.phone&&d.phoneCode&&
            d.country&&d.estado&&d.municipio&&d.calle&&d.numero;
  return(
    <div style={OVERLAY}>
      <div style={{...MODAL,maxWidth:680}}>
        <h2 style={{fontFamily:"'Cinzel',serif",color:C.gold,fontSize:17,marginBottom:20}}>
          🏥 {T("Registro de Centro de Tratamiento de Adicciones","Addiction Treatment Center Registration","Inscription du Centre de Traitement des Addictions","Registrierung des Suchtbehandlungszentrums","Registro de Centro de Tratamento de Dependências","Registrazione del Centro di Trattamento delle Dipendenze")}
        </h2>

        <FRow label={T("Nombre completo de la Institución","Full name of the Institution","Nom complet de l'établissement","Vollständiger Name der Einrichtung","Nome completo da Instituição","Nome completo dell'istituzione")}>
          <Input value={d.nombre} onChange={v=>set("nombre",v)}
            placeholder={T("Nombre completo y oficial de la Institución","Full official name of the Institution","Nom complet et officiel de l'établissement","Vollständiger und offizieller Name der Einrichtung","Nome completo e oficial da Instituição","Nome completo e ufficiale dell'istituzione")}/>
        </FRow>

        <FRow label={T("Nombre de la persona de contacto","Name of the contact person","Nom de la personne de contact","Name der Kontaktperson","Nome da pessoa de contato","Nome della persona di contatto")}>
          <Input value={d.contacto} onChange={v=>set("contacto",v)}
            placeholder={T("Nombre completo","Full name","Nom complet","Vollständiger Name","Nome completo","Nome completo")}/>
        </FRow>

        <FRow label={T("Correo electrónico de contacto","Contact email","E-mail de contact","Kontakt-E-Mail","E-mail de contato","Email di contatto")}>
          <Input type="email" value={d.email} onChange={v=>set("email",v)}
            placeholder="contacto@centro.org"/>
        </FRow>

        <FRow label={T("Número telefónico de contacto","Contact phone number","Numéro de téléphone de contact","Kontakttelefonnummer","Número de telefone de contato","Numero di telefono di contatto")}>
          <PhoneField phoneCode={d.phoneCode} phone={d.phone} onChange={set}/>
        </FRow>

        {/* ─── Ubicación ─── */}
        <div style={{...CARD,background:"rgba(200,169,81,0.06)",
          border:`1px solid ${C.gold}30`,marginBottom:16,padding:"14px 16px"}}>
          <p style={{...LBL,marginBottom:12,fontSize:13}}>
            {T("Ubicación de la Institución","Location of the Institution","Emplacement de l'établissement","Standort der Einrichtung","Localização da Instituição","Ubicazione dell'istituzione")}
          </p>
          <FRow label={T("País","Country","Pays","Land","País","Paese")}>
            <select value={d.country||""} onChange={e=>set("country",e.target.value)} style={INP}>
              <option value="">{T("Selecciona el país","Select country","Sélectionnez le pays","Land auswählen","Selecione o país","Seleziona il paese")}</option>
              {COUNTRIES.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </FRow>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <FRow label={T("Estado / Provincia","State / Province","État / Province","Bundesland / Provinz","Estado / Província","Stato / Provincia")}>
              <Input value={d.estado} onChange={v=>set("estado",v)}
                placeholder={T("Estado o Provincia","State or Province","État ou Province","Bundesland oder Provinz","Estado ou Província","Stato o Provincia")}/>
            </FRow>
            <FRow label={T("Municipalidad / Alcaldía","Municipality / Borough","Municipalité / Arrondissement","Gemeinde / Bezirk","Município / Distrito","Comune / Circoscrizione")}>
              <Input value={d.municipio} onChange={v=>set("municipio",v)}
                placeholder={T("Municipalidad o Alcaldía","Municipality or Borough","Municipalité ou Arrondissement","Gemeinde oder Bezirk","Município ou Distrito","Comune o Circoscrizione")}/>
            </FRow>
            <FRow label={T("Calle","Street","Rue","Straße","Rua","Via")}>
              <Input value={d.calle} onChange={v=>set("calle",v)}
                placeholder={T("Nombre de la calle","Street name","Nom de la rue","Straßenname","Nome da rua","Nome della via")}/>
            </FRow>
            <FRow label={T("Número","Number","Numéro","Nummer","Número","Numero")}>
              <Input value={d.numero} onChange={v=>set("numero",v)} placeholder="123"/>
            </FRow>
          </div>
        </div>

        {/* Nota: afiliación sin costo + beneficio del 20% */}
        <div style={{...CARD,background:"rgba(200,169,81,0.06)",
          border:`1px solid ${C.gold}30`,marginBottom:16,padding:"12px 16px"}}>
          <p style={{color:C.goldL,fontFamily:"'Crimson Text',serif",fontSize:14,
            lineHeight:1.65,marginBottom:8}}>
            ✅ {T("La afiliación de su Centro no tiene costo alguno. Este registro no genera ningún pago.","Affiliating your Center is completely free of charge. This registration involves no payment.","L'affiliation de votre Centre est entièrement gratuite. Cette inscription n'entraîne aucun paiement.","Der Anschluss Ihres Zentrums ist völlig kostenlos. Diese Registrierung erfordert keine Zahlung.","A afiliação do seu Centro não tem custo algum. Este registro não gera nenhum pagamento.","L'affiliazione del tuo Centro è completamente gratuita. Questa registrazione non comporta alcun pagamento.")}
          </p>
          <p style={{color:C.goldL,fontFamily:"'Crimson Text',serif",fontSize:14,lineHeight:1.65}}>
            💊 {T("Al completar la afiliación, todos sus pacientes en tratamiento activo podrán acceder a la formación sacramental con un 20% de descuento sobre la cuota de recuperación habitual.","Upon completing affiliation, all your active patients will access sacramental formation with a 20% discount on the standard recovery fee.","Une fois l'affiliation terminée, tous vos patients en traitement actif pourront accéder à la formation sacramentelle avec une réduction de 20 % sur la contribution habituelle.","Nach Abschluss des Anschlusses erhalten alle Ihre Patienten in aktiver Behandlung Zugang zur sakramentalen Ausbildung mit einem Rabatt von 20 % auf den üblichen Genesungsbeitrag.","Ao concluir a afiliação, todos os seus pacientes em tratamento ativo poderão acessar a formação sacramental com 20% de desconto na taxa de recuperação habitual.","Al completamento dell'affiliazione, tutti i tuoi pazienti in trattamento attivo potranno accedere alla formazione sacramentale con uno sconto del 20% sulla quota di recupero abituale.")}
          </p>
        </div>

        <div style={{display:"flex",gap:12}}>
          <button onClick={onBack} style={{...BTN("sec"),flex:1,justifyContent:"center"}}>
            ← {T("Regresar","Back","Retour","Zurück","Voltar","Indietro")}
          </button>
          <button onClick={()=>can&&onNext(d)} disabled={!can}
            style={{...BTN("pri"),flex:2,justifyContent:"center",
              opacity:can?1:0.4,cursor:can?"pointer":"not-allowed"}}>
            {T("Enviar Solicitud de Afiliación","Send Affiliation Request","Envoyer la demande d'affiliation","Antrag auf Anschluss senden","Enviar Solicitação de Afiliação","Invia richiesta di affiliazione")} →
          </button>
        </div>
        <SoporteLink contexto={T("Registro de Centro de Tratamiento de Adicciones","Addiction Treatment Center registration","Inscription du Centre de Traitement des Addictions","Registrierung des Suchtbehandlungszentrums","Registro de Centro de Tratamento de Dependências","Registrazione del Centro di Trattamento delle Dipendenze")}/>
      </div>
    </div>
  );
}


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
function LibraryButton({size="sec"}){
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

// Ventana de validación de constancia (la abre el QR: /?validar=CODIGO).
function ValidarConstanciaModal({codigo,onClose}){
  const [estado,setEstado]=useState("cargando"); // cargando | ok | invalida | error
  const [info,setInfo]=useState(null);
  useEffect(()=>{
    (async()=>{
      try{
        const {data,error}=await supabase.rpc("validar_constancia",{p_codigo:codigo});
        if(error) throw error;
        const row=Array.isArray(data)?data[0]:data;
        if(row&&row.valida){ setInfo(row); setEstado("ok"); }
        else setEstado("invalida");
      }catch(e){ console.error("validar_constancia:",e); setEstado("error"); }
    })();
  },[codigo]);
  const fmt=(d)=>d?new Date(d).toLocaleDateString("es-MX",{year:"numeric",month:"long",day:"numeric"}):"—";
  return(
    <div style={OVERLAY} onClick={onClose}>
      <div style={{...MODAL,maxWidth:460,textAlign:"center"}} onClick={e=>e.stopPropagation()}>
        {estado==="cargando"&&<p style={{color:C.ivory,fontFamily:"'Crimson Text',serif",fontSize:16}}>{T("Verificando constancia…","Verifying certificate…","Vérification de l'attestation…","Bescheinigung wird überprüft…","Verificando certificado…","Verifica dell'attestato…")}</p>}
        {estado==="ok"&&info&&(<>
          <div style={{fontSize:44,marginBottom:8}}>{info.vigente?"✅":"⚠️"}</div>
          <h2 style={{fontFamily:"'Cinzel',serif",color:C.gold,fontSize:19,marginBottom:4}}>
            {info.vigente?T("Constancia válida y vigente","Valid and current certificate","Attestation valide et en vigueur","Gültige und aktuelle Bescheinigung","Certificado válido e vigente","Attestato valido e in corso"):T("Constancia auténtica (vigencia vencida)","Authentic certificate (expired)","Attestation authentique (expirée)","Echte Bescheinigung (abgelaufen)","Certificado autêntico (expirado)","Attestato autentico (scaduto)")}
          </h2>
          <div style={{textAlign:"left",marginTop:14,fontFamily:"'Crimson Text',serif",color:C.ivory,fontSize:14.5,lineHeight:1.9}}>
            <div><b>{T("Nombre","Name","Nom","Name","Nome","Nome")}:</b> {info.nombre}</div>
            <div><b>{T("Formación","Formation","Formation","Ausbildung","Formação","Formazione")}:</b> {info.sacramento}</div>
            <div><b>{T("País","Country","Pays","Land","País","Paese")}:</b> {info.pais_residencia}</div>
            <div><b>{T("Catequista","Catechist","Catéchiste","Katechetin","Catequista","Catechista")}:</b> {info.catequista}</div>
            <div><b>{T("Serie","Serial","Série","Seriennr.","Série","Serie")}:</b> <span style={{fontFamily:"monospace",color:C.gold}}>{info.serie}</span></div>
            <div><b>{T("Expedición","Issued","Délivrance","Ausstellung","Expedição","Rilascio")}:</b> {fmt(info.fecha_emision)}</div>
            <div><b>{T("Vigencia","Valid until","Validité","Gültig bis","Validade","Validità")}:</b> {fmt(info.fecha_vigencia)}</div>
          </div>
        </>)}
        {estado==="invalida"&&(<>
          <div style={{fontSize:44,marginBottom:8}}>❌</div>
          <h2 style={{fontFamily:"'Cinzel',serif",color:"#C0392B",fontSize:18}}>{T("Constancia no encontrada","Certificate not found","Attestation introuvable","Bescheinigung nicht gefunden","Certificado não encontrado","Attestato non trovato")}</h2>
          <p style={{color:C.ivoryM,fontSize:14,marginTop:8}}>{T("El código no corresponde a ninguna constancia emitida.","The code does not match any issued certificate.","Le code ne correspond à aucune attestation émise.","Der Code entspricht keiner ausgestellten Bescheinigung.","O código não corresponde a nenhum certificado emitido.","Il codice non corrisponde ad alcun attestato emesso.")}</p>
        </>)}
        {estado==="error"&&<p style={{color:"#C0392B",fontSize:14}}>{T("No se pudo verificar. Intenta más tarde.","Could not verify. Try again later.","Impossible de vérifier. Réessayez plus tard.","Überprüfung fehlgeschlagen. Später erneut versuchen.","Não foi possível verificar. Tente mais tarde.","Impossibile verificare. Riprova più tardi.")}</p>}
        <button onClick={onClose} style={{...BTN("sec"),marginTop:20}}>{T("Cerrar","Close","Fermer","Schließen","Fechar","Chiudi")}</button>
      </div>
    </div>
  );
}

// Botón "Consultar dudas" — abre la ventana de contacto (mismo diseño de soporte)
// para que el usuario escriba a admin@catecumen.com desde el área de estudio.
function ConsultarDudasButton({contexto="Consulta de dudas",size="sec"}){
  const [open,setOpen]=useState(false);
  return(
    <div style={{display:"inline-block"}}>
      <button onClick={()=>setOpen(true)} style={{...BTN(size),fontSize:12}}>
        💬 {T("Consultar dudas","Ask a question","Poser une question","Frage stellen","Tirar dúvidas","Fai una domanda")}
      </button>
      {open&&<SoporteModal contexto={contexto} onClose={()=>setOpen(false)}/>}
    </div>
  );
}

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
      if(bypassUnload) return; // redirección intencional al pago
      if(phase==="welcome"||phase==="orgThankYou") return;
      e.preventDefault();
      e.returnValue=T("¿Deseas abandonar la plataforma? Tu progreso podría no guardarse.","Do you want to leave the platform? Your progress may not be saved.","Voulez-vous quitter la plateforme ? Votre progression pourrait ne pas être enregistrée.","Möchten Sie die Plattform verlassen? Ihr Fortschritt wird möglicherweise nicht gespeichert.","Deseja sair da plataforma? Seu progresso pode não ser salvo.","Vuoi lasciare la piattaforma? I tuoi progressi potrebbero non essere salvati.");
      return e.returnValue;
    };
    const handlePopState=e=>{
      if(bypassUnload) return;
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
    else if(uType==="parroquia"||uType==="diocesis"||uType==="centroadiccion"){
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
        // Sesión sin perfil (huérfana, p. ej. cuenta borrada): cerrar sesión y
        // volver al inicio en vez de dejar la plataforma en blanco.
        try{ await supabase.auth.signOut(); }catch(e){ console.error("signOut:",e); }
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
      }else{
        table="centros_adiccion";
        fila={...comunes, estado:data.estado||null, municipio:data.municipio||null,
          calle:data.calle||null, numero:data.numero||null};
      }
      const {error}=await supabase.from(table).insert(fila);
      if(error)throw error;
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
  const isOrgFlow=orgType==="parroquia"||orgType==="diocesis"||orgType==="centroadiccion";

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
      {validarCodigo&&<ValidarConstanciaModal codigo={validarCodigo}
        onClose={()=>{setValidarCodigo(null);window.history.replaceState({},"",window.location.pathname);}}/>}

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
        ):(
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
        )}
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
      
      {phase==="filter"&&<FilterModal onSelect={handleFilterSelect}/>}
      
      {phase==="sacSelect"&&(
        <SacSelectModal onContinue={handleSacSelect} onBack={()=>setPhase("filter")}/>
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
      {phase==="register"&&isOrgFlow&&orgType==="parroquia"&&(
        <RegisterParroquiaForm onNext={handleOrgRegisterNext} onBack={()=>setPhase("encuadre")}/>
      )}
      {phase==="register"&&isOrgFlow&&orgType==="diocesis"&&(
        <RegisterDiocesisForm onNext={handleOrgRegisterNext} onBack={()=>setPhase("encuadre")}/>
      )}
      {phase==="register"&&isOrgFlow&&orgType==="centroadiccion"&&(
        <RegisterCentroForm onNext={handleOrgRegisterNext} onBack={()=>setPhase("encuadre")}/>
      )}
      {phase==="register"&&!isOrgFlow&&(
        <RegisterForm userType={userType} sacraments={selectedSacs}
          onNext={handleRegisterNext} onBack={()=>setPhase("encuadre")}/>
      )}

      {phase==="password"&&!isOrgFlow&&(
        <PasswordModal email={formData.email} onNext={handlePasswordNext} onBack={()=>setPhase("register")}/>
      )}

      {phase==="payment"&&!isOrgFlow&&(
        <PaymentModal formData={formData} userType={userType} selectedSacs={selectedSacs}
          onSuccess={handlePaymentSuccess} onBack={()=>setPhase("password")}/>
      )}

      {phase==="thankYou"&&!isOrgFlow&&(
        <ThankYouModal formData={formData} onClose={handleThankYouClose}/>
      )}

      {phase==="orgThankYou"&&(
        <OrgThankYouModal orgType={orgType} formData={formData}
          onClose={()=>{setOrgType(null);setPhase("filter");}}/>
      )}

      <ScrollbarStyle/>

      {/* CURSO */}
      {phase==="course"&&currentSecId&&!showResult&&!showSecComplete&&!showCerts&&!showDash&&(
        <CourseSectionView secId={currentSecId} progress={progress}
          onVideoAction={handleVideoAction}
          onEvalAction={handleEvalAction}
          canBack={seqIdx>0}
          onBack={()=>setSeqIdx(i=>Math.max(0,i-1))}
          onDash={()=>{setDashTab(null);setShowDash(true);}}/>
      )}

      {/* OVERLAY MODALS */}
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

      {showCerts&&(
        <CertificatesModal formData={formData} sequence={sequence} progress={progress} insBySec={insBySec}
          onClose={()=>{setShowCerts(false);setPhase("course");}}/>
      )}

      {showDash&&(
        <Dashboard formData={formData} sequence={sequence} progress={progress}
          initialTab={dashTab}
          onUpdate={updates=>setFormData(p=>({...p,...updates}))}
          onClose={()=>{setShowDash(false);setDashTab(null);
            supabase.rpc("mis_mensajes_no_leidos").then(({data})=>setMsgNoLeidos(typeof data==="number"?data:0)).catch(()=>{});
          }}/>
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