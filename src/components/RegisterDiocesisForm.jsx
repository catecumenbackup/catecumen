import { useState } from "react";
import { COUNTRIES } from "../data/countries.js";
import { FRow, Input, PhoneField } from "./fields.jsx";
import { SoporteLink } from "./support.jsx";
import { C, BTN, INP, MODAL, OVERLAY } from "../ui.js";
import { T } from "../i18n.js";

export default function RegisterDiocesisForm({onNext,onBack}){
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
