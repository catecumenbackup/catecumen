import { useState } from "react";
import { COUNTRIES, MX_ESTADOS } from "../data/countries.js";
import { FRow, Input, PhoneField } from "./fields.jsx";
import { SoporteLink } from "./support.jsx";
import { C, BTN, INP, LBL, CARD, MODAL, OVERLAY, checkStyle } from "../ui.js";
import { T } from "../i18n.js";

export default function RegisterParroquiaForm({onNext,onBack}){
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
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <FRow label={T("Estado / Provincia","State / Province","État / Province","Bundesland / Provinz","Estado / Província","Stato / Provincia")}>
            {d.country==="México"
              ? <select value={d.estado||""} onChange={e=>set("estado",e.target.value)} style={INP}>
                  <option value="">{T("Selecciona","Select","Sélectionnez","Wählen","Selecione","Seleziona")}</option>
                  {MX_ESTADOS.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              : <Input value={d.estado} onChange={v=>set("estado",v)} placeholder={T("Estado o provincia","State or province","État ou province","Bundesland","Estado ou província","Stato o provincia")}/>}
          </FRow>
          <FRow label={T("Municipio / Alcaldía","Municipality / Borough","Municipalité","Gemeinde / Bezirk","Município","Comune")}>
            <Input value={d.municipio} onChange={v=>set("municipio",v)} placeholder={T("Municipio o alcaldía","Municipality","Municipalité","Gemeinde","Município","Comune")}/>
          </FRow>
        </div>
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
