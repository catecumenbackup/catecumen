import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient.js";
import { ConsultarIAButton } from "./support.jsx";
import { C, BTN, MODAL, OVERLAY } from "../ui.js";
import { T, PICK } from "../i18n.js";

// Motor común de las Scholas (espacios de formación continua). `espacio`:
//   'catecumen' → formación permanente para catequistas.
//   'fidei'     → formación continua tras recibir un sacramento.
// El acceso lo decide el servidor (RPC `schola`); aquí solo se muestra el
// contenido o un aviso de acceso restringido. Recursos: video (iframe),
// documento/enlace (abren su URL).
const META = {
  catecumen: {
    icono: "🧠",
    titulo: "Schola Catecumen",
    lema: (T) => T("Formación permanente e intercambio entre catequistas", "Ongoing formation and sharing among catechists", "Formation permanente et échange entre catéchistes", "Ständige Bildung und Austausch unter Katecheten", "Formação permanente e intercâmbio entre catequistas", "Formazione permanente e scambio tra catechisti"),
    sinAcceso: (T) => T("Este espacio es exclusivo para catequistas.", "This space is exclusively for catechists.", "Cet espace est réservé aux catéchistes.", "Dieser Bereich ist ausschließlich für Katecheten.", "Este espaço é exclusivo para catequistas.", "Questo spazio è riservato ai catechisti."),
  },
  fidei: {
    icono: "✝️",
    titulo: "Schola Fidei",
    lema: (T) => T("Continúa tu formación en la fe más allá de los sacramentos", "Continue your formation in the faith beyond the sacraments", "Poursuivez votre formation dans la foi au-delà des sacrements", "Setze deine Glaubensbildung über die Sakramente hinaus fort", "Continue sua formação na fé além dos sacramentos", "Continua la tua formazione nella fede oltre i sacramenti"),
    sinAcceso: (T) => T("Este espacio se habilita cuando completas tu primera formación sacramental.", "This space unlocks once you complete your first sacramental formation.", "Cet espace se débloque une fois votre première formation sacramentelle terminée.", "Dieser Bereich wird freigeschaltet, sobald du deine erste sakramentale Ausbildung abgeschlossen hast.", "Este espaço é liberado quando você conclui sua primeira formação sacramental.", "Questo spazio si sblocca una volta completata la tua prima formazione sacramentale."),
  },
};

const pickI18n = (r, campo) => PICK({
  es: r[`${campo}_es`], en: r[`${campo}_en`], fr: r[`${campo}_fr`],
  de: r[`${campo}_de`], pt: r[`${campo}_pt`], it: r[`${campo}_it`],
});

export default function Schola({ espacio, onClose }) {
  const meta = META[espacio] || META.fidei;
  const [estado, setEstado] = useState("cargando"); // cargando | ok | sinAcceso | error
  const [recursos, setRecursos] = useState([]);
  const [video, setVideo] = useState(null); // url del iframe abierto

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const { data, error } = await supabase.rpc("schola", { p_espacio: espacio });
        if (!vivo) return;
        if (error) throw error;
        if (!data?.acceso) { setEstado("sinAcceso"); return; }
        setRecursos(Array.isArray(data.recursos) ? data.recursos : []);
        setEstado("ok");
      } catch (e) { console.error("schola:", e); if (vivo) setEstado("error"); }
    })();
    return () => { vivo = false; };
  }, [espacio]);

  // Agrupar por categoría, respetando el orden que trae la RPC.
  const grupos = [];
  recursos.forEach((r) => {
    const cat = pickI18n(r, "categoria") || T("General", "General", "Général", "Allgemein", "Geral", "Generale");
    let g = grupos.find((x) => x.cat === cat);
    if (!g) { g = { cat, items: [] }; grupos.push(g); }
    g.items.push(r);
  });

  const iconoTipo = { video: "▶️", documento: "📄", enlace: "🔗" };

  return (
    <div style={OVERLAY} onClick={onClose}>
      <div className="catePanel" onClick={(e) => e.stopPropagation()}
        style={{ ...MODAL, maxWidth: 720, width: "min(720px,96vw)", display: "flex", flexDirection: "column", maxHeight: "90vh", padding: 0, overflow: "hidden" }}>
        {/* Encabezado */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "16px 20px", borderBottom: `1px solid ${C.gold}25` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 24 }}>{meta.icono}</span>
            <div>
              <h2 style={{ fontFamily: "'Cinzel',serif", color: C.gold, fontSize: 17, margin: 0 }}>{meta.titulo}</h2>
              <p style={{ color: C.ivoryM, fontSize: 11.5, margin: 0 }}>{meta.lema(T)}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ ...BTN("sec"), fontSize: 12, padding: "6px 12px" }}>✕</button>
        </div>

        {/* Cuerpo */}
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 20px" }}>
          {estado === "cargando" && <p style={{ color: C.ivoryM, textAlign: "center", fontStyle: "italic" }}>{T("Cargando…", "Loading…", "Chargement…", "Laden…", "Carregando…", "Caricamento…")}</p>}

          {estado === "error" && <p style={{ color: "#F87171", textAlign: "center" }}>⚠️ {T("No se pudo cargar. Intenta de nuevo.", "Could not load. Please try again.", "Impossible de charger. Réessayez.", "Laden fehlgeschlagen. Bitte erneut versuchen.", "Não foi possível carregar. Tente novamente.", "Impossibile caricare. Riprova.")}</p>}

          {estado === "sinAcceso" && (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🔒</div>
              <p style={{ color: C.ivory, fontFamily: "'Crimson Text',serif", fontSize: 16, lineHeight: 1.6 }}>{meta.sinAcceso(T)}</p>
            </div>
          )}

          {estado === "ok" && recursos.length === 0 && (
            <p style={{ color: C.ivoryM, textAlign: "center", fontStyle: "italic", padding: "24px 0" }}>
              {T("Pronto encontrarás aquí recursos de formación.", "Formation resources will appear here soon.", "Des ressources de formation apparaîtront bientôt ici.", "Bald findest du hier Bildungsressourcen.", "Em breve você encontrará recursos de formação aqui.", "Presto troverai qui risorse di formazione.")}
            </p>
          )}

          {estado === "ok" && grupos.map((g, gi) => (
            <div key={gi} style={{ marginBottom: 22 }}>
              <h3 style={{ fontFamily: "'Cinzel',serif", color: C.gold, fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase", borderBottom: `1px solid ${C.gold}25`, paddingBottom: 6, marginBottom: 12 }}>{g.cat}</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {g.items.map((r) => {
                  const titulo = pickI18n(r, "titulo");
                  const desc = pickI18n(r, "descripcion");
                  const abrir = () => { if (r.tipo === "video") setVideo(r.url); else window.open(r.url, "_blank", "noopener"); };
                  return (
                    <div key={r.id} style={{ background: "rgba(200,169,81,0.05)", border: `1px solid ${C.borderD}`, borderRadius: 12, padding: "12px 14px", display: "flex", gap: 12, alignItems: "center" }}>
                      <span style={{ fontSize: 22, flexShrink: 0 }}>{iconoTipo[r.tipo] || "📌"}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ color: C.ivory, fontFamily: "'Crimson Text',serif", fontSize: 15.5, fontWeight: 600, margin: 0 }}>{titulo}</p>
                        {desc && <p style={{ color: C.ivoryM, fontSize: 13, margin: "3px 0 0" }}>{desc}</p>}
                      </div>
                      <button onClick={abrir} style={{ ...BTN("sec"), fontSize: 12, padding: "8px 14px", flexShrink: 0 }}>
                        {r.tipo === "video" ? T("Ver", "Watch", "Voir", "Ansehen", "Ver", "Guarda") : T("Abrir", "Open", "Ouvrir", "Öffnen", "Abrir", "Apri")} →
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Compañero de estudio: Magisterium AI (sobre todo en Schola Fidei) */}
        {estado === "ok" && (
          <div style={{ padding: "12px 20px", borderTop: `1px solid ${C.gold}18`, display: "flex", justifyContent: "center" }}>
            <ConsultarIAButton contexto={"Schola — " + espacio} />
          </div>
        )}
      </div>

      {/* Reproductor de video (iframe embebido, p. ej. Bunny Stream) */}
      {video && (
        <div style={{ ...OVERLAY, zIndex: 3100 }} onClick={(e) => { e.stopPropagation(); setVideo(null); }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "min(900px,96vw)", aspectRatio: "16/9", background: "#000", borderRadius: 12, overflow: "hidden", position: "relative" }}>
            <iframe src={video} title="video" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen
              style={{ width: "100%", height: "100%", border: 0 }} />
            <button onClick={() => setVideo(null)} style={{ position: "absolute", top: 8, right: 8, ...BTN("sec"), fontSize: 12, padding: "6px 12px" }}>✕</button>
          </div>
        </div>
      )}
    </div>
  );
}
