import { useState } from "react";
import { supabase } from "../supabaseClient.js";
import { CUOTAS } from "../data/pricing.js";
import { CDOCS, COUNTRIES } from "../data/countries.js";
import { resolverCuota, aplicarBeca } from "../logic.js";
import { FRow, Input, PhoneField, CountrySelect } from "./fields.jsx";
import { CalizIcon, iconoBautismo, iconoConfirmacion } from "./icons.jsx";
import { GoldenRain } from "./effects.jsx";
import { SoporteLink } from "./support.jsx";
import { C, BTN, INP, LBL, CARD, MODAL, OVERLAY, checkStyle, radioStyle } from "../ui.js";
import { T, PICK, SINO } from "../i18n.js";

// Registro catecúmeno / papás (prebautismal) / padrino / catequista.
// Calcula el desglose de precios (PPP + beca) y lo pasa a onNext.
export default function RegisterForm({userType,sacraments,onNext,onBack}){
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
  // Confirmación de correo: ambos campos deben coincidir (sin distinguir
  // mayúsculas ni espacios) para evitar erratas que dejarían al usuario sin acceso.
  const emailsMatch=(d.email||"").trim().toLowerCase()===(d.emailConfirm||"").trim().toLowerCase();
  const canSubmit=d.nombre&&d.apellido&&d.email&&d.emailConfirm&&emailsMatch&&d.country&&d.estado&&d.dob&&d.phone&&d.docNum&&d.phoneCode&&
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
        
        {/* Correo y su confirmación en la misma línea. */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <FRow label={T("Correo electrónico","Email address","Adresse e-mail","E-Mail-Adresse","E-mail","Indirizzo email")}>
            <Input type="email" value={d.email} onChange={v=>set("email",v)} placeholder="nombre@ejemplo.com"/>
          </FRow>

          <FRow label={T("Confirmar correo electrónico","Confirm email address","Confirmer l'adresse e-mail","E-Mail-Adresse bestätigen","Confirmar e-mail","Conferma indirizzo email")}>
            {/* Reescribir (no pegar) para atrapar erratas; se compara sin distinguir mayúsculas. */}
            <input type="email" value={d.emailConfirm||""} onChange={e=>set("emailConfirm",e.target.value)}
              onPaste={e=>e.preventDefault()} onDrop={e=>e.preventDefault()}
              autoComplete="off" spellCheck={false} placeholder="nombre@ejemplo.com"
              style={{...INP, ...(d.emailConfirm&&!emailsMatch?{borderColor:"#F87171"}:{})}}/>
            {d.emailConfirm&&!emailsMatch&&(
              <p style={{color:"#F87171",fontSize:12.5,margin:"6px 0 0",fontFamily:"'Crimson Text',serif"}}>
                ⚠️ {T("Los correos no coinciden","The emails do not match","Les e-mails ne correspondent pas","Die E-Mail-Adressen stimmen nicht überein","Os e-mails não coincidem","Le email non corrispondono")}
              </p>
            )}
          </FRow>
        </div>

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
                      {k:"Casado/a sólo por el civil",es:"Casado/a sólo por el civil (unión libre)", en:"Married (civil only / common-law)",fr:"Marié(e) civilement seulement (union libre)",de:"Nur standesamtlich verheiratet (freie Partnerschaft)",pt:"Casado/a só no civil (união estável)",it:"Sposato/a solo civilmente (unione di fatto)"},
                      {k:"Divorciado/a",              es:"Divorciado/a",                en:"Divorced",fr:"Divorcé(e)",de:"Geschieden",pt:"Divorciado/a",it:"Divorziato/a"},
                    ]
                  : [
                      {k:"Soltero/a",                es:"Soltero/a",                   en:"Single",fr:"Célibataire",de:"Ledig",pt:"Solteiro/a",it:"Celibe/Nubile"},
                      {k:"Casado/a sólo por el civil",es:"Casado/a sólo por el civil (unión libre)", en:"Married (civil only / common-law)",fr:"Marié(e) civilement seulement (union libre)",de:"Nur standesamtlich verheiratet (freie Partnerschaft)",pt:"Casado/a só no civil (união estável)",it:"Sposato/a solo civilmente (unione di fatto)"},
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
              {d.email&&(!d.emailConfirm||!emailsMatch)&&<span>• {T("Confirmar correo (debe coincidir)","Confirm email (must match)","Confirmer l'e-mail (doit correspondre)","E-Mail bestätigen (muss übereinstimmen)","Confirmar e-mail (deve coincidir)","Conferma email (deve corrispondere)")}<br/></span>}
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
