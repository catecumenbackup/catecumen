import { SEC_META } from "../data/course.js";
import SecIcon from "./SecIcon.jsx";
import { C, BTN, CARD, MODAL, OVERLAY } from "../ui.js";
import { T, PICK } from "../i18n.js";

export default function SectionCompleteModal({secId,avgScore,nextSecId,isLastBeforeCerts,isAllDone,onContinue}){
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
