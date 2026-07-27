import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient.js";
import { T } from "../i18n.js";
import { C, BTN } from "../ui.js";

// Bandeja de mensajería del usuario ↔ administración: lee el hilo, lo marca como
// leído y permite responder. Pantalla hoja extraída del monolito; probada en
// MensajesTab.test.jsx.
export default function MensajesTab({ onLeidos }) {
  const [msgs, setMsgs] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const scrollRef = useRef(null);

  const cargar = async () => {
    try {
      const { data } = await supabase.rpc("mis_mensajes");
      setMsgs(Array.isArray(data) ? data : []);
      await supabase.rpc("marcar_leidos_usuario");
      if (onLeidos) onLeidos();
    } catch (e) { console.error("mis_mensajes:", e); }
    setCargando(false);
  };
  useEffect(() => { cargar(); }, []);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [msgs]);

  const enviar = async () => {
    const cuerpo = texto.trim();
    if (!cuerpo) return;
    setEnviando(true);
    try {
      await supabase.rpc("responder_usuario", { p_cuerpo: cuerpo });
      setTexto("");
      await cargar();
    } catch (e) { console.error("responder_usuario:", e); }
    setEnviando(false);
  };

  return (
    <div>
      <div ref={scrollRef} style={{ maxHeight: "46vh", overflowY: "auto", padding: "4px 2px 10px",
        display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
        {cargando
          ? <p style={{ color: C.ivoryM, textAlign: "center", fontStyle: "italic" }}>{T("Cargando…", "Loading…", "Chargement…", "Laden…", "Carregando…", "Caricamento…")}</p>
          : msgs.length === 0
            ? <p style={{ color: C.ivoryM, textAlign: "center", fontStyle: "italic", padding: "20px 0" }}>
                {T("No tienes mensajes por ahora.", "You have no messages yet.", "Vous n'avez aucun message.", "Sie haben noch keine Nachrichten.", "Você ainda não tem mensagens.", "Non hai ancora messaggi.")}
              </p>
            : msgs.map((m) => {
                const admin = m.remitente === "admin";
                return (
                  <div key={m.id} style={{ display: "flex", justifyContent: admin ? "flex-start" : "flex-end" }}>
                    <div style={{ maxWidth: "78%", padding: "9px 13px", borderRadius: 12, fontSize: 14.5, lineHeight: 1.45,
                      background: admin ? C.card : `linear-gradient(135deg,${C.goldL},${C.gold})`,
                      color: admin ? C.ivory : "#0a1626",
                      border: admin ? `1px solid ${C.borderD}` : "none" }}>
                      {admin && <div style={{ fontSize: 11, color: C.gold, fontWeight: 700, marginBottom: 2 }}>Catecumen</div>}
                      {m.cuerpo}
                      <div style={{ fontSize: 10, opacity: .7, marginTop: 3 }}>{new Date(m.creado).toLocaleString()}</div>
                    </div>
                  </div>
                );
              })}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input type="text" value={texto} onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") enviar(); }}
          placeholder={T("Escribe un mensaje…", "Write a message…", "Écrivez un message…", "Nachricht schreiben…", "Escreva uma mensagem…", "Scrivi un messaggio…")}
          style={{ flex: 1, background: C.card, color: C.ivory, border: `1px solid ${C.borderD}`,
            borderRadius: 10, padding: "10px 12px", fontFamily: "'Crimson Text',serif", fontSize: 14.5, outline: "none" }} />
        <button onClick={enviar} disabled={enviando || !texto.trim()}
          style={{ ...BTN("pri"), fontSize: 13, opacity: (enviando || !texto.trim()) ? 0.5 : 1,
            cursor: (enviando || !texto.trim()) ? "default" : "pointer" }}>
          {T("Enviar", "Send", "Envoyer", "Senden", "Enviar", "Invia")}
        </button>
      </div>
    </div>
  );
}
