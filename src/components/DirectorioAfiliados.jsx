import { useState, useRef, useEffect } from "react";
import { supabase } from "../supabaseClient.js";
import { COUNTRIES, MX_ESTADOS } from "../data/countries.js";
import { C, BTN, MODAL, OVERLAY } from "../ui.js";
import { T } from "../i18n.js";

// Buscador PÚBLICO de parroquias y diócesis afiliadas: por cercanía (geolocalización)
// o por texto, con mapa Leaflet + OpenStreetMap (gratis, sin API key). Consume las
// RPCs buscar_afiliados_cercanos / buscar_afiliados_texto (accesibles para anon).
// Leaflet se carga por CDN bajo demanda (no engorda el bundle).
let leafletPromise = null;
function cargarLeaflet() {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
  if (window.L) return Promise.resolve(window.L);
  if (!document.getElementById("leaflet-css")) {
    const l = document.createElement("link");
    l.id = "leaflet-css"; l.rel = "stylesheet";
    l.href = "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(l);
  }
  if (leafletPromise) return leafletPromise;
  leafletPromise = new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js";
    s.onload = () => res(window.L); s.onerror = () => rej(new Error("leaflet"));
    document.head.appendChild(s);
  });
  return leafletPromise;
}

export default function DirectorioAfiliados({ onClose }) {
  const [q, setQ] = useState("");
  const [tipo, setTipo] = useState(null);      // null | 'parroquia' | 'diocesis'
  const [pais, setPais] = useState("");        // país seleccionado ('' = todos)
  const [estado, setEstado] = useState("");    // estado (solo México)
  const [municipio, setMunicipio] = useState(""); // municipio (solo México, texto)
  const esMexico = pais === "México";
  const selStyle = { background: C.card, color: C.ivory, border: `1px solid ${C.borderD}`, borderRadius: 10, padding: "8px 10px", fontFamily: "'Crimson Text',serif", fontSize: 13.5, outline: "none" };
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [err, setErr] = useState("");
  const [buscado, setBuscado] = useState(false);
  const mapDiv = useRef(null), mapRef = useRef(null), layerRef = useRef(null);

  // Mapa: crea/actualiza marcadores cuando cambian los resultados.
  useEffect(() => {
    let cancel = false;
    cargarLeaflet().then((L) => {
      if (cancel || !mapDiv.current) return;
      if (!mapRef.current) {
        mapRef.current = L.map(mapDiv.current, { scrollWheelZoom: false }).setView([14, -80], 3);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          { attribution: "© OpenStreetMap", maxZoom: 18 }).addTo(mapRef.current);
        layerRef.current = L.layerGroup().addTo(mapRef.current);
      }
      const lay = layerRef.current; lay.clearLayers();
      const pts = [];
      resultados.forEach((r) => {
        if (r.lat == null || r.lng == null) return;
        const et = r.tipo === "diocesis"
          ? T("Diócesis", "Diocese", "Diocèse", "Diözese", "Diocese", "Diocesi")
          : T("Parroquia", "Parish", "Paroisse", "Pfarrei", "Paróquia", "Parrocchia");
        lay.addLayer(L.marker([r.lat, r.lng]).bindPopup(`<b>${r.nombre}</b><br>${et}<br>${r.direccion || ""}`));
        pts.push([r.lat, r.lng]);
      });
      if (pts.length) mapRef.current.fitBounds(pts, { padding: [30, 30], maxZoom: 12 });
      setTimeout(() => mapRef.current && mapRef.current.invalidateSize(), 120);
    }).catch(() => {});
    return () => { cancel = true; };
  }, [resultados]);

  useEffect(() => () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } }, []);

  const buscarCerca = () => {
    setErr("");
    if (!navigator.geolocation) {
      setErr(T("Tu navegador no permite geolocalización. Busca por nombre o ciudad.", "Your browser doesn't support geolocation. Search by name or city.", "Votre navigateur ne prend pas en charge la géolocalisation. Recherchez par nom ou ville.", "Ihr Browser unterstützt keine Geolokalisierung. Suchen Sie nach Name oder Stadt.", "Seu navegador não suporta geolocalização. Busque por nome ou cidade.", "Il tuo browser non supporta la geolocalizzazione. Cerca per nome o città."));
      return;
    }
    setCargando(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const { data, error } = await supabase.rpc("buscar_afiliados_cercanos",
          { p_lat: pos.coords.latitude, p_lng: pos.coords.longitude, p_tipo: tipo });
        if (error) throw error;
        setResultados(Array.isArray(data) ? data : []); setBuscado(true);
      } catch { setErr(errBusqueda()); } finally { setCargando(false); }
    }, () => {
      setCargando(false);
      setErr(T("No pudimos obtener tu ubicación. Búscala por nombre o ciudad.", "We couldn't get your location. Search by name or city.", "Nous n'avons pas pu obtenir votre position. Recherchez par nom ou ville.", "Wir konnten Ihren Standort nicht ermitteln. Suchen Sie nach Name oder Stadt.", "Não conseguimos obter sua localização. Busque por nome ou cidade.", "Non è stato possibile ottenere la tua posizione. Cerca per nome o città."));
    }, { timeout: 10000 });
  };

  const buscarTexto = async () => {
    setErr(""); setCargando(true);
    try {
      const { data, error } = await supabase.rpc("buscar_afiliados_texto", {
        p_q: q, p_tipo: tipo, p_pais: pais || null,
        p_estado: esMexico ? (estado || null) : null,
        p_municipio: esMexico ? (municipio || null) : null,
      });
      if (error) throw error;
      setResultados(Array.isArray(data) ? data : []); setBuscado(true);
    } catch { setErr(errBusqueda()); } finally { setCargando(false); }
  };
  const errBusqueda = () => T("No se pudo completar la búsqueda. Intenta de nuevo.", "The search could not be completed. Please try again.", "La recherche n'a pas pu aboutir. Réessayez.", "Die Suche konnte nicht abgeschlossen werden. Bitte erneut versuchen.", "Não foi possível concluir a busca. Tente novamente.", "Impossibile completare la ricerca. Riprova.");

  const filtros = [
    { k: null, lbl: T("Todas", "All", "Toutes", "Alle", "Todas", "Tutte") },
    { k: "parroquia", lbl: T("Parroquias", "Parishes", "Paroisses", "Pfarreien", "Paróquias", "Parrocchie") },
    { k: "diocesis", lbl: T("Diócesis", "Dioceses", "Diocèses", "Diözesen", "Dioceses", "Diocesi") },
  ];

  return (
    <div style={OVERLAY} onClick={onClose}>
      <div className="catePanel" onClick={(e) => e.stopPropagation()}
        style={{ ...MODAL, maxWidth: 760, width: "min(760px,96vw)", display: "flex", flexDirection: "column", maxHeight: "90vh", padding: 0, overflow: "hidden" }}>
        {/* Encabezado */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "16px 20px", borderBottom: `1px solid ${C.gold}25` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>⛪</span>
            <h2 style={{ fontFamily: "'Cinzel',serif", color: C.gold, fontSize: 16, margin: 0 }}>
              {T("Encuentra una parroquia o diócesis afiliada", "Find an affiliated parish or diocese", "Trouvez une paroisse ou un diocèse affilié", "Finde eine angeschlossene Pfarrei oder Diözese", "Encontre uma paróquia ou diocese afiliada", "Trova una parrocchia o diocesi affiliata")}
            </h2>
          </div>
          <button onClick={onClose} style={{ ...BTN("sec"), fontSize: 12, padding: "6px 12px" }}>✕</button>
        </div>

        {/* Controles */}
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.gold}18`, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") buscarTexto(); }}
              placeholder={T("Nombre, ciudad o país…", "Name, city or country…", "Nom, ville ou pays…", "Name, Stadt oder Land…", "Nome, cidade ou país…", "Nome, città o paese…")}
              style={{ flex: 1, background: C.card, color: C.ivory, border: `1px solid ${C.borderD}`, borderRadius: 10, padding: "10px 12px", fontFamily: "'Crimson Text',serif", fontSize: 14.5, outline: "none" }} />
            <button onClick={buscarTexto} disabled={cargando} style={{ ...BTN("pri"), fontSize: 12, padding: "8px 14px" }}>
              🔍 {T("Buscar", "Search", "Chercher", "Suchen", "Buscar", "Cerca")}
            </button>
          </div>
          {/* País (y, para México, estado + municipio) */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <select value={pais} onChange={(e) => { setPais(e.target.value); setEstado(""); setMunicipio(""); }} style={selStyle}>
              <option value="">{T("Todos los países", "All countries", "Tous les pays", "Alle Länder", "Todos os países", "Tutti i paesi")}</option>
              {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {esMexico && (
              <select value={estado} onChange={(e) => setEstado(e.target.value)} style={selStyle}>
                <option value="">{T("Todos los estados", "All states", "Tous les états", "Alle Bundesstaaten", "Todos os estados", "Tutti gli stati")}</option>
                {MX_ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
            {esMexico && (
              <input value={municipio} onChange={(e) => setMunicipio(e.target.value)}
                placeholder={T("Municipio", "Municipality", "Municipalité", "Gemeinde", "Município", "Comune")}
                style={{ ...selStyle, width: 160 }} />
            )}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <button onClick={buscarCerca} disabled={cargando} style={{ ...BTN("sec"), fontSize: 12 }}>
              📍 {T("Cerca de mí", "Near me", "Près de moi", "In meiner Nähe", "Perto de mim", "Vicino a me")}
            </button>
            <span style={{ width: 1, height: 20, background: `${C.gold}30` }} />
            {filtros.map((f) => (
              <button key={String(f.k)} onClick={() => setTipo(f.k)}
                style={{ ...BTN(tipo === f.k ? "pri" : "sec"), fontSize: 11.5, padding: "6px 12px" }}>{f.lbl}</button>
            ))}
          </div>
          {err && <p style={{ color: "#F87171", fontSize: 13, margin: 0 }}>⚠️ {err}</p>}
        </div>

        {/* Mapa */}
        <div ref={mapDiv} style={{ height: 240, background: C.card, flexShrink: 0 }} />

        {/* Resultados */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 20px" }}>
          {cargando && <p style={{ color: C.ivoryM, textAlign: "center", fontStyle: "italic" }}>{T("Buscando…", "Searching…", "Recherche…", "Suche…", "Buscando…", "Ricerca…")}</p>}
          {!cargando && buscado && resultados.length === 0 && (
            <p style={{ color: C.ivoryM, textAlign: "center", fontStyle: "italic", padding: "16px 0" }}>
              {T("No se encontraron afiliados. Prueba con otro nombre o amplía la búsqueda.", "No affiliates found. Try another name or widen the search.", "Aucun affilié trouvé. Essayez un autre nom ou élargissez la recherche.", "Keine angeschlossenen Einrichtungen gefunden. Versuchen Sie einen anderen Namen.", "Nenhum afiliado encontrado. Tente outro nome ou amplie a busca.", "Nessun affiliato trovato. Prova un altro nome o amplia la ricerca.")}
            </p>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {resultados.map((r, i) => {
              const et = r.tipo === "diocesis"
                ? T("Diócesis", "Diocese", "Diocèse", "Diözese", "Diocese", "Diocesi")
                : T("Parroquia", "Parish", "Paroisse", "Pfarrei", "Paróquia", "Parrocchia");
              return (
                <div key={i} style={{ background: "rgba(200,169,81,0.05)", border: `1px solid ${C.borderD}`, borderRadius: 12, padding: "12px 14px", display: "flex", gap: 12 }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{r.tipo === "diocesis" ? "🏛️" : "⛪"}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: C.ivory, fontFamily: "'Cinzel',serif", fontSize: 14.5, margin: 0 }}>{r.nombre}</p>
                    <p style={{ color: C.gold, fontSize: 11.5, margin: "2px 0 0", letterSpacing: "0.04em" }}>
                      {et}{r.distancia_km != null ? ` · ${r.distancia_km} km` : ""}
                    </p>
                    {r.responsable && <p style={{ color: C.ivoryM, fontSize: 13, margin: "4px 0 0", fontFamily: "'Crimson Text',serif" }}>{r.responsable}</p>}
                    <p style={{ color: C.ivoryM, fontSize: 12.5, margin: "3px 0 0" }}>
                      {[r.direccion, r.pais].filter(Boolean).join(" · ")}
                    </p>
                    <div style={{ display: "flex", gap: 12, marginTop: 6, flexWrap: "wrap" }}>
                      {r.email && <a href={`mailto:${r.email}`} style={{ color: C.gold, fontSize: 12.5 }}>✉️ {r.email}</a>}
                      {r.telefono && <a href={`tel:${r.telefono.replace(/\s/g, "")}`} style={{ color: C.gold, fontSize: 12.5 }}>📞 {r.telefono}</a>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
