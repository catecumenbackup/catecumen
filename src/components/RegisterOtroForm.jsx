import { useState } from "react";
import { COUNTRIES } from "../data/countries.js";
import { FRow, Input, PhoneField } from "./fields.jsx";
import { SoporteLink } from "./support.jsx";
import { C, BTN, INP, LBL, CARD, MODAL, OVERLAY } from "../ui.js";
import { T } from "../i18n.js";

// Registro de "otra" organización/institución no prevista (movimientos,
// colegios, universidades, capellanías, fundaciones, comunidades religiosas…).
// Campo clave: `tipoOrg` — el interesado señala QUÉ tipo de organización es.
// Se guarda en la tabla organizaciones_otro (ver scripts/admin-afiliados.sql).
export default function RegisterOtroForm({onNext,onBack}){
  const [d,setD]=useState({});
  const set=(k,v)=>setD(p=>({...p,[k]:v}));

  const can=d.tipoOrg&&d.nombre&&d.contacto&&d.email&&d.phone&&d.phoneCode&&
            d.country&&d.estado&&d.municipio&&d.direccion;
  return(
    <div style={OVERLAY}>
      <div style={{...MODAL,maxWidth:680}}>
        <h2 style={{fontFamily:"'Cinzel',serif",color:C.gold,fontSize:17,marginBottom:20}}>
          🏢 {T("Afiliación de otra organización o institución","Affiliation of another organization or institution","Affiliation d'une autre organisation ou institution","Anschluss einer anderen Organisation oder Institution","Afiliação de outra organização ou instituição","Affiliazione di un'altra organizzazione o istituzione")}
        </h2>

        {/* ─── Campo clave: tipo de organización ─── */}
        <FRow label={T("Tipo de organización o institución","Type of organization or institution","Type d'organisation ou d'institution","Art der Organisation oder Institution","Tipo de organização ou instituição","Tipo di organizzazione o istituzione")}>
          <Input value={d.tipoOrg} onChange={v=>set("tipoOrg",v)}
            placeholder={T("Ej.: movimiento, colegio, universidad, capellanía, fundación, comunidad religiosa…","E.g.: movement, school, university, chaplaincy, foundation, religious community…","P. ex. : mouvement, école, université, aumônerie, fondation, communauté religieuse…","Z. B.: Bewegung, Schule, Universität, Seelsorge, Stiftung, Ordensgemeinschaft…","Ex.: movimento, colégio, universidade, capelania, fundação, comunidade religiosa…","Es.: movimento, scuola, università, cappellania, fondazione, comunità religiosa…")}/>
        </FRow>

        <FRow label={T("Nombre completo de la organización","Full name of the organization","Nom complet de l'organisation","Vollständiger Name der Organisation","Nome completo da organização","Nome completo dell'organizzazione")}>
          <Input value={d.nombre} onChange={v=>set("nombre",v)}
            placeholder={T("Nombre completo y oficial","Full official name","Nom complet et officiel","Vollständiger und offizieller Name","Nome completo e oficial","Nome completo e ufficiale")}/>
        </FRow>

        <FRow label={T("Nombre de la persona de contacto","Name of the contact person","Nom de la personne de contact","Name der Kontaktperson","Nome da pessoa de contato","Nome della persona di contatto")}>
          <Input value={d.contacto} onChange={v=>set("contacto",v)}
            placeholder={T("Nombre completo","Full name","Nom complet","Vollständiger Name","Nome completo","Nome completo")}/>
        </FRow>

        <FRow label={T("Correo electrónico de contacto","Contact email","E-mail de contact","Kontakt-E-Mail","E-mail de contato","Email di contatto")}>
          <Input type="email" value={d.email} onChange={v=>set("email",v)}
            placeholder="contacto@organizacion.org"/>
        </FRow>

        <FRow label={T("Número telefónico de contacto","Contact phone number","Numéro de téléphone de contact","Kontakttelefonnummer","Número de telefone de contato","Numero di telefono di contatto")}>
          <PhoneField phoneCode={d.phoneCode} phone={d.phone} onChange={set}/>
        </FRow>

        {/* ─── Ubicación ─── */}
        <div style={{...CARD,background:"rgba(200,169,81,0.06)",
          border:`1px solid ${C.gold}30`,marginBottom:16,padding:"14px 16px"}}>
          <p style={{...LBL,marginBottom:12,fontSize:13}}>
            {T("Ubicación de la organización","Location of the organization","Emplacement de l'organisation","Standort der Organisation","Localização da organização","Ubicazione dell'organizzazione")}
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
          </div>
          <FRow label={T("Dirección","Address","Adresse","Adresse","Endereço","Indirizzo")}>
            <Input value={d.direccion} onChange={v=>set("direccion",v)}
              placeholder={T("Calle y número","Street and number","Rue et numéro","Straße und Nummer","Rua e número","Via e numero")}/>
          </FRow>
        </div>

        {/* Nota: afiliación sin costo */}
        <div style={{...CARD,background:"rgba(200,169,81,0.06)",
          border:`1px solid ${C.gold}30`,marginBottom:16,padding:"12px 16px"}}>
          <p style={{color:C.goldL,fontFamily:"'Crimson Text',serif",fontSize:14,lineHeight:1.65}}>
            ✅ {T("La afiliación de su organización no tiene costo alguno. Nuestro equipo revisará su solicitud y le contactará para proponerle la modalidad de colaboración más adecuada.","Affiliating your organization is completely free of charge. Our team will review your request and contact you to propose the most suitable form of collaboration.","L'affiliation de votre organisation est entièrement gratuite. Notre équipe examinera votre demande et vous contactera pour vous proposer la forme de collaboration la plus adaptée.","Der Anschluss Ihrer Organisation ist völlig kostenlos. Unser Team prüft Ihre Anfrage und wird Sie kontaktieren, um Ihnen die passendste Form der Zusammenarbeit vorzuschlagen.","A afiliação da sua organização não tem custo algum. Nossa equipe analisará sua solicitação e entrará em contato para propor a modalidade de colaboração mais adequada.","L'affiliazione della tua organizzazione è completamente gratuita. Il nostro team esaminerà la tua richiesta e ti contatterà per proporti la forma di collaborazione più adatta.")}
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
        <SoporteLink contexto={T("Afiliación de otra organización o institución","Affiliation of another organization or institution","Affiliation d'une autre organisation ou institution","Anschluss einer anderen Organisation oder Institution","Afiliação de outra organização ou instituição","Affiliazione di un'altra organizzazione o istituzione")}/>
      </div>
    </div>
  );
}
