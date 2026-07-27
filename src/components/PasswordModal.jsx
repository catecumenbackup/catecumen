import { useState } from "react";
import { supabase } from "../supabaseClient.js";
import { FRow, PasswordInput } from "./fields.jsx";
import { C, BTN, MODAL, OVERLAY } from "../ui.js";
import { T } from "../i18n.js";

function pwdStrength(pw){
  let s=0;
  if(pw.length>=8)s++;
  if(/[A-Z]/.test(pw))s++;
  if(/[0-9]/.test(pw))s++;
  if(/[^A-Za-z0-9]/.test(pw))s++;
  return s; // 0-4
}

export default function PasswordModal({onNext,onBack,email}){
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
