import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient.js";
import { LANG, T } from "../i18n.js";
import { C, BTN, INP } from "../ui.js";

// Agenda del usuario: sesiones programadas por el administrador, con confirmar
// asistencia o avisar inasistencia (con motivo). Pantalla hoja extraída del
// monolito; probada en AgendaTab.test.jsx.
export default function AgendaTab() {
  const [sesiones, setSesiones] = useState(null);
  const [justif, setJustif] = useState({});     // {sesionId: texto}
  const [abierta, setAbierta] = useState(null);  // sesionId con el campo abierto
  const [enviando, setEnviando] = useState(false);

  const cargar = async () => {
    try {
      const { data } = await supabase.rpc("mi_agenda");
      setSesiones(Array.isArray(data) ? data : []);
    } catch (e) { console.error("mi_agenda:", e); setSesiones([]); }
  };
  useEffect(() => { cargar(); }, []);

  const responder = async (sesionId, estado, justificacion) => {
    setEnviando(true);
    try {
      await supabase.rpc("responder_asistencia", { p_sesion_id: sesionId, p_estado: estado, p_justificacion: justificacion || null });
      setAbierta(null); setJustif((p) => ({ ...p, [sesionId]: "" }));
      await cargar();
    } catch (e) { console.error("responder_asistencia:", e); }
    setEnviando(false);
  };

  const fmt = (iso) => { try { return new Date(iso).toLocaleString(LANG === "en" ? "en-US" : LANG + "-" + LANG.toUpperCase(), { dateStyle: "full", timeStyle: "short" }); } catch { return iso; } };

  if (sesiones === null) return <div style={{ color: C.ivoryM, padding: 20, textAlign: "center" }}>{T("Cargando…", "Loading…", "Chargement…", "Wird geladen…", "Carregando…", "Caricamento…")}</div>;
  if (!sesiones.length) return <div style={{ color: C.ivoryM, padding: 24, textAlign: "center", fontFamily: "'Crimson Text',serif" }}>{T("No tienes sesiones programadas por ahora.", "You have no scheduled sessions for now.", "Vous n'avez aucune session programmée pour l'instant.", "Du hast derzeit keine geplanten Sitzungen.", "Você não tem sessões agendadas por enquanto.", "Non hai sessioni programmate al momento.")}</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {sesiones.map((s) => {
        const inicio = new Date(s.inicio);
        const proxima = inicio > new Date();
        const pronto = proxima && (inicio - new Date()) < 24 * 3600 * 1000; // dentro de 24h
        return (
          <div key={s.id} style={{ background: C.card, border: `1px solid ${pronto ? C.gold : C.borderD}`, borderRadius: 14, padding: 16 }}>
            {pronto && <div style={{ color: C.gold, fontSize: 12, fontWeight: 700, marginBottom: 6, fontFamily: "'Cinzel',serif" }}>⏰ {T("Próximamente", "Coming up", "Bientôt", "Demnächst", "Em breve", "A breve")}</div>}
            <div style={{ fontFamily: "'Cinzel',serif", color: C.ivory, fontSize: 16, marginBottom: 4 }}>{s.titulo}</div>
            {s.descripcion && <div style={{ color: C.ivoryM, fontSize: 13, marginBottom: 6, fontFamily: "'Crimson Text',serif" }}>{s.descripcion}</div>}
            <div style={{ color: C.goldL, fontSize: 13, marginBottom: 10 }}>🗓 {fmt(s.inicio)} · {s.duracion_min || 60} min</div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              {s.enlace && (
                <a href={s.enlace} target="_blank" rel="noopener noreferrer"
                  style={{ ...BTN("pri"), fontSize: 12, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
                  🔗 {T("Unirse a la reunión", "Join the meeting", "Rejoindre la réunion", "Meeting beitreten", "Entrar na reunião", "Partecipa alla riunione")}
                </a>
              )}
              {s.mi_estado === "confirmada"
                ? <span style={{ color: "#7ED957", fontSize: 13, fontWeight: 700 }}>✓ {T("Asistencia confirmada", "Attendance confirmed", "Présence confirmée", "Teilnahme bestätigt", "Presença confirmada", "Presenza confermata")}</span>
                : s.mi_estado === "no_asiste"
                ? <span style={{ color: "#E5875A", fontSize: 13, fontWeight: 700 }}>✕ {T("Marcaste inasistencia", "You marked non-attendance", "Absence signalée", "Abwesenheit gemeldet", "Ausência marcada", "Assenza segnalata")}</span>
                : proxima && (
                  <>
                    <button onClick={() => responder(s.id, "confirmada")} disabled={enviando}
                      style={{ ...BTN("sec"), fontSize: 12 }}>✓ {T("Confirmar asistencia", "Confirm attendance", "Confirmer", "Bestätigen", "Confirmar", "Conferma")}</button>
                    <button onClick={() => setAbierta(abierta === s.id ? null : s.id)} disabled={enviando}
                      style={{ ...BTN("sec"), fontSize: 12 }}>✕ {T("No podré asistir", "Can't attend", "Absent", "Kann nicht", "Não poderei", "Non posso")}</button>
                  </>
                )}
            </div>

            {abierta === s.id && (
              <div style={{ marginTop: 10 }}>
                <textarea value={justif[s.id] || ""} onChange={(e) => setJustif((p) => ({ ...p, [s.id]: e.target.value }))}
                  placeholder={T("Motivo de tu inasistencia (se enviará al administrador)", "Reason for your absence (will be sent to the administrator)", "Motif de votre absence (envoyé à l'administrateur)", "Grund für deine Abwesenheit (wird an den Administrator gesendet)", "Motivo da sua ausência (será enviado ao administrador)", "Motivo della tua assenza (verrà inviato all'amministratore)")}
                  style={{ ...INP, minHeight: 70, resize: "vertical" }} />
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button onClick={() => responder(s.id, "no_asiste", justif[s.id])} disabled={enviando || !(justif[s.id] || "").trim()}
                    style={{ ...BTN("pri"), fontSize: 12 }}>{T("Enviar aviso", "Send notice", "Envoyer", "Senden", "Enviar aviso", "Invia")}</button>
                  <button onClick={() => setAbierta(null)} style={{ ...BTN("sec"), fontSize: 12 }}>{T("Cancelar", "Cancel", "Annuler", "Abbrechen", "Cancelar", "Annulla")}</button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
