import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient.js";
import { C, BTN } from "../ui.js";
import { T } from "../i18n.js";

// Comunidad/foro de una Schola: lista de hilos, ver hilo con respuestas, crear
// tema y responder. El acceso lo gatean las RPCs (schola_acceso) del servidor.
export default function ScholaComunidad({ espacio }) {
  const [vista, setVista] = useState("lista");   // lista | hilo | nuevo
  const [hilos, setHilos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [hiloId, setHiloId] = useState(null);
  const [hiloData, setHiloData] = useState(null); // {hilo, posts}
  const [titulo, setTitulo] = useState("");
  const [cuerpo, setCuerpo] = useState("");
  const [respuesta, setRespuesta] = useState("");
  const [enviando, setEnviando] = useState(false);
  const finRef = useRef(null);

  const cargarHilos = async () => {
    setCargando(true);
    try {
      const { data } = await supabase.rpc("schola_listar_hilos", { p_espacio: espacio });
      setHilos(Array.isArray(data?.hilos) ? data.hilos : []);
    } catch (e) { console.error("schola_listar_hilos:", e); }
    setCargando(false);
  };
  useEffect(() => { cargarHilos(); }, [espacio]);

  const abrirHilo = async (id) => {
    setHiloId(id); setVista("hilo"); setHiloData(null);
    try {
      const { data } = await supabase.rpc("schola_ver_hilo", { p_hilo: id });
      if (data?.acceso) setHiloData(data);
    } catch (e) { console.error("schola_ver_hilo:", e); }
  };
  useEffect(() => { if (finRef.current) finRef.current.scrollIntoView({ behavior: "smooth" }); }, [hiloData]);

  const crearHilo = async () => {
    if (!titulo.trim() || !cuerpo.trim() || enviando) return;
    setEnviando(true);
    try {
      const { data } = await supabase.rpc("schola_crear_hilo", { p_espacio: espacio, p_titulo: titulo, p_cuerpo: cuerpo });
      if (data?.ok) { setTitulo(""); setCuerpo(""); await cargarHilos(); if (data.id) abrirHilo(data.id); else setVista("lista"); }
    } catch (e) { console.error("schola_crear_hilo:", e); }
    setEnviando(false);
  };

  const responder = async () => {
    if (!respuesta.trim() || enviando) return;
    setEnviando(true);
    try {
      const { data } = await supabase.rpc("schola_responder", { p_hilo: hiloId, p_cuerpo: respuesta });
      if (data?.ok) { setRespuesta(""); await abrirHilo(hiloId); cargarHilos(); }
    } catch (e) { console.error("schola_responder:", e); }
    setEnviando(false);
  };

  const fecha = (d) => (d ? new Date(d).toLocaleDateString() : "");

  // ── Vista: nuevo tema ──
  if (vista === "nuevo") {
    return (
      <div>
        <button onClick={() => setVista("lista")} style={{ ...BTN("sec"), fontSize: 12, marginBottom: 14 }}>← {T("Volver", "Back", "Retour", "Zurück", "Voltar", "Indietro")}</button>
        <input value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={200}
          placeholder={T("Título del tema", "Topic title", "Titre du sujet", "Titel des Themas", "Título do tema", "Titolo dell'argomento")}
          style={{ width: "100%", boxSizing: "border-box", background: C.card, color: C.ivory, border: `1px solid ${C.borderD}`, borderRadius: 10, padding: "10px 12px", fontFamily: "'Crimson Text',serif", fontSize: 15, marginBottom: 10, outline: "none" }} />
        <textarea value={cuerpo} onChange={(e) => setCuerpo(e.target.value)} rows={5} maxLength={5000}
          placeholder={T("Escribe tu mensaje…", "Write your message…", "Écrivez votre message…", "Schreibe deine Nachricht…", "Escreva sua mensagem…", "Scrivi il tuo messaggio…")}
          style={{ width: "100%", boxSizing: "border-box", resize: "vertical", background: C.card, color: C.ivory, border: `1px solid ${C.borderD}`, borderRadius: 10, padding: "10px 12px", fontFamily: "'Crimson Text',serif", fontSize: 15, outline: "none" }} />
        <button onClick={crearHilo} disabled={enviando || !titulo.trim() || !cuerpo.trim()}
          style={{ ...BTN("pri"), width: "100%", justifyContent: "center", marginTop: 12, opacity: (enviando || !titulo.trim() || !cuerpo.trim()) ? 0.5 : 1 }}>
          {enviando ? T("Publicando…", "Posting…", "Publication…", "Wird veröffentlicht…", "Publicando…", "Pubblicazione…") : T("Publicar tema", "Post topic", "Publier le sujet", "Thema veröffentlichen", "Publicar tema", "Pubblica argomento")}
        </button>
      </div>
    );
  }

  // ── Vista: hilo ──
  if (vista === "hilo") {
    return (
      <div>
        <button onClick={() => { setVista("lista"); setHiloId(null); }} style={{ ...BTN("sec"), fontSize: 12, marginBottom: 14 }}>← {T("Volver a los temas", "Back to topics", "Retour aux sujets", "Zurück zu den Themen", "Voltar aos temas", "Torna agli argomenti")}</button>
        {!hiloData ? <p style={{ color: C.ivoryM, textAlign: "center", fontStyle: "italic" }}>{T("Cargando…", "Loading…", "Chargement…", "Laden…", "Carregando…", "Caricamento…")}</p> : (
          <>
            <h3 style={{ fontFamily: "'Cinzel',serif", color: C.gold, fontSize: 16, marginBottom: 12 }}>{hiloData.hilo?.titulo}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
              {(hiloData.posts || []).map((p) => (
                <div key={p.id} style={{ background: "rgba(200,169,81,0.05)", border: `1px solid ${C.borderD}`, borderRadius: 12, padding: "10px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                    <span style={{ color: C.gold, fontFamily: "'Cinzel',serif", fontSize: 12 }}>{p.autor_nombre || T("Miembro", "Member", "Membre", "Mitglied", "Membro", "Membro")}</span>
                    <span style={{ color: C.ivoryM, fontSize: 11 }}>{fecha(p.creado)}</span>
                  </div>
                  <p style={{ color: C.ivory, fontFamily: "'Crimson Text',serif", fontSize: 15, lineHeight: 1.55, margin: 0, whiteSpace: "pre-wrap" }}>{p.cuerpo}</p>
                </div>
              ))}
              <div ref={finRef} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={respuesta} onChange={(e) => setRespuesta(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") responder(); }}
                placeholder={T("Escribe una respuesta…", "Write a reply…", "Écrire une réponse…", "Antwort schreiben…", "Escreva uma resposta…", "Scrivi una risposta…")}
                style={{ flex: 1, background: C.card, color: C.ivory, border: `1px solid ${C.borderD}`, borderRadius: 10, padding: "10px 12px", fontFamily: "'Crimson Text',serif", fontSize: 14.5, outline: "none" }} />
              <button onClick={responder} disabled={enviando || !respuesta.trim()} style={{ ...BTN("pri"), fontSize: 13, opacity: (enviando || !respuesta.trim()) ? 0.5 : 1 }}>{T("Responder", "Reply", "Répondre", "Antworten", "Responder", "Rispondi")}</button>
            </div>
          </>
        )}
      </div>
    );
  }

  // ── Vista: lista de temas ──
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, gap: 8, flexWrap: "wrap" }}>
        <p style={{ color: C.ivoryM, fontFamily: "'Crimson Text',serif", fontSize: 14, margin: 0 }}>
          {T("Comparte y aprende con los demás miembros.", "Share and learn with other members.", "Partagez et apprenez avec les autres membres.", "Teile und lerne mit anderen Mitgliedern.", "Compartilhe e aprenda com outros membros.", "Condividi e impara con gli altri membri.")}
        </p>
        <button onClick={() => setVista("nuevo")} style={{ ...BTN("pri"), fontSize: 12 }}>✍️ {T("Nuevo tema", "New topic", "Nouveau sujet", "Neues Thema", "Novo tema", "Nuovo argomento")}</button>
      </div>
      {cargando ? <p style={{ color: C.ivoryM, textAlign: "center", fontStyle: "italic" }}>{T("Cargando…", "Loading…", "Chargement…", "Laden…", "Carregando…", "Caricamento…")}</p>
        : hilos.length === 0 ? <p style={{ color: C.ivoryM, textAlign: "center", fontStyle: "italic", padding: "20px 0" }}>{T("Aún no hay temas. ¡Crea el primero!", "No topics yet. Start the first one!", "Aucun sujet pour l'instant. Lancez le premier !", "Noch keine Themen. Starte das erste!", "Ainda não há temas. Crie o primeiro!", "Ancora nessun argomento. Crea il primo!")}</p>
          : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {hilos.map((h) => (
                <button key={h.id} onClick={() => abrirHilo(h.id)}
                  style={{ textAlign: "left", background: "rgba(200,169,81,0.05)", border: `1px solid ${C.borderD}`, borderRadius: 12, padding: "12px 14px", cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ color: C.ivory, fontFamily: "'Cinzel',serif", fontSize: 14.5 }}>{h.fijado ? "📌 " : ""}{h.titulo}</span>
                    <span style={{ color: C.gold, fontSize: 12, flexShrink: 0 }}>💬 {h.respuestas}</span>
                  </div>
                  <span style={{ color: C.ivoryM, fontSize: 12 }}>{h.autor_nombre || ""} · {fecha(h.actualizado)}</span>
                </button>
              ))}
            </div>
          )}
    </div>
  );
}
