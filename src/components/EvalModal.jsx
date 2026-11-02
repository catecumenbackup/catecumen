import { useState, useEffect } from "react";
import { Q } from "../data/course.js";
import { supabase } from "../supabaseClient.js";
import { C, BTN, CARD, MODAL, OVERLAY } from "../ui.js";
import { T, PICK } from "../i18n.js";
import { useEscClose, BotonX } from "./modalUtils.jsx";

// Evaluación del tema. Preferimos las preguntas REALES de la BD (una evaluación
// propia por video/tema) vía la RPC `obtener_preguntas`, y la CALIFICACIÓN se hace
// en el SERVIDOR (`calificar_evaluacion`) — así la respuesta correcta nunca viaja
// al navegador. Si el video no tiene preguntas en la BD (o no hay sesión, p. ej. la
// demo), se cae al banco estático `Q` del código con calificación local.
export default function EvalModal({ secId, vid, videoUuid = null, onResult, onClose }) {
  useEscClose(onClose);
  const localBank = () => Q[vid.id] || (() => { const keys = Object.keys(Q); return Q[keys[vid.o % keys.length]]; })();
  const [qs, setQs] = useState(() => (videoUuid ? null : localBank()));   // null = cargando
  const [modo, setModo] = useState("local");                              // "db" | "local"
  const [ans, setAns] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!videoUuid) return;                 // sin puente/sesión: banco local ya está
    let vivo = true;
    (async () => {
      try {
        const { data, error } = await supabase.rpc("obtener_preguntas", { p_video_id: videoUuid });
        if (!vivo) return;
        if (!error && Array.isArray(data) && data.length) {
          const mapped = data.map(r => ({
            id: r.id,
            q: PICK({ es: r.pregunta_es, en: r.pregunta_en, fr: r.pregunta_fr, de: r.pregunta_de, pt: r.pregunta_pt, it: r.pregunta_it }),
            o: {
              a: PICK({ es: r.opcion_a_es, en: r.opcion_a_en, fr: r.opcion_a_fr, de: r.opcion_a_de, pt: r.opcion_a_pt, it: r.opcion_a_it }),
              b: PICK({ es: r.opcion_b_es, en: r.opcion_b_en, fr: r.opcion_b_fr, de: r.opcion_b_de, pt: r.opcion_b_pt, it: r.opcion_b_it }),
              c: PICK({ es: r.opcion_c_es, en: r.opcion_c_en, fr: r.opcion_c_fr, de: r.opcion_c_de, pt: r.opcion_c_pt, it: r.opcion_c_it }),
              d: PICK({ es: r.opcion_d_es, en: r.opcion_d_en, fr: r.opcion_d_fr, de: r.opcion_d_de, pt: r.opcion_d_pt, it: r.opcion_d_it }),
            },
          }));
          setQs(mapped); setModo("db"); return;
        }
      } catch { /* cae al banco local */ }
      if (vivo) { setQs(localBank()); setModo("local"); }
    })();
    return () => { vivo = false; };
  }, [videoUuid]); // eslint-disable-line react-hooks/exhaustive-deps

  if (qs === null) {
    return (
      <div style={OVERLAY}>
        <div style={{ ...MODAL, maxWidth: 640, textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>📝</div>
          <p style={{ color: C.gold, fontFamily: "'Cinzel',serif" }}>
            {T("Cargando evaluación…", "Loading evaluation…", "Chargement de l'évaluation…", "Bewertung wird geladen…", "Carregando avaliação…", "Caricamento valutazione…")}
          </p>
        </div>
      </div>
    );
  }
  if (!qs.length) return null;

  const allAnswered = qs.every(q => ans[q.id]);
  const title = PICK(vid);

  const handleSubmit = async () => {
    if (!allAnswered || submitted) return;
    setSubmitted(true); setErr("");
    if (modo === "db") {
      try {
        const respuestas = {}; qs.forEach(q => { respuestas[q.id] = ans[q.id]; });
        const { data, error } = await supabase.rpc("calificar_evaluacion", { p_video_id: videoUuid, p_respuestas: respuestas });
        if (error) throw error;
        const score = Number(data?.puntaje || 0), passed = !!data?.aprobado;
        setTimeout(() => onResult({ score, passed, correct: Math.round((score / 10) * qs.length), total: qs.length, serverGraded: true }), 400);
      } catch (e) {
        console.error("calificar_evaluacion:", e);
        setSubmitted(false);
        setErr(T("No se pudo calificar. Revisa tu conexión e inténtalo de nuevo.", "Couldn't grade. Check your connection and try again.", "Impossible d'évaluer. Vérifiez votre connexion et réessayez.", "Bewertung fehlgeschlagen. Prüfe deine Verbindung und versuche es erneut.", "Não foi possível avaliar. Verifique sua conexão e tente de novo.", "Impossibile valutare. Controlla la connessione e riprova."));
      }
    } else {
      const correct = qs.filter(q => ans[q.id] === q.k).length;
      const score = (correct / qs.length) * 10;
      setTimeout(() => onResult({ score, passed: score >= 8, correct, total: qs.length, serverGraded: false }), 600);
    }
  };

  return (
    <div style={OVERLAY}>
      <div style={{ ...MODAL, maxWidth: 640, position: "relative" }}>
        <BotonX onClose={onClose} />
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>📝</div>
          <h2 style={{ fontFamily: "'Cinzel',serif", color: C.gold, fontSize: 16 }}>{T("Evaluación", "Evaluation", "Évaluation", "Bewertung", "Avaliação", "Valutazione")}</h2>
          <p style={{ color: C.ivoryM, fontSize: 13, marginTop: 4 }}>{title}</p>
          <p style={{ color: C.ivoryM, fontSize: 12 }}>
            {T("Necesitas 8/10 para aprobar", "You need 8/10 to pass", "Vous avez besoin de 8/10 pour réussir", "Sie benötigen 8/10, um zu bestehen", "Você precisa de 8/10 para ser aprovado", "Ti servono 8/10 per superare la prova")} |
            {T(` ${qs.length} preguntas`, ` ${qs.length} questions`, ` ${qs.length} questions`, ` ${qs.length} Fragen`, ` ${qs.length} perguntas`, ` ${qs.length} domande`)}
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {qs.map((q, qi) => (
            <div key={q.id} style={{ ...CARD }}>
              <p style={{ color: C.ivory, fontFamily: "'Crimson Text',serif", fontSize: 16, marginBottom: 12 }}>
                <strong style={{ color: C.gold }}>{qi + 1}.</strong> {q.q}
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {Object.entries(q.o).map(([k, v]) => (
                  <button key={k} onClick={() => !submitted && setAns(p => ({ ...p, [q.id]: k }))}
                    style={{
                      background: ans[q.id] === k ? "rgba(200,169,81,0.18)" : "rgba(255,255,255,0.04)",
                      border: `1.5px solid ${ans[q.id] === k ? C.gold : C.borderD}`,
                      borderRadius: 8, padding: "10px 12px", color: C.ivory,
                      fontFamily: "'Crimson Text',serif", fontSize: 14, textAlign: "left", cursor: "pointer",
                      transition: "all .2s",
                    }}>
                    <strong style={{ color: C.gold }}>{k.toUpperCase()}.</strong> {v}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        {err && <p style={{ color: "#F87171", fontFamily: "'Crimson Text',serif", fontSize: 13.5, marginTop: 12 }}>⚠️ {err}</p>}
        <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
          <button onClick={onClose} style={{ ...BTN("sec"), flex: 1, justifyContent: "center" }}>
            {T("Cancelar", "Cancel", "Annuler", "Abbrechen", "Cancelar", "Annulla")}
          </button>
          <button onClick={handleSubmit} disabled={!allAnswered || submitted}
            style={{ ...BTN("pri"), flex: 2, justifyContent: "center", opacity: (allAnswered && !submitted) ? 1 : 0.4, cursor: (allAnswered && !submitted) ? "pointer" : "not-allowed" }}>
            {submitted ? T("Calificando…", "Grading…", "Notation en cours…", "Wird bewertet…", "Avaliando…", "Valutazione in corso…") : T("Enviar evaluación", "Submit evaluation", "Envoyer l'évaluation", "Bewertung einreichen", "Enviar avaliação", "Invia valutazione")}
          </button>
        </div>
      </div>
    </div>
  );
}
