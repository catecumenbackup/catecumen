import { useState } from "react";
import { COUNTRIES } from "../data/countries.js";
import { FRow, Input, PhoneField } from "./fields.jsx";
import { SoporteLink } from "./support.jsx";
import { C, BTN, INP, LBL, CARD, MODAL, OVERLAY } from "../ui.js";
import { T } from "../i18n.js";

export default function RegisterCentroForm({onNext,onBack}){
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
