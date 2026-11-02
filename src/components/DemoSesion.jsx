// DemoSesion.jsx — Orquesta la SESIÓN DE DEMOSTRACIÓN (sin cuenta):
//   video → encuesta de calidad → evaluación → resultado + invitación a registrarse.
// Reutiliza los mismos modales del curso. NO guarda respuestas personales: solo
// registra contadores ANÓNIMOS agregados vía la RPC pública `demo_registrar`.
// Recibe ya resuelto: secId + vid (del frontend) y un "mini-puente" con la URL del
// video ya firmada y el subtítulo (SIN frontToUuid → los modales no persisten).
import { useState, lazy, Suspense } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../supabaseClient.js";
import { C, BTN, MODAL, OVERLAY } from "../ui.js";
import { T } from "../i18n.js";

const VideoModal = lazy(() => import("./VideoModal.jsx"));
const EncuestaVideoModal = lazy(() => import("./EncuestaVideoModal.jsx"));
const EvalModal = lazy(() => import("./EvalModal.jsx"));

const reg = (evento, puntaje) => {
  try { supabase.rpc("demo_registrar", { p_evento: evento, p_puntaje: puntaje ?? null }).then(() => {}, () => {}); } catch {}
};

export default function DemoSesion({ secId, vid, bridge, onClose, onRegister }) {
  const [step, setStep] = useState("video"); // video | encuesta | eval | result
  const [res, setRes] = useState(null);

  const finEval = (result) => {
    setRes(result);
    const score = Math.round((result?.score || 0) * 10) / 10;
    reg("completo", score);               // cuenta "completó" + alimenta el promedio
    if (result?.passed) reg("aprobado");  // cuenta "aprobó"
    setStep("result");
  };

  const cargando = (
    <div style={OVERLAY}><div style={{ color: C.gold, fontFamily: "'Cinzel',serif" }}>
      {T("Cargando…", "Loading…", "Chargement…", "Wird geladen…", "Carregando…", "Caricamento…")}
    </div></div>
  );

  return (
    <Suspense fallback={cargando}>
      {step === "video" && (
        <VideoModal demo secId={secId} vid={vid} bridge={bridge}
          onWatched={() => setStep("encuesta")} onClose={onClose} />
      )}
      {step === "encuesta" && (
        <EncuestaVideoModal secId={secId} vid={vid} bridge={bridge} onDone={() => setStep("eval")} />
      )}
      {step === "eval" && (
        <EvalModal secId={secId} vid={vid} onResult={finEval} onClose={onClose} />
      )}
      {step === "result" && createPortal(
        <div style={OVERLAY} onClick={onClose}>
          <div style={{ ...MODAL, maxWidth: 480, textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 40, marginBottom: 8 }} aria-hidden="true">{res?.passed ? "🎉" : "📘"}</div>
            <h2 style={{ fontFamily: "'Cinzel',serif", color: C.gold, fontSize: 20, marginBottom: 8 }}>
              {res?.passed
                ? T("¡Así se vive una lección!", "That's what a lesson feels like!", "Voilà à quoi ressemble une leçon !", "So fühlt sich eine Lektion an!", "Assim é uma lição!", "Ecco com'è una lezione!")
                : T("Así es una lección", "This is what a lesson is like", "Voilà à quoi ressemble une leçon", "So ist eine Lektion", "Assim é uma lição", "Ecco com'è una lezione")}
            </h2>
            <p style={{ color: C.ivory, fontFamily: "'Crimson Text',serif", fontSize: 15.5, lineHeight: 1.6, marginBottom: 6 }}>
              {T(`Obtuviste ${Math.round((res?.score || 0) * 10) / 10}/10 en la evaluación de demostración.`,
                 `You scored ${Math.round((res?.score || 0) * 10) / 10}/10 on the demo evaluation.`,
                 `Vous avez obtenu ${Math.round((res?.score || 0) * 10) / 10}/10 à l'évaluation de démonstration.`,
                 `Du hast ${Math.round((res?.score || 0) * 10) / 10}/10 in der Demo-Bewertung erreicht.`,
                 `Você obteve ${Math.round((res?.score || 0) * 10) / 10}/10 na avaliação de demonstração.`,
                 `Hai ottenuto ${Math.round((res?.score || 0) * 10) / 10}/10 nella valutazione dimostrativa.`)}
            </p>
            <p style={{ color: C.ivoryM, fontFamily: "'Crimson Text',serif", fontSize: 14.5, lineHeight: 1.6, marginBottom: 18 }}>
              {T("Esto fue solo una muestra. Al registrarte accedes al curso completo, con tu constancia al terminar.",
                 "That was just a sample. When you register you get the full course, with your certificate at the end.",
                 "Ce n'était qu'un aperçu. En vous inscrivant, vous accédez au cours complet, avec votre attestation à la fin.",
                 "Das war nur eine Kostprobe. Mit deiner Anmeldung erhältst du den vollständigen Kurs samt Bescheinigung am Ende.",
                 "Isto foi apenas uma amostra. Ao se registrar você acessa o curso completo, com sua constância ao concluir.",
                 "Questo era solo un assaggio. Registrandoti accedi al corso completo, con il tuo attestato alla fine.")}
            </p>
            <button onClick={onRegister} style={{ ...BTN("pri"), width: "100%", justifyContent: "center", color: "#FFFFFF" }}>
              ✝️ {T("Registrarme", "Register", "M'inscrire", "Registrieren", "Registrar-me", "Registrati")}
            </button>
            <button onClick={onClose}
              style={{ background: "none", border: "none", color: C.ivoryM, fontFamily: "'Crimson Text',serif",
                fontSize: 13.5, marginTop: 12, cursor: "pointer", textDecoration: "underline" }}>
              {T("Volver al inicio", "Back to start", "Retour à l'accueil", "Zurück zum Start", "Voltar ao início", "Torna all'inizio")}
            </button>
          </div>
        </div>, document.body)}
    </Suspense>
  );
}
