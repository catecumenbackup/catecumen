// src/components/AyudaConexionModal.jsx
// Fase 3 — Explicación al catecúmeno de cómo prepararse con poca o nula conexión.
// Honesto con el estado actual: el avance (videos vistos, evaluaciones, encuestas)
// se guarda y sincroniza solo; el VIDEO todavía requiere conexión (Fase 2 en camino)
// y la constancia se emite en línea. Incluye el buscador de parroquias afiliadas
// como "punto puente" de conexión.
import { lazy, Suspense, useState } from "react";
import { createPortal } from "react-dom";
import { C, BTN, MODAL, OVERLAY } from "../ui.js";
import { T } from "../i18n.js";

const DirectorioAfiliados = lazy(() => import("./DirectorioAfiliados.jsx"));

function Bloque({ icono, titulo, children }) {
  return (
    <div style={{
      background: "var(--c-cardH)", border: `1px solid ${C.border}`,
      borderRadius: 12, padding: "14px 16px", marginBottom: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <span aria-hidden="true" style={{ fontSize: 20 }}>{icono}</span>
        <h3 style={{ margin: 0, fontFamily: "'Cinzel',serif", color: C.gold, fontSize: 15 }}>{titulo}</h3>
      </div>
      <div style={{ color: C.ivory, fontFamily: "'Crimson Text',serif", fontSize: 15, lineHeight: 1.55 }}>
        {children}
      </div>
    </div>
  );
}

export default function AyudaConexionModal({ onClose }) {
  const [dir, setDir] = useState(false);

  // Portal a document.body: en la bienvenida hay ancestros con transform/animación
  // que anclarían este position:fixed a su caja y recortarían el modal en escritorio.
  return createPortal(
    <div style={{ ...OVERLAY, zIndex: 2000 }}>
      <div style={{ ...MODAL, maxWidth: 620, maxHeight: "86vh", overflowY: "auto" }}>
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 30, marginBottom: 6 }} aria-hidden="true">📶</div>
          <h2 style={{ margin: 0, fontFamily: "'Cinzel',serif", color: C.gold, fontSize: 19 }}>
            {T("¿Tienes poca o nada de conexión?", "Little or no internet?", "Peu ou pas de connexion ?",
               "Wenig oder kein Internet?", "Pouca ou nenhuma conexão?", "Poca o nessuna connessione?")}
          </h2>
          <p style={{ color: C.ivoryM, fontSize: 14, marginTop: 8, lineHeight: 1.5 }}>
            {T("Tu preparación está pensada para llegar a todos, también donde el internet escasea. Esto es lo que puedes hacer según tu caso:",
               "Your preparation is meant to reach everyone, even where internet is scarce. Here's what you can do depending on your situation:",
               "Votre préparation est conçue pour atteindre tout le monde, même là où Internet est rare. Voici ce que vous pouvez faire selon votre situation :",
               "Deine Vorbereitung soll alle erreichen, auch dort, wo das Internet knapp ist. Das kannst du je nach Situation tun:",
               "Sua preparação foi pensada para alcançar a todos, mesmo onde a internet é escassa. Veja o que você pode fazer conforme o seu caso:",
               "La tua preparazione è pensata per raggiungere tutti, anche dove Internet scarseggia. Ecco cosa puoi fare a seconda del tuo caso:")}
          </p>
        </div>

        <Bloque icono="🔁" titulo={T("Tienes señal de vez en cuando", "You have signal from time to time",
          "Vous avez du signal de temps en temps", "Du hast ab und zu Empfang",
          "Você tem sinal de vez em quando", "Hai segnale ogni tanto")}>
          {T("Estudia cuando tengas internet. Tu avance —videos vistos, evaluaciones y encuestas— se guarda en tu dispositivo y se sincroniza solo cuando vuelve la conexión, aunque cierres la aplicación. No pierdes tu progreso.",
             "Study when you have internet. Your progress —watched videos, quizzes and surveys— is saved on your device and syncs by itself when the connection returns, even if you close the app. You don't lose your progress.",
             "Étudiez quand vous avez Internet. Votre progression —vidéos vues, évaluations et enquêtes— est enregistrée sur votre appareil et se synchronise automatiquement au retour de la connexion, même si vous fermez l'application. Vous ne perdez rien.",
             "Lerne, wenn du Internet hast. Dein Fortschritt —gesehene Videos, Tests und Umfragen— wird auf deinem Gerät gespeichert und synchronisiert sich von selbst, sobald die Verbindung zurückkehrt, auch wenn du die App schließt. Du verlierst nichts.",
             "Estude quando tiver internet. Seu progresso —vídeos assistidos, avaliações e pesquisas— é salvo no seu dispositivo e sincroniza sozinho quando a conexão volta, mesmo que você feche o aplicativo. Você não perde seu progresso.",
             "Studia quando hai Internet. I tuoi progressi —video visti, valutazioni e sondaggi— vengono salvati sul dispositivo e si sincronizzano da soli al ritorno della connessione, anche se chiudi l'app. Non perdi nulla.")}
        </Bloque>

        <Bloque icono="⛪" titulo={T("No hay señal donde estudias", "No signal where you study",
          "Pas de signal là où vous étudiez", "Kein Empfang dort, wo du lernst",
          "Sem sinal onde você estuda", "Nessun segnale dove studi")}>
          <p style={{ margin: "0 0 10px" }}>
            {T("Acércate a una parroquia afiliada o a un punto con internet (la casa de un familiar, una biblioteca, la cabecera municipal) para ver las lecciones y que tu avance se sincronice. Busca la parroquia afiliada más cercana:",
               "Go to an affiliated parish or a place with internet (a relative's home, a library, the town center) to watch the lessons and let your progress sync. Find the nearest affiliated parish:",
               "Rendez-vous dans une paroisse affiliée ou un lieu avec Internet (chez un proche, une bibliothèque, le centre-ville) pour voir les leçons et synchroniser votre progression. Trouvez la paroisse affiliée la plus proche :",
               "Geh zu einer angeschlossenen Pfarrei oder einem Ort mit Internet (zu Verwandten, in eine Bibliothek, ins Ortszentrum), um die Lektionen anzusehen und deinen Fortschritt zu synchronisieren. Finde die nächste angeschlossene Pfarrei:",
               "Vá a uma paróquia afiliada ou a um ponto com internet (a casa de um parente, uma biblioteca, o centro do município) para ver as lições e sincronizar seu progresso. Encontre a paróquia afiliada mais próxima:",
               "Recati in una parrocchia affiliata o in un luogo con Internet (casa di un parente, una biblioteca, il centro del paese) per vedere le lezioni e sincronizzare i progressi. Trova la parrocchia affiliata più vicina:")}
          </p>
          <button onClick={() => setDir(true)} style={{ ...BTN("sec"), fontSize: 12,
            background: "rgba(45,122,90,0.18)", color: C.ivory, border: "1px solid rgba(45,122,90,0.55)" }}>
            ⛪ {T("Buscar parroquia afiliada", "Find affiliated parish", "Trouver une paroisse affiliée",
                  "Angeschlossene Pfarrei finden", "Buscar paróquia afiliada", "Trova parrocchia affiliata")}
          </button>
        </Bloque>

        <Bloque icono="🧑‍🏫" titulo={T("¿Eres catequista o parroquia?", "Are you a catechist or parish?",
          "Êtes-vous catéchiste ou paroisse ?", "Bist du Katechet oder Pfarrei?",
          "Você é catequista ou paróquia?", "Sei catechista o parrocchia?")}>
          {T("Puedes acompañar a varios catecúmenos desde un solo equipo con conexión; el avance de cada uno se guarda con su propia cuenta. Si el equipo es compartido, recuerda cerrar la sesión al terminar.",
             "You can accompany several catechumens from a single device with a connection; each person's progress is saved under their own account. If the device is shared, remember to sign out when finished.",
             "Vous pouvez accompagner plusieurs catéchumènes depuis un seul appareil connecté ; la progression de chacun est enregistrée sous son propre compte. Si l'appareil est partagé, pensez à vous déconnecter à la fin.",
             "Du kannst mehrere Katechumenen von einem einzigen Gerät mit Verbindung begleiten; der Fortschritt jeder Person wird unter ihrem eigenen Konto gespeichert. Bei einem gemeinsam genutzten Gerät denke daran, dich am Ende abzumelden.",
             "Você pode acompanhar vários catecúmenos a partir de um único equipamento com conexão; o progresso de cada um é salvo em sua própria conta. Se o equipamento for compartilhado, lembre-se de sair ao terminar.",
             "Puoi accompagnare più catecumeni da un solo dispositivo connesso; i progressi di ciascuno vengono salvati nel proprio account. Se il dispositivo è condiviso, ricordati di uscire al termine.")}
        </Bloque>

        <div style={{ background: "rgba(200,169,81,0.10)", border: `1px solid ${C.gold}44`,
          borderRadius: 10, padding: "12px 14px", color: C.ivoryM, fontSize: 13.5, lineHeight: 1.6 }}>
          <p style={{ margin: "0 0 6px" }}>
            ⬇️ {T("Puedes descargar las lecciones disponibles para verlas sin conexión: busca el botón «Descargar para ver sin conexión» en cada video. La descarga se guarda cifrada y ligada a tu cuenta, y la administras en «Mi Cuenta → Descargas».",
               "You can download available lessons to watch offline: look for the “Download to watch offline” button on each video. The download is stored encrypted and tied to your account, and you manage it in “My Account → Downloads”.",
               "Vous pouvez télécharger les leçons disponibles pour les voir hors ligne : cherchez le bouton « Télécharger pour voir hors ligne » sur chaque vidéo. Le téléchargement est chiffré et lié à votre compte ; gérez-le dans « Mon compte → Téléchargements ».",
               "Du kannst verfügbare Lektionen zum Offline-Ansehen herunterladen: Suche bei jedem Video die Schaltfläche „Zum Offline-Ansehen herunterladen“. Der Download wird verschlüsselt und mit deinem Konto verknüpft gespeichert und in „Mein Konto → Downloads“ verwaltet.",
               "Você pode baixar as lições disponíveis para vê-las offline: procure o botão “Baixar para ver offline” em cada vídeo. O download é salvo criptografado e vinculado à sua conta, e você o gerencia em “Minha Conta → Downloads”.",
               "Puoi scaricare le lezioni disponibili per vederle offline: cerca il pulsante «Scarica per vedere offline» su ogni video. Il download viene salvato cifrato e legato al tuo account, e lo gestisci in «Il mio account → Download».")}
          </p>
          <p style={{ margin: 0 }}>
            🎓 {T("Tu constancia se emite cuando tengas conexión (requiere validación en línea).",
               "Your certificate is issued when you have a connection (it requires online validation).",
               "Votre attestation est délivrée lorsque vous avez une connexion (validation en ligne requise).",
               "Deine Bescheinigung wird ausgestellt, wenn du eine Verbindung hast (Online-Validierung erforderlich).",
               "Seu certificado é emitido quando você tiver conexão (requer validação online).",
               "Il tuo attestato viene rilasciato quando hai una connessione (richiede la convalida online).")}
          </p>
        </div>

        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button onClick={onClose} style={BTN("pri")}>
            {T("Entendido", "Got it", "Compris", "Verstanden", "Entendi", "Ho capito")}
          </button>
        </div>
      </div>

      {dir && (
        <Suspense fallback={<div style={OVERLAY}><div style={{ color: C.gold, fontFamily: "'Cinzel',serif" }}>
          {T("Cargando…", "Loading…", "Chargement…", "Wird geladen…", "Carregando…", "Caricamento…")}</div></div>}>
          <DirectorioAfiliados onClose={() => setDir(false)} />
        </Suspense>
      )}
    </div>,
    document.body
  );
}
