import { useState } from "react";
import { supabase } from "../supabaseClient.js";
import { appNav } from "../appNav.js";
import { COUNTRY_ISO, CDOCS } from "../data/countries.js";
import { C, BTN, CARD, MODAL, OVERLAY } from "../ui.js";
import { T, LANG } from "../i18n.js";

// Flujo de inscripción y pago (Stripe Checkout vía edge function).
// crearCuentaUsuario es su único consumidor, por eso vive aquí.
// CRÍTICO: la cuenta de pago se crea SOLO tras confirmar el pago (webhook);
// esta pantalla solo guarda el registro pendiente y redirige a Stripe.
async function crearCuentaUsuario(formData,userType,selectedSacs,opts){
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
    // Preinscripción (sin pago): queda 'preinscrito' hasta que abra la plataforma.
    estado_inscripcion:opts?.preinscrito?"preinscrito":"activo",
    // Precio previsto (para cobrar la conversión al abrir sin recalcular).
    importe_previsto:opts?.preinscrito?(pb||null):null,
  };
  const {error:insErr}=await supabase.from("usuarios").insert(fila);
  if(insErr){
    console.error("insert usuarios:",insErr);
    throw new Error(T("No se pudo guardar tu perfil. Intenta de nuevo o contacta soporte.","Your profile could not be saved. Try again or contact support.","Votre profil n'a pas pu être enregistré. Réessayez ou contactez le support.","Ihr Profil konnte nicht gespeichert werden. Versuchen Sie es erneut oder kontaktieren Sie den Support.","Não foi possível salvar seu perfil. Tente novamente ou entre em contato com o suporte.","Non è stato possibile salvare il tuo profilo. Riprova o contatta l'assistenza."));
  }
  return {uid,registroId};
}

export default function PaymentModal({formData,userType,selectedSacs,onSuccess,onBack,preinscripcion,conversion,usuarioId}){
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

  // ── Ruta de PREINSCRIPCIÓN (plataforma aún no abierta): crea la cuenta en
  //    estado 'preinscrito' SIN pago; el usuario queda a la espera de la apertura.
  const handlePreinscribir=async()=>{
    setLoading(true);setErr("");
    try{
      const res=await crearCuentaUsuario(formData,userType,selectedSacs,{preinscrito:true});
      onSuccess({...res,preinscrito:true});
    }catch(e){setErr(e.message);}
    finally{setLoading(false);}
  };

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
        // Conversión de preinscrito: activa la cuenta existente, no crea otra.
        conversion:!!conversion, usuario_id:usuarioId||null,
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
      appNav.bypassUnload=true; // no mostrar "¿Abandonar sitio?" al ir a Stripe
      window.location.href=data.url; // → Stripe Checkout
    }catch(e){setErr(e.message);setLoading(false);setPayingMethod(null);}
  };

  const esCatequistaVerificado=!esBeca&&formData.orgVerificada;

  // ── Modo PREINSCRIPCIÓN: reemplaza el pago por "reserva tu lugar sin costo" ──
  if(preinscripcion){
    return(
      <div style={OVERLAY}>
        <div style={{...MODAL,maxWidth:500,textAlign:"center"}}>
          <div style={{fontSize:46,marginBottom:12}}>📝</div>
          <h2 style={{fontFamily:"'Cinzel',serif",color:C.gold,fontSize:19,marginBottom:12}}>
            {T("Preinscripción sin costo","Free pre-registration","Préinscription sans frais","Kostenlose Voranmeldung","Pré-inscrição sem custo","Preiscrizione gratuita")}
          </h2>
          <div style={{...CARD,background:"rgba(200,169,81,0.08)",marginBottom:20}}>
            <p style={{color:C.ivory,fontFamily:"'Crimson Text',serif",fontSize:16,lineHeight:1.65}}>
              {T("Aún no realizarás ningún pago. Reserva tu lugar ahora y te avisaremos en cuanto se abra el acceso completo a la plataforma; en ese momento podrás completar tu inscripción.","No payment yet. Reserve your spot now and we'll notify you as soon as full access to the platform opens; at that point you'll be able to complete your registration.","Aucun paiement pour l'instant. Réservez votre place maintenant et nous vous préviendrons dès l'ouverture de l'accès complet à la plateforme ; vous pourrez alors finaliser votre inscription.","Noch keine Zahlung. Reservieren Sie jetzt Ihren Platz und wir benachrichtigen Sie, sobald der vollständige Zugang zur Plattform freigeschaltet wird; dann können Sie Ihre Anmeldung abschließen.","Ainda sem pagamento. Reserve seu lugar agora e avisaremos assim que o acesso completo à plataforma for aberto; nesse momento você poderá concluir sua inscrição.","Nessun pagamento per ora. Prenota il tuo posto adesso e ti avviseremo non appena si aprirà l'accesso completo alla piattaforma; a quel punto potrai completare la tua iscrizione.")}
            </p>
          </div>
          {err&&<p style={{color:"#F87171",fontFamily:"'Crimson Text',serif",fontSize:14,marginBottom:14}}>⚠️ {err}</p>}
          <div style={{display:"flex",gap:12}}>
            <button onClick={onBack} disabled={loading}
              style={{...BTN("sec"),flex:1,justifyContent:"center",opacity:loading?0.4:1}}>
              ← {T("Regresar","Back","Retour","Zurück","Voltar","Indietro")}
            </button>
            <button onClick={handlePreinscribir} disabled={loading}
              style={{...BTN("pri"),flex:2,justifyContent:"center",opacity:loading?0.5:1,cursor:loading?"wait":"pointer"}}>
              {loading?T("Reservando tu lugar…","Reserving your spot…","Réservation de votre place…","Ihr Platz wird reserviert…","Reservando seu lugar…","Prenotazione del tuo posto…")
                :T("Reservar mi lugar","Reserve my spot","Réserver ma place","Meinen Platz reservieren","Reservar meu lugar","Prenota il mio posto")} →
            </button>
          </div>
        </div>
      </div>
    );
  }

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
