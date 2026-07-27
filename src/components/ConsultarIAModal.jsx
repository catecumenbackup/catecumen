import { useState, useRef, useEffect } from "react";
import { supabase } from "../supabaseClient.js";
import { C, BTN, MODAL, OVERLAY } from "../ui.js";
import { T, LANG } from "../i18n.js";

// Chat con Magisterium AI (vía edge function `consultar-magisterium`, que oculta
// la API key). Muestra respuesta + citas de fuentes + preguntas relacionadas.
// Contenido de IA: se incluye un aviso de verificación con el catequista.
export default function ConsultarIAModal({ onClose, contexto = "" }) {
  const [msgs, setMsgs] = useState([]);      // {role, content, citations?, related?}
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, loading]);

  const sugerencias = [
    T("¿Qué es la gracia santificante?", "What is sanctifying grace?", "Qu'est-ce que la grâce sanctifiante ?", "Was ist die heiligmachende Gnade?", "O que é a graça santificante?", "Cos'è la grazia santificante?"),
    T("Explícame el Kerigma", "Explain the Kerygma to me", "Explique-moi le Kérygme", "Erkläre mir das Kerygma", "Explique-me o Querigma", "Spiegami il Kerygma"),
    T("¿Por qué es importante el Bautismo?", "Why is Baptism important?", "Pourquoi le Baptême est-il important ?", "Warum ist die Taufe wichtig?", "Por que o Batismo é importante?", "Perché è importante il Battesimo?"),
  ];

  const enviar = async (texto) => {
    const q = (texto ?? input).trim();
    if (!q || loading) return;
    setErr("");
    const nuevos = [...msgs, { role: "user", content: q }];
    setMsgs(nuevos);
    setInput("");
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("consultar-magisterium", {
        body: { messages: nuevos.map((m) => ({ role: m.role, content: m.content })), lang: LANG },
      });
      if (error || !data || data.error) throw new Error(data?.error || error?.message || "error");
      setMsgs((prev) => [...prev, {
        role: "assistant",
        content: data.content || "",
        citations: Array.isArray(data.citations) ? data.citations : [],
        related: Array.isArray(data.related_questions) ? data.related_questions : [],
      }]);
    } catch (e) {
      setErr(T(
        "No se pudo obtener respuesta. Intenta de nuevo en un momento.",
        "Could not get a response. Please try again shortly.",
        "Impossible d'obtenir une réponse. Réessayez dans un instant.",
        "Es konnte keine Antwort abgerufen werden. Bitte versuchen Sie es gleich erneut.",
        "Não foi possível obter resposta. Tente novamente em instantes.",
        "Impossibile ottenere una risposta. Riprova tra poco.",
      ));
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); } };

  return (
    <div style={OVERLAY} onClick={onClose}>
      <div className="catePanel" onClick={(e) => e.stopPropagation()}
        style={{ ...MODAL, maxWidth: 640, width: "min(640px, 96vw)", display: "flex", flexDirection: "column", maxHeight: "88vh", padding: 0, overflow: "hidden" }}>
        {/* Encabezado */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "16px 20px", borderBottom: `1px solid ${C.gold}25` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>✨</span>
            <div style={{ textAlign: "left" }}>
              <h2 style={{ fontFamily: "'Cinzel',serif", color: C.gold, fontSize: 16, margin: 0 }}>
                {T("Consultar con Magisterium AI", "Ask Magisterium AI", "Consulter Magisterium AI", "Magisterium AI fragen", "Consultar o Magisterium AI", "Consulta Magisterium AI")}
              </h2>
              <p style={{ color: C.ivoryM, fontSize: 11.5, margin: 0 }}>
                {T("Respuestas fieles al Magisterio de la Iglesia", "Answers faithful to the Church's Magisterium", "Réponses fidèles au Magistère de l'Église", "Antworten treu zum Lehramt der Kirche", "Respostas fiéis ao Magistério da Igreja", "Risposte fedeli al Magistero della Chiesa")}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ ...BTN("sec"), fontSize: 12, padding: "6px 12px" }}>✕</button>
        </div>

        {/* Conversación */}
        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14, minHeight: 240 }}>
          {msgs.length === 0 && !loading && (
            <div style={{ margin: "auto 0", textAlign: "center" }}>
              <p style={{ color: C.ivoryM, fontFamily: "'Crimson Text',serif", fontSize: 15, marginBottom: 14 }}>
                {T("Pregunta lo que quieras sobre la fe católica.", "Ask anything about the Catholic faith.", "Posez toute question sur la foi catholique.", "Frag alles über den katholischen Glauben.", "Pergunte o que quiser sobre a fé católica.", "Chiedi qualsiasi cosa sulla fede cattolica.")}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {sugerencias.map((s, i) => (
                  <button key={i} onClick={() => enviar(s)}
                    style={{ ...BTN("sec"), fontSize: 13, justifyContent: "flex-start", textAlign: "left" }}>
                    💬 {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {msgs.map((m, i) => (
            <div key={i} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "88%" }}>
              <div style={{
                background: m.role === "user" ? "rgba(200,169,81,0.16)" : C.card,
                border: `1px solid ${m.role === "user" ? C.gold + "40" : C.borderD}`,
                borderRadius: 14, padding: "10px 14px",
                color: C.ivory, fontFamily: "'Crimson Text',serif", fontSize: 15, lineHeight: 1.6,
                whiteSpace: "pre-wrap", wordBreak: "break-word",
              }}>
                {m.content}
              </div>

              {/* Citas de fuentes */}
              {m.role === "assistant" && m.citations?.length > 0 && (
                <details style={{ marginTop: 6 }}>
                  <summary style={{ cursor: "pointer", color: C.gold, fontFamily: "'Cinzel',serif", fontSize: 11, letterSpacing: "0.05em" }}>
                    📚 {T("Fuentes", "Sources", "Sources", "Quellen", "Fontes", "Fonti")} ({m.citations.length})
                  </summary>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
                    {m.citations.map((c, ci) => {
                      const titulo = c?.document_title || c?.title || c?.document?.title || T("Fuente", "Source", "Source", "Quelle", "Fonte", "Fonte");
                      const ref = c?.document_reference || c?.reference || c?.document?.reference || "";
                      const url = c?.source_url || c?.url || c?.document?.url || "";
                      const cita = c?.cited_text || c?.text || "";
                      return (
                        <div key={ci} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${C.borderD}`, borderRadius: 8, padding: "8px 10px" }}>
                          <p style={{ color: C.gold, fontSize: 12.5, margin: 0, fontWeight: 600 }}>
                            {url ? <a href={url} target="_blank" rel="noreferrer" style={{ color: C.gold }}>{titulo} ↗</a> : titulo}
                            {ref ? <span style={{ color: C.ivoryM, fontWeight: 400 }}> — {ref}</span> : null}
                          </p>
                          {cita && <p style={{ color: C.ivoryM, fontSize: 12.5, margin: "4px 0 0", fontStyle: "italic" }}>"{cita}"</p>}
                        </div>
                      );
                    })}
                  </div>
                </details>
              )}

              {/* Preguntas relacionadas */}
              {m.role === "assistant" && m.related?.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                  {m.related.slice(0, 4).map((rq, ri) => {
                    const texto = typeof rq === "string" ? rq : (rq?.question || rq?.text || "");
                    if (!texto) return null;
                    return (
                      <button key={ri} onClick={() => enviar(texto)}
                        style={{ background: "transparent", border: `1px solid ${C.gold}55`, color: C.gold, borderRadius: 99, padding: "5px 12px", fontSize: 12, cursor: "pointer", fontFamily: "'Crimson Text',serif" }}>
                        {texto}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div style={{ alignSelf: "flex-start", color: C.ivoryM, fontFamily: "'Crimson Text',serif", fontSize: 14 }}>
              ✨ {T("Consultando las fuentes…", "Consulting the sources…", "Consultation des sources…", "Quellen werden geprüft…", "Consultando as fontes…", "Consultazione delle fonti…")}
            </div>
          )}
          {err && <p style={{ color: "#F87171", fontSize: 13, textAlign: "center" }}>⚠️ {err}</p>}
        </div>

        {/* Entrada */}
        <div style={{ padding: "12px 16px", borderTop: `1px solid ${C.gold}25` }}>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKey} rows={1}
              placeholder={T("Escribe tu pregunta…", "Type your question…", "Écrivez votre question…", "Schreiben Sie Ihre Frage…", "Escreva sua pergunta…", "Scrivi la tua domanda…")}
              style={{ flex: 1, resize: "none", maxHeight: 120, background: C.card, color: C.ivory, border: `1px solid ${C.borderD}`, borderRadius: 12, padding: "10px 12px", fontFamily: "'Crimson Text',serif", fontSize: 15, outline: "none" }} />
            <button onClick={() => enviar()} disabled={loading || !input.trim()}
              style={{ ...BTN("pri"), padding: "10px 18px", opacity: (loading || !input.trim()) ? 0.5 : 1, cursor: (loading || !input.trim()) ? "default" : "pointer" }}>
              {T("Enviar", "Send", "Envoyer", "Senden", "Enviar", "Invia")} →
            </button>
          </div>
          <p style={{ color: C.ivoryM, fontSize: 11, textAlign: "center", margin: "8px 0 0", lineHeight: 1.5 }}>
            {T("Respuestas generadas por Magisterium AI. Pueden contener errores; verifica con tu catequista.", "Answers generated by Magisterium AI. They may contain errors; verify with your catechist.", "Réponses générées par Magisterium AI. Elles peuvent contenir des erreurs ; vérifiez avec votre catéchiste.", "Von Magisterium AI generierte Antworten. Sie können Fehler enthalten; prüfen Sie mit Ihrem Katecheten.", "Respostas geradas pelo Magisterium AI. Podem conter erros; verifique com seu catequista.", "Risposte generate da Magisterium AI. Possono contenere errori; verifica con il tuo catechista.")}
          </p>
        </div>
      </div>
    </div>
  );
}
